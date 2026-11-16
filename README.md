# Pixels

A 1920 × 1080 collaborative pixel canvas in the spirit of r/place, navigated like a Figma board.

- **server/**: Go. HTTP + WebSocket, storage in Redis.
- **web/**: Svelte 5 + Vite. One full-screen `<canvas>`. The UI is in French.

## Run locally

Requirements: Go, Node, pnpm and Redis (`brew install go redis pnpm golangci-lint`).

```bash
redis-server --daemonize yes
```

```bash
cd server && go run .
```

```bash
cd web && pnpm install && pnpm dev
```

Then open http://localhost:5173 (Vite proxies `/api` and `/ws` to the Go server on `:3007`).

## Development

`pnpm install` also installs the Git hooks (Husky). Every command below is also run by a hook.

| What | Command | Hook |
|---|---|---|
| Front lint (Prettier + ESLint) | `cd web && pnpm lint` (fix: `pnpm format`) | pre-commit |
| Front type check | `cd web && pnpm check` | pre-commit |
| Go lint + format check | `cd server && golangci-lint run ./...` (fix: `golangci-lint fmt`) | pre-commit |
| Commit message | Conventional Commits, checked by commitlint | commit-msg |
| Branch name | `<type>/<kebab-case>` | pre-push |
| Front unit tests, 100 % coverage | `cd web && pnpm test` | pre-push |
| Go tests, 100 % coverage | `cd server && go test -race -cover ./internal/...` | pre-push |
| End-to-end tests | `cd web && pnpm test:e2e` | pre-push |

- Front unit tests run in a real headless Chromium (Vitest browser mode). Once: `cd web && pnpm exec playwright install chromium`.
- Go tests use an in-memory Redis (miniredis): no Redis needed.
- End-to-end tests start their own Go server (`:3017`, Redis database 14) and Vite (`:5183`): Redis must be running.

See [CLAUDE.md](CLAUDE.md) for conventions (naming, commits, branches, layout).

## Controls

- Drag, wheel or two fingers: pan. Ctrl + wheel, pinch or `+` / `-`: zoom.
- Click (without dragging): paint a pixel with the selected colour. Outside the 1920 × 1080 world (grey area), nothing is painted.
- Bottom toolbar: palette button (`C`), with a swatch of the current colour; Escape closes it. Grid toggle (`G`). Quota gauge.
- Bottom-right buttons: zoom in / out, back to 0, 0 (`0`), shortcut list (`?`).
- X / Y fields (top left) follow the pointer; type coordinates and press Enter to jump there. Escape cancels.
- Recenter, button / keyboard zoom and jumps are animated; a far jump starts a few screens before the target.
- Minimap (top right): drag to pan, click to fly there.
- On load, the view opens on 0, 0.
- Keyboard: arrows move a cursor (Shift: 10 pixels, the view follows), Enter or Space paints.
- Accessibility: every control has a name (colours have French names), the board announces the targeted and painted pixels to screen readers, and animations are disabled when the system asks for reduced motion.
- Hovering a pixel shows how many times its colour changed and when.

## How it works

- The world is 1920 × 1080 (16:9) and centred on 0, 0: x from -960 to 959, y from -540 to 539. It is stored in 256×256 chunks (8 × 6, the border ones partly outside). The size is `WorldWidth` / `WorldHeight` in `server/internal/board/pixel.go`; growing it later needs no data migration.
- Each chunk is a Redis string `chunk:{cx}:{cy}` of 65,536 bytes, one byte = palette index (0 = white = never painted).
- History lives in the hash `meta:{cx}:{cy}`: `n:{offset}` = colour change count, `t:{offset}` = time of the last change (Unix ms).
- Painting runs an atomic Lua script: if the colour changes, it writes the byte (`SETRANGE`), bumps the counter and timestamps the change. Painting the same colour again does not count.
- `GET /api/config` returns the palette and quota; `GET /api/chunks/{cx}/{cy}` the raw chunk bytes (gzipped when the client accepts it); `GET /api/pixels/{x}/{y}` returns `{x, y, c, changes, lastChange}`.
- WebSocket `/ws`: the client sends `{"x","y","c"}`. The server answers `{"t":"q","n"}` (remaining quota) and broadcasts every 100 ms a batch `{"t":"b","p":[x,y,c, x,y,c, …]}` of every pixel painted meanwhile. Messages over 512 bytes are compressed (permessage-deflate) when the browser supports it.

## Protections (no user accounts)

- Strict validation: integers, within world bounds, colour in the palette.
- Per-IP quota (token bucket): 10 pixels in a row, then one more every 2 s. The quota survives disconnection.
- Batched broadcast every 100 ms: outgoing messages no longer scale with clicks.
- Anti-flood: 10 messages/s (burst 20) per connection, beyond that the connection is closed; messages are 256 bytes max.
- 10 WebSocket connections max per IP; cross-origin WebSockets are refused.

## Server configuration (environment variables)

| Variable | Default |
|---|---|
| `ADDR` | `:3007` |
| `REDIS_URL` | `redis://localhost:6379` |
| `PIXEL_BURST` | `10` (pixels in a row) |
| `PIXEL_REFILL_MS` | `2000` (time to regain one pixel; `0` = unlimited, handy in dev: `PIXEL_REFILL_MS=0 go run .`) |
