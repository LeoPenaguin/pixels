import { Request, Response } from 'express'
import { webSocketserver } from '../services/websocket'
import Websocket from 'ws'

export async function ping_get(req: Request, res: Response) {
  webSocketserver.clients.forEach((client) => {
    if (client.readyState === Websocket.OPEN) {
      client.send('pong')
    }
  })
  res.send('pong')
}
