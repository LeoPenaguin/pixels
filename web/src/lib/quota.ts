// Client-side pixel quota: the server sends the token count at a given time, from which the
// current state is derived for display.

export type QuotaRules = { burst: number; refillMs: number }
/** `n` (fractional) tokens available at time `at` (ms). */
export type QuotaSnapshot = { n: number; at: number }

export type QuotaState = {
  tokens: number // fractional tokens
  available: number // pixels that can be painted now
  full: boolean
  progress: number // progress towards the next pixel, 0 to 1 (1 when full)
  nextIn: number // seconds until the next pixel
}

export function quotaAt(rules: QuotaRules, snap: QuotaSnapshot, now: number): QuotaState {
  const tokens = Math.min(rules.burst, snap.n + (now - snap.at) / rules.refillMs)
  const available = Math.floor(tokens)
  const full = available >= rules.burst
  return {
    tokens,
    available,
    full,
    progress: full ? 1 : tokens - available,
    nextIn: Math.ceil(((available + 1 - tokens) * rules.refillMs) / 1000),
  }
}
