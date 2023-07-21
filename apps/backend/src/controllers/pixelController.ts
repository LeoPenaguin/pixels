import { Request, Response } from 'express'
import { Pixel, Color, Board } from '../models'
import { broadcastNewPixel } from '../services/websocket/pixels'

export async function pixel_get(req: Request, res: Response) {
  const pixel = await Pixel.findById(req.params.id)
  res.status(201).json(pixel)
}

export async function pixel_post(req: Request, res: Response) {
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
  res.status(201).json(populated)
}
