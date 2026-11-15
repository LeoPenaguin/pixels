<script lang="ts">
  import { onMount, tick } from 'svelte'
  import { World, type Config } from './world'

  let canvas: HTMLCanvasElement
  let minimap: HTMLCanvasElement
  let cfg = $state<Config>()
  let world: World | undefined
  let color = $state(5)
  let hover = $state<{ x: number; y: number } | null>(null)
  // Quota : `quota.n` pixels disponibles à l'instant `quota.at`, le serveur fait foi (message "q").
  let quota = $state({ n: Infinity, at: 0 })
  let now = $state(Date.now())
  let lost = $state(false) // vrai seulement après une coupure, pas au premier chargement
  let error = $state('')
  let showGrid = $state(true)
  let paletteOpen = $state(false)
  let paletteButton = $state<HTMLButtonElement>()
  let swatches: HTMLButtonElement[] = $state([])
  let help: HTMLDialogElement
  // Annonces pour les lecteurs d'écran (région aria-live).
  let message = $state('')
  let announceInfo = false // le curseur clavier vient de bouger : on annonce le pixel visé
  // Champs X / Y : suivent la souris, sauf pendant qu'on les édite pour sauter quelque part.
  let editing = $state(false)
  let fx = $state<number | null>(0)
  let fy = $state<number | null>(0)
  // Souris sur le board : ses coordonnées. Sinon (par ex. en allant vers les champs) : le centre
  // de la vue, pour ne pas garder la dernière position survolée en chemin.
  let center = $state({ x: 0, y: 0 })
  $effect(() => {
    if (editing) return
    const p = hover ?? center
    fx = p.x
    fy = p.y
  })
  // Historique du pixel survolé, chargé après un court arrêt de la souris.
  type PixelInfo = { x: number; y: number; c: number; changes: number; lastChange: number | null }
  let info = $state<PixelInfo | null>(null)
  const shownInfo = $derived(info && hover && info.x === hover.x && info.y === hover.y ? info : null)

  // Noms lus par les lecteurs d'écran ; une couleur ajoutée sans nom est lue en hexadécimal.
  const NAMES: Record<string, string> = {
    '#FFFFFF': 'Blanc', '#CDCDCD': 'Gris très clair', '#9C9C9C': 'Gris clair', '#696969': 'Gris',
    '#373737': 'Gris foncé', '#000000': 'Noir',
    '#E5A49C': 'Saumon pâle', '#F6C886': 'Abricot pâle', '#FBE7AA': 'Jaune pâle', '#99E3B5': 'Vert pâle',
    '#A6E6E7': 'Turquoise pâle', '#A5A1E1': 'Lavande', '#D8A4E2': 'Mauve pâle',
    '#D34F3E': 'Rouge', '#F09336': 'Orange', '#F7CF5F': 'Jaune', '#5CC96E': 'Vert',
    '#65CFD0': 'Turquoise', '#597CE2': 'Bleu', '#B64DC8': 'Violet',
    '#7D2E25': 'Rouge foncé', '#A84F1D': 'Orange brûlé', '#CD9C34': 'Ocre', '#347842': 'Vert foncé',
    '#3B7C7C': 'Bleu canard', '#354A87': 'Bleu marine', '#6D2D77': 'Prune',
    '#E52521': 'Rouge vif', '#FF4FA3': 'Rose vif', '#FFE135': 'Jaune vif', '#2ECC40': 'Vert vif',
    '#00B4F0': 'Cyan vif', '#1F5BFF': 'Bleu vif', '#8A2BE2': 'Violet vif',
    '#F2C9A8': 'Beige', '#C68B59': 'Caramel', '#7A4A2E': 'Brun', '#4A2E1C': 'Brun foncé',
  }
  const nameOf = (i: number) => NAMES[colors[i]] ?? colors[i] ?? ''

  // Index de départ de chaque ligne dans la palette aplatie.
  const colors = $derived(cfg ? cfg.palette.flat() : [])
  const offsets = $derived(cfg ? cfg.palette.map((_, r) => cfg!.palette.slice(0, r).flat().length) : [])
  const limited = $derived(!!cfg && cfg.quota.refillMs > 0)
  const tokens = $derived(cfg ? Math.min(cfg.quota.burst, quota.n + (now - quota.at) / cfg.quota.refillMs) : 0)
  const available = $derived(Math.floor(tokens))
  const full = $derived(!!cfg && available >= cfg.quota.burst)
  const refill = $derived(full ? 1 : tokens - available) // avancement vers le prochain pixel, 0 → 1
  const nextIn = $derived(cfg ? Math.ceil(((available + 1 - tokens) * cfg.quota.refillMs) / 1000) : 0)

  let ws: WebSocket | undefined
  let infoTimer: ReturnType<typeof setTimeout> | undefined

  function loadInfo() {
    clearTimeout(infoTimer)
    infoTimer = setTimeout(async () => {
      if (!hover) return
      try {
        const r = await fetch(`/api/pixels/${hover.x}/${hover.y}`)
        if (!r.ok) return
        info = await r.json()
        if (announceInfo && info && info.x === hover?.x && info.y === hover?.y) {
          announceInfo = false
          const n = info.changes
          announce(`${info.x}, ${info.y} : ${nameOf(info.c)}${n ? `, ${n} changement${n > 1 ? 's' : ''}` : ''}`)
        }
      } catch {
        // pas grave : l'info réapparaîtra au prochain survol
      }
    }, 200)
  }

  const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })
  function ago(ms: number) {
    const s = Math.round((ms - now) / 1000)
    for (const [unit, size] of [['day', 86400], ['hour', 3600], ['minute', 60]] as const) {
      if (Math.abs(s) >= size) return rtf.format(Math.round(s / size), unit)
    }
    return rtf.format(s, 'second')
  }

  function connect() {
    ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`)
    // À chaque (re)connexion on recharge les chunks : rien de raté entre le fetch et le flux live.
    ws.onopen = () => {
      lost = false
      world?.reload()
    }
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.t === 'b') {
        for (let i = 0; i < msg.p.length; i += 3) {
          world?.setPixel(msg.p[i], msg.p[i + 1], msg.p[i + 2])
          if (msg.p[i] === hover?.x && msg.p[i + 1] === hover?.y) loadInfo() // le pixel survolé vient de changer
        }
      }      else if (msg.t === 'q') quota = { n: msg.n, at: Date.now() }
    }
    ws.onclose = () => {
      lost = true
      setTimeout(connect, 1000)
    }
  }

  // Dernier pixel posé par ce visiteur : la page s'ouvre dessus.
  const LAST_KEY = 'pixels:last'
  let lastPlaced: { x: number; y: number } | null = (() => {
    try {
      const v = JSON.parse(localStorage.getItem(LAST_KEY) ?? 'null')
      return Number.isInteger(v?.x) && Number.isInteger(v?.y) ? v : null
    } catch {
      return null
    }
  })()

  function announce(text: string) {
    message = ''
    setTimeout(() => (message = text), 50) // vider puis remplir : une annonce identique est relue
  }

  function place(x: number, y: number) {
    if (ws?.readyState !== WebSocket.OPEN) return announce('Hors ligne, pixel non posé')
    if (limited) {
      now = Date.now()
      if (available < 1) return announce(`Plus de pixel disponible, prochain dans ${nextIn} secondes`)
      quota = { n: tokens - 1, at: now } // optimiste, corrigé par la réponse du serveur
    }
    ws.send(JSON.stringify({ x, y, c: color }))
    lastPlaced = { x, y }
    try {
      localStorage.setItem(LAST_KEY, JSON.stringify(lastPlaced))
    } catch {}
    announce(`${nameOf(color)} posé en ${x}, ${y}`)
  }

  const ARROWS: Record<string, [number, number]> = {
    ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
  }

  function moveCursor(dx: number, dy: number) {
    if (!world) return
    const from = world.hover ?? center
    announceInfo = true
    hover = world.setCursor(from.x + dx, from.y + dy)
    loadInfo()
  }

  function key(e: KeyboardEvent) {
    // Champs de saisie, raccourcis du navigateur (Ctrl + -, Cmd + 0…), touches déjà traitées : on laisse.
    if (e.target instanceof HTMLInputElement || e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return
    if (help?.open) return // la boîte d'aide gère elle-même Échap
    const k = e.key.toLowerCase()
    const onBoard = e.target === canvas || e.target === document.body
    if (e.key in ARROWS) {
      const [dx, dy] = ARROWS[e.key]
      const step = e.shiftKey ? 10 : 1
      moveCursor(dx * step, dy * step)
    } else if ((e.key === 'Enter' || e.key === ' ') && onBoard) {
      if (!world?.hover) return moveCursor(0, 0) // premier appui : fait apparaître le curseur
      place(world.hover.x, world.hover.y)
    } else if (e.key === '+' || e.key === '=') world?.zoomBy(1.5)
    else if (e.key === '-') world?.zoomBy(1 / 1.5)
    else if (e.key === '0') world?.recenter()
    else if (k === 'g') toggleGrid()
    else if (k === 'c') togglePalette()
    else if (e.key === '?') help.showModal()
    else if (e.key === 'Escape' && paletteOpen) closePalette()
    else return
    e.preventDefault()
  }

  async function togglePalette() {
    if (paletteOpen) return closePalette()
    paletteOpen = true
    await tick()
    swatches[color]?.focus()
  }

  function closePalette() {
    const inside = document.activeElement?.closest('#palette-panel')
    paletteOpen = false
    if (inside) paletteButton?.focus() // ne pas perdre le focus clavier
  }

  // Palette = groupe de boutons radio : flèches pour changer de couleur (la sélection suit le focus).
  function paletteKey(e: KeyboardEvent) {
    const rows = cfg!.palette
    let r = offsets.findLastIndex((o) => o <= color)
    let i = color
    if (e.key === 'ArrowLeft') i = (color - 1 + colors.length) % colors.length
    else if (e.key === 'ArrowRight') i = (color + 1) % colors.length
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      const col = color - offsets[r]
      r = (r + (e.key === 'ArrowUp' ? rows.length - 1 : 1)) % rows.length
      i = offsets[r] + Math.min(col, rows[r].length - 1)
    } else if (e.key === 'Home') i = 0
    else if (e.key === 'End') i = colors.length - 1
    else return
    e.preventDefault()
    color = i
    swatches[i]?.focus()
  }

  function toggleGrid() {
    world?.toggleGrid()
    showGrid = world?.showGrid ?? true
  }

  function jump(e: SubmitEvent) {
    e.preventDefault()
    if (!Number.isInteger(fx) || !Number.isInteger(fy)) return
    world?.jumpTo(fx!, fy!)
    ;(document.activeElement as HTMLElement | null)?.blur()
  }

  function cancelEdit(e: KeyboardEvent) {
    if (e.key === 'Escape') (e.target as HTMLElement).blur()
  }

  // Réessaie tant que le serveur ne répond pas (ex. page ouverte pendant un redémarrage).
  // Dernière vue du visiteur, pour reprendre là où il était.
  const VIEW_KEY = 'pixels:view'
  function restoreView() {
    try {
      const v = JSON.parse(localStorage.getItem(VIEW_KEY) ?? 'null')
      if (![v?.x, v?.y, v?.zoom].every(Number.isFinite)) return
      world!.cam = { x: v.x, y: v.y, zoom: v.zoom }
      world!.zoomAt(1) // borne le zoom et la position
    } catch {}
  }
  function saveView() {
    try {
      if (world) localStorage.setItem(VIEW_KEY, JSON.stringify(world.cam))
    } catch {}
  }

  async function init() {
    try {
      const r = await fetch('/api/config')
      if (!r.ok) throw new Error(r.statusText)
      const c: Config = await r.json()
      error = ''
      cfg = c
      quota = { n: c.quota.burst, at: Date.now() }
      world = new World(canvas, c)
      world.onHover = (p) => {
        announceInfo = false // souris
        hover = p
        loadInfo()
      }
      world.onPlace = (x, y) => {
        paletteOpen = false // un clic sur le board referme la palette
        place(x, y)
      }
      world.onView = (c) => {
        if (c.x !== center.x || c.y !== center.y) center = c
      }
      if (lastPlaced) world.cam = { ...world.cam, x: lastPlaced.x + 0.5, y: lastPlaced.y + 0.5 }
      else restoreView()
      world.setMinimap(minimap)
      connect()
    } catch {
      error = 'Serveur injoignable'
      setTimeout(init, 2000)
    }
  }

  onMount(() => {
    const tick = setInterval(() => (now = Date.now()), 250)
    init()
    return () => clearInterval(tick)
  })
</script>

<svelte:window onkeydown={key} onpagehide={saveView} />
<svelte:document onvisibilitychange={() => document.hidden && saveView()} />

<!-- Board = zone interactive gérée par nos raccourcis : role application pour que les lecteurs
     d'écran laissent passer les flèches, Entrée et Espace. -->
<!-- svelte-ignore a11y_no_interactive_element_to_noninteractive_role -->
<canvas
  class="world"
  bind:this={canvas}
  tabindex="0"
  role="application"
  aria-label="Board de pixels"
  aria-describedby="board-help"
></canvas>
<p id="board-help" class="sr-only">
  Flèches pour déplacer le curseur, Maj et flèches pour aller 10 pixels plus loin, Entrée ou Espace pour poser
  un pixel de la couleur choisie. Plus et moins pour zoomer, 0 pour revenir en 0, 0, C pour les couleurs,
  G pour la grille, point d'interrogation pour la liste des raccourcis.
</p>
<div class="sr-only" aria-live="polite">{message}</div>

<div class="panel top-left">
  <form
    class="row"
    aria-label="Aller à un pixel"
    onsubmit={jump}
    onfocusin={() => (editing = true)}
    onfocusout={(e) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node)) editing = false
    }}
  >
    <label>X <input type="number" step="1" bind:value={fx} onkeydown={cancelEdit} aria-label="Coordonnée X" /></label>
    <label>Y <input type="number" step="1" bind:value={fy} onkeydown={cancelEdit} aria-label="Coordonnée Y" /></label>
    <button class="icon" type="submit" title="Aller à ces coordonnées (Entrée)" aria-label="Aller à ces coordonnées">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </button>
  </form>
  {#if error}
    <div class="info" role="alert">{error}</div>
  {:else if shownInfo}
    <div class="info">
      {#if shownInfo.lastChange}
        {shownInfo.changes} changement{shownInfo.changes > 1 ? 's' : ''} · dernier {ago(shownInfo.lastChange)}
      {:else if shownInfo.c}
        Peint avant le suivi des changements
      {:else}
        Jamais peint
      {/if}
    </div>
  {/if}
</div>

<canvas class="panel minimap" bind:this={minimap} aria-hidden="true"></canvas>

<div class="panel controls" role="group" aria-label="Navigation">
  <button class="icon" title="Zoomer (+)" aria-label="Zoomer" aria-keyshortcuts="+" onclick={() => world?.zoomBy(1.5)}>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  </button>
  <button class="icon" title="Dézoomer (−)" aria-label="Dézoomer" aria-keyshortcuts="-" onclick={() => world?.zoomBy(1 / 1.5)}>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  </button>
  <hr />
  <button class="icon" title="Recentrer sur 0, 0 (touche 0)" aria-label="Recentrer sur 0, 0" aria-keyshortcuts="0" onclick={() => world?.recenter()}>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="12" cy="12" r="7" /><circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
    </svg>
  </button>
  <hr />
  <button class="icon" title="Raccourcis clavier (?)" aria-label="Raccourcis clavier" aria-keyshortcuts="Shift+?" aria-haspopup="dialog" onclick={() => help.showModal()}>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
      <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
    </svg>
  </button>
</div>

<dialog class="panel help" bind:this={help} aria-labelledby="help-title" onclick={(e) => e.target === help && help.close()}>
  <div class="help-head">
    <h2 id="help-title">Raccourcis clavier</h2>
    <button class="icon" aria-label="Fermer" title="Fermer (Échap)" onclick={() => help.close()}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  </div>
  <dl>
    <dt><kbd>←</kbd> <kbd>↑</kbd> <kbd>→</kbd> <kbd>↓</kbd></dt><dd>Déplacer le curseur (la vue suit)</dd>
    <dt><kbd>Maj</kbd> + flèches</dt><dd>Déplacer de 10 pixels</dd>
    <dt><kbd>Entrée</kbd> ou <kbd>Espace</kbd></dt><dd>Poser un pixel sous le curseur</dd>
    <dt><kbd>+</kbd> <kbd>−</kbd></dt><dd>Zoomer, dézoomer</dd>
    <dt><kbd>0</kbd></dt><dd>Revenir en 0, 0</dd>
    <dt><kbd>C</kbd></dt><dd>Ouvrir ou fermer les couleurs (flèches pour choisir)</dd>
    <dt><kbd>G</kbd></dt><dd>Afficher ou cacher la grille</dd>
    <dt><kbd>Tab</kbd></dt><dd>Passer d'un bouton à l'autre ; les champs X / Y permettent de sauter à un pixel</dd>
    <dt><kbd>Échap</kbd></dt><dd>Fermer la palette ou cette aide</dd>
    <dt><kbd>?</kbd></dt><dd>Afficher cette aide</dd>
  </dl>
</dialog>

{#if lost}
  <div class="panel offline" role="status">Connexion perdue, reconnexion…</div>
{/if}

{#if cfg}
  <!-- Barre d'outils en bas : un bouton par outil, chacun peut ouvrir son panneau au-dessus. -->
  <div class="dock">
    {#if paletteOpen}
      <div class="panel popover" id="palette-panel">
        <!-- svelte-ignore a11y_interactive_supports_focus -->
        <div class="grid" role="radiogroup" aria-label="Couleur" tabindex="-1" onkeydown={paletteKey}>
          {#each cfg.palette as row, r}
            {#each row as hex, i}
              {@const index = offsets[r] + i}
              <button
                class="swatch"
                style:background={hex}
                style:grid-row={r + 1}
                class:selected={index === color}
                bind:this={swatches[index]}
                role="radio"
                aria-label={nameOf(index)}
                title={nameOf(index)}
                aria-checked={index === color}
                tabindex={index === color ? 0 : -1}
                onclick={() => (color = index)}
              ></button>
            {/each}
          {/each}
        </div>
      </div>
    {/if}

    <div class="panel toolbar" role="group" aria-label="Outils">
      <button
        bind:this={paletteButton}
        class="icon tool"
        class:active={paletteOpen}
        style:--c={colors[color]}
        title="Couleurs (C)"
        aria-label="Couleurs, couleur actuelle : {nameOf(color)}"
        aria-keyshortcuts="C"
        aria-expanded={paletteOpen}
        aria-controls="palette-panel"
        onclick={togglePalette}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 21a9 9 0 0 1 0-18c4.97 0 9 3.58 9 8 0 1.06-.47 2.08-1.32 2.83-.84.75-1.99 1.17-3.18 1.17H14a2 2 0 0 0-1 3.75A1.3 1.3 0 0 1 12 21" />
          <circle cx="7.5" cy="10.5" r=".5" fill="currentColor" /><circle cx="12" cy="7.5" r=".5" fill="currentColor" /><circle cx="16.5" cy="10.5" r=".5" fill="currentColor" />
        </svg>
        <span class="current" style:background={colors[color]}></span>
      </button>
      <button
        class="icon square"
        class:active={showGrid}
        title="Afficher / cacher la grille (G)"
        aria-label="Grille"
        aria-keyshortcuts="G"
        aria-pressed={showGrid}
        onclick={toggleGrid}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="1" /><path d="M9.33 4v16M14.67 4v16M4 9.33h16M4 14.67h16" />
        </svg>
      </button>
      {#if limited}
        <span class="sep" aria-hidden="true"></span>
        <!-- Anneau = recharge du prochain pixel, chiffre = pixels disponibles maintenant. -->
        <div class="quota" class:empty={available === 0}>
          <span class="sr-only">
            {available} pixel{available > 1 ? 's' : ''} disponible{available > 1 ? 's' : ''} sur {cfg.quota.burst}{full
              ? ''
              : `, prochain dans ${nextIn} secondes`}
          </span>
          <span class="ring" aria-hidden="true">
            {#key available}
            <svg viewBox="0 0 36 36" width="34" height="34">
              <circle class="track" cx="18" cy="18" r="15" />
              <circle
                class="progress"
                cx="18"
                cy="18"
                r="15"
                pathLength="100"
                stroke-dasharray="100"
                stroke-dashoffset={100 - refill * 100}
                transform="rotate(-90 18 18)"
              />
            </svg>
            {/key}
            <span class="num">{available}</span>
          </span>
          <span class="label" aria-hidden="true">
            <span>pixel{available > 1 ? 's' : ''}</span>
            <span class="sub">{full ? `max ${cfg.quota.burst}` : `+1 dans ${nextIn} s`}</span>
          </span>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .world:focus-visible {
    outline: 3px solid #1e1e1e;
    outline-offset: -3px;
  }
  .help {
    position: fixed;
    max-width: min(440px, calc(100vw - 32px));
    padding: 16px 18px;
    border: 0;
    line-height: 1.4;
  }
  .help::backdrop {
    background: rgb(0 0 0 / 0.35);
  }
  .help-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .help h2 {
    margin: 0;
    font-size: 15px;
  }
  .help dl {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 8px 16px;
    margin: 0;
  }
  .help dt {
    white-space: nowrap;
  }
  .help dd {
    margin: 0;
    color: #c8c8c8;
    font-weight: 400;
  }
  kbd {
    display: inline-block;
    min-width: 1.4em;
    padding: 2px 5px;
    border-radius: 4px;
    background: #333;
    font: inherit;
    text-align: center;
  }
  @media (prefers-reduced-motion: reduce) {
    .progress {
      transition: none;
    }
    .swatch:hover {
      transform: none;
    }
  }
  .world {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    cursor: crosshair;
    touch-action: none;
  }
  .panel {
    position: fixed;
    background: #1e1e1e;
    border-radius: 10px;
    box-shadow: 0 2px 12px rgb(0 0 0 / 0.25);
    font: 500 13px/1 system-ui, sans-serif;
    color: #f2f2f2;
  }
  .top-left {
    top: 12px;
    left: 12px;
    padding: 4px 4px 4px 10px;
  }
  .row {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .info {
    padding: 2px 6px 6px 0;
    font-weight: 400;
    color: #a0a0a0;
  }
  label {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #a0a0a0;
  }
  input {
    width: 8ch;
    padding: 4px 6px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: #2c2c2c;
    font: inherit;
    color: #f2f2f2;
    font-variant-numeric: tabular-nums;
  }
  input:focus {
    outline: none;
    border-color: #f2f2f2;
    background: #2c2c2c;
  }
  .minimap {
    top: 12px;
    right: 12px;
    width: 160px;
    height: 160px;
    cursor: pointer;
    touch-action: none;
  }
  @media (max-width: 480px) {
    .minimap {
      width: 96px;
      height: 96px;
    }
  }
  .controls {
    right: 12px;
    bottom: 16px;
    padding: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .controls .icon {
    width: 36px;
    height: 36px;
  }
  .controls hr {
    width: 100%;
    margin: 2px 0;
    border: 0;
    border-top: 1px solid #3a3a3a;
  }
  .icon.active {
    color: #fff;
    background: #444;
  }
  .icon:focus-visible,
  .swatch:focus-visible {
    outline: 2px solid #f2f2f2;
    outline-offset: 1px;
  }
  .icon {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: inherit;
    cursor: pointer;
  }
  .icon:hover {
    background: #333;
  }
  .offline {
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 12px;
    background: #1e1e1e;
    color: #f2f2f2;
  }
  .dock {
    position: fixed;
    bottom: 16px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  .dock .panel {
    position: static;
  }
  .popover {
    padding: 10px;
  }
  .toolbar {
    padding: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .tool {
    display: flex;
    align-items: center;
    gap: 8px;
    width: auto;
    height: 40px;
    padding: 0 10px;
    background: color-mix(in srgb, var(--c) 22%, #1e1e1e);
  }
  .icon.tool:hover {
    background: color-mix(in srgb, var(--c) 30%, #1e1e1e);
  }
  .icon.tool.active {
    background: color-mix(in srgb, var(--c) 38%, #1e1e1e);
  }
  .square {
    width: 40px;
    height: 40px;
  }
  .current {
    width: 18px;
    height: 18px;
    border-radius: 4px;
    box-shadow: 0 0 0 1px rgb(255 255 255 / 0.35);
  }
  .sep {
    width: 1px;
    align-self: stretch;
    margin: 6px 4px;
    background: #3a3a3a;
  }
  .grid {
    display: grid;
    grid-auto-columns: 26px;
    grid-auto-rows: 26px;
    gap: 4px;
  }
  .swatch {
    border-radius: 6px;
    border: 1px solid rgb(255 255 255 / 0.18);
    cursor: pointer;
    padding: 0;
  }
  .swatch:hover {
    transform: scale(1.1);
  }
  .swatch.selected {
    outline: 2px solid #f2f2f2;
    outline-offset: 1px;
  }
  .quota {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-right: 10px;
    --q: #f2f2f2;
  }
  .quota.empty {
    --q: #8a8a8a;
  }
  .ring {
    position: relative;
    display: grid;
    place-items: center;
  }
  .ring circle {
    fill: none;
    stroke-width: 3.5;
  }
  .track {
    stroke: #3a3a3a;
  }
  .progress {
    stroke: var(--q);
    stroke-linecap: round;
    transition: stroke-dashoffset 250ms linear;
  }
  .num {
    position: absolute;
    font-size: 13px;
    font-weight: 600;
    color: var(--q);
    font-variant-numeric: tabular-nums;
  }
  .label {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 64px;
  }
  .sub {
    font-size: 11px;
    font-weight: 400;
    color: #8a8a8a;
    font-variant-numeric: tabular-nums;
  }
</style>
