package server

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/LeoPenaguin/pixels/server/internal/board"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

type testEnv struct {
	s   *Server
	mr  *miniredis.Miniredis
	url string
}

// newTestEnv runs a full server on an in-memory Redis, with a fast broadcast loop.
func newTestEnv(t *testing.T, o Options) testEnv {
	t.Helper()
	mr := miniredis.RunT(t)
	rdb := redis.NewClient(&redis.Options{Addr: mr.Addr(), MaxRetries: -1})
	s := New(board.NewStore(rdb), o)
	s.flushEvery = 5 * time.Millisecond
	s.forgetEvery = 5 * time.Millisecond
	s.now = func() time.Time { return time.UnixMilli(42) }
	ctx, cancel := context.WithCancel(context.Background())
	t.Cleanup(cancel)
	go s.Loop(ctx)
	ts := httptest.NewServer(s.Handler())
	t.Cleanup(ts.Close)
	return testEnv{s, mr, ts.URL}
}

func get(t *testing.T, url string) (code int, body []byte) {
	t.Helper()
	req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, url, http.NoBody)
	if err != nil {
		t.Fatal(err)
	}
	res, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = res.Body.Close() }()
	body, _ = io.ReadAll(res.Body)
	return res.StatusCode, body
}

func TestNewDefaults(t *testing.T) {
	s := New(nil, Options{Burst: 0})
	if s.opts.Burst != 1 {
		t.Error("the quota must allow at least one pixel")
	}
}

func TestConfig(t *testing.T) {
	e := newTestEnv(t, Options{Burst: 7, Refill: 1500 * time.Millisecond})
	code, body := get(t, e.url+"/api/config")
	var cfg struct {
		ChunkSize, WorldLimit int
		Palette               [][]string
		Quota                 struct{ Burst, RefillMs int }
	}
	if err := json.Unmarshal(body, &cfg); err != nil || code != 200 {
		t.Fatal(code, err)
	}
	if cfg.ChunkSize != 256 || cfg.WorldLimit != board.WorldLimit || len(cfg.Palette) != len(board.PaletteRows) ||
		cfg.Quota.Burst != 7 || cfg.Quota.RefillMs != 1500 {
		t.Errorf("config = %+v", cfg)
	}
}

func TestChunkRoute(t *testing.T) {
	e := newTestEnv(t, Options{Burst: 1})
	_ = e.mr.Set("chunk:-2:3", "\x05")
	if code, body := get(t, e.url+"/api/chunks/-2/3"); code != 200 || string(body) != "\x05" {
		t.Errorf("chunk = %d %q", code, body)
	}
	if code, body := get(t, e.url+"/api/chunks/0/0"); code != 200 || len(body) != 0 {
		t.Errorf("chunk jamais peint = %d %q ; attendu 200 vide", code, body)
	}
	for _, bad := range []string{"x/0", "0/y", "4096/0"} {
		if code, _ := get(t, e.url+"/api/chunks/"+bad); code != 400 {
			t.Errorf("/api/chunks/%s = %d ; attendu 400", bad, code)
		}
	}
	e.mr.Close()
	if code, _ := get(t, e.url+"/api/chunks/0/0"); code != 500 {
		t.Errorf("Redis en panne = %d ; attendu 500", code)
	}
}

func TestPixelRoute(t *testing.T) {
	e := newTestEnv(t, Options{Burst: 1})
	code, body := get(t, e.url+"/api/pixels/-1/2")
	var info board.Info
	if err := json.Unmarshal(body, &info); err != nil || code != 200 || info != (board.Info{X: -1, Y: 2}) {
		t.Errorf("pixel = %d %s", code, body)
	}
	for _, bad := range []string{"x/0", "0/y", "1048576/0"} {
		if code, _ := get(t, e.url+"/api/pixels/"+bad); code != 400 {
			t.Errorf("/api/pixels/%s = %d ; attendu 400", bad, code)
		}
	}
	e.mr.Close()
	if code, _ := get(t, e.url+"/api/pixels/0/0"); code != 500 {
		t.Errorf("Redis en panne = %d ; attendu 500", code)
	}
}

func TestPlaceIgnoresRedisErrors(t *testing.T) {
	e := newTestEnv(t, Options{Burst: 1})
	e.mr.Close()
	e.s.place(context.Background(), "ip", board.Pixel{X: 1, Y: 1, C: 1}, make(chan []byte, 1))
	e.s.hub.pendMu.Lock()
	defer e.s.hub.pendMu.Unlock()
	if len(e.s.hub.pending) != 0 {
		t.Error("a pixel that was not written must not be broadcast")
	}
}

func TestForgetLoop(t *testing.T) {
	e := newTestEnv(t, Options{Burst: 1})
	e.s.quotas.get("parti")
	deadline := time.Now().Add(time.Second)
	for {
		e.s.quotas.mu.Lock()
		n := len(e.s.quotas.m)
		e.s.quotas.mu.Unlock()
		if n == 0 {
			return
		}
		if time.Now().After(deadline) {
			t.Fatal("the quota cleanup did not run")
		}
		time.Sleep(5 * time.Millisecond)
	}
}
