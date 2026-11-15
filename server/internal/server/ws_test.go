package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/coder/websocket"
)

type msg struct {
	T string
	N float64
	P []int
}

func dial(t *testing.T, e testEnv) *websocket.Conn {
	t.Helper()
	c, err := tryDial(e, nil)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = c.CloseNow() })
	return c
}

// tryDial opens a WebSocket connection; on refusal, the error keeps the HTTP status.
func tryDial(e testEnv, opts *websocket.DialOptions) (*websocket.Conn, error) {
	c, res, err := websocket.Dial(context.Background(), "ws"+strings.TrimPrefix(e.url, "http")+"/ws", opts)
	if res != nil && res.Body != nil {
		_ = res.Body.Close()
	}
	if err != nil && res != nil {
		return nil, fmt.Errorf("%d: %w", res.StatusCode, err)
	}
	return c, err
}

func send(t *testing.T, c *websocket.Conn, s string) {
	t.Helper()
	if err := c.Write(context.Background(), websocket.MessageText, []byte(s)); err != nil {
		t.Fatal(err)
	}
}

func read(t *testing.T, c *websocket.Conn) msg {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	_, data, err := c.Read(ctx)
	if err != nil {
		t.Fatal(err)
	}
	var m msg
	if err := json.Unmarshal(data, &m); err != nil {
		t.Fatal(err)
	}
	return m
}

func TestPlaceAndBroadcast(t *testing.T) {
	e := newTestEnv(t, Options{Burst: 2, Refill: time.Hour})
	a, b := dial(t, e), dial(t, e)

	send(t, a, `{"x":3,"y":-4,"c":5}`)
	if m := read(t, a); m.T != "q" || int(m.N) != 1 {
		t.Errorf("quota = %+v ; attendu 1 restant", m)
	}
	for _, c := range []*websocket.Conn{a, b} {
		if m := read(t, c); m.T != "b" || len(m.P) != 3 || m.P[0] != 3 || m.P[1] != -4 || m.P[2] != 5 {
			t.Errorf("lot = %+v", m)
		}
	}
	if info, _ := e.s.store.Info(context.Background(), 3, -4); info.LastChange == nil || *info.LastChange != 42 {
		t.Errorf("the change must be timestamped by the server clock: %+v", info)
	}

	send(t, a, `not json`) // ignored
	send(t, a, `{"x":0,"y":0,"c":1}`)
	if m := read(t, a); m.T != "q" || int(m.N) != 0 {
		t.Errorf("quota = %+v ; attendu 0 restant", m)
	}
	read(t, a) // batch of the 2nd pixel
	send(t, a, `{"x":9,"y":9,"c":1}`)
	if m := read(t, a); m.T != "q" || int(m.N) != 0 {
		t.Errorf("exhausted quota = %+v", m)
	}
	if info, _ := e.s.store.Info(context.Background(), 9, 9); info.C != 0 {
		t.Error("exhausted quota: the pixel must not be painted")
	}
}

func TestUnlimitedSendsNoQuota(t *testing.T) {
	e := newTestEnv(t, Options{Burst: 1})
	a := dial(t, e)
	send(t, a, `{"x":1,"y":1,"c":2}`)
	send(t, a, `{"x":2,"y":1,"c":2}`)
	if m := read(t, a); m.T != "b" {
		t.Errorf("without a limit, the first message must be a batch: %+v", m)
	}
}

func TestFloodClosesConnection(t *testing.T) {
	e := newTestEnv(t, Options{Burst: 1})
	a := dial(t, e)
	for range 30 {
		_ = a.Write(context.Background(), websocket.MessageText, []byte(`{}`))
	}
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	for {
		if _, _, err := a.Read(ctx); err != nil {
			if websocket.CloseStatus(err) != websocket.StatusPolicyViolation {
				t.Errorf("fermeture = %v ; attendu StatusPolicyViolation", err)
			}
			return
		}
	}
}

func TestTooManyConnections(t *testing.T) {
	e := newTestEnv(t, Options{Burst: 1})
	for range maxConnsIP {
		dial(t, e)
	}
	if _, err := tryDial(e, nil); err == nil || !strings.HasPrefix(err.Error(), "429") {
		t.Errorf("11e connexion : %v ; attendu 429", err)
	}
}

func TestRejectsOtherOrigin(t *testing.T) {
	e := newTestEnv(t, Options{Burst: 1})
	opts := &websocket.DialOptions{HTTPHeader: http.Header{"Origin": {"https://ailleurs.example"}}}
	if _, err := tryDial(e, opts); err == nil {
		t.Error("another origin must be refused")
	}
}

func TestDisconnectReleasesSlot(t *testing.T) {
	e := newTestEnv(t, Options{Burst: 1})
	a := dial(t, e)
	_ = a.Close(websocket.StatusNormalClosure, "")
	deadline := time.Now().Add(time.Second)
	for e.s.conns.connected("127.0.0.1") {
		if time.Now().After(deadline) {
			t.Fatal("a closed connection must free its slot")
		}
		time.Sleep(5 * time.Millisecond)
	}
}
