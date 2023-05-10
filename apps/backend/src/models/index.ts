import { model } from 'mongoose'
import { IBoard, IColor, IPixel } from '../types'
import boardSchema from './board'
import pixelSchema from './pixel'
import colorSchema from './color'

const Pixel = model<IPixel>('Pixel', pixelSchema)
const Board = model<IBoard>('Board', boardSchema)
const Color = model<IColor>('Color', colorSchema)

export { Color, Pixel, Board }
