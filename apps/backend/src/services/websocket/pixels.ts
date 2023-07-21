import { webSocketserver } from './'
import Websocket from 'ws'

export function broadcastNewPixel(pixel: any) {
  webSocketserver.clients.forEach((client) => {
    if (client.readyState === Websocket.OPEN) {
      client.send(JSON.stringify({ name: 'new pixel', pixel }))
    }
  })
}
