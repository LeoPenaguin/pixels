package server

import (
	"context"
	"net"
	"net/http"

	"github.com/LeoPenaguin/pixels/server/internal/board"

	"github.com/coder/websocket"
	"golang.org/x/time/rate"
)

// Protocol: the client sends {"x","y","c"}; the server answers {"t":"q","n"} (remaining quota)
// and broadcasts {"t":"b","p":[…]} batches.
func (s *Server) ws(w http.ResponseWriter, r *http.Request) {
	// ponytail: RemoteAddr only; behind a reverse proxy, read a trusted X-Forwarded-For.
	ip, _, _ := net.SplitHostPort(r.RemoteAddr)
	if !s.conns.acquire(ip) {
		http.Error(w, "too many connections", http.StatusTooManyRequests)
		return
	}
	defer s.conns.release(ip)

	// Accept checks the Origin (same origin only): in dev, Vite proxies /ws.
	// Batches of digits compress well. No context takeover: no 1.2 MB writer kept per connection;
	// messages under 512 bytes go uncompressed, and Safari does not negotiate it at all.
	// ponytail: each batch is compressed once per client; compress once for all if CPU becomes the limit.
	conn, err := websocket.Accept(w, r, &websocket.AcceptOptions{CompressionMode: websocket.CompressionNoContextTakeover})
	if err != nil {
		return
	}
	defer func() { _ = conn.CloseNow() }()
	conn.SetReadLimit(256)

	ctx, cancel := context.WithCancel(r.Context())
	defer cancel()
	send := s.hub.subscribe()
	defer s.hub.unsubscribe(send)
	go writeLoop(ctx, conn, send)

	flood := rate.NewLimiter(10, 20) // messages per second: beyond that, the connection is closed
	for {
		_, data, err := conn.Read(ctx)
		if err != nil {
			return
		}
		if !flood.Allow() {
			_ = conn.Close(websocket.StatusPolicyViolation, "rate limit")
			return
		}
		if p, ok := board.ParsePixel(data); ok {
			s.place(ctx, ip, p, send)
		}
	}
}

// writeLoop sends messages to the client. A failed write (dead connection) also fails the
// read, which cancels ctx: no need to handle it here.
func writeLoop(ctx context.Context, conn *websocket.Conn, send chan []byte) {
	for {
		select {
		case msg := <-send:
			_ = conn.Write(ctx, websocket.MessageText, msg)
		case <-ctx.Done():
			return
		}
	}
}
