import { Board } from '../models'
import { Request, Response } from 'express'

export const board_get = async (request: Request, response: Response) => {
  const boards = await Board.find({})
  response.json(boards)
}

export const oneBoard_get = async (request: Request, response: Response) => {
  const board = await Board.findById(request.params.id).populate('pixels')
  await board?.populate('pixels.color')
  response.status(201).json(board)
}

export const board_post = async (request: Request, response: Response) => {
  const board = new Board(request.body)
  await board.save()
  response.status(201).json(board)
}
