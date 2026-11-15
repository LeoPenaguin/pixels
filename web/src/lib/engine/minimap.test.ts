import { expect, test } from 'vitest'
import { MINIMAP_SPAN, smoothSpan, stepSpan } from './minimap'

test('stepSpan doubles when the view no longer fits, up to the maximum', () => {
  expect(stepSpan(256, 100)).toBe(256)
  expect(stepSpan(256, 200)).toBe(512)
  expect(stepSpan(256, 100000)).toBe(MINIMAP_SPAN[1])
})

test('stepSpan only steps down below 1/6 (hysteresis), never below the minimum', () => {
  expect(stepSpan(1024, 200)).toBe(1024) // 1024 < 6 × 200: kept
  expect(stepSpan(1024, 100)).toBe(512)
  expect(stepSpan(1024, 1)).toBe(MINIMAP_SPAN[0])
})

test('smoothSpan approaches the step then snaps to it', () => {
  const next = smoothSpan(256, 512)
  expect(next).toBeGreaterThan(256)
  expect(next).toBeLessThan(512)
  expect(smoothSpan(511.9, 512)).toBe(512)
})
