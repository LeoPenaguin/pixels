// Moteur du canvas infini : caméra (pan/zoom), chargement des chunks visibles, rendu.
// Indépendant de Svelte : App.svelte ne fait que le brancher.

// palette = lignes de couleurs ; index d'une couleur = position une fois les lignes aplaties.
export type Config = {
  chunkSize: number
  worldLimit: number
  palette: string[][]
  quota: { burst: number; refillMs: number } // refillMs = 0 : illimité
}

const MIN_ZOOM = 2 // dézoom max : 1 pixel = 2 px à l'écran, plus loin on ne distingue plus rien
const MAX_ZOOM = 24 // zoom avant max : 1 pixel = 24 px à l'écran : assez pour viser, au-delà ça n'apporte rien
const MAX_CHUNKS = 400 // ~100 Mo de canvas ; au-delà on oublie les chunks hors écran
const DRAG_THRESHOLD = 4
const HOME = { x: 0, y: 0, zoom: 12 }
const GRID_MIN_ZOOM = 6 // en dessous, les lignes seraient trop serrées
// Largeur de monde couverte par la minimap : échelle fixe, doublée par paliers seulement
// quand la vue ne tient plus dedans (sinon la minimap se redimensionne à chaque cran de zoom).
const MINIMAP_SPAN = [256, 4096]
const ANIM_MS = 450
const TARGET_MS = 1000 // durée du surlignage bleu après un saut
const MAX_FLIGHT_SCREENS = 3 // au-delà, on "téléporte" près de la cible puis on anime la fin du trajet

type Cam = { x: number; y: number; zoom: number }

// L'interface reste en noir et blanc : seul le board est en couleur. Un contour noir doublé
// de blanc reste lisible sur n'importe quel pixel, y compris noir.
function outline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, width: number) {
  ctx.lineWidth = width * 2
  ctx.strokeStyle = '#fff'
  ctx.strokeRect(x, y, w, h)
  ctx.lineWidth = width
  ctx.strokeStyle = '#000'
  ctx.strokeRect(x, y, w, h)
}
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

type Chunk = { canvas: OffscreenCanvas } | { pending: [number, number, number][] }

export class World {
  cam = { ...HOME } // x, y = coordonnée monde au centre de l'écran
  hover: { x: number; y: number } | null = null
  showGrid = true
  private target: { x: number; y: number } | null = null // pixel visé par un saut, surligné
  private targetTimer: ReturnType<typeof setTimeout> | undefined
  private anim: { from: Cam; to: Cam; t0: number; done?: () => void } | null = null
  private minimap?: HTMLCanvasElement
  private mini = { x0: 0, y0: 0, span: MINIMAP_SPAN[0] } // zone de monde affichée par la minimap
  private miniTarget = MINIMAP_SPAN[0] // palier visé ; `mini.span` y glisse en douceur
  onHover = (_p: { x: number; y: number } | null) => {}
  onPlace = (_x: number, _y: number) => {}
  onView = (_center: { x: number; y: number }) => {} // pixel au centre de l'écran, appelé à chaque image

  private ctx: CanvasRenderingContext2D
  private chunks = new Map<string, Chunk>()
  private colors: string[]
  private rgb: [number, number, number][]
  private shift: number
  private frame = 0
  private drag: { id: number; sx: number; sy: number; lx: number; ly: number; moved: boolean } | null = null

  constructor(private canvas: HTMLCanvasElement, private cfg: Config) {
    this.ctx = canvas.getContext('2d')!
    this.shift = Math.log2(cfg.chunkSize)
    this.colors = cfg.palette.flat()
    this.rgb = this.colors.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number])

    canvas.addEventListener('pointerdown', this.down)
    canvas.addEventListener('pointermove', this.move)
    canvas.addEventListener('pointerup', this.up)
    canvas.addEventListener('pointerleave', this.leave)
    canvas.addEventListener('wheel', this.wheel, { passive: false })
    new ResizeObserver(() => this.redraw()).observe(canvas)
  }

  /** Coordonnées écran (px CSS) → pixel monde. */
  toWorld(sx: number, sy: number) {
    const { x, y, zoom } = this.cam
    return {
      x: x + (sx - this.canvas.clientWidth / 2) / zoom,
      y: y + (sy - this.canvas.clientHeight / 2) / zoom,
    }
  }

  setPixel(x: number, y: number, c: number) {
    const chunk = this.chunks.get(this.key(x >> this.shift, y >> this.shift))
    if (!chunk) return // pas chargé : on aura la bonne valeur au prochain fetch
    if ('pending' in chunk) return void chunk.pending.push([x, y, c])
    const ctx = chunk.canvas.getContext('2d')!
    ctx.fillStyle = this.colors[c]
    ctx.fillRect(x & (this.cfg.chunkSize - 1), y & (this.cfg.chunkSize - 1), 1, 1)
    this.redraw()
  }

  /** Après une reconnexion : on a pu rater des pixels, on recharge tout. */
  reload() {
    this.chunks.clear()
    this.redraw()
  }

  /** Recentre sur l'origine (0, 0) au zoom par défaut, en animation. */
  recenter() {
    this.clearTarget()
    this.animateTo({ ...HOME })
  }

  /** Va en animation jusqu'à un pixel, puis le surligne pendant 1 s. */
  jumpTo(x: number, y: number) {
    this.clearTarget()
    const l = this.cfg.worldLimit - 1
    x = Math.min(l, Math.max(-l, x))
    y = Math.min(l, Math.max(-l, y))
    const zoom = Math.max((this.anim?.to ?? this.cam).zoom, HOME.zoom)
    this.animateTo({ x: x + 0.5, y: y + 0.5, zoom }, () => {
      this.target = { x, y }
      this.targetTimer = setTimeout(() => this.clearTarget(), TARGET_MS)
    })
  }

  /** Zoom animé autour du centre de l'écran (boutons, clavier). Les clics rapides se cumulent. */
  zoomBy(factor: number) {
    const base = this.anim?.to ?? this.cam
    this.animateTo({ ...base, zoom: Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, base.zoom * factor)) }, this.anim?.done)
  }

  /** Curseur clavier : surligne un pixel et déplace la vue juste assez pour qu'il reste visible. */
  setCursor(x: number, y: number) {
    const l = this.cfg.worldLimit - 1
    x = Math.min(l, Math.max(-l, x))
    y = Math.min(l, Math.max(-l, y))
    this.stopAnim()
    this.clearTarget()
    this.hover = { x, y }
    const { zoom } = this.cam
    const mx = Math.min(80, this.canvas.clientWidth / 4) / zoom // marge en pixels monde
    const my = Math.min(80, this.canvas.clientHeight / 4) / zoom
    const tl = this.toWorld(0, 0)
    const br = this.toWorld(this.canvas.clientWidth, this.canvas.clientHeight)
    if (x < tl.x + mx) this.cam.x += x - (tl.x + mx)
    if (x + 1 > br.x - mx) this.cam.x += x + 1 - (br.x - mx)
    if (y < tl.y + my) this.cam.y += y - (tl.y + my)
    if (y + 1 > br.y - my) this.cam.y += y + 1 - (br.y - my)
    this.clampCam()
    this.redraw()
    return { x, y }
  }

  private animateTo(to: Cam, done?: () => void) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.anim = null
      this.cam = to
      this.redraw()
      return done?.()
    }
    // Trop loin : on se place à quelques écrans de la cible pour ne pas charger tous les chunks du trajet.
    const dx = to.x - this.cam.x
    const dy = to.y - this.cam.y
    const screen = Math.max(this.canvas.clientWidth, this.canvas.clientHeight) / this.cam.zoom
    const dist = Math.hypot(dx, dy)
    if (dist > MAX_FLIGHT_SCREENS * screen) {
      const k = (MAX_FLIGHT_SCREENS * screen) / dist
      this.cam = { ...this.cam, x: to.x - dx * k, y: to.y - dy * k }
    }
    this.anim = { from: { ...this.cam }, to, t0: performance.now(), done }
    this.redraw()
  }

  private stopAnim() {
    this.anim = null
  }

  private clearTarget() {
    clearTimeout(this.targetTimer)
    if (this.target) {
      this.target = null
      this.redraw()
    }
  }

  // Avance l'animation en cours d'un pas ; zoom interpolé en échelle log pour un rendu régulier.
  private stepAnim() {
    const a = this.anim
    if (!a) return
    const t = Math.min(1, (performance.now() - a.t0) / ANIM_MS)
    const e = ease(t)
    this.cam = {
      x: a.from.x + (a.to.x - a.from.x) * e,
      y: a.from.y + (a.to.y - a.from.y) * e,
      zoom: a.from.zoom * (a.to.zoom / a.from.zoom) ** e,
    }
    if (t < 1) return this.redraw()
    this.anim = null
    a.done?.()
  }

  toggleGrid() {
    this.showGrid = !this.showGrid
    this.redraw()
  }

  /** Branche la minimap : elle suit la caméra ; cliquer ou glisser dessus déplace la vue. */
  setMinimap(m: HTMLCanvasElement) {
    this.minimap = m
    // Glisser = déplacer le rectangle de la vue (déplacement relatif, la minimap suit sans s'emballer).
    // Clic sans glisser = aller en animation au point cliqué.
    let last: { x: number; y: number; moved: boolean } | null = null
    m.addEventListener('pointerdown', (e) => {
      m.setPointerCapture(e.pointerId)
      this.stopAnim()
      last = { x: e.clientX, y: e.clientY, moved: false }
    })
    m.addEventListener('pointermove', (e) => {
      if (!last || !m.hasPointerCapture(e.pointerId)) return
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      if (!last.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      last = { x: e.clientX, y: e.clientY, moved: true }
      const k = this.mini.span / m.clientWidth
      this.cam.x += dx * k
      this.cam.y += dy * k
      this.clearTarget()
      this.clampCam()
      this.redraw()
    })
    m.addEventListener('pointerup', (e) => {
      if (last && !last.moved) {
        const { x0, y0, span } = this.mini
        this.animateTo({
          x: x0 + (e.offsetX / m.clientWidth) * span,
          y: y0 + (e.offsetY / m.clientHeight) * span,
          zoom: this.cam.zoom,
        })
      }
      last = null
    })
    this.redraw()
  }


  /** Zoom immédiat autour d'un point (molette / pincement, déjà continus). */
  zoomAt(factor: number, sx = this.canvas.clientWidth / 2, sy = this.canvas.clientHeight / 2) {
    this.stopAnim()
    const before = this.toWorld(sx, sy)
    this.cam.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, this.cam.zoom * factor))
    const after = this.toWorld(sx, sy)
    this.cam.x += before.x - after.x
    this.cam.y += before.y - after.y
    this.clampCam()
    this.redraw()
  }

  redraw = () => {
    if (!this.frame) this.frame = requestAnimationFrame(this.draw)
  }

  private key = (cx: number, cy: number) => `${cx}:${cy}`

  private clampCam() {
    const l = this.cfg.worldLimit
    this.cam.x = Math.min(l, Math.max(-l, this.cam.x))
    this.cam.y = Math.min(l, Math.max(-l, this.cam.y))
  }

  private draw = () => {
    this.frame = 0
    this.stepAnim()
    const { canvas, ctx, cam, cfg } = this
    const dpr = devicePixelRatio
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = '#e5e5e5'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const z = cam.zoom * dpr
    ctx.setTransform(z, 0, 0, z, (w / 2 - cam.x * cam.zoom) * dpr, (h / 2 - cam.y * cam.zoom) * dpr)
    ctx.imageSmoothingEnabled = false

    const S = cfg.chunkSize
    const tl = this.toWorld(0, 0)
    const br = this.toWorld(w, h)

    const visible = new Set<string>()
    this.eachChunk(tl.x, tl.y, br.x, br.y, visible, (c, cx, cy) => ctx.drawImage(c, cx * S, cy * S))

    // Grille entre les pixels (désactivable), seulement quand on est assez zoomé.
    if (this.showGrid && cam.zoom >= GRID_MIN_ZOOM) {
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'
      ctx.lineWidth = 1 / cam.zoom
      ctx.beginPath()
      for (let x = Math.floor(tl.x); x <= br.x; x++) ctx.moveTo(x, tl.y), ctx.lineTo(x, br.y)
      for (let y = Math.floor(tl.y); y <= br.y; y++) ctx.moveTo(tl.x, y), ctx.lineTo(br.x, y)
      ctx.stroke()
    }

    if (this.hover) outline(ctx, this.hover.x, this.hover.y, 1, 1, 2 / cam.zoom)
    if (this.target) outline(ctx, this.target.x - 0.5, this.target.y - 0.5, 2, 2, 3 / cam.zoom)

    this.drawMinimap(tl, br, visible)
    this.onView({ x: Math.floor(cam.x), y: Math.floor(cam.y) })

    if (this.chunks.size > MAX_CHUNKS) {
      for (const k of this.chunks.keys()) if (!visible.has(k)) this.chunks.delete(k)
    }
  }

  /** Parcourt les chunks couvrant une zone du monde : charge ceux qui manquent, dessine les autres. */
  private eachChunk(
    x0: number, y0: number, x1: number, y1: number, seen: Set<string>,
    draw: (c: OffscreenCanvas, cx: number, cy: number) => void,
  ) {
    const S = this.cfg.chunkSize
    const lim = this.cfg.worldLimit >> this.shift
    for (let cy = Math.max(-lim, Math.floor(y0 / S)); cy <= Math.min(lim - 1, Math.floor(y1 / S)); cy++) {
      for (let cx = Math.max(-lim, Math.floor(x0 / S)); cx <= Math.min(lim - 1, Math.floor(x1 / S)); cx++) {
        const k = this.key(cx, cy)
        seen.add(k)
        const chunk = this.chunks.get(k)
        if (!chunk) this.load(cx, cy)
        else if ('canvas' in chunk) draw(chunk.canvas, cx, cy)
      }
    }
  }

  // Vue d'ensemble centrée sur la caméra, ~4× plus large que l'écran ; rectangle bleu = ce qu'on voit.
  private drawMinimap(tl: { x: number; y: number }, br: { x: number; y: number }, seen: Set<string>) {
    const m = this.minimap
    if (!m) return
    const dpr = devicePixelRatio
    const size = m.clientWidth * dpr
    if (m.width !== size) m.width = m.height = size
    const mctx = m.getContext('2d')!
    // Palier : on double dès que la vue dépasse la moitié de la minimap, mais on ne redescend
    // que quand elle tombe sous 1/6 (hystérésis : pas d'allers-retours autour d'un seuil).
    const view = Math.max(br.x - tl.x, br.y - tl.y)
    let t = this.miniTarget
    while (t < 2 * view && t < MINIMAP_SPAN[1]) t *= 2
    while (t > 6 * view && t / 2 >= MINIMAP_SPAN[0]) t /= 2
    this.miniTarget = t
    // Transition douce vers le palier (en échelle log) au lieu d'un saut.
    let span = this.mini.span * (t / this.mini.span) ** 0.12 // ~0,5 s pour changer de palier
    if (Math.abs(Math.log(t / span)) < 0.005) span = t
    else this.redraw()
    const x0 = this.cam.x - span / 2
    const y0 = this.cam.y - span / 2
    this.mini = { x0, y0, span }
    const k = size / span

    mctx.setTransform(1, 0, 0, 1, 0, 0)
    mctx.fillStyle = '#e5e5e5'
    mctx.fillRect(0, 0, size, size)
    mctx.setTransform(k, 0, 0, k, -x0 * k, -y0 * k)
    mctx.imageSmoothingEnabled = true
    const S = this.cfg.chunkSize
    this.eachChunk(x0, y0, x0 + span, y0 + span, seen, (c, cx, cy) => mctx.drawImage(c, cx * S, cy * S))

    outline(mctx, tl.x, tl.y, br.x - tl.x, br.y - tl.y, (2 * dpr) / k)
  }

  private async load(cx: number, cy: number) {
    const k = this.key(cx, cy)
    const entry: Chunk = { pending: [] }
    this.chunks.set(k, entry)
    try {
      const res = await fetch(`/api/chunks/${cx}/${cy}`)
      if (!res.ok) throw new Error(res.statusText)
      const bytes = new Uint8Array(await res.arrayBuffer())
      if (this.chunks.get(k) !== entry) return // rechargé ou évincé entre-temps

      const S = this.cfg.chunkSize
      const img = new ImageData(S, S)
      for (let i = 0; i < S * S; i++) {
        const [r, g, b] = this.rgb[bytes[i] ?? 0] ?? this.rgb[0] // octets absents = blanc
        img.data.set([r, g, b, 255], i * 4)
      }
      const canvas = new OffscreenCanvas(S, S)
      canvas.getContext('2d')!.putImageData(img, 0, 0)
      this.chunks.set(k, { canvas })
      for (const [x, y, c] of entry.pending) this.setPixel(x, y, c)
      this.redraw()
    } catch {
      if (this.chunks.get(k) === entry) this.chunks.delete(k)
      setTimeout(this.redraw, 2000) // réessaie au prochain rendu
    }
  }

  private updateHover(e: PointerEvent) {
    const p = this.toWorld(e.offsetX, e.offsetY)
    const next = { x: Math.floor(p.x), y: Math.floor(p.y) }
    if (next.x !== this.hover?.x || next.y !== this.hover?.y) {
      this.hover = next
      this.onHover(next)
      this.redraw()
    }
  }

  private down = (e: PointerEvent) => {
    if (this.drag) return
    this.canvas.setPointerCapture(e.pointerId)
    this.drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, moved: false }
  }

  private move = (e: PointerEvent) => {
    const d = this.drag
    if (d && d.id === e.pointerId) {
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > DRAG_THRESHOLD) d.moved = true
      if (d.moved) {
        this.stopAnim()
        this.clearTarget()
        this.cam.x -= (e.clientX - d.lx) / this.cam.zoom
        this.cam.y -= (e.clientY - d.ly) / this.cam.zoom
        this.clampCam()
        this.canvas.style.cursor = 'grabbing'
      }
      d.lx = e.clientX
      d.ly = e.clientY
    }
    this.updateHover(e)
    this.redraw()
  }

  private up = (e: PointerEvent) => {
    const d = this.drag
    if (!d || d.id !== e.pointerId) return
    this.drag = null
    this.canvas.style.cursor = ''
    if (!d.moved && e.button === 0) {
      const p = this.toWorld(e.offsetX, e.offsetY)
      this.onPlace(Math.floor(p.x), Math.floor(p.y))
    }
  }

  private leave = () => {
    if (this.drag) return
    this.hover = null
    this.onHover(null)
    this.redraw()
  }

  // Comme Figma : molette / deux doigts = déplacement, Ctrl+molette ou pincement = zoom.
  private wheel = (e: WheelEvent) => {
    e.preventDefault()
    // Normalise : certaines souris comptent en lignes ou en pages, et un cran de molette vaut ~100 px.
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? this.canvas.clientHeight : 1
    if (e.ctrlKey || e.metaKey) {
      // Borné par événement : un cran de molette = ×1,5 max, le pincement trackpad reste fin.
      const d = Math.max(-40, Math.min(40, e.deltaY * unit))
      this.zoomAt(Math.exp(-d * 0.01), e.offsetX, e.offsetY)
    } else {
      this.stopAnim()
      this.cam.x += (e.deltaX * unit) / this.cam.zoom
      this.cam.y += (e.deltaY * unit) / this.cam.zoom
      this.clampCam()
      this.redraw()
    }
  }
}
