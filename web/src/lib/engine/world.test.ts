import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { config, frames, stubFetch } from '../../test/fakes'
import { HOME } from './camera'
import { World } from './world'

let canvas: HTMLCanvasElement
let minimap: HTMLCanvasElement

// A 400 × 300 canvas at the top left: screen coordinates = canvas coordinates.
function setup() {
  canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;left:0;top:0;width:400px;height:300px'
  minimap = document.createElement('canvas')
  minimap.style.cssText = 'position:fixed;left:500px;top:0;width:100px;height:100px'
  document.body.append(canvas, minimap)
  // Test events are not real pointers: capture would fail.
  canvas.setPointerCapture = vi.fn()
  minimap.setPointerCapture = vi.fn()
  return new World(canvas, config)
}

const pointer = (el: HTMLElement, type: string, x: number, y: number, init: PointerEventInit = {}) =>
  el.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, button: 0, bubbles: true, ...init }))

const wheel = (init: WheelEventInit) => canvas.dispatchEvent(new WheelEvent('wheel', { cancelable: true, ...init }))

const rgbAt = (c: HTMLCanvasElement, x: number, y: number) => {
  const dpr = devicePixelRatio
  return Array.from(
    c
      .getContext('2d')!
      .getImageData(x * dpr, y * dpr, 1, 1)
      .data.slice(0, 3),
  )
}

/** Waits for an animation to end (450 ms). */
const settle = () => new Promise((r) => setTimeout(r, 600))

beforeEach(() => {
  // Chunk 0:0: pixel (0, 0) black, (1, 0) red; other chunks are empty.
  stubFetch({
    '/api/chunks/0/0': () => new Response(new Uint8Array([1, 2])),
    '/api/chunks/': () => new Response(new Uint8Array()),
  })
})

afterEach(() => {
  canvas.remove()
  minimap.remove()
  vi.unstubAllGlobals()
})

describe('rendering', () => {
  test('draws the chunks, the grid, the hover and the minimap', async () => {
    const w = setup()
    w.setMinimap(minimap)
    const view = vi.fn()
    w.onView = view
    w.setCam({ x: 1, y: 1, zoom: 20 })
    await vi.waitFor(async () => {
      await frames()
      expect(rgbAt(canvas, 190, 140)).toEqual([0, 0, 0]) // pixel (0, 0)
    })
    expect(rgbAt(canvas, 210, 140)).toEqual([0xe5, 0x25, 0x21]) // pixel (1, 0)
    expect(view).toHaveBeenLastCalledWith({ x: 1, y: 1 })
    expect(minimap.width).toBe(100 * devicePixelRatio)

    w.hover = { x: 2, y: 2 }
    w.redraw()
    await frames()
    expect(rgbAt(canvas, 220, 175)).toEqual([0, 0, 0]) // hovered pixel outline (left edge)

    w.toggleGrid()
    expect(w.showGrid).toBe(false)
    w.setCam({ x: 1, y: 1, zoom: 2 }) // zoomed out: the minimap changes step smoothly
    await frames(10)
  })

  test('live pixels and reload', async () => {
    const w = setup()
    w.toggleGrid() // no grid: exact colours
    w.setCam({ x: 0, y: 0, zoom: 20 })
    await vi.waitFor(async () => {
      await frames()
      expect(rgbAt(canvas, 210, 150)).toEqual([0, 0, 0])
    })
    w.setPixel(0, 0, 3)
    await frames()
    expect(rgbAt(canvas, 210, 150)).toEqual([0x1f, 0x5b, 0xff])
    const calls = vi.mocked(fetch).mock.calls.length
    w.reload()
    await frames()
    expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(calls)
  })

  test('default callbacks do nothing', async () => {
    const w = setup()
    await frames()
    pointer(canvas, 'pointermove', 10, 10)
    pointer(canvas, 'pointerdown', 10, 10)
    pointer(canvas, 'pointerup', 10, 10)
    expect(w.hover).not.toBeNull()
  })
})

describe('camera', () => {
  test('toWorld and clamped setCam', () => {
    const w = setup()
    expect(w.toWorld(200, 150)).toEqual({ x: 0, y: 0 })
    w.setCam({ x: 1e9, y: 0, zoom: 1000 })
    expect(w.cam).toEqual({ x: config.worldLimit, y: 0, zoom: 24 })
  })

  test('animated recenter and zoomBy, rapid presses add up', async () => {
    const w = setup()
    w.setCam({ x: 50, y: 50, zoom: 4 })
    w.recenter()
    await settle()
    expect(w.cam).toEqual(HOME)
    w.zoomBy(1.5)
    w.zoomBy(1.5) // during the animation: starts from the previous target
    await settle()
    expect(w.cam.zoom).toBeCloseTo(24)
  })

  test('jumpTo goes to the pixel, highlights it for a second, and a far jump starts nearby', async () => {
    const w = setup()
    w.zoomBy(1.5)
    w.jumpTo(1e9, -1e9) // clamped to the world; zoom taken from the running animation
    expect(w.cam.x).toBeGreaterThan(300) // teleported near the target
    await settle()
    expect(w.cam).toEqual({ x: config.worldLimit - 0.5, y: -config.worldLimit + 0.5, zoom: 18 })
    w.jumpTo(3, 4) // replaces the current highlight
    w.zoomBy(1) // keeps the end of the jump (highlight)
    await settle()
    expect(w.cam).toMatchObject({ x: 3.5, y: 4.5 })
    await new Promise((r) => setTimeout(r, 1100)) // the highlight fades
  })

  test('zoomAt keeps the point under the pointer', () => {
    const w = setup()
    w.zoomAt(2, 0, 0)
    expect(w.cam.zoom).toBe(24)
    expect(w.toWorld(0, 0).x).toBeCloseTo(-200 / 12)
  })

  test('setCursor targets a clamped pixel and makes the view follow', async () => {
    const w = setup()
    w.jumpTo(0, 0)
    await settle() // a highlight is running: the cursor clears it
    expect(w.setCursor(100, 0)).toEqual({ x: 100, y: 0 })
    expect(w.cam.x).toBeGreaterThan(80)
    expect(w.setCursor(1e9, 0)).toEqual({ x: config.worldLimit - 1, y: 0 })
  })

  test('reduced motion: instant moves', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const w = setup()
    w.recenter()
    expect(w.cam).toEqual(HOME)
    w.jumpTo(10, 10)
    expect(w.cam).toEqual({ x: 10.5, y: 10.5, zoom: 12 })
  })
})

describe('mouse', () => {
  test('hover, click to paint, leaving the board', async () => {
    const w = setup()
    const hover = vi.fn()
    const place = vi.fn()
    w.onHover = hover
    w.onPlace = place
    await frames()
    pointer(canvas, 'pointermove', 200, 150)
    pointer(canvas, 'pointermove', 201, 151) // same pixel: no new call
    expect(hover).toHaveBeenCalledTimes(1)
    expect(hover).toHaveBeenCalledWith({ x: 0, y: 0 })

    pointer(canvas, 'pointerdown', 200, 150)
    pointer(canvas, 'pointerdown', 200, 150, { pointerId: 2 }) // second finger: ignored
    pointer(canvas, 'pointerup', 200, 150, { pointerId: 2 })
    pointer(canvas, 'pointerup', 200, 150)
    expect(place).toHaveBeenCalledWith(0, 0)

    pointer(canvas, 'pointerdown', 200, 150, { button: 2 })
    pointer(canvas, 'pointerup', 200, 150, { button: 2 }) // right click: paints nothing
    expect(place).toHaveBeenCalledTimes(1)

    canvas.dispatchEvent(new PointerEvent('pointerleave'))
    expect(hover).toHaveBeenLastCalledWith(null)
    expect(w.hover).toBeNull()
  })

  test('outside the world: no hover, no paint, no grid', async () => {
    const w = setup()
    const hover = vi.fn()
    const place = vi.fn()
    w.onHover = hover
    w.onPlace = place
    w.setCam({ x: config.worldLimit, y: 0, zoom: 12 }) // the right half of the canvas is outside
    pointer(canvas, 'pointermove', 100, 150)
    expect(hover).toHaveBeenLastCalledWith({ x: config.worldLimit - 9, y: 0 })
    pointer(canvas, 'pointermove', 296, 150)
    pointer(canvas, 'pointermove', 310, 150) // still outside: no new call
    expect(hover).toHaveBeenCalledTimes(2)
    expect(hover).toHaveBeenLastCalledWith(null)

    pointer(canvas, 'pointerdown', 296, 150)
    pointer(canvas, 'pointerup', 296, 150)
    expect(place).not.toHaveBeenCalled()
    await frames()
    expect(rgbAt(canvas, 296, 150)).toEqual([0xe5, 0xe5, 0xe5]) // where a grid line would be
  })

  test('dragging pans the view without painting', () => {
    const w = setup()
    const place = vi.fn()
    w.onPlace = place
    pointer(canvas, 'pointerdown', 200, 150)
    pointer(canvas, 'pointermove', 202, 150) // below the threshold: not a drag yet
    expect(w.cam.x).toBe(0)
    pointer(canvas, 'pointermove', 224, 150) // drag: the view follows from the last move
    expect(w.cam.x).toBe(-22 / 12)
    expect(canvas.style.cursor).toBe('grabbing')
    pointer(canvas, 'pointermove', 236, 150, { pointerId: 2 }) // other pointer: hover only
    expect(w.cam.x).toBe(-22 / 12)
    canvas.dispatchEvent(new PointerEvent('pointerleave')) // leaving while dragging: kept
    expect(w.hover).not.toBeNull()
    pointer(canvas, 'pointerup', 224, 150)
    expect(place).not.toHaveBeenCalled()
    expect(canvas.style.cursor).toBe('')
  })

  test('wheel pans, Ctrl or Cmd + wheel zooms, clamped per notch', () => {
    const w = setup()
    wheel({ deltaX: 120, deltaY: 24 })
    expect(w.cam).toMatchObject({ x: 10, y: 2 })
    wheel({ deltaY: 3, deltaMode: 1 }) // in lines
    expect(w.cam.y).toBe(6)
    wheel({ deltaY: 1, deltaMode: 2 }) // in pages
    expect(w.cam.y).toBe(31)
    wheel({ deltaY: -1000, ctrlKey: true, clientX: 200, clientY: 150 })
    expect(w.cam.zoom).toBeCloseTo(12 * Math.exp(0.4))
    wheel({ deltaY: 10, metaKey: true })
    expect(w.cam.zoom).toBeCloseTo(12 * Math.exp(0.3))
  })
})

describe('minimap', () => {
  test('dragging pans the view, a click animates there', async () => {
    const w = setup()
    w.setMinimap(minimap)
    await frames()
    pointer(minimap, 'pointermove', 550, 50) // not pressed: nothing
    pointer(minimap, 'pointerdown', 550, 50)
    pointer(minimap, 'pointermove', 551, 50) // below the threshold
    expect(w.cam.x).toBe(0)
    pointer(minimap, 'pointermove', 560, 50) // 10 px × 256 / 100
    expect(w.cam.x).toBeCloseTo(25.6)
    pointer(minimap, 'pointermove', 570, 50) // already dragging: follows every move
    expect(w.cam.x).toBeCloseTo(51.2)
    pointer(minimap, 'pointerup', 570, 50)
    expect(w.cam.x).toBeCloseTo(51.2)
    await frames() // the minimap follows the view

    pointer(minimap, 'pointerdown', 575, 50)
    pointer(minimap, 'pointerup', 575, 50) // click: goes to the aimed point
    await settle()
    expect(w.cam.x).toBeCloseTo(51.2 + 25 * 2.56, 0)
    pointer(minimap, 'pointerup', 575, 50) // released without a press: nothing
  })
})
