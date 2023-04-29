import mongoose from 'mongoose'

const colorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  }
})

const Color = mongoose.model('Color', colorSchema)

export { Color }
