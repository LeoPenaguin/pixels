# CLAUDE.md

1024 × 1024 collaborative pixel canvas (r/place-like, navigated like Figma). Go + Redis server, Svelte 5 front.
User-facing behaviour, protocol and configuration are described in [README.md](README.md); this file is about how to work on the code.

## Layout

```
server/                     Go module github.com/LeoPenaguin/pixels/server
  main.go                   entry point only: signals → server.Run
  internal/board/           world model: pixel geometry, palette, Redis Store (Lua paint script)
  internal/server/          HTTP routes, WebSocket, per-IP quotas and connection limits, batched broadcast hub, Run
web/                        Svelte 5 + Vite + TypeScript, pnpm
  src/App.svelte            wiring only: engine, live connection, keyboard, panels
  src/components/           presentational Svelte components (PascalCase.svelte)
  src/lib/                  framework-free logic: api, live (WebSocket), keyboard, quota, storage, colors, time
  src/lib/engine/           canvas engine: camera (pure maths), chunks (cache), minimap, world (rendering + input)
  src/test/fakes.ts         shared test doubles (fetch, WebSocket, frames)
  e2e/                      Playwright end-to-end tests
  .husky/                   Git hooks (installed by `pnpm install` in web/)
```

Keep that split: pure logic in `lib/` (no DOM where possible, so it is testable alone), the canvas engine independent of Svelte, components dumb (props in, callbacks out), `App.svelte` only connecting things.

## Commands

Run from the directory shown. Hooks run them too, so a commit or push fails if any of them fails.

| Task | Command |
|---|---|
| Start Redis | `redis-server --daemonize yes` |
| Dev server (Go, `:3007`) | `cd server && go run .` (unlimited quota: `PIXEL_REFILL_MS=0 go run .`) |
| Dev front (`:5173`) | `cd web && pnpm dev` |
| Front lint / auto-fix | `cd web && pnpm lint` / `pnpm format` |
| Front type check | `cd web && pnpm check` |
| Front unit tests + coverage | `cd web && pnpm test` (watch: `pnpm test:watch`) |
| End-to-end tests | `cd web && pnpm test:e2e` (needs Redis; uses DB 14, ports 3017 and 5183) |
| Go lint / auto-format | `cd server && golangci-lint run ./...` / `golangci-lint fmt` |
| Go tests + coverage | `cd server && go test -race -cover ./internal/...` |

Hooks (`web/.husky/`): **pre-commit** = front lint + type check + Go lint; **commit-msg** = commitlint; **pre-push** = branch name + Go tests (100 %) + front tests (100 %) + e2e.
Never bypass them (`--no-verify`); fix the cause instead.

## Language

- **English** for everything in the code base: comments, doc comments, test names, assertion messages, docs (README, this file), commit messages, branch names, identifiers.
- **French** only for what the user sees: UI labels, `aria-label`s, screen reader announcements, colour names. Tests assert on those French strings, which is expected.

## Naming

- Go: standard Go style (gofumpt + goimports, revive `exported`): exported identifiers get a doc comment starting with their name; short receiver names; avoid stutter like `board.BoardStore` (not enforced, but expected).
- TypeScript files: `camelCase.ts`; Svelte components: `PascalCase.svelte`; tests sit next to the code as `*.test.ts` (e2e: `e2e/*.spec.ts`).
- Types: `type`, never `interface` (lint rule). Constants: `UPPER_SNAKE_CASE` for tunables (`RETRY_MS`, `MAX_ZOOM`), with the unit in the name or a trailing comment.
- Component callback props are lowercase DOM-style: `onjump`, `onzoomin`, `ontogglegrid`. Component methods exposed via `bind:this` are verbs: `open()`, `toggle()`, `focus()`.
- Pixel coordinates are `x`, `y` (world), `cx`, `cy` (chunk), `sx`, `sy` (screen, CSS px); colour index is `c`.

## Lint rules

Both sides are strict and the config files are the source of truth: `web/eslint.config.js` (typescript-eslint `strictTypeChecked` + `stylisticTypeChecked`, Svelte recommended, extra consistency rules), `web/.prettierrc.json` (no semicolons, single quotes, width 120), `server/.golangci.yml` (standard + bodyclose, contextcheck, errorlint, gocritic, gosec, misspell, noctx, revive, …).
No need to memorise them: run the linters. Things they will push you towards:

- No non-null assertions (`!`) outside tests, no `any`, no floating promises, `===` only, template literals over concatenation, numbers wrapped in `String()` inside templates.
- Svelte: `<script lang="ts">`, `type="button"` on every button, keyed `{#each}`, `class:` / `style:` directives.
- Go: every error handled or wrapped (`fmt.Errorf("…: %w", err)`), contexts passed down, `//nolint` only with a specific linter and a reason.

## Tests

- **Coverage must stay at 100 %** (statements, branches, functions, lines) on both sides; the thresholds fail the run otherwise. Go coverage covers `./internal/...` (`main.go` is excluded on purpose).
- Front unit tests run in real headless Chromium (Vitest browser mode, `vitest-browser-svelte`): real canvas, `<dialog>`, focus. Use `page` / `userEvent` from `vitest/browser`. First run: `cd web && pnpm exec playwright install chromium`.
- Svelte compiles mixed text like `{a} text {b}` into `?? ''` branches that v8 reports as uncovered: write a single expression instead, e.g. ``{`${a} text ${b}`}``.
- Synthetic pointer events need `el.setPointerCapture = vi.fn()`. Tests rendering `App` must import `./app.css` (panels are positioned by it).
- Go tests use miniredis (`newTestEnv` in `server_test.go`); mark helpers with `t.Helper()`.
- E2E tests run with reduced motion (instant camera) and random coordinates, so they never depend on existing Redis data. Wait for the app to load (`open()` helper) before acting.
- One test per behaviour, named after the behaviour (`'reopens on the last painted pixel'`).

## Git

- Branches: `<type>/<kebab-case>`, e.g. `feat/minimap-drag`, `fix/quota-refill`, `refactor/go-svelte`. Types: `feat`, `fix`, `refactor`, `perf`, `test`, `docs`, `chore`, `ci`, `build`. Enforced on push.
- Commits: [Conventional Commits](https://www.conventionalcommits.org), English, imperative subject starting with a lower-case letter, no trailing period: `type(scope): subject`. Scopes (optional): `web`, `server`, `e2e`, `deps`, `repo`. Example: `feat(web): announce painted pixels to screen readers`. Breaking change: `feat(server)!: …`.
- Work on a branch, then merge into `main`.

## Principles

- Simplest thing that works; no speculative abstraction. A deliberate shortcut with a known ceiling gets a `ponytail:` comment naming the ceiling and the upgrade path (see `hub.go`, `server.go`, `ws.go`).
- Comments explain why, not what. Keep them short.
- Accessibility is a requirement, not a bonus: every control has an accessible name and a keyboard path, state changes are announced through the `aria-live` region, animations respect `prefers-reduced-motion`.
- Palette order is persisted in Redis: never reorder `PaletteRows`, only append.
