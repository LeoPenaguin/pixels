import type { Document, Model, Types } from 'mongoose'

interface IBoard {
  name: string
  description: string
  width: number
  height: number
  pixels: { x: number; y: number; color: string }[]
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
type IUserDocument = Document<IUser>

export { type IBoard, type IBoardDocument, type IUser, type IUserDocument, type UserModel }
