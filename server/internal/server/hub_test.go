package server

import (
	"encoding/json"
	"slices"
	"testing"

	"github.com/LeoPenaguin/pixels/server/internal/board"
)

func TestHubFlush(t *testing.T) {
	h := newHub()
	a, b := h.subscribe(), h.subscribe()

	h.flush()
	if len(a) != 0 {
		t.Fatal("nothing pending: nothing must be sent")
	}

	h.queue(board.Pixel{X: 1, Y: 2, C: 3})
	h.queue(board.Pixel{X: 1, Y: 2, C: 4}) // same pixel: the last one wins
	h.flush()
	for _, c := range []chan []byte{a, b} {
		var msg struct {
			T string
			P []int
		}
		if err := json.Unmarshal(<-c, &msg); err != nil {
			t.Fatal(err)
		}
		if msg.T != "b" || !slices.Equal(msg.P, []int{1, 2, 4}) {
			t.Errorf("batch = %+v; want {b [1 2 4]}", msg)
		}
	}

	h.unsubscribe(a)
	h.queue(board.Pixel{X: 0, Y: 0, C: 1})
	h.flush()
	if len(a) != 0 || len(b) != 1 {
		t.Error("an unsubscribed client receives nothing")
	}
}

func TestTrySendDropsWhenFull(t *testing.T) {
	c := make(chan []byte, 1)
	trySend(c, []byte("1"))
	trySend(c, []byte("2")) // full buffer: dropped, without blocking
	if got := string(<-c); got != "1" || len(c) != 0 {
		t.Errorf("got %q", got)
	}
}
