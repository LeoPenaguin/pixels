import express, { Request, Response } from 'express'
import { webSocketserver } from '../services/websocket'
import Websocket from 'ws'

const pingRouter = express.Router()

pingRouter.get('/api/ping', async (request: Request, response: Response) => {
  webSocketserver.clients.forEach((client) => {
    if (client.readyState === Websocket.OPEN) {
      client.send('pong')
    }
  })
  response.send('pong')
})

export default pingRouter
