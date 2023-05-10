import { Schema } from 'mongoose'
import { IPixel } from '../types'

export default new Schema<IPixel>({
  col: {
    type: Number,
    required: true
  },
  row: {
    type: Number,
    required: true
  },
  color: { type: Schema.Types.ObjectId, ref: 'Color' }
})
