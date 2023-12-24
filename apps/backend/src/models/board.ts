import { Schema, models } from 'mongoose'
import { IBoard } from '@pixels/typings'

const boardSchema = new Schema<IBoard>({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  width: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  pixels: [
    {
      x: {
        type: Number,
        required: true
      },
      y: {
        type: Number,
        required: true
      },
      color: {
        type: String,
        required: true
      }
    }
  ]
})

export default boardSchema
