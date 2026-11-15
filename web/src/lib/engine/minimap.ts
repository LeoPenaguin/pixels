// Minimap scale: displayed world width, in steps, with a smooth transition.

export const MINIMAP_SPAN = [256, 4096] as const

/** Target step for a view `view` world pixels wide. Doubles as soon as the view exceeds half the
 *  minimap, only steps down below 1/6: no flip-flopping around a threshold. */
export function stepSpan(target: number, view: number): number {
  let t = target
  while (t < 2 * view && t < MINIMAP_SPAN[1]) t *= 2
  while (t > 6 * view && t / 2 >= MINIMAP_SPAN[0]) t /= 2
  return t
}

/** Moves `span` towards the step (log scale, ~0.5 s per step). Returns the step once close enough. */
export function smoothSpan(span: number, target: number): number {
  const next = span * (target / span) ** 0.12
  return Math.abs(Math.log(target / next)) < 0.005 ? target : next
}
