import { Schema } from 'mongoose'
import { IPixel } from '@pixels/typings'

export default new Schema<IPixel>({
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
})
