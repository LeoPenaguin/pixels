package board

import (
	"context"
	"errors"
	"strconv"

	"github.com/redis/go-redis/v9"
)

// Store keeps the world in Redis. For a chunk "cx:cy":
//
//	chunk:cx:cy  65,536-byte string, one colour per pixel (missing or short = white)
//	meta:cx:cy   hash, "n:{offset}" = colour change count, "t:{offset}" = time of the last one (Unix ms)
type Store struct{ rdb redis.UniversalClient }

// NewStore stores the world in the given Redis.
func NewStore(rdb redis.UniversalClient) *Store { return &Store{rdb} }

// Info is a pixel's state. LastChange is nil if its colour never changed.
type Info struct {
	X          int    `json:"x"`
	Y          int    `json:"y"`
	C          int    `json:"c"`
	Changes    int64  `json:"changes"`
	LastChange *int64 `json:"lastChange"`
}

// Atomic paint: writes the byte, bumps the counter and timestamps the change. Every paint
// counts, same colour included: repainting a pixel is a deliberate (and paid) move.
var paintScript = redis.NewScript(`
local off = tonumber(ARGV[1])
redis.call('SETRANGE', KEYS[1], off, string.char(tonumber(ARGV[2])))
redis.call('HINCRBY', KEYS[2], 'n:' .. off, 1)
redis.call('HSET', KEYS[2], 't:' .. off, ARGV[3])
return 1
`)

// Paint sets a pixel at time `at` (Unix ms).
func (s *Store) Paint(ctx context.Context, p Pixel, at int64) error {
	id, off := Locate(p.X, p.Y)
	return paintScript.Run(ctx, s.rdb, []string{"chunk:" + id, "meta:" + id}, off, p.C, at).Err()
}

// Chunk returns a chunk's raw bytes; empty if it was never painted.
func (s *Store) Chunk(ctx context.Context, cx, cy int) ([]byte, error) {
	data, err := s.rdb.Get(ctx, "chunk:"+ChunkID(cx, cy)).Bytes()
	if errors.Is(err, redis.Nil) {
		return nil, nil
	}
	return data, err
}

// Info reads a pixel's colour and history.
func (s *Store) Info(ctx context.Context, x, y int) (Info, error) {
	id, off := Locate(x, y)
	o := strconv.FormatInt(off, 10)
	pipe := s.rdb.Pipeline()
	color := pipe.GetRange(ctx, "chunk:"+id, off, off)
	meta := pipe.HMGet(ctx, "meta:"+id, "n:"+o, "t:"+o)
	if _, err := pipe.Exec(ctx); err != nil {
		return Info{}, err
	}
	info := Info{X: x, Y: y}
	if v := color.Val(); len(v) == 1 {
		info.C = int(v[0])
	}
	if v, ok := meta.Val()[0].(string); ok {
		info.Changes, _ = strconv.ParseInt(v, 10, 64)
	}
	if v, ok := meta.Val()[1].(string); ok {
		last, _ := strconv.ParseInt(v, 10, 64)
		info.LastChange = &last
	}
	return info, nil
}
