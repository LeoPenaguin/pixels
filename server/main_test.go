package main

import (
	"context"
	"testing"
	"time"

	"github.com/redis/go-redis/v9"
	"golang.org/x/time/rate"
)

func TestLocate(t *testing.T) {
	cases := []struct {
		x, y int
		key  string
		off  int64
	}{
		{0, 0, "0:0", 0},
		{255, 0, "0:0", 255},
		{256, 1, "1:0", 256},
		{-1, -1, "-1:-1", 255*256 + 255},
		{-256, -257, "-1:-2", 255 * 256},
	}
	for _, c := range cases {
		key, off := locate(c.x, c.y)
		if key != c.key || off != c.off {
			t.Errorf("locate(%d,%d) = %s,%d ; attendu %s,%d", c.x, c.y, key, off, c.key, c.off)
		}
	}
}

func TestValid(t *testing.T) {
	if !(pixel{-5, 7, 0}).valid() || (pixel{0, 0, len(palette)}).valid() ||
		(pixel{worldLimit, 0, 1}).valid() || (pixel{0, 0, -1}).valid() {
		t.Error("validation incorrecte")
	}
}

func TestParsePixel(t *testing.T) {
	for in, want := range map[string]bool{
		`{"x":-5,"y":7,"c":3}`:  true,
		`{}`:                    false,
		`{"x":1,"y":2}`:         false,
		`{"x":1.5,"y":2,"c":1}`: false,
		`{"x":1,"y":2,"c":99}`:  false,
		`nope`:                  false,
	} {
		if _, ok := parsePixel([]byte(in)); ok != want {
			t.Errorf("parsePixel(%s) = %v", in, ok)
		}
	}
}

func TestQuota(t *testing.T) {
	s := &server{burst: 3, refill: time.Hour, quotas: map[string]*rate.Limiter{}}
	for i := range 3 {
		if !s.quota("a").Allow() {
			t.Fatalf("pixel %d refusé alors que le quota est de 3", i+1)
		}
	}
	if s.quota("a").Allow() {
		t.Error("4e pixel accepté")
	}
	if !s.quota("b").Allow() {
		t.Error("le quota doit être par IP")
	}
	s = &server{burst: 1, quotas: map[string]*rate.Limiter{}} // refill 0 = illimité
	for range 100 {
		if !s.quota("a").Allow() {
			t.Fatal("refill 0 doit être illimité")
		}
	}
}

// Nécessite un Redis local (base 15, vidée) ; ignoré sinon.
func TestPaintScript(t *testing.T) {
	ctx := context.Background()
	rdb := redis.NewClient(&redis.Options{Addr: "localhost:6379", DB: 15})
	if rdb.Ping(ctx).Err() != nil {
		t.Skip("pas de Redis local")
	}
	rdb.FlushDB(ctx)
	defer rdb.FlushDB(ctx)

	keys := []string{"chunk:0:0", "meta:0:0"}
	paint := func(c, ts int) int {
		n, err := paintScript.Run(ctx, rdb, keys, 300, c, ts).Int()
		if err != nil {
			t.Fatal(err)
		}
		return n
	}
	if paint(0, 1) != 0 {
		t.Error("blanc sur un pixel jamais peint n'est pas un changement")
	}
	if paint(5, 2) != 1 || paint(5, 3) != 0 || paint(7, 4) != 1 {
		t.Error("seuls les vrais changements de couleur doivent compter")
	}
	meta := rdb.HGetAll(ctx, "meta:0:0").Val()
	if meta["n:300"] != "2" || meta["t:300"] != "4" {
		t.Errorf("meta = %v ; attendu 2 changements, dernier à 4", meta)
	}
	if b := rdb.GetRange(ctx, "chunk:0:0", 300, 300).Val(); b != "\x07" {
		t.Errorf("octet = %q ; attendu 7", b)
	}
}
