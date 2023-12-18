import type { Document, Model, Types } from 'mongoose'

interface IBoard {
  name: string
  description: string
  width: number
  height: number
  pixels: Types.ObjectId[]
}

interface IPixel {
  x: number
  y: number
  color: string
  board: Types.ObjectId
}

interface IUser {
  email: string
  password: string
  username: string
}

interface UserModel extends Model<IUser> {
  login(email: string, password: string): IUserDocument
}

type IBoardDocument = Document<IBoard>
type IPixelDocument = Document<IPixel>
type IUserDocument = Document<IUser>

export {
  type IBoard,
  type IPixel,
  type IBoardDocument,
  type IPixelDocument,
  type IUser,
  type IUserDocument,
  type UserModel
}
