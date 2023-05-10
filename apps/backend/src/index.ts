import express from 'express'
import cors from 'cors'
import { connect } from 'mongoose'
import { boardsRouter, colorRouter, pixelsRouter } from './routes'
import WebSocket, { WebSocketServer } from 'ws'
import http from 'http'

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const port = 3006

connect('mongodb://127.0.0.1:27017/pixels').then(() => {
  console.log('connected to database')
})

app.use(pixelsRouter)
app.use(boardsRouter)
app.use(colorRouter)

const server = http.createServer(app)

const wss = new WebSocket.Server({ server })

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (message: string) => {
    console.log('received: %s', message)
    ws.send(`Hello, you sent -> ${message}`)
  })

  ws.send('Hi there, I am a WebSocket server')
})

app.listen(port, () => {
  console.log(`server is listening on port ${port}`)
})
