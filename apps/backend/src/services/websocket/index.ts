import Websocket, { Server as WsServer } from 'ws'
import type { Server } from 'http'
import { SocketPayload } from '../../types/socketPayload'
import { savePixelToDB } from '../crud/pixels'

export let webSocketserver: WsServer

export const initWebsocket = function (server: Server) {
  webSocketserver = new Websocket.Server({ server })

  webSocketserver.on('connection', (socket) => {
    socket.on('message', async (message) => {
      try {
        const jsonMessage = JSON.parse(message.toString()) as SocketPayload

        // ADDPIXEL
        if (jsonMessage.event === 0) {
          await savePixelToDB(jsonMessage.data.x, jsonMessage.data.y, jsonMessage.data.colorId)
          broadcast(message.toString())
        }
      } catch (error) {
        console.log(error)
      }
    })
  })
}

function broadcast(message: string) {
  webSocketserver.clients.forEach((client) => {
    if (client.readyState === Websocket.OPEN) {
      client.send(message)
    }
  })
}
