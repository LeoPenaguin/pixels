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
)

// Index 0 = blanc = pixel jamais peint (Redis renvoie des octets nuls).
var palette = []string{
	"#FFFFFF", "#CDCDCD", "#9C9C9C", "#696969", "#373737", "#000000",
	"#E5A49C", "#F6C886", "#FBE7AA", "#99E3B5", "#A6E6E7", "#A5A1E1", "#D8A4E2",
	"#D34F3E", "#F09336", "#F7CF5F", "#5CC96E", "#65CFD0", "#597CE2", "#B64DC8",
	"#7D2E25", "#A84F1D", "#CD9C34", "#347842", "#3B7C7C", "#354A87", "#6D2D77",
}

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

// Le décalage arithmétique arrondit vers -∞ : x=-1 tombe bien dans le chunk -1, offset 255.
func chunkKey(cx, cy int) string { return "chunk:" + strconv.Itoa(cx) + ":" + strconv.Itoa(cy) }

func locate(x, y int) (key string, offset int64) {
	return chunkKey(x>>chunkShift, y>>chunkShift), int64((y&(chunkSize-1))*chunkSize + x&(chunkSize-1))
}

type server struct {
	rdb      *redis.Client
	cooldown time.Duration

	mu      sync.Mutex
	clients map[chan []byte]struct{}
	perIP   map[string]int
}

func main() {
	opt, err := redis.ParseURL(env("REDIS_URL", "redis://localhost:6379"))
	if err != nil {
		log.Fatal(err)
	}
	cooldownMs, _ := strconv.Atoi(env("COOLDOWN_MS", "5000"))
	s := &server{
		rdb:      redis.NewClient(opt),
		cooldown: time.Duration(cooldownMs) * time.Millisecond,
		clients:  map[chan []byte]struct{}{},
		perIP:    map[string]int{},
	}
	if err := s.rdb.Ping(context.Background()).Err(); err != nil {
		log.Fatal("redis: ", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/config", s.config)
	mux.HandleFunc("GET /api/chunks/{cx}/{cy}", s.chunk)
	mux.HandleFunc("GET /ws", s.ws)

	addr := env("ADDR", ":3007")
	log.Println("listening on", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}

func (s *server) config(w http.ResponseWriter, _ *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"chunkSize": chunkSize, "worldLimit": worldLimit,
		"palette": palette, "cooldownMs": s.cooldown.Milliseconds(),
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
	data, err := s.rdb.Get(r.Context(), chunkKey(cx, cy)).Bytes()
	if err != nil && !errors.Is(err, redis.Nil) {
		http.Error(w, "redis error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Cache-Control", "no-store")
	w.Write(data)
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

	limiter := rate.NewLimiter(5, 10) // anti-flood : au-delà, on coupe la connexion
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

func (s *server) place(ctx context.Context, ip string, p pixel, reply chan []byte) {
	// SET NX PX = cooldown atomique par IP, partagé entre toutes ses connexions.
	ok, err := s.rdb.SetNX(ctx, "cooldown:"+ip, 1, s.cooldown).Result()
	if err != nil {
		return
	}
	if !ok {
		left, _ := s.rdb.PTTL(ctx, "cooldown:"+ip).Result()
		trySend(reply, mustJSON(map[string]any{"t": "cd", "ms": left.Milliseconds()}))
		return
	}
	key, off := locate(p.X, p.Y)
	if s.rdb.SetRange(ctx, key, off, string([]byte{byte(p.C)})).Err() != nil {
		return
	}
	trySend(reply, mustJSON(map[string]any{"t": "cd", "ms": s.cooldown.Milliseconds()}))
	s.broadcast(mustJSON(map[string]any{"t": "p", "x": p.X, "y": p.Y, "c": p.C}))
}

// ponytail: diffusion en mémoire, un seul process. Plusieurs instances → Redis Pub/Sub.
func (s *server) broadcast(msg []byte) {
	s.mu.Lock()
	defer s.mu.Unlock()
	for c := range s.clients {
		trySend(c, msg)
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
