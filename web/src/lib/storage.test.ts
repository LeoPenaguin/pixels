import { afterEach, expect, test, vi } from 'vitest'
import { loadLastPixel, loadView, saveLastPixel, saveView } from './storage'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

test('the view and the last pixel survive a reload', () => {
  saveView({ x: 1.5, y: -2, zoom: 12 })
  saveLastPixel({ x: 3, y: -4 })
  expect(loadView()).toEqual({ x: 1.5, y: -2, zoom: 12 })
  expect(loadLastPixel()).toEqual({ x: 3, y: -4 })
})

test('nothing stored, or invalid data: null', () => {
  expect(loadView()).toBeNull()
  expect(loadLastPixel()).toBeNull()
  for (const bad of ['pas du json', '42', '{"x":1,"y":2}', '{"x":1,"y":2,"zoom":"z"}', '{"x":1,"y":null,"zoom":1}']) {
    localStorage.setItem('pixels:view', bad)
    expect(loadView()).toBeNull()
  }
  localStorage.setItem('pixels:view', '{"x":1,"y":2,"zoom":1e999}')
  expect(loadView()).toBeNull()
  for (const bad of ['null', '{"x":1.5,"y":2}', '{"x":1,"y":"2"}']) {
    localStorage.setItem('pixels:last', bad)
    expect(loadLastPixel()).toBeNull()
  }
})

test('blocked storage: empty reads, ignored writes', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('bloqué')
  })
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('bloqué')
  })
  expect(loadView()).toBeNull()
  expect(() => {
    saveLastPixel({ x: 1, y: 1 })
  }).not.toThrow()
})
