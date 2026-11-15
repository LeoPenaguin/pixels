# Pixels

Une grille de pixels infinie et collaborative, façon r/place, qu'on parcourt comme un canevas Figma.

- **server/** : Go. HTTP + WebSocket, stockage dans Redis.
- **web/** : Svelte 5 + Vite. Un seul `<canvas>` plein écran.

## Lancer en local

Il faut Go, Node, pnpm et Redis (`brew install go redis pnpm`).

```bash
redis-server --daemonize yes
```

```bash
cd server && go run .
```

```bash
cd web && pnpm install && pnpm dev
```

Puis ouvrir http://localhost:5173 (Vite proxifie `/api` et `/ws` vers le serveur Go sur `:3007`).

## Commandes

- Glisser : se déplacer. Molette / deux doigts : se déplacer. Ctrl + molette, pincement ou `+` / `-` : zoomer.
- Clic (sans glisser) : poser un pixel de la couleur choisie.

## Fonctionnement

- Le monde va de -1 048 576 à 1 048 575 sur chaque axe, découpé en chunks de 256×256.
- Chaque chunk est une chaîne Redis `chunk:{cx}:{cy}` de 65 536 octets, 1 octet = index dans la palette (0 = blanc = jamais peint). Poser un pixel = un `SETRANGE` d'un octet, atomique.
- Le client charge les chunks visibles (`GET /api/chunks/{cx}/{cy}`, octets bruts) et reçoit les pixels en direct via `/ws`.
- Protocole WS : le client envoie `{"x","y","c"}` ; le serveur diffuse `{"t":"p","x","y","c"}` et répond `{"t":"cd","ms"}` (cooldown restant).

## Protections (sans compte utilisateur)

- Validation stricte : entiers, dans les bornes du monde, couleur dans la palette.
- Cooldown par IP (Redis `SET NX PX`), 5 s par défaut.
- Anti-flood : 5 messages/s (rafale 10) par connexion, au-delà la connexion est coupée ; messages de 256 octets max.
- 10 connexions WebSocket max par IP ; WebSocket refusé depuis une autre origine.

## Configuration (variables d'environnement du serveur)

| Variable | Défaut |
|---|---|
| `ADDR` | `:3007` |
| `REDIS_URL` | `redis://localhost:6379` |
| `COOLDOWN_MS` | `5000` |

## Tests

```bash
cd server && go test ./...
```

```bash
cd web && pnpm check
```
