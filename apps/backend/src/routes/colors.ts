import express, { Request, Response } from 'express'
import { Color } from '../models'

const colorsRouter = express.Router()

colorsRouter.get('/api/colors', async (req: Request, res: Response) => {
  const color = await Color.find({})
  res.json(color)
})

export default colorsRouter
