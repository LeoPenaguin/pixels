// Moteur du canvas infini : caméra (pan/zoom), chargement des chunks visibles, rendu.
// Indépendant de Svelte : App.svelte ne fait que le brancher.

export type Config = { chunkSize: number; worldLimit: number; palette: string[]; cooldownMs: number }

const MIN_ZOOM = 0.5
const MAX_ZOOM = 64
const MAX_CHUNKS = 400 // ~100 Mo de canvas ; au-delà on oublie les chunks hors écran
const DRAG_THRESHOLD = 4

type Chunk = { canvas: OffscreenCanvas } | { pending: [number, number, number][] }

export class World {
  cam = { x: 0, y: 0, zoom: 8 } // x, y = coordonnée monde au centre de l'écran
  hover: { x: number; y: number } | null = null
  onHover = (_p: { x: number; y: number } | null) => {}
  onPlace = (_x: number, _y: number) => {}

  private ctx: CanvasRenderingContext2D
  private chunks = new Map<string, Chunk>()
  private rgb: [number, number, number][]
  private shift: number
  private frame = 0
  private drag: { id: number; sx: number; sy: number; lx: number; ly: number; moved: boolean } | null = null

  constructor(private canvas: HTMLCanvasElement, private cfg: Config) {
    this.ctx = canvas.getContext('2d')!
    this.shift = Math.log2(cfg.chunkSize)
    this.rgb = cfg.palette.map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number])

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
    ctx.fillStyle = this.cfg.palette[c]
    ctx.fillRect(x & (this.cfg.chunkSize - 1), y & (this.cfg.chunkSize - 1), 1, 1)
    this.redraw()
  }

  /** Après une reconnexion : on a pu rater des pixels, on recharge tout. */
  reload() {
    this.chunks.clear()
    this.redraw()
  }

  zoomAt(factor: number, sx = this.canvas.clientWidth / 2, sy = this.canvas.clientHeight / 2) {
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
    const lim = cfg.worldLimit >> this.shift
    const tl = this.toWorld(0, 0)
    const br = this.toWorld(w, h)
    const cx0 = Math.max(-lim, Math.floor(tl.x / S))
    const cy0 = Math.max(-lim, Math.floor(tl.y / S))
    const cx1 = Math.min(lim - 1, Math.floor(br.x / S))
    const cy1 = Math.min(lim - 1, Math.floor(br.y / S))

    const visible = new Set<string>()
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        const k = this.key(cx, cy)
        visible.add(k)
        const chunk = this.chunks.get(k)
        if (!chunk) this.load(cx, cy)
        else if ('canvas' in chunk) ctx.drawImage(chunk.canvas, cx * S, cy * S)
      }
    }

    if (this.chunks.size > MAX_CHUNKS) {
      for (const k of this.chunks.keys()) if (!visible.has(k)) this.chunks.delete(k)
    }

    // Grille fine quand on est très zoomé, comme dans un éditeur.
    if (cam.zoom >= 16) {
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'
      ctx.lineWidth = 1 / cam.zoom
      ctx.beginPath()
      for (let x = Math.floor(tl.x); x <= br.x; x++) ctx.moveTo(x, tl.y), ctx.lineTo(x, br.y)
      for (let y = Math.floor(tl.y); y <= br.y; y++) ctx.moveTo(tl.x, y), ctx.lineTo(br.x, y)
      ctx.stroke()
    }

    if (this.hover) {
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2 / cam.zoom
      ctx.strokeRect(this.hover.x, this.hover.y, 1, 1)
    }
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
    if (e.ctrlKey || e.metaKey) {
      this.zoomAt(Math.exp(-e.deltaY * 0.01), e.offsetX, e.offsetY)
    } else {
      this.cam.x += e.deltaX / this.cam.zoom
      this.cam.y += e.deltaY / this.cam.zoom
      this.clampCam()
      this.redraw()
    }
  }
}
