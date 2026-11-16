// Board camera: pure maths (no DOM), testable on its own.

export type Point = { x: number; y: number }
/** x, y = world coordinate at the screen centre; zoom = on-screen pixel size, in CSS px. */
export type Cam = Point & { zoom: number }
export type Viewport = { w: number; h: number }

export const MIN_ZOOM = 0.5 // max zoom out: the whole 1024 × 1024 world fits in 512 screen px
export const MAX_ZOOM = 24 // max zoom in: enough to aim, more adds nothing
export const HOME: Cam = { x: 0, y: 0, zoom: 12 }
const MAX_FLIGHT_SCREENS = 3 // beyond that, "teleport" near the target then animate the rest
const FOLLOW_MARGIN = 80 // px: the keyboard cursor stays at least this far from the edge

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export const clampZoom = (zoom: number) => clamp(zoom, MIN_ZOOM, MAX_ZOOM)

/** Is pixel p inside the world, i.e. in [-limit, limit) on both axes? */
export const inWorld = (p: Point, limit: number) => p.x >= -limit && p.x < limit && p.y >= -limit && p.y < limit

/** Nearest world pixel to p. */
export const clampPixel = (p: Point, limit: number): Point => ({
  x: clamp(p.x, -limit, limit - 1),
  y: clamp(p.y, -limit, limit - 1),
})

/** Keeps the view centre inside the world. */
export function clampCam(cam: Cam, limit: number): Cam {
  return { x: clamp(cam.x, -limit, limit), y: clamp(cam.y, -limit, limit), zoom: cam.zoom }
}

/** Screen coordinates (CSS px) → world coordinates. */
export function toWorld(cam: Cam, vp: Viewport, sx: number, sy: number): Point {
  return { x: cam.x + (sx - vp.w / 2) / cam.zoom, y: cam.y + (sy - vp.h / 2) / cam.zoom }
}

/** Zooms while keeping screen point (sx, sy) under the pointer. */
export function zoomAround(cam: Cam, factor: number, vp: Viewport, sx: number, sy: number): Cam {
  const next = { ...cam, zoom: clampZoom(cam.zoom * factor) }
  const before = toWorld(cam, vp, sx, sy)
  const after = toWorld(next, vp, sx, sy)
  return { x: cam.x + before.x - after.x, y: cam.y + before.y - after.y, zoom: next.zoom }
}

/** Shifts the view just enough for pixel p to stay on screen, away from the edge. */
export function keepVisible(cam: Cam, vp: Viewport, p: Point): Cam {
  const follow = (c: number, size: number, v: number) => {
    const m = Math.min(FOLLOW_MARGIN, size / 4) / cam.zoom
    const lo = c - size / 2 / cam.zoom + m // first world pixel to keep visible
    const hi = c + size / 2 / cam.zoom - m
    return v < lo ? c + v - lo : v + 1 > hi ? c + v + 1 - hi : c
  }
  return { x: follow(cam.x, vp.w, p.x), y: follow(cam.y, vp.h, p.y), zoom: cam.zoom }
}

/** Start point of an animation: when too far, start a few screens before the target
 *  (otherwise every chunk along the way would load). */
export function flightStart(from: Cam, to: Cam, vp: Viewport): Cam {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const reach = (MAX_FLIGHT_SCREENS * Math.max(vp.w, vp.h)) / from.zoom
  const dist = Math.hypot(dx, dy)
  if (dist <= reach) return from
  const k = reach / dist
  return { ...from, x: to.x - dx * k, y: to.y - dy * k }
}

/** Ease in, then out. */
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

/** Position at progress e ∈ [0, 1]; zoom on a log scale for a steady feel. */
export function interpolate(from: Cam, to: Cam, e: number): Cam {
  return {
    x: from.x + (to.x - from.x) * e,
    y: from.y + (to.y - from.y) * e,
    zoom: from.zoom * (to.zoom / from.zoom) ** e,
  }
}
