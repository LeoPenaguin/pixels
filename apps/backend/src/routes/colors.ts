import express, { Request, Response } from 'express'
import { Color } from '../models/colors'

const colorsRouter = express.Router()

colorsRouter.get('/api/colors', async (req: Request, res: Response) => {
  const color = await Color.find({})
  res.json(color)
})

colorsRouter.post('/api/color', async (req: Request, res: Response) => {
  const { name, value } = req.body

  const color = new Color({ name, value })
  await color.save()

  res.status(201).json(color)
})

export default colorsRouter
