// Test doubles: a fake HTTP server (fetch) and a controllable fake WebSocket.
import { vi } from 'vitest'
import type { Config } from '../lib/api'

export const config: Config = {
  chunkSize: 256,
  worldLimit: 512,
  palette: [
    ['#FFFFFF', '#000000'],
    ['#E52521', '#1F5BFF', '#2ECC40'],
  ],
  quota: { burst: 2, refillMs: 1000 },
}

type Route = (url: string) => Response | Promise<Response>

/** Replaces fetch: `routes` maps a URL prefix to a response; anything else answers 404. */
export function stubFetch(routes: Record<string, Route>) {
  const fetch = vi.fn((url: string) => {
    const prefix = Object.keys(routes).find((p) => url.startsWith(p))
    return Promise.resolve(prefix ? routes[prefix](url) : new Response('', { status: 404 }))
  })
  vi.stubGlobal('fetch', fetch)
  return fetch
}

export class FakeWebSocket {
  static readonly OPEN = 1
  static instances: FakeWebSocket[] = []
  static get last() {
    return FakeWebSocket.instances[FakeWebSocket.instances.length - 1]
  }

  readyState = 0
  sent: unknown[] = []
  onopen: (() => void) | null = null
  onmessage: ((e: { data: string }) => void) | null = null
  onclose: (() => void) | null = null

  constructor(readonly url: string) {
    FakeWebSocket.instances.push(this)
  }

  send(data: string) {
    this.sent.push(JSON.parse(data))
  }

  close() {
    this.readyState = 3
    this.onclose?.()
  }

  // Server side:
  open() {
    this.readyState = FakeWebSocket.OPEN
    this.onopen?.()
  }

  receive(msg: unknown) {
    this.onmessage?.({ data: JSON.stringify(msg) })
  }
}

export function stubWebSocket() {
  FakeWebSocket.instances = []
  vi.stubGlobal('WebSocket', FakeWebSocket)
}

/** Waits for the browser to render a few frames. */
export const frames = async (n = 3) => {
  for (let i = 0; i < n; i++) await new Promise(requestAnimationFrame)
}
