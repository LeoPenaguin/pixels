import { Schema } from 'mongoose'
import { IColor } from '@pixels/typings'

export default new Schema<IColor>({
  name: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  }
})
