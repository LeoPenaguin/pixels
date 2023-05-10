import express, { Request, Response } from 'express'
import { Pixel, Color, Board } from '../models'

const pixelsRouter = express.Router()

pixelsRouter.post('/api/pixel', async (req: Request, res: Response) => {
  const { col, row, color, board } = req.body

  const dbBoard = await Board.findById({ _id: board._id })

  if (!dbBoard) {
    res.status(404).json({ ok: false, message: 'Board not found' })
    return
  }

  const dbColor = await Color.findById({ col, row, _id: color._id })

  if (!dbColor) {
    res.status(404).json({ ok: false, message: 'Color not found' })
    return
  }

  const newPixel = new Pixel({ col, row, color: dbColor._id })
  dbBoard.pixels.push(newPixel._id)

  await dbBoard.save()

  res.status(201).json({ dbBoard: dbBoard.populate('pixels') })
})

export default pixelsRouter
