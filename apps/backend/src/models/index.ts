import { model } from 'mongoose'
import { IBoard, IUser, UserModel } from '@pixels/typings'
import boardSchema from './board'
import userSchema from './user'

const Board = model<IBoard>('Board', boardSchema)
const User = model<IUser, UserModel>('user', userSchema)

export { Board, User }
