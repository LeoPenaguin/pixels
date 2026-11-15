import { expect, test } from 'vitest'
import { context2d } from './canvas'

test('context2d returns the 2D context', () => {
  expect(context2d(document.createElement('canvas'))).toBeInstanceOf(CanvasRenderingContext2D)
  expect(context2d(new OffscreenCanvas(1, 1))).toBeInstanceOf(OffscreenCanvasRenderingContext2D)
})

test('context2d fails if the canvas is already used for something else', () => {
  const c = document.createElement('canvas')
  c.getContext('webgl')
  expect(() => context2d(c)).toThrow('Canvas 2D indisponible')
})
