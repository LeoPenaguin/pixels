import { describe, expect, test } from 'vitest'
import { paletteMove, shortcut } from './keyboard'

const key = (k: string, mods: Partial<Record<'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey', boolean>> = {}) => ({
  key: k,
  shiftKey: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  ...mods,
})

describe('shortcut', () => {
  test('arrows move by 1, or 10 with Shift', () => {
    expect(shortcut(key('ArrowLeft'), false)).toEqual({ type: 'move', dx: -1, dy: 0 })
    expect(shortcut(key('ArrowDown', { shiftKey: true }), false)).toEqual({ type: 'move', dx: 0, dy: 10 })
  })

  test('Enter and Space paint only from the board', () => {
    expect(shortcut(key('Enter'), true)).toEqual({ type: 'place' })
    expect(shortcut(key(' '), true)).toEqual({ type: 'place' })
    expect(shortcut(key('Enter'), false)).toBeNull()
  })

  test('single keys, case-insensitive', () => {
    expect(shortcut(key('+'), false)).toEqual({ type: 'zoomIn' })
    expect(shortcut(key('='), false)).toEqual({ type: 'zoomIn' })
    expect(shortcut(key('-'), false)).toEqual({ type: 'zoomOut' })
    expect(shortcut(key('0'), false)).toEqual({ type: 'recenter' })
    expect(shortcut(key('G'), false)).toEqual({ type: 'grid' })
    expect(shortcut(key('c'), false)).toEqual({ type: 'palette' })
    expect(shortcut(key('?', { shiftKey: true }), false)).toEqual({ type: 'help' })
    expect(shortcut(key('Escape'), false)).toEqual({ type: 'escape' })
  })

  test('unknown keys and browser shortcuts are ignored', () => {
    expect(shortcut(key('x'), true)).toBeNull()
    expect(shortcut(key('Tab'), true)).toBeNull()
    expect(shortcut(key('-', { ctrlKey: true }), true)).toBeNull()
    expect(shortcut(key('0', { metaKey: true }), true)).toBeNull()
    expect(shortcut(key('g', { altKey: true }), true)).toBeNull()
  })
})

describe('paletteMove', () => {
  const rows = [
    ['a', 'b', 'c'],
    ['d', 'e'],
  ] // indexes: a0 b1 c2 / d3 e4

  test('left / right walk through everything, wrapping', () => {
    expect(paletteMove('ArrowRight', 2, rows)).toBe(3)
    expect(paletteMove('ArrowRight', 4, rows)).toBe(0)
    expect(paletteMove('ArrowLeft', 0, rows)).toBe(4)
  })

  test('up / down change rows keeping the column if possible', () => {
    expect(paletteMove('ArrowDown', 1, rows)).toBe(4)
    expect(paletteMove('ArrowDown', 2, rows)).toBe(4) // shorter next row
    expect(paletteMove('ArrowDown', 3, rows)).toBe(0) // wraps
    expect(paletteMove('ArrowUp', 0, rows)).toBe(3)
  })

  test('Home / End, and other keys do nothing', () => {
    expect(paletteMove('Home', 3, rows)).toBe(0)
    expect(paletteMove('End', 0, rows)).toBe(4)
    expect(paletteMove('a', 0, rows)).toBeNull()
  })
})
