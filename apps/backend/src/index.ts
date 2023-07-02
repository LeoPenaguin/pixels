import express from 'express'
import cors from 'cors'
import { boardsRouter, colorRouter, pixelsRouter } from './routes'
import http from 'http'
import PixelWebsocket from './websocket'
import dotenv from 'dotenv'
import PixelDb from './config/mongodb'

const app = express()
dotenv.config()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const port = process.env.BACKEND_PORT

const pixelDb = new PixelDb()
pixelDb.init()

app.use(pixelsRouter)
app.use(boardsRouter)
app.use(colorRouter)

const server = http.createServer(app)

const pixelWebsocket = new PixelWebsocket(server)
pixelWebsocket.init()

server.listen(port, () => {
  console.log(`server is listening on port ${port}`)
})
