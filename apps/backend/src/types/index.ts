import { Types } from 'mongoose'

interface IBoard {
  name: string
  description: string
  width: number
  height: number
  pixels: Types.ObjectId[]
}

interface IColor {
  name: string
  value: string
}

interface IPixel {
  col: number
  row: number
  color: Types.ObjectId
  board: Types.ObjectId
}

export { IBoard, IColor, IPixel }
