// Command server runs pixels: one 1920 × 1080 grid split into 256×256 chunks stored in Redis.
// All the logic lives in internal/; this file only starts it.
package main

import (
	"context"
	"log"
	"os"
	"os/signal"
	"syscall"

	"github.com/LeoPenaguin/pixels/server/internal/server"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

// run serves until Ctrl+C or SIGTERM (graceful shutdown: open connections finish).
func run() error {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	return server.Run(ctx, os.Getenv)
}
