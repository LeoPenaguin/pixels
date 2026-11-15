import { describe, expect, test } from 'vitest'
import {
  HOME,
  MAX_ZOOM,
  MIN_ZOOM,
  clampCam,
  clampZoom,
  ease,
  flightStart,
  interpolate,
  keepVisible,
  toWorld,
  zoomAround,
} from './camera'

const vp = { w: 800, h: 600 }

test('clampZoom clamps the zoom', () => {
  expect(clampZoom(0.1)).toBe(MIN_ZOOM)
  expect(clampZoom(100)).toBe(MAX_ZOOM)
  expect(clampZoom(10)).toBe(10)
})

test('clampCam keeps the centre in the world', () => {
  expect(clampCam({ x: 5000, y: -5000, zoom: 3 }, 1000)).toEqual({ x: 1000, y: -1000, zoom: 3 })
  expect(clampCam({ x: 1, y: 2, zoom: 3 }, 1000)).toEqual({ x: 1, y: 2, zoom: 3 })
})

test('toWorld: the screen centre is the camera', () => {
  const cam = { x: 10, y: -5, zoom: 4 }
  expect(toWorld(cam, vp, 400, 300)).toEqual({ x: 10, y: -5 })
  expect(toWorld(cam, vp, 0, 0)).toEqual({ x: 10 - 100, y: -5 - 75 })
})

test('zoomAround keeps the aimed point under the pointer', () => {
  const cam = { x: 0, y: 0, zoom: 10 }
  const before = toWorld(cam, vp, 100, 50)
  const next = zoomAround(cam, 2, vp, 100, 50)
  expect(next.zoom).toBe(20)
  const after = toWorld(next, vp, 100, 50)
  expect(after.x).toBeCloseTo(before.x)
  expect(after.y).toBeCloseTo(before.y)
  expect(zoomAround(cam, 100, vp, 0, 0).zoom).toBe(MAX_ZOOM)
})

describe('keepVisible', () => {
  const cam = { x: 0, y: 0, zoom: 10 } // 80 × 60 visible pixels, 8-pixel margin
  test('does not move if the pixel is already well visible', () => {
    expect(keepVisible(cam, vp, { x: 0, y: 0 })).toEqual(cam)
  })
  test('follows the pixel on every side', () => {
    expect(keepVisible(cam, vp, { x: -40, y: 0 }).x).toBeCloseTo(-8)
    expect(keepVisible(cam, vp, { x: 39, y: 0 }).x).toBeCloseTo(8)
    expect(keepVisible(cam, vp, { x: 0, y: -30 }).y).toBeCloseTo(-8)
    expect(keepVisible(cam, vp, { x: 0, y: 29 }).y).toBeCloseTo(8)
  })
})

test('flightStart: unchanged start when close, brought closer when far', () => {
  const from = { x: 0, y: 0, zoom: 10 } // 3 screens = 240 pixels
  const near = { x: 100, y: 0, zoom: 10 }
  expect(flightStart(from, near, vp)).toBe(from)
  const start = flightStart(from, { x: 10000, y: 0, zoom: 10 }, vp)
  expect(start.x).toBeCloseTo(10000 - 240)
  expect(start.zoom).toBe(10)
})

test('ease starts at 0, ends at 1 and goes through the middle', () => {
  expect(ease(0)).toBe(0)
  expect(ease(0.5)).toBe(0.5)
  expect(ease(1)).toBe(1)
  expect(ease(0.25)).toBeLessThan(0.25)
  expect(ease(0.75)).toBeGreaterThan(0.75)
})

test('interpolate: linear position, geometric zoom', () => {
  const mid = interpolate({ x: 0, y: 0, zoom: 2 }, { x: 10, y: 20, zoom: 8 }, 0.5)
  expect(mid).toEqual({ x: 5, y: 10, zoom: 4 })
  expect(interpolate(HOME, { x: 1, y: 1, zoom: 24 }, 1)).toEqual({ x: 1, y: 1, zoom: 24 })
})
