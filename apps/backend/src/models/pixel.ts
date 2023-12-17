import { Schema } from 'mongoose'
import { IPixel } from '@pixels/typings'

export default new Schema<IPixel>({
  col: {
    type: Number,
    required: true
  },
  row: {
    type: Number,
    required: true
  },
  color: {
    type: String,
    required: true
  }
})
