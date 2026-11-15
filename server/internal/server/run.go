package server

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/LeoPenaguin/pixels/server/internal/board"

	"github.com/redis/go-redis/v9"
)

// Run reads its configuration from the environment, connects to Redis and serves until ctx is cancelled.
func Run(ctx context.Context, getenv func(string) string) error {
	env := func(k, def string) string {
		if v := getenv(k); v != "" {
			return v
		}
		return def
	}
	burst, err := strconv.Atoi(env("PIXEL_BURST", "10"))
	if err != nil {
		return fmt.Errorf("PIXEL_BURST: %w", err)
	}
	refillMs, err := strconv.Atoi(env("PIXEL_REFILL_MS", "2000"))
	if err != nil {
		return fmt.Errorf("PIXEL_REFILL_MS: %w", err)
	}
	opt, err := redis.ParseURL(env("REDIS_URL", "redis://localhost:6379"))
	if err != nil {
		return fmt.Errorf("REDIS_URL: %w", err)
	}
	rdb := redis.NewClient(opt)
	defer func() { _ = rdb.Close() }()
	if err := rdb.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("redis: %w", err)
	}

	s := New(board.NewStore(rdb), Options{Burst: burst, Refill: time.Duration(refillMs) * time.Millisecond})
	srv := &http.Server{Addr: env("ADDR", ":3007"), Handler: s.Handler(), ReadHeaderTimeout: 10 * time.Second}
	go s.Loop(ctx)
	go func() {
		<-ctx.Done()
		stop, cancel := context.WithTimeout(context.WithoutCancel(ctx), 5*time.Second)
		defer cancel()
		_ = srv.Shutdown(stop)
	}()
	log.Println("listening on", srv.Addr)
	if err := srv.ListenAndServe(); !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}
