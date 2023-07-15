import Websocket, { Server as WsServer } from 'ws'
import type { Server } from 'http'

export let webSocketserver: WsServer

export const initWebsocket = function (server: Server) {
  webSocketserver = new Websocket.Server({ server })
}
