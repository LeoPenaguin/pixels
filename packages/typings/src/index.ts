import { Document, Model, Types } from 'mongoose'

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

interface IUser {
  email: string
  password: string
}

interface UserModel extends Model<IUser> {
  login(email: string, password: string): IUserDocument
}

type IBoardDocument = Document<IBoard>
type IColorDocument = Document<IColor>
type IPixelDocument = Document<IPixel>
type IUserDocument = Document<IUser>

export {
  IBoard,
  IColor,
  IPixel,
  IBoardDocument,
  IColorDocument,
  IPixelDocument,
  IUser,
  IUserDocument,
  UserModel
}
