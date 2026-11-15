// Real-time connection to the server (WebSocket /ws), reconnected automatically.
//   sent:     {"x","y","c"}
//   received: {"t":"q","n"} remaining quota; {"t":"b","p":[x,y,c, x,y,c, …]} batch of painted pixels
const RECONNECT_MS = 1000

type Message = { t: 'q'; n: number } | { t: 'b'; p: number[] }

export type LiveHandlers = {
  onOpen: () => void
  onClose: () => void
  onPixel: (x: number, y: number, c: number) => void
  onQuota: (n: number) => void
}

/** WebSocket URL of the page's server (wss over https). */
export const wsUrl = ({ protocol, host }: { protocol: string; host: string }) =>
  `${protocol === 'https:' ? 'wss' : 'ws'}://${host}/ws`

export class Live {
  private ws?: WebSocket
  private stopped = false

  constructor(private h: LiveHandlers) {}

  get open() {
    return this.ws?.readyState === WebSocket.OPEN
  }

  connect() {
    const ws = new WebSocket(wsUrl(location))
    this.ws = ws
    ws.onopen = () => {
      this.h.onOpen()
    }
    ws.onmessage = (e: MessageEvent<string>) => {
      const msg = JSON.parse(e.data) as Message
      if (msg.t === 'q') this.h.onQuota(msg.n)
      else for (let i = 0; i < msg.p.length; i += 3) this.h.onPixel(msg.p[i], msg.p[i + 1], msg.p[i + 2])
    }
    ws.onclose = () => {
      if (this.stopped) return
      this.h.onClose()
      setTimeout(() => {
        this.connect()
      }, RECONNECT_MS)
    }
  }

  /** Sends a pixel; false if the connection is not open. */
  send(x: number, y: number, c: number): boolean {
    if (!this.open) return false
    this.ws?.send(JSON.stringify({ x, y, c }))
    return true
  }

  close() {
    this.stopped = true
    this.ws?.close()
  }
}
