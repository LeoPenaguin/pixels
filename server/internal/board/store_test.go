package board

import (
	"context"
	"testing"

	"github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

func newTestStore(t *testing.T) (*Store, *miniredis.Miniredis) {
	t.Helper()
	mr := miniredis.RunT(t)
	return NewStore(redis.NewClient(&redis.Options{Addr: mr.Addr(), MaxRetries: -1})), mr
}

func TestPaint(t *testing.T) {
	s, mr := newTestStore(t)
	ctx := context.Background()
	paint := func(c int, at int64) bool {
		t.Helper()
		changed, err := s.Paint(ctx, Pixel{300, 1, c}, at)
		if err != nil {
			t.Fatal(err)
		}
		return changed
	}
	if paint(0, 1) {
		t.Error("white on a never-painted pixel is not a change")
	}
	if !paint(5, 2) || paint(5, 3) || !paint(7, 4) {
		t.Error("only real colour changes must count")
	}
	_, off := Locate(300, 1)
	if b, _ := mr.Get("chunk:1:0"); b[off] != 7 {
		t.Errorf("octet = %d ; attendu 7", b[off])
	}
}

func TestChunk(t *testing.T) {
	s, mr := newTestStore(t)
	ctx := context.Background()
	if data, err := s.Chunk(ctx, 0, 0); err != nil || data != nil {
		t.Errorf("chunk jamais peint : %v, %v ; attendu vide", data, err)
	}
	_ = mr.Set("chunk:-1:2", "\x00\x03")
	if data, err := s.Chunk(ctx, -1, 2); err != nil || string(data) != "\x00\x03" {
		t.Errorf("Chunk = %q, %v", data, err)
	}
	mr.Close()
	if _, err := s.Chunk(ctx, 0, 0); err == nil {
		t.Error("a Redis failure must be returned")
	}
}

func TestInfo(t *testing.T) {
	s, mr := newTestStore(t)
	ctx := context.Background()

	info, err := s.Info(ctx, -3, 4)
	if err != nil || info != (Info{X: -3, Y: 4}) {
		t.Errorf("pixel jamais peint : %+v, %v", info, err)
	}

	_, _ = s.Paint(ctx, Pixel{-3, 4, 9}, 1234)
	_, _ = s.Paint(ctx, Pixel{-3, 4, 2}, 5678)
	info, err = s.Info(ctx, -3, 4)
	if err != nil || info.C != 2 || info.Changes != 2 || info.LastChange == nil || *info.LastChange != 5678 {
		t.Errorf("Info = %+v, %v; want colour 2, 2 changes, last at 5678", info, err)
	}

	mr.Close()
	if _, err := s.Info(ctx, 0, 0); err == nil {
		t.Error("a Redis failure must be returned")
	}
}
