// Serveur pixels : une seule grille infinie découpée en chunks de 256×256 stockés dans Redis.
// Chaque chunk = une chaîne Redis de 65 536 octets, 1 octet = index de couleur dans la palette.
package main

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net"
	"net/http"
	"os"
	"slices"
	"strconv"
	"sync"
	"time"

	"github.com/coder/websocket"
	"github.com/redis/go-redis/v9"
	"golang.org/x/time/rate"
)

const (
	chunkShift = 8 // chunk = 2^8 = 256 pixels de côté
	chunkSize  = 1 << chunkShift
	worldLimit = 1 << 20 // |x|, |y| < 1 048 576 : "infini" en pratique, borné pour rester sain
	maxConnsIP = 10
	sendBuffer = 256
	flushEvery = 100 * time.Millisecond // fréquence de diffusion des pixels groupés
)

// Lignes affichées telles quelles par le front : gris, pastels, moyennes, sombres, vives, chair.
// L'index d'une couleur = sa position une fois les lignes mises bout à bout. Index 0 = blanc
// = pixel jamais peint. Ne jamais réordonner : les octets déjà dans Redis pointent sur ces index.
// Pour ajouter des couleurs, les mettre à la fin de la dernière ligne ou dans une nouvelle ligne.
var paletteRows = [][]string{
	{"#FFFFFF", "#CDCDCD", "#9C9C9C", "#696969", "#373737", "#000000"},
	{"#E5A49C", "#F6C886", "#FBE7AA", "#99E3B5", "#A6E6E7", "#A5A1E1", "#D8A4E2"},
	{"#D34F3E", "#F09336", "#F7CF5F", "#5CC96E", "#65CFD0", "#597CE2", "#B64DC8"},
	{"#7D2E25", "#A84F1D", "#CD9C34", "#347842", "#3B7C7C", "#354A87", "#6D2D77"},
	{"#E52521", "#FF4FA3", "#FFE135", "#2ECC40", "#00B4F0", "#1F5BFF", "#8A2BE2"}, // vives
	{"#F2C9A8", "#C68B59", "#7A4A2E", "#4A2E1C"},                                  // tons chair et marrons
}

var palette = slices.Concat(paletteRows...)

type pixel struct {
	X int `json:"x"`
	Y int `json:"y"`
	C int `json:"c"`
}

// Les trois champs sont obligatoires : `{}` ne doit pas valoir "pixel blanc en (0,0)".
func parsePixel(data []byte) (pixel, bool) {
	var m struct{ X, Y, C *int }
	if json.Unmarshal(data, &m) != nil || m.X == nil || m.Y == nil || m.C == nil {
		return pixel{}, false
	}
	p := pixel{*m.X, *m.Y, *m.C}
	return p, p.valid()
}

func (p pixel) valid() bool {
	return p.X > -worldLimit && p.X < worldLimit &&
		p.Y > -worldLimit && p.Y < worldLimit &&
		p.C >= 0 && p.C < len(palette)
}

// Clés Redis d'un chunk "cx:cy" :
//
//	chunk:cx:cy  chaîne de 65 536 octets, la couleur de chaque pixel
//	meta:cx:cy   hash, "n:{offset}" = nombre de changements de couleur, "t:{offset}" = date du dernier (ms Unix)
func chunkID(cx, cy int) string { return strconv.Itoa(cx) + ":" + strconv.Itoa(cy) }

// Le décalage arithmétique arrondit vers -∞ : x=-1 tombe bien dans le chunk -1, offset 255.
func locate(x, y int) (id string, offset int64) {
	return chunkID(x>>chunkShift, y>>chunkShift), int64((y&(chunkSize-1))*chunkSize + x&(chunkSize-1))
}

// Pose atomique : ne fait rien si la couleur est déjà la bonne (pas un changement),
// sinon écrit l'octet, incrémente le compteur et date le changement. Renvoie 1 si changé.
var paintScript = redis.NewScript(`
local off = tonumber(ARGV[1])
local old = redis.call('GETRANGE', KEYS[1], off, off)
local oldc = 0
if #old == 1 then oldc = string.byte(old) end
if oldc == tonumber(ARGV[2]) then return 0 end
redis.call('SETRANGE', KEYS[1], off, string.char(tonumber(ARGV[2])))
redis.call('HINCRBY', KEYS[2], 'n:' .. off, 1)
redis.call('HSET', KEYS[2], 't:' .. off, ARGV[3])
return 1
`)

type server struct {
	rdb    *redis.Client
	burst  int           // pixels posables d'affilée
	refill time.Duration // temps pour regagner 1 pixel ; 0 = illimité

	mu      sync.Mutex
	clients map[chan []byte]struct{}
	perIP   map[string]int
	quotas  map[string]*rate.Limiter // par IP, survit à la déconnexion (sinon reconnecter = recharger)

	// ponytail: verrou global autour de SETRANGE pour que l'ordre Redis = l'ordre diffusé.
	// Plafond ~20k pixels/s en local ; au-delà, verrou par chunk.
	pendMu  sync.Mutex
	pending map[[2]int]int // pixels posés depuis la dernière diffusion, le dernier gagne
}

func main() {
	opt, err := redis.ParseURL(env("REDIS_URL", "redis://localhost:6379"))
	if err != nil {
		log.Fatal(err)
	}
	burst, _ := strconv.Atoi(env("PIXEL_BURST", "10"))
	refillMs, _ := strconv.Atoi(env("PIXEL_REFILL_MS", "2000"))
	s := &server{
		rdb:     redis.NewClient(opt),
		burst:   max(burst, 1),
		refill:  time.Duration(refillMs) * time.Millisecond,
		clients: map[chan []byte]struct{}{},
		perIP:   map[string]int{},
		quotas:  map[string]*rate.Limiter{},
		pending: map[[2]int]int{},
	}
	if err := s.rdb.Ping(context.Background()).Err(); err != nil {
		log.Fatal("redis: ", err)
	}

	go s.flushLoop()
	go s.forgetIdleQuotas()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/config", s.config)
	mux.HandleFunc("GET /api/chunks/{cx}/{cy}", s.chunk)
	mux.HandleFunc("GET /api/pixels/{x}/{y}", s.pixelInfo)
	mux.HandleFunc("GET /ws", s.ws)

	addr := env("ADDR", ":3007")
	log.Println("listening on", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}

func (s *server) config(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"chunkSize": chunkSize, "worldLimit": worldLimit,
		"palette": paletteRows,
		"quota":   map[string]any{"burst": s.burst, "refillMs": s.refill.Milliseconds()},
	})
}

// Renvoie les octets bruts du chunk. Peut être plus court que 65 536 (ou vide) : le reste vaut 0.
func (s *server) chunk(w http.ResponseWriter, r *http.Request) {
	cx, err1 := strconv.Atoi(r.PathValue("cx"))
	cy, err2 := strconv.Atoi(r.PathValue("cy"))
	lim := worldLimit >> chunkShift
	if err1 != nil || err2 != nil || cx < -lim || cx >= lim || cy < -lim || cy >= lim {
		http.Error(w, "bad chunk", http.StatusBadRequest)
		return
	}
	data, err := s.rdb.Get(r.Context(), "chunk:"+chunkID(cx, cy)).Bytes()
	if err != nil && !errors.Is(err, redis.Nil) {
		http.Error(w, "redis error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Cache-Control", "no-store")
	w.Write(data)
}

// Infos d'un pixel : couleur, nombre de changements, date du dernier (null si jamais peint).
func (s *server) pixelInfo(w http.ResponseWriter, r *http.Request) {
	x, err1 := strconv.Atoi(r.PathValue("x"))
	y, err2 := strconv.Atoi(r.PathValue("y"))
	if p := (pixel{x, y, 0}); err1 != nil || err2 != nil || !p.valid() {
		http.Error(w, "bad pixel", http.StatusBadRequest)
		return
	}
	id, off := locate(x, y)
	o := strconv.FormatInt(off, 10)
	pipe := s.rdb.Pipeline()
	color := pipe.GetRange(r.Context(), "chunk:"+id, off, off)
	meta := pipe.HMGet(r.Context(), "meta:"+id, "n:"+o, "t:"+o)
	if _, err := pipe.Exec(r.Context()); err != nil && !errors.Is(err, redis.Nil) {
		http.Error(w, "redis error", http.StatusInternalServerError)
		return
	}
	c := 0
	if v := color.Val(); len(v) == 1 {
		c = int(v[0])
	}
	var changes, last int64
	if v, ok := meta.Val()[0].(string); ok {
		changes, _ = strconv.ParseInt(v, 10, 64)
	}
	if v, ok := meta.Val()[1].(string); ok {
		last, _ = strconv.ParseInt(v, 10, 64)
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	info := map[string]any{"x": x, "y": y, "c": c, "changes": changes, "lastChange": nil}
	if last > 0 {
		info["lastChange"] = last
	}
	json.NewEncoder(w).Encode(info)
}

func (s *server) ws(w http.ResponseWriter, r *http.Request) {
	// ponytail: RemoteAddr seulement ; derrière un reverse proxy il faudra lire X-Forwarded-For (de confiance).
	ip, _, _ := net.SplitHostPort(r.RemoteAddr)

	s.mu.Lock()
	if s.perIP[ip] >= maxConnsIP {
		s.mu.Unlock()
		http.Error(w, "too many connections", http.StatusTooManyRequests)
		return
	}
	s.perIP[ip]++
	s.mu.Unlock()
	defer func() {
		s.mu.Lock()
		if s.perIP[ip]--; s.perIP[ip] <= 0 {
			delete(s.perIP, ip)
		}
		s.mu.Unlock()
	}()

	// Accept vérifie l'Origin (même origine uniquement) : en dev, Vite proxifie /ws.
	conn, err := websocket.Accept(w, r, nil)
	if err != nil {
		return
	}
	defer conn.CloseNow()
	conn.SetReadLimit(256)

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()

	send := make(chan []byte, sendBuffer)
	s.mu.Lock()
	s.clients[send] = struct{}{}
	s.mu.Unlock()
	defer func() {
		s.mu.Lock()
		delete(s.clients, send)
		s.mu.Unlock()
	}()

	go func() {
		defer cancel()
		for {
			select {
			case msg, ok := <-send:
				if !ok || conn.Write(ctx, websocket.MessageText, msg) != nil {
					return
				}
			case <-ctx.Done():
				return
			}
		}
	}()

	limiter := rate.NewLimiter(10, 20) // anti-flood sur les messages : au-delà, on coupe la connexion
	for {
		_, data, err := conn.Read(ctx)
		if err != nil {
			return
		}
		if !limiter.Allow() {
			conn.Close(websocket.StatusPolicyViolation, "rate limit")
			return
		}
		if p, ok := parsePixel(data); ok {
			s.place(ctx, ip, p, send)
		}
	}
}

func (s *server) quota(ip string) *rate.Limiter {
	s.mu.Lock()
	defer s.mu.Unlock()
	q := s.quotas[ip]
	if q == nil {
		every := rate.Inf
		if s.refill > 0 {
			every = rate.Every(s.refill)
		}
		q = rate.NewLimiter(every, s.burst)
		s.quotas[ip] = q
	}
	return q
}

// Seau de jetons par IP : `burst` pixels d'affilée, puis 1 de plus toutes les `refill`.
func (s *server) place(ctx context.Context, ip string, p pixel, reply chan []byte) {
	q := s.quota(ip)
	ok := q.Allow()
	if s.refill > 0 {
		trySend(reply, mustJSON(map[string]any{"t": "q", "n": q.Tokens()}))
	}
	if !ok {
		return
	}
	id, off := locate(p.X, p.Y)
	s.pendMu.Lock()
	defer s.pendMu.Unlock()
	changed, err := paintScript.Run(ctx, s.rdb, []string{"chunk:" + id, "meta:" + id},
		off, p.C, time.Now().UnixMilli()).Int()
	if err == nil && changed == 1 {
		s.pending[[2]int{p.X, p.Y}] = p.C
	}
}

// Diffuse tous les pixels posés depuis le dernier tick en un seul message {"t":"b","p":[x,y,c,x,y,c,…]} :
// N poses × M clients messages deviennent ~10 × M par seconde.
// ponytail: diffusion en mémoire, un seul process. Plusieurs instances → Redis Pub/Sub.
func (s *server) flushLoop() {
	for range time.Tick(flushEvery) {
		s.pendMu.Lock()
		batch := s.pending
		if len(batch) > 0 {
			s.pending = map[[2]int]int{}
		}
		s.pendMu.Unlock()
		if len(batch) == 0 {
			continue
		}
		flat := make([]int, 0, len(batch)*3)
		for k, c := range batch {
			flat = append(flat, k[0], k[1], c)
		}
		msg := mustJSON(map[string]any{"t": "b", "p": flat})
		s.mu.Lock()
		for c := range s.clients {
			trySend(c, msg)
		}
		s.mu.Unlock()
	}
}

// Oublie les quotas pleins des IP déconnectées, pour que la map ne grossisse pas indéfiniment.
func (s *server) forgetIdleQuotas() {
	for range time.Tick(time.Minute) {
		s.mu.Lock()
		for ip, q := range s.quotas {
			if s.perIP[ip] == 0 && q.Tokens() >= float64(s.burst) {
				delete(s.quotas, ip)
			}
		}
		s.mu.Unlock()
	}
}

// Client trop lent (buffer plein) : il perd le message, il rechargera les chunks à la reconnexion.
func trySend(c chan []byte, msg []byte) {
	select {
	case c <- msg:
	default:
	}
}

func mustJSON(v any) []byte {
	b, _ := json.Marshal(v)
	return b
}

func env(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}
