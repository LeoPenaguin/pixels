import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import { boardsRouter, colorRouter, pixelsRouter } from './routes'

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const port = 3000

mongoose.connect('mongodb://127.0.0.1:27017/pixels').then(() => {
  console.log('connected to database')
})

app.use(pixelsRouter)
app.use(boardsRouter)
app.use(colorRouter)

app.listen(port, () => {
  console.log(`server is listening on port ${port}`)
})
