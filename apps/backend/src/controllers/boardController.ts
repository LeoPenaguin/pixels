import { Board } from '../models'
import { Request, Response } from 'express'

export async function board_get(request: Request, response: Response) {
  const boards = await Board.find({})
  response.json(boards)
}

export async function oneBoard_get(request: Request, response: Response) {
  const board = await Board.findById(request.params.id).populate('pixels')
  await board?.populate('pixels.color')
  response.status(201).json(board)
}

export async function board_post(request: Request, response: Response) {
  const board = new Board(request.body)
  await board.save()
  response.status(201).json(board)
}
