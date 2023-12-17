import express from 'express'
import cors from 'cors'
import { boardsRouter, colorRouter, authRouter } from './routes'
import http from 'http'
import dotenv from 'dotenv'
import PixelDb from './config/mongodb'
import { initWebsocket } from './services/websocket'

const app = express()
dotenv.config()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const port = process.env.BACKEND_PORT

const pixelDb = new PixelDb()
pixelDb.init()

app.use(boardsRouter)
app.use(colorRouter)
app.use(authRouter)

const server = http.createServer(app)

initWebsocket(server)

server.listen(port, () => {
  console.log(`server is listening on port ${port}`)
})
