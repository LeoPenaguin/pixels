import { Board } from '../models'
import { Request, Response } from 'express'

export async function oneBoard_get(request: Request, response: Response) {
  const board = await Board.findById(request.params.id).populate('pixels')
  await board?.populate('pixels.color')
  response.status(201).json(board)
}
