// Keyboard shortcuts: maps a key to an action without running it (testable on its own).

type Simple = 'place' | 'zoomIn' | 'zoomOut' | 'recenter' | 'grid' | 'palette' | 'help' | 'escape'
export type Action = { type: 'move'; dx: number; dy: number } | { type: Simple }

const ARROWS: Partial<Record<string, [number, number]>> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
}

const KEYS: Partial<Record<string, Simple>> = {
  '+': 'zoomIn',
  '=': 'zoomIn',
  '-': 'zoomOut',
  '0': 'recenter',
  g: 'grid',
  c: 'palette',
  '?': 'help',
  Escape: 'escape',
}

type Key = Pick<KeyboardEvent, 'key' | 'shiftKey' | 'ctrlKey' | 'metaKey' | 'altKey'>

/** A key's action, or null. `onBoard`: focus is on the board (or nowhere), where Enter and Space
 *  paint a pixel; elsewhere they keep their role (activating a button). */
export function shortcut(e: Key, onBoard: boolean): Action | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null // browser shortcuts (Ctrl + -, Cmd + 0…)
  const arrow = ARROWS[e.key]
  if (arrow) {
    const step = e.shiftKey ? 10 : 1
    return { type: 'move', dx: arrow[0] * step, dy: arrow[1] * step }
  }
  if (e.key === 'Enter' || e.key === ' ') return onBoard ? { type: 'place' } : null
  const type = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key]
  return type ? { type } : null
}

/** Palette navigation (rows of different lengths): the new index, or null if the key is not for
 *  the palette. Left / right walk through every colour, up / down change rows keeping the column. */
export function paletteMove(key: string, index: number, rows: string[][]): number | null {
  const total = rows.reduce((n, r) => n + r.length, 0)
  const starts = rows.map((_, r) => rows.slice(0, r).reduce((n, row) => n + row.length, 0))
  const row = starts.findLastIndex((s) => s <= index)
  switch (key) {
    case 'ArrowLeft':
      return (index - 1 + total) % total
    case 'ArrowRight':
      return (index + 1) % total
    case 'ArrowUp':
    case 'ArrowDown': {
      const next = (row + (key === 'ArrowUp' ? rows.length - 1 : 1)) % rows.length
      return starts[next] + Math.min(index - starts[row], rows[next].length - 1)
    }
    case 'Home':
      return 0
    case 'End':
      return total - 1
    default:
      return null
  }
}
