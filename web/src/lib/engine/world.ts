// Board engine: camera, animations, mouse / wheel / minimap input, Canvas2D rendering.
// Independent of Svelte: App.svelte only wires it up.
import type { Config } from '../api'
import {
  HOME,
  clampCam,
  clampZoom,
  ease,
  flightStart,
  interpolate,
  keepVisible,
  toWorld,
  zoomAround,
  type Cam,
  type Point,
} from './camera'
import { context2d } from './canvas'
import { Chunks } from './chunks'
import { MINIMAP_SPAN, smoothSpan, stepSpan } from './minimap'

const DRAG_THRESHOLD = 4 // px: below this, it is a click
const GRID_MIN_ZOOM = 6 // below this, grid lines would be too dense
const ANIM_MS = 450
const TARGET_MS = 1000 // highlight duration after a jump
const BACKGROUND = '#e5e5e5' // outside the world

// The UI stays monochrome: only the board is in colour. A black outline doubled with white
// stays readable on any pixel, black included.
function outline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, width: number) {
  ctx.lineWidth = width * 2
  ctx.strokeStyle = '#fff'
  ctx.strokeRect(x, y, w, h)
  ctx.lineWidth = width
  ctx.strokeStyle = '#000'
  ctx.strokeRect(x, y, w, h)
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

export class World {
  cam: Cam = { ...HOME }
  /** Pixel under the mouse or targeted by the keyboard cursor. */
  hover: Point | null = null
  showGrid = true
  onHover: (p: Point | null) => void = () => undefined
  onPlace: (x: number, y: number) => void = () => undefined
  /** Pixel at the screen centre, on every frame. */
  onView: (center: Point) => void = () => undefined

  private ctx: CanvasRenderingContext2D
  private chunks: Chunks
  private frame = 0
  private anim: { from: Cam; to: Cam; t0: number; done?: () => void } | null = null
  private target: Point | null = null // jump target, briefly highlighted
  private targetTimer: ReturnType<typeof setTimeout> | undefined
  private drag: { id: number; sx: number; sy: number; lx: number; ly: number; moved: boolean } | null = null
  private minimap?: HTMLCanvasElement
  private mini = { x0: 0, y0: 0, span: MINIMAP_SPAN[0] as number } // world area shown by the minimap
  private miniTarget: number = MINIMAP_SPAN[0] // target step; `mini.span` glides towards it

  constructor(
    private canvas: HTMLCanvasElement,
    private cfg: Config,
  ) {
    this.ctx = context2d(canvas)
    this.chunks = new Chunks(cfg, this.redraw)
    canvas.addEventListener('pointerdown', this.down)
    canvas.addEventListener('pointermove', this.move)
    canvas.addEventListener('pointerup', this.up)
    canvas.addEventListener('pointerleave', this.leave)
    canvas.addEventListener('wheel', this.wheel, { passive: false })
    new ResizeObserver(this.redraw).observe(canvas)
  }

  private get vp() {
    return { w: this.canvas.clientWidth, h: this.canvas.clientHeight }
  }

  /** Screen coordinates (CSS px) → world coordinates. */
  toWorld(sx: number, sy: number) {
    return toWorld(this.cam, this.vp, sx, sy)
  }

  /** Sets the camera without animation (clamped to the world and allowed zooms). */
  setCam(cam: Cam) {
    this.stopAnim()
    this.cam = clampCam({ ...cam, zoom: clampZoom(cam.zoom) }, this.cfg.worldLimit)
    this.redraw()
  }

  setPixel(x: number, y: number, c: number) {
    this.chunks.setPixel(x, y, c)
  }

  /** Reloads every chunk (after a reconnection, pixels may have been missed). */
  reload() {
    this.chunks.clear()
  }

  toggleGrid() {
    this.showGrid = !this.showGrid
    this.redraw()
  }

  /** Animates back to 0, 0 at the default zoom. */
  recenter() {
    this.clearTarget()
    this.animateTo({ ...HOME })
  }

  /** Animates to a pixel, then briefly highlights it. */
  jumpTo(x: number, y: number) {
    this.clearTarget()
    const l = this.cfg.worldLimit - 1
    const p = clampCam({ x, y, zoom: 0 }, l)
    const zoom = Math.max((this.anim?.to ?? this.cam).zoom, HOME.zoom)
    this.animateTo({ x: p.x + 0.5, y: p.y + 0.5, zoom }, () => {
      this.target = { x: p.x, y: p.y }
      this.targetTimer = setTimeout(() => this.clearTarget(), TARGET_MS)
    })
  }

  /** Animated zoom around the centre (buttons, keyboard). Rapid presses add up. */
  zoomBy(factor: number) {
    const base = this.anim?.to ?? this.cam
    this.animateTo({ ...base, zoom: clampZoom(base.zoom * factor) }, this.anim?.done)
  }

  /** Keyboard cursor: targets a pixel and moves the view just enough to keep it visible. */
  setCursor(x: number, y: number): Point {
    const l = this.cfg.worldLimit - 1
    const p = clampCam({ x, y, zoom: 0 }, l)
    this.stopAnim()
    this.clearTarget()
    this.hover = { x: p.x, y: p.y }
    this.cam = clampCam(keepVisible(this.cam, this.vp, this.hover), this.cfg.worldLimit)
    this.redraw()
    return this.hover
  }

  /** Attaches the minimap: it follows the camera; dragging in it pans the view, clicking animates there. */
  setMinimap(m: HTMLCanvasElement) {
    this.minimap = m
    // Relative to the gesture (not absolute): the minimap moves with the view without running away.
    let last: { x: number; y: number; moved: boolean } | null = null
    m.addEventListener('pointerdown', (e) => {
      m.setPointerCapture(e.pointerId)
      this.stopAnim()
      last = { x: e.clientX, y: e.clientY, moved: false }
    })
    m.addEventListener('pointermove', (e) => {
      if (!last) return
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      if (!last.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
      last = { x: e.clientX, y: e.clientY, moved: true }
      const k = this.mini.span / m.clientWidth
      this.clearTarget()
      this.cam = clampCam({ ...this.cam, x: this.cam.x + dx * k, y: this.cam.y + dy * k }, this.cfg.worldLimit)
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

  /** Immediate zoom around a screen point (wheel, pinch: already continuous). */
  zoomAt(factor: number, sx: number, sy: number) {
    this.stopAnim()
    this.cam = clampCam(zoomAround(this.cam, factor, this.vp, sx, sy), this.cfg.worldLimit)
    this.redraw()
  }

  /** Requests a render on the next frame (several requests = one render). */
  redraw = () => {
    if (!this.frame) this.frame = requestAnimationFrame(this.draw)
  }

  private animateTo(to: Cam, done?: () => void) {
    if (reducedMotion()) {
      this.anim = null
      this.cam = to
      this.redraw()
      done?.()
      return
    }
    this.cam = flightStart(this.cam, to, this.vp)
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

  /** Advances the running animation by one step. */
  private stepAnim() {
    const a = this.anim
    if (!a) return
    const t = Math.min(1, (performance.now() - a.t0) / ANIM_MS)
    this.cam = interpolate(a.from, a.to, ease(t))
    if (t < 1) {
      this.redraw()
      return
    }
    this.anim = null
    a.done?.()
  }

  private draw = () => {
    this.frame = 0
    this.stepAnim()
    const { canvas, ctx, cam } = this
    const dpr = devicePixelRatio
    const { w, h } = this.vp
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr
      canvas.height = h * dpr
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.fillStyle = BACKGROUND
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const z = cam.zoom * dpr
    ctx.setTransform(z, 0, 0, z, (w / 2 - cam.x * cam.zoom) * dpr, (h / 2 - cam.y * cam.zoom) * dpr)
    ctx.imageSmoothingEnabled = false
    const tl = this.toWorld(0, 0)
    const br = this.toWorld(w, h)
    const visible = new Set<string>()
    this.eachChunk(tl, br, visible, (c, x, y) => ctx.drawImage(c, x, y))

    if (this.showGrid && cam.zoom >= GRID_MIN_ZOOM) {
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'
      ctx.lineWidth = 1 / cam.zoom
      ctx.beginPath()
      for (let x = Math.floor(tl.x); x <= br.x; x++) {
        ctx.moveTo(x, tl.y)
        ctx.lineTo(x, br.y)
      }
      for (let y = Math.floor(tl.y); y <= br.y; y++) {
        ctx.moveTo(tl.x, y)
        ctx.lineTo(br.x, y)
      }
      ctx.stroke()
    }
    if (this.hover) outline(ctx, this.hover.x, this.hover.y, 1, 1, 2 / cam.zoom)
    if (this.target) outline(ctx, this.target.x - 0.5, this.target.y - 0.5, 2, 2, 3 / cam.zoom)

    this.drawMinimap(tl, br, visible)
    this.onView({ x: Math.floor(cam.x), y: Math.floor(cam.y) })
    this.chunks.evict(visible)
  }

  /** Draws the ready chunks covering area [a, b] (world coordinates) and loads the others. */
  private eachChunk(a: Point, b: Point, seen: Set<string>, draw: (c: OffscreenCanvas, x: number, y: number) => void) {
    const S = this.cfg.chunkSize
    const lim = this.cfg.worldLimit / S
    for (let cy = Math.max(-lim, Math.floor(a.y / S)); cy <= Math.min(lim - 1, Math.floor(b.y / S)); cy++) {
      for (let cx = Math.max(-lim, Math.floor(a.x / S)); cx <= Math.min(lim - 1, Math.floor(b.x / S)); cx++) {
        seen.add(this.chunks.key(cx, cy))
        const c = this.chunks.get(cx, cy)
        if (c) draw(c, cx * S, cy * S)
      }
    }
  }

  /** Overview centred on the camera; the rectangle shows what is visible. */
  private drawMinimap(tl: Point, br: Point, seen: Set<string>) {
    const m = this.minimap
    if (!m) return
    const dpr = devicePixelRatio
    const size = m.clientWidth * dpr
    if (m.width !== size) m.width = m.height = size
    const mctx = context2d(m)

    this.miniTarget = stepSpan(this.miniTarget, Math.max(br.x - tl.x, br.y - tl.y))
    const span = smoothSpan(this.mini.span, this.miniTarget)
    if (span !== this.miniTarget) this.redraw() // transition in progress
    const x0 = this.cam.x - span / 2
    const y0 = this.cam.y - span / 2
    this.mini = { x0, y0, span }
    const k = size / span

    mctx.setTransform(1, 0, 0, 1, 0, 0)
    mctx.fillStyle = BACKGROUND
    mctx.fillRect(0, 0, size, size)
    mctx.setTransform(k, 0, 0, k, -x0 * k, -y0 * k)
    mctx.imageSmoothingEnabled = true
    this.eachChunk({ x: x0, y: y0 }, { x: x0 + span, y: y0 + span }, seen, (c, x, y) => mctx.drawImage(c, x, y))
    outline(mctx, tl.x, tl.y, br.x - tl.x, br.y - tl.y, (2 * dpr) / k)
  }

  private updateHover(e: PointerEvent) {
    const p = this.toWorld(e.offsetX, e.offsetY)
    const next = { x: Math.floor(p.x), y: Math.floor(p.y) }
    const h = this.hover
    if (h?.x === next.x && h.y === next.y) return
    this.hover = next
    this.onHover(next)
    this.redraw()
  }

  private down = (e: PointerEvent) => {
    if (this.drag) return
    this.canvas.setPointerCapture(e.pointerId)
    this.drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, moved: false }
  }

  private move = (e: PointerEvent) => {
    const d = this.drag
    if (d?.id === e.pointerId) {
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > DRAG_THRESHOLD) d.moved = true
      if (d.moved) {
        this.stopAnim()
        this.clearTarget()
        const { x, y, zoom } = this.cam
        this.cam = clampCam(
          { x: x - (e.clientX - d.lx) / zoom, y: y - (e.clientY - d.ly) / zoom, zoom },
          this.cfg.worldLimit,
        )
        this.canvas.style.cursor = 'grabbing'
        this.redraw()
      }
      d.lx = e.clientX
      d.ly = e.clientY
    }
    this.updateHover(e)
  }

  private up = (e: PointerEvent) => {
    const d = this.drag
    if (d?.id !== e.pointerId) return
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

  // Like Figma: wheel / two fingers = pan, Ctrl + wheel or pinch = zoom.
  private wheel = (e: WheelEvent) => {
    e.preventDefault()
    // Some mice count in lines or pages; one wheel notch is ~100 px.
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? this.vp.h : 1
    if (e.ctrlKey || e.metaKey) {
      // Clamped per event: one wheel notch = ×1.5 at most, trackpad pinch stays fine-grained.
      const d = Math.max(-40, Math.min(40, e.deltaY * unit))
      this.zoomAt(Math.exp(-d * 0.01), e.offsetX, e.offsetY)
      return
    }
    this.stopAnim()
    const { x, y, zoom } = this.cam
    this.cam = clampCam({ x: x + (e.deltaX * unit) / zoom, y: y + (e.deltaY * unit) / zoom, zoom }, this.cfg.worldLimit)
    this.redraw()
  }
}
