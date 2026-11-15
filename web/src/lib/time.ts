const rtf = new Intl.RelativeTimeFormat('fr', { numeric: 'auto' })

const UNITS = [
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
] as const

/** Relative time in French (UI language): « il y a 3 minutes », « hier »… */
export function ago(ms: number, now: number): string {
  const s = Math.round((ms - now) / 1000)
  for (const [unit, size] of UNITS) {
    if (Math.abs(s) >= size) return rtf.format(Math.round(s / size), unit)
  }
  return rtf.format(s, 'second')
}
