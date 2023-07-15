import { IPixel } from '@pixels/typings'
import { webSocketserver } from './'
import Websocket from 'ws'

export function broadcastNewPixel(pixel: any) {
  console.log('broadcasting new pixel', pixel)
  webSocketserver.clients.forEach((client) => {
    if (client.readyState === Websocket.OPEN) {
      client.send(JSON.stringify({ name: 'new pixel', pixel }))
    }
  })
}
