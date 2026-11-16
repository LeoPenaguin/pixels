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
	for i, c := range []int{5, 5, 7} {
		if err := s.Paint(ctx, Pixel{300, 1, c}, int64(i)); err != nil {
			t.Fatal(err)
		}
	}
	_, off := Locate(300, 1)
	if b, _ := mr.Get("chunk:1:0"); b[off] != 7 {
		t.Errorf("byte = %d; want 7", b[off])
	}
	if info, _ := s.Info(ctx, 300, 1); info.Changes != 3 {
		t.Errorf("changes = %d; want 3: repainting the same colour counts too", info.Changes)
	}
}

func TestChunk(t *testing.T) {
	s, mr := newTestStore(t)
	ctx := context.Background()
	if data, err := s.Chunk(ctx, 0, 0); err != nil || data != nil {
		t.Errorf("never-painted chunk: %v, %v; want empty", data, err)
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
		t.Errorf("never-painted pixel: %+v, %v", info, err)
	}

	_ = s.Paint(ctx, Pixel{-3, 4, 9}, 1234)
	_ = s.Paint(ctx, Pixel{-3, 4, 2}, 5678)
	info, err = s.Info(ctx, -3, 4)
	if err != nil || info.C != 2 || info.Changes != 2 || info.LastChange == nil || *info.LastChange != 5678 {
		t.Errorf("Info = %+v, %v; want colour 2, 2 changes, last at 5678", info, err)
	}

	mr.Close()
	if _, err := s.Info(ctx, 0, 0); err == nil {
		t.Error("a Redis failure must be returned")
	}
}
