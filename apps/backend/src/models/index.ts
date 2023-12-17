import { model } from 'mongoose'
import { IBoard, IPixel, IUser, UserModel } from '@pixels/typings'
import boardSchema from './board'
import pixelSchema from './pixel'
import userSchema from './user'

const Pixel = model<IPixel>('Pixel', pixelSchema)
const Board = model<IBoard>('Board', boardSchema)
const User = model<IUser, UserModel>('user', userSchema)

export { Pixel, Board, User }
