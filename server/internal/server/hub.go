package server

import (
	"encoding/json"
	"sync"

	"github.com/LeoPenaguin/pixels/server/internal/board"
)

const sendBuffer = 256 // queued messages per client before it starts dropping

// hub broadcasts painted pixels to every connected client, in batches.
// ponytail: in memory, single process. Several instances → Redis Pub/Sub.
type hub struct {
	mu      sync.Mutex
	clients map[chan []byte]struct{}

	pendMu  sync.Mutex
	pending map[[2]int]int // pixels painted since the last batch; for the same pixel, the last one wins
}

func newHub() *hub {
	return &hub{clients: map[chan []byte]struct{}{}, pending: map[[2]int]int{}}
}

func (h *hub) subscribe() chan []byte {
	c := make(chan []byte, sendBuffer)
	h.mu.Lock()
	h.clients[c] = struct{}{}
	h.mu.Unlock()
	return c
}

func (h *hub) unsubscribe(c chan []byte) {
	h.mu.Lock()
	delete(h.clients, c)
	h.mu.Unlock()
}

func (h *hub) queue(p board.Pixel) {
	h.pendMu.Lock()
	h.pending[[2]int{p.X, p.Y}] = p.C
	h.pendMu.Unlock()
}

// flush sends every pending pixel in a single {"t":"b","p":[x,y,c, x,y,c, …]} message:
// N paints × M clients messages become one message per client per batch.
func (h *hub) flush() {
	h.pendMu.Lock()
	batch := h.pending
	h.pending = map[[2]int]int{}
	h.pendMu.Unlock()
	if len(batch) == 0 {
		return
	}
	flat := make([]int, 0, len(batch)*3)
	for k, c := range batch {
		flat = append(flat, k[0], k[1], c)
	}
	msg := mustJSON(map[string]any{"t": "b", "p": flat})
	h.mu.Lock()
	for c := range h.clients {
		trySend(c, msg)
	}
	h.mu.Unlock()
}

// trySend drops the message for a slow client (full buffer); it reloads chunks when it reconnects.
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
