import express, { Request, Response } from 'express'
import { Board, Pixel } from '../models'
import { IPixel } from '../types'
import { ObjectId } from 'mongoose'

const boardsRouter = express.Router()

boardsRouter.get('/api/boards', async (req: Request, res: Response) => {
  const boards = await Board.find({})
  res.json(boards)
})

boardsRouter.get('/api/board/:id', async (req: Request, res: Response) => {
  const board = await Board.findById(req.params.id).populate('pixels')
  res.status(201).json(board)
})

boardsRouter.post('/api/board', async (req: Request, res: Response) => {
  const board = new Board(req.body)
  await board.save()

  res.status(201).json(board)
})

boardsRouter.delete('/api/board/:id', async (req: Request, res: Response) => {
  Board.deleteOne({ _id: req.params.id })
    .then(() => {
      res.status(201).json({ ok: true })
    })
    .catch((err: Error) => {
      res.status(500).json({ ok: false, err })
    })
})

export default boardsRouter
