import { Schema } from 'mongoose'
import { IBoard } from '@pixels/typings'

export default new Schema<IBoard>({
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
      type: Schema.Types.ObjectId,
      ref: 'Pixel'
    }
  ]
})
