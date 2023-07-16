import { Color } from '../models'
import { Request, Response } from 'express'

export async function colors_get(req: Request, res: Response) {
  const color = await Color.find({})
  res.json(color)
}
