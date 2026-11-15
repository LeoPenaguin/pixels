// Small stateless modules: colours, dates, quota, API.
import { afterEach, expect, test, vi } from 'vitest'
import { fetchConfig, fetchPixelInfo } from './api'
import { colorName } from './colors'
import { quotaAt } from './quota'
import { ago } from './time'

afterEach(() => {
  vi.unstubAllGlobals()
})

test('colorName: French name, or hex if unknown', () => {
  expect(colorName('#000000')).toBe('Noir')
  expect(colorName('#e52521')).toBe('Rouge vif')
  expect(colorName('#123456')).toBe('#123456')
})

test('ago: relative time in French', () => {
  const now = 1_000_000_000
  expect(ago(now - 5_000, now)).toBe('il y a 5 secondes')
  expect(ago(now - 3 * 60_000, now)).toBe('il y a 3 minutes')
  expect(ago(now - 2 * 3_600_000, now)).toBe('il y a 2 heures')
  expect(ago(now - 86_400_000, now)).toBe('hier')
})

test('quotaAt: refill, cap and next pixel', () => {
  const rules = { burst: 10, refillMs: 2000 }
  const empty = quotaAt(rules, { n: 0, at: 0 }, 500)
  expect(empty).toEqual({ tokens: 0.25, available: 0, full: false, progress: 0.25, nextIn: 2 })
  const full = quotaAt(rules, { n: 9, at: 0 }, 60_000)
  expect(full).toEqual({ tokens: 10, available: 10, full: true, progress: 1, nextIn: 2 })
})

test('the API returns the server JSON and fails on an HTTP error', async () => {
  const fetch = vi.fn(() => Promise.resolve(Response.json({ x: 1 })))
  vi.stubGlobal('fetch', fetch)
  await expect(fetchConfig()).resolves.toEqual({ x: 1 })
  expect(fetch).toHaveBeenCalledWith('/api/config')
  await expect(fetchPixelInfo(-3, 4)).resolves.toEqual({ x: 1 })
  expect(fetch).toHaveBeenLastCalledWith('/api/pixels/-3/4')

  fetch.mockImplementation(() => Promise.resolve(new Response('', { status: 500 })))
  await expect(fetchConfig()).rejects.toThrow('/api/config : 500')
})
