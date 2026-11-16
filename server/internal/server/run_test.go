package server

import (
	"context"
	"net"
	"strings"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
)

func envOf(m map[string]string) func(string) string {
	return func(k string) string { return m[k] }
}

func TestRunConfigErrors(t *testing.T) {
	mr := miniredis.RunT(t)
	cases := map[string]map[string]string{
		"PIXEL_BURST":     {"PIXEL_BURST": "beaucoup"},
		"PIXEL_REFILL_MS": {"PIXEL_REFILL_MS": "vite"},
		"REDIS_URL":       {"REDIS_URL": "not-a-url"},
		"redis:":          {"REDIS_URL": "redis://" + closedAddr(t)},
		"listen":          {"REDIS_URL": "redis://" + mr.Addr(), "ADDR": "127.0.0.1:-1"},
	}
	for want, env := range cases {
		ctx, cancel := context.WithCancel(context.Background())
		err := Run(ctx, envOf(env))
		cancel()
		if err == nil || !strings.Contains(err.Error(), want) {
			t.Errorf("%v: error %v; want %q", env, err, want)
		}
	}
}

func TestRunServesUntilCancelled(t *testing.T) {
	mr := miniredis.RunT(t)
	ctx, cancel := context.WithTimeout(context.Background(), 100*time.Millisecond)
	defer cancel()
	if err := Run(ctx, envOf(map[string]string{"REDIS_URL": "redis://" + mr.Addr(), "ADDR": "127.0.0.1:0"})); err != nil {
		t.Errorf("expected a clean shutdown, got %v", err)
	}
}

// closedAddr returns an address nothing listens on.
func closedAddr(t *testing.T) string {
	t.Helper()
	l, err := (&net.ListenConfig{}).Listen(context.Background(), "tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	addr := l.Addr().String()
	_ = l.Close()
	return addr
}
