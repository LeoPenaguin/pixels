import mongoose from 'mongoose'

const pixelSchema = new mongoose.Schema({
  col: {
    type: Number,
    required: true
  },
  row: {
    type: Number,
    required: true
  },
  _color: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  _board: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
})

const Pixel = mongoose.model('Pixel', pixelSchema)

export { Pixel }
