package server

import (
	"sync"

	"golang.org/x/time/rate"
)

// quotas is a token bucket per IP: `burst` pixels in a row, then one more every `refill`
// (refill = 0: unlimited). Buckets outlive disconnection, otherwise reconnecting would refill them.
type quotas struct {
	burst int
	every rate.Limit

	mu sync.Mutex
	m  map[string]*rate.Limiter
}

func newQuotas(burst int, every rate.Limit) *quotas {
	return &quotas{burst: burst, every: every, m: map[string]*rate.Limiter{}}
}

func (q *quotas) get(ip string) *rate.Limiter {
	q.mu.Lock()
	defer q.mu.Unlock()
	l := q.m[ip]
	if l == nil {
		l = rate.NewLimiter(q.every, q.burst)
		q.m[ip] = l
	}
	return l
}

// forgetIdle drops full buckets of disconnected IPs so the map does not grow forever.
func (q *quotas) forgetIdle(connected func(ip string) bool) {
	q.mu.Lock()
	defer q.mu.Unlock()
	for ip, l := range q.m {
		if !connected(ip) && l.Tokens() >= float64(q.burst) {
			delete(q.m, ip)
		}
	}
}

// connLimit caps simultaneous WebSocket connections per IP.
type connLimit struct {
	max int

	mu sync.Mutex
	n  map[string]int
}

func newConnLimit(limit int) *connLimit { return &connLimit{max: limit, n: map[string]int{}} }

// acquire reserves a connection for the IP; false if it already has too many.
func (c *connLimit) acquire(ip string) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	if c.n[ip] >= c.max {
		return false
	}
	c.n[ip]++
	return true
}

func (c *connLimit) release(ip string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.n[ip]--
	if c.n[ip] <= 0 {
		delete(c.n, ip)
	}
}

func (c *connLimit) connected(ip string) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.n[ip] > 0
}
