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
- Barre d'outils en bas : le bouton palette (touche `C`) ouvre le choix des couleurs au-dessus, le carré à côté de l'icône montre la couleur active ; Échap ferme. Juste après, afficher / cacher la grille (touche `G`). À droite, la jauge du quota.
- Boutons en bas à droite : zoomer / dézoomer, revenir en 0, 0 (touche `0`).
- Champs X / Y en haut à gauche : ils suivent la souris ; on peut y taper des coordonnées (négatives comprises) puis Entrée pour y aller. Échap annule. Le pixel visé est entouré en bleu pendant 1 s.
- Recentrer, zoom par boutons / clavier et saut sont animés ; pour une destination lointaine, la vue part de quelques écrans avant la cible.
- Minimap en haut à droite : 256 pixels de monde de large (doublé par paliers si on dézoome beaucoup), le rectangle bleu montre ce qu'on voit. Glisser dedans déplace ce rectangle ; un clic y va en animation.
- À l'ouverture, la vue se centre sur le dernier pixel qu'on a posé (mémorisé dans le navigateur) ; si on n'en a jamais posé, on revient à la dernière vue.
- Clavier : flèches pour déplacer un curseur (Maj : 10 pixels, la vue suit), Entrée ou Espace pour poser, `?` pour la liste des raccourcis. Dans la palette, les flèches changent de couleur.
- Accessibilité : chaque contrôle a un nom lisible (couleurs nommées en français), le board annonce le pixel visé et les pixels posés aux lecteurs d'écran, et les animations sont coupées si le système demande de réduire les animations.
- Survoler un pixel : affiche combien de fois il a changé de couleur et quand.

## Fonctionnement

- Le monde va de -1 048 576 à 1 048 575 sur chaque axe, découpé en chunks de 256×256.
- Chaque chunk est une chaîne Redis `chunk:{cx}:{cy}` de 65 536 octets, 1 octet = index dans la palette (0 = blanc = jamais peint).
- Son historique est dans le hash `meta:{cx}:{cy}` : `n:{offset}` = nombre de changements de couleur, `t:{offset}` = date du dernier (ms Unix).
- Poser un pixel = un script Lua atomique : si la couleur change, il écrit l'octet (`SETRANGE`), incrémente le compteur et date le changement. Reposer la même couleur ne compte pas.
- `GET /api/pixels/{x}/{y}` renvoie `{x, y, c, changes, lastChange}` ; le front l'affiche sous les coordonnées du pixel survolé.
- Le client charge les chunks visibles (`GET /api/chunks/{cx}/{cy}`, octets bruts) et reçoit les pixels en direct via `/ws`.
- Protocole WS : le client envoie `{"x","y","c"}`. Le serveur répond `{"t":"q","n"}` (pixels restants dans le quota) et diffuse toutes les 100 ms un lot `{"t":"b","p":[x,y,c, x,y,c, …]}` avec tous les pixels posés entre-temps.

## Protections (sans compte utilisateur)

- Validation stricte : entiers, dans les bornes du monde, couleur dans la palette.
- Quota par IP (seau de jetons) : 10 pixels d'affilée, puis 1 de plus toutes les 2 s. Le quota survit à la déconnexion.
- Diffusion groupée toutes les 100 ms : le nombre de messages envoyés ne dépend plus du nombre de clics.
- Anti-flood : 10 messages/s (rafale 20) par connexion, au-delà la connexion est coupée ; messages de 256 octets max.
- 10 connexions WebSocket max par IP ; WebSocket refusé depuis une autre origine.

## Configuration (variables d'environnement du serveur)

| Variable | Défaut |
|---|---|
| `ADDR` | `:3007` |
| `REDIS_URL` | `redis://localhost:6379` |
| `PIXEL_BURST` | `10` (pixels posables d'affilée) |
| `PIXEL_REFILL_MS` | `2000` (temps pour regagner 1 pixel ; `0` = illimité, pratique en dev : `PIXEL_REFILL_MS=0 go run .`) |

## Tests

```bash
cd server && go test ./...
```

(Le test du script Lua utilise la base Redis 15 et la vide ; il est ignoré si Redis ne tourne pas.)

```bash
cd web && pnpm check
```
