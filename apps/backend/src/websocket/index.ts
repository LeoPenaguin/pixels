import WebSocket from 'ws'
import http from 'http'
import { Pixel } from '../models'

class PixelWebsocket {
  wss: WebSocket.Server
  ws: WebSocket | null

  constructor(server: http.Server) {
    this.wss = new WebSocket.Server({ server })
    this.ws = null
  }

  init() {
    this.wss.on('connection', (ws: WebSocket) => {
      this.ws = ws
      ws.on('message', this.sendMessage)
      ws.send('Hi there, I am a WebSocket server')

      const pixelEmitter = Pixel.watch()
      pixelEmitter.on('change', (change) => {
        console.log('Lol', change)
        ws.send('Lol', change)
      })
    })
  }

  sendMessage(message: string) {
    console.log('received: %s', message)
    this.ws?.send(`Hello, you sent -> ${message}`)
  }
}

export default PixelWebsocket
