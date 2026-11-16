// Package server serves the board over HTTP and WebSocket: routes, quotas, pixel broadcast.
package server

import (
	"compress/gzip"
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/LeoPenaguin/pixels/server/internal/board"

	"golang.org/x/time/rate"
)

const maxConnsIP = 10

// Options tunes the pixel quota.
type Options struct {
	Burst  int           // pixels that can be painted in a row
	Refill time.Duration // time to regain one pixel; 0 = unlimited
}

// Server is the state shared by the routes (storage, quotas, connections, broadcast).
type Server struct {
	store  *board.Store
	opts   Options
	quotas *quotas
	conns  *connLimit
	hub    *hub

	// ponytail: global lock around painting so Redis order = broadcast order.
	// Tops out around 20k pixels/s locally; beyond that, lock per chunk.
	paintMu sync.Mutex

	flushEvery  time.Duration // batch broadcast interval
	forgetEvery time.Duration // quota cleanup interval
	now         func() time.Time
}

// New creates a server; Loop must run for pixels to be broadcast.
func New(store *board.Store, o Options) *Server {
	o.Burst = max(o.Burst, 1)
	every := rate.Inf
	if o.Refill > 0 {
		every = rate.Every(o.Refill)
	}
	return &Server{
		store:       store,
		opts:        o,
		quotas:      newQuotas(o.Burst, every),
		conns:       newConnLimit(maxConnsIP),
		hub:         newHub(),
		flushEvery:  100 * time.Millisecond,
		forgetEvery: time.Minute,
		now:         time.Now,
	}
}

// Handler returns the HTTP and WebSocket routes.
func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/config", s.config)
	mux.HandleFunc("GET /api/chunks/{cx}/{cy}", s.chunk)
	mux.HandleFunc("GET /api/pixels/{x}/{y}", s.pixelInfo)
	mux.HandleFunc("GET /ws", s.ws)
	return mux
}

// Loop broadcasts batches and cleans up quotas until ctx is cancelled.
func (s *Server) Loop(ctx context.Context) {
	flush := time.NewTicker(s.flushEvery)
	forget := time.NewTicker(s.forgetEvery)
	defer flush.Stop()
	defer forget.Stop()
	for {
		select {
		case <-flush.C:
			s.hub.flush()
		case <-forget.C:
			s.quotas.forgetIdle(s.conns.connected)
		case <-ctx.Done():
			return
		}
	}
}

// place paints a pixel for an IP if its quota allows it, and returns the remaining quota.
func (s *Server) place(ctx context.Context, ip string, p board.Pixel, reply chan []byte) {
	q := s.quotas.get(ip)
	ok := q.Allow()
	if s.opts.Refill > 0 {
		trySend(reply, mustJSON(map[string]any{"t": "q", "n": q.Tokens()}))
	}
	if !ok {
		return
	}
	s.paintMu.Lock()
	defer s.paintMu.Unlock()
	if changed, err := s.store.Paint(ctx, p, s.now().UnixMilli()); err == nil && changed {
		s.hub.queue(p)
	}
}

func (s *Server) config(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, map[string]any{
		"chunkSize":   board.ChunkSize,
		"worldWidth":  board.WorldWidth,
		"worldHeight": board.WorldHeight,
		"palette":     board.PaletteRows,
		"quota":       map[string]any{"burst": s.opts.Burst, "refillMs": s.opts.Refill.Milliseconds()},
	})
}

// chunk returns a chunk's raw bytes. It may be shorter than 65,536 bytes (or empty):
// the rest is 0, i.e. white.
func (s *Server) chunk(w http.ResponseWriter, r *http.Request) {
	cx, err1 := strconv.Atoi(r.PathValue("cx"))
	cy, err2 := strconv.Atoi(r.PathValue("cy"))
	if err1 != nil || err2 != nil || !board.ChunkInWorld(cx, cy) {
		http.Error(w, "bad chunk", http.StatusBadRequest)
		return
	}
	data, err := s.store.Chunk(r.Context(), cx, cy)
	if err != nil {
		http.Error(w, "redis error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/octet-stream")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("Vary", "Accept-Encoding")
	// Mostly white (zeros): 64 KB shrinks to a few hundred bytes.
	if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") {
		_, _ = w.Write(data)
		return
	}
	w.Header().Set("Content-Encoding", "gzip")
	gz := gzip.NewWriter(w)
	_, _ = gz.Write(data)
	_ = gz.Close()
}

// pixelInfo returns the colour, change count and time of the last change (null if never changed).
func (s *Server) pixelInfo(w http.ResponseWriter, r *http.Request) {
	x, err1 := strconv.Atoi(r.PathValue("x"))
	y, err2 := strconv.Atoi(r.PathValue("y"))
	if err1 != nil || err2 != nil || !board.InWorld(x, y) {
		http.Error(w, "bad pixel", http.StatusBadRequest)
		return
	}
	info, err := s.store.Info(r.Context(), x, y)
	if err != nil {
		http.Error(w, "redis error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Cache-Control", "no-store")
	writeJSON(w, info)
}

func writeJSON(w http.ResponseWriter, v any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(v)
}
