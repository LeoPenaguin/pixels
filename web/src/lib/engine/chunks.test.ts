import { afterEach, expect, test, vi } from 'vitest'
import { config, stubFetch } from '../../test/fakes'
import { Chunks, decodeChunk, hexToRgb } from './chunks'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

const pixelAt = (c: OffscreenCanvas, x: number, y: number) =>
  Array.from(c.getContext('2d')!.getImageData(x, y, 1, 1).data.slice(0, 3))

test('hexToRgb', () => {
  expect(hexToRgb('#E52521')).toEqual([0xe5, 0x25, 0x21])
})

test('decodeChunk: byte = colour index, missing or unknown = white', () => {
  const rgb = [hexToRgb('#FFFFFF'), hexToRgb('#000000')]
  const img = decodeChunk(new Uint8Array([1, 9]), rgb, 2)
  expect(Array.from(img.data)).toEqual([0, 0, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255])
})

test('loads a chunk once, applies pixels received while loading', async () => {
  let release: (r: Response) => void = () => undefined
  const fetch = stubFetch({ '/api/chunks/': () => new Promise<Response>((r) => (release = r)) })
  const changed = vi.fn()
  const chunks = new Chunks(config, changed)

  expect(chunks.get(-1, 0)).toBeUndefined()
  expect(chunks.get(-1, 0)).toBeUndefined()
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(fetch).toHaveBeenCalledWith('/api/chunks/-1/0')

  chunks.setPixel(-256, 1, 2) // chunk loading: set aside
  chunks.setPixel(5000, 5000, 1) // chunk never requested: ignored
  release(new Response(new Uint8Array([1])))
  await vi.waitFor(() => {
    expect(chunks.get(-1, 0)).toBeInstanceOf(OffscreenCanvas)
  })
  const c = chunks.get(-1, 0)!
  expect(pixelAt(c, 0, 0)).toEqual([0, 0, 0])
  expect(pixelAt(c, 0, 1)).toEqual([0xe5, 0x25, 0x21])
  expect(changed).toHaveBeenCalled()

  chunks.setPixel(-255, 0, 3) // chunk ready: drawn right away
  expect(pixelAt(c, 1, 0)).toEqual([0x1f, 0x5b, 0xff])
})

test('a failed load is forgotten then requested again', async () => {
  vi.useFakeTimers()
  const fetch = stubFetch({ '/api/chunks/': () => new Response('', { status: 500 }) })
  const changed = vi.fn()
  const chunks = new Chunks(config, changed)
  chunks.get(0, 0)
  await vi.waitFor(() => {
    expect(chunks.size).toBe(0)
  })
  vi.advanceTimersByTime(2000)
  expect(changed).toHaveBeenCalled()
  chunks.get(0, 0)
  expect(fetch).toHaveBeenCalledTimes(2)
})

test('a response arriving after clear() is ignored', async () => {
  let release: (r: Response) => void = () => undefined
  stubFetch({ '/api/chunks/': () => new Promise<Response>((r) => (release = r)) })
  const chunks = new Chunks(config, vi.fn())
  chunks.get(0, 0)
  chunks.clear()
  release(new Response(new Uint8Array([1])))
  await new Promise((r) => setTimeout(r, 10))
  expect(chunks.size).toBe(0)
})

test('a failure arriving after clear() does not touch the new load', async () => {
  let fail: (e: Error) => void = () => undefined
  stubFetch({ '/api/chunks/': () => new Promise<Response>((_, reject) => (fail = reject)) })
  const chunks = new Chunks(config, vi.fn())
  chunks.get(0, 0)
  const first = fail
  chunks.clear()
  chunks.get(0, 0) // new load in progress
  first(new Error('coupure'))
  await new Promise((r) => setTimeout(r, 10))
  expect(chunks.size).toBe(1)
})

test('evict keeps only visible chunks beyond 400', () => {
  stubFetch({ '/api/chunks/': () => new Promise<Response>(() => undefined) })
  const chunks = new Chunks(config, vi.fn())
  for (let i = 0; i < 400; i++) chunks.get(i, 0)
  chunks.evict(new Set())
  expect(chunks.size).toBe(400) // under the limit: nothing
  chunks.get(400, 0)
  chunks.evict(new Set([chunks.key(3, 0)]))
  expect(chunks.size).toBe(1)
})
