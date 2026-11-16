<!-- Application: wires the board engine, the real-time connection, the keyboard and the panels. -->
<script lang="ts">
  import { onMount } from 'svelte'
  import HelpDialog from './components/HelpDialog.svelte'
  import JumpPanel from './components/JumpPanel.svelte'
  import NavControls from './components/NavControls.svelte'
  import ServerDown from './components/ServerDown.svelte'
  import Toolbar from './components/Toolbar.svelte'
  import { fetchConfig, fetchPixelInfo, type Config, type PixelInfo } from './lib/api'
  import { colorName } from './lib/colors'
  import type { Point } from './lib/engine/camera'
  import { World } from './lib/engine/world'
  import { shortcut, type Action } from './lib/keyboard'
  import { Live } from './lib/live'
  import { quotaAt } from './lib/quota'

  const RETRY_MS = 2000 // server unreachable on load: retry
  const INFO_DELAY_MS = 200 // a pixel's history loads after a short pause on it

  let canvas: HTMLCanvasElement
  let minimap: HTMLCanvasElement
  // Methods exposed by the components (bind:this).
  let toolbar = $state<{ toggle: () => Promise<void>; close: () => void }>()
  let help: { open: () => void; isOpen: () => boolean }
  let world: World | undefined
  let live: Live | undefined

  let cfg = $state<Config>()
  let color = $state(5) // black
  let paletteOpen = $state(false)
  let showGrid = $state(true)
  let hover = $state<Point | null>(null) // targeted pixel (mouse or keyboard cursor)
  let center = $state<Point>({ x: 0, y: 0 }) // pixel at the view centre
  let info = $state<PixelInfo | null>(null)
  let quota = $state({ n: Infinity, at: 0 }) // the server is authoritative ("q" message)
  let now = $state(Date.now())
  let lost = $state(false) // true only after a disconnection, not on first load
  let down = $state(false) // server unreachable on load (retried every RETRY_MS)
  let message = $state('') // screen reader announcement

  let colors: string[] = [] // flattened palette, filled when the configuration loads
  const limits = $derived(cfg?.quota.refillMs ? cfg.quota : null)
  const shownInfo = $derived(info && isHovered(info) ? info : null)
  const canPaint = $derived(!lost && (!limits || quotaAt(limits, quota, now).available >= 1))
  $effect(() => {
    const v = canPaint // read first: `world?.` would skip it, and the effect would never re-run
    world?.setCanPaint(v)
  })

  /** Is p the currently targeted pixel? */
  function isHovered(p: Point) {
    return hover !== null && hover.x === p.x && hover.y === p.y
  }

  function announce(text: string) {
    message = ''
    setTimeout(() => (message = text), 50) // clear then fill: an identical announcement is read again
  }

  // History of the targeted pixel, loaded after a short pause. `speak`: announce it (keyboard cursor).
  let infoTimer: ReturnType<typeof setTimeout> | undefined
  function loadInfo(speak = false) {
    clearTimeout(infoTimer)
    infoTimer = setTimeout(() => void showInfo(speak), INFO_DELAY_MS)
  }

  async function showInfo(speak: boolean) {
    if (!hover) return
    try {
      const i = await fetchPixelInfo(hover.x, hover.y)
      info = i
      if (!speak || !isHovered(i)) return
      const changes = i.changes ? `, ${String(i.changes)} changement${i.changes > 1 ? 's' : ''}` : ''
      announce(`${String(i.x)}, ${String(i.y)} : ${colorName(colors[i.c])}${changes}`)
    } catch {
      // harmless: the info comes back on the next hover
    }
  }

  function place(x: number, y: number) {
    if (!live?.open) {
      announce('Hors ligne, pixel non posé')
      return
    }
    if (limits) {
      now = Date.now()
      const q = quotaAt(limits, quota, now)
      if (q.available < 1) {
        announce(`Plus de pixel disponible, prochain dans ${String(q.nextIn)} secondes`)
        return
      }
      quota = { n: q.tokens - 1, at: now } // optimistic, corrected by the server's answer
    }
    live.send(x, y, color)
    announce(`${colorName(colors[color])} posé en ${String(x)}, ${String(y)}`)
  }

  function moveCursor(dx: number, dy: number) {
    if (!world) return
    const from = world.hover ?? { x: Math.floor(world.cam.x), y: Math.floor(world.cam.y) } // the camera, not `center`: that one waits for the next frame
    hover = world.setCursor(from.x + dx, from.y + dy)
    loadInfo(true)
  }

  function toggleGrid() {
    world?.toggleGrid()
    showGrid = !showGrid
  }

  function run(a: Action) {
    switch (a.type) {
      case 'move':
        moveCursor(a.dx, a.dy)
        break
      case 'place':
        if (world?.hover) place(world.hover.x, world.hover.y)
        else moveCursor(0, 0) // first press: shows the cursor
        break
      case 'zoomIn':
        world?.zoomBy(1.5)
        break
      case 'zoomOut':
        world?.zoomBy(1 / 1.5)
        break
      case 'recenter':
        world?.recenter()
        break
      case 'grid':
        toggleGrid()
        break
      case 'palette':
        void toolbar?.toggle()
        break
      case 'help':
        help.open()
        break
      case 'escape':
        toolbar?.close()
        break
    }
  }

  function keydown(e: KeyboardEvent) {
    // Typing coordinates, key already handled (palette) or help open (it handles Escape): leave it.
    if (e.target instanceof HTMLInputElement || e.defaultPrevented || help.isOpen()) return
    const a = shortcut(e, e.target === canvas || e.target === document.body)
    if (!a) return
    e.preventDefault()
    run(a)
  }

  async function init() {
    try {
      const conf = await fetchConfig()
      down = false
      cfg = conf
      colors = conf.palette.flat()
      quota = { n: conf.quota.burst, at: Date.now() }
      const w = new World(canvas, conf)
      world = w
      w.onHover = (p) => {
        hover = p
        loadInfo()
      }
      w.onPlace = (x, y) => {
        paletteOpen = false // a click on the board closes the palette
        place(x, y)
      }
      w.onView = (p) => {
        if (p.x !== center.x || p.y !== center.y) center = p
      }
      w.setMinimap(minimap)
      live = new Live({
        onOpen: () => {
          lost = false
          w.reload() // pixels may have been missed while disconnected
        },
        onClose: () => (lost = true),
        onPixel: (x, y, c) => {
          w.setPixel(x, y, c)
          if (isHovered({ x, y })) loadInfo() // the targeted pixel just changed
        },
        onQuota: (n) => (quota = { n, at: Date.now() }),
      })
      live.connect()
    } catch {
      down = true
      setTimeout(() => void init(), RETRY_MS)
    }
  }

  onMount(() => {
    const clock = setInterval(() => (now = Date.now()), 250)
    void init()
    return () => {
      clearInterval(clock)
      live?.close()
    }
  })
</script>

<svelte:window onkeydown={keydown} />

<!-- The board is an interactive area driven by our shortcuts: role application so screen
     readers pass arrows, Enter and Space through. -->
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
  Flèches pour déplacer le curseur, Maj et flèches pour aller 10 pixels plus loin, Entrée ou Espace pour poser un pixel
  de la couleur choisie. Plus et moins pour zoomer, 0 pour revenir en 0, 0, C pour les couleurs, G pour la grille, point
  d'interrogation pour la liste des raccourcis.
</p>
<div class="sr-only" aria-live="polite">{message}</div>

<!-- Visual duplicate of the view, mouse-only: hidden from screen readers. Always rendered so it
     is bound before the engine starts. -->
<canvas class="panel minimap" bind:this={minimap} hidden={!cfg} aria-hidden="true"></canvas>
<HelpDialog bind:this={help} />

{#if down}
  <ServerDown />
{/if}

{#if lost}
  <div class="panel offline" role="status">Connexion perdue, reconnexion…</div>
{/if}

<!-- Controls only once the board is loaded: before that they would do nothing. -->
{#if cfg}
  <JumpPanel position={hover ?? center} info={shownInfo} {now} onjump={(x: number, y: number) => world?.jumpTo(x, y)} />
  <NavControls
    onzoomin={() => world?.zoomBy(1.5)}
    onzoomout={() => world?.zoomBy(1 / 1.5)}
    onrecenter={() => world?.recenter()}
    onhelp={() => help.open()}
  />
  <Toolbar
    bind:this={toolbar}
    rows={cfg.palette}
    bind:color
    bind:open={paletteOpen}
    {showGrid}
    ontogglegrid={toggleGrid}
    quota={limits}
    snapshot={quota}
    {now}
  />
{/if}

<style>
  .world {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    cursor: crosshair;
    touch-action: none;
  }
  .world:focus-visible {
    outline: 3px solid #1e1e1e;
    outline-offset: -3px;
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
  .offline {
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    padding: 8px 12px;
  }
</style>
