import express, {Request, Response} from 'express'
import mongoose from 'mongoose'
import { Pixel } from './models/pixel'
import { Board } from './models/board'
import { Color } from './models/colors'

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const port = 3001

mongoose.connect('mongodb://127.0.0.1:27017/pixels').then((test) => {
    console.log('connected to database')
})

app.get('/api/colors', async (req:Request, res:Response) => {
    const color = await Color.find({})
    res.json(color)
})

app.post('/api/color', async (req:Request, res:Response) => {
    const {name, value} = req.body

    const color = new Color({name, value})
    await color.save()

    res.status(201).json(color)
})

app.get('/api/boards', async (req:Request, res:Response) => {
    const board = await Board.find({})
    res.json(board)
})

app.post('/api/board', async (req:Request, res:Response) => {
    const {name} = req.body

    const board = new Board({name})
    await board.save()

    res.status(201).json(board)
})

app.get('/api/pixels', async (req:Request, res:Response) => {
    const {name, position, boardId} = req.body

    const pixel = await Pixel.find({_board: boardId})
    res.json(pixel)
})

app.post('/api/pixel', async (req:Request, res:Response) => {
    const {name, position, boardId} = req.body

    const pixel = new Pixel({name, position, _board: boardId})
    await pixel.save()

    res.status(201).json(pixel)
})

app.listen(port, () => {
    console.log(`server is listening on port ${port}`)
})