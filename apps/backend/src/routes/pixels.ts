import express, { Request, Response } from 'express'
import { Pixel, Color, Board } from '../models'
import { broadcastNewPixel } from '../services/websocket/pixels'

const pixelsRouter = express.Router()

pixelsRouter.get('/api/pixel/:id', async (req: Request, res: Response) => {
  const pixel = await Pixel.findById(req.params.id)
  res.status(201).json(pixel)
})

pixelsRouter.post('/api/pixel', async (req: Request, res: Response) => {
  const { col, row, colorId, boardId } = req.body

  const dbBoard = await Board.findById(boardId)

  if (!dbBoard) {
    res.status(404).json({ ok: false, message: 'Board not found' })
    return
  }

  const colorExists = await Color.exists({ _id: colorId })

  if (!colorExists) {
    res.status(404).json({ ok: false, message: 'Color not found' })
    return
  }

  const newPixel = new Pixel({ col, row, color: colorId })
  await newPixel.save()

  dbBoard.pixels.push(newPixel._id)
  await dbBoard.save()

  const populated = await newPixel.populate('color')

  broadcastNewPixel(populated)
  res.status(201).json({ dbBoard: dbBoard.populate('pixels') })
})

export default pixelsRouter
