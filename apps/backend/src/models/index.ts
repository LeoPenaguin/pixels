import { model } from 'mongoose'
import { IBoard, IColor, IPixel, IUser, UserModel } from '@pixels/typings'
import boardSchema from './board'
import pixelSchema from './pixel'
import colorSchema from './color'
import userSchema from './user'

const Pixel = model<IPixel>('Pixel', pixelSchema)
const Board = model<IBoard>('Board', boardSchema)
const Color = model<IColor>('Color', colorSchema)
const User = model<IUser, UserModel>('user', userSchema)

export { Color, Pixel, Board, User }
