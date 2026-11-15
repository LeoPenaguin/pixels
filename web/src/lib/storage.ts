// Browser memory: last view and last painted pixel. Storage may be unavailable (private browsing,
// blocked data): it is then treated as empty.
import type { Cam, Point } from './engine/camera'

const VIEW_KEY = 'pixels:view'
const LAST_KEY = 'pixels:last'

function read(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null')
  } catch {
    return null
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full or blocked: never mind, it is only a convenience
  }
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

export function loadView(): Cam | null {
  const v = read(VIEW_KEY)
  if (!isObject(v)) return null
  const { x, y, zoom } = v
  return typeof x === 'number' &&
    typeof y === 'number' &&
    typeof zoom === 'number' &&
    [x, y, zoom].every(Number.isFinite)
    ? { x, y, zoom }
    : null
}

export const saveView = (cam: Cam) => write(VIEW_KEY, cam)

export function loadLastPixel(): Point | null {
  const v = read(LAST_KEY)
  if (!isObject(v)) return null
  const { x, y } = v
  return Number.isInteger(x) && Number.isInteger(y) ? { x: x as number, y: y as number } : null
}

export const saveLastPixel = (p: Point) => write(LAST_KEY, p)
