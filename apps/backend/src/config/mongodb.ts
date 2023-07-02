import { connect } from 'mongoose'

class PixelDb {
  mongodbUrl: string

  constructor() {
    this.mongodbUrl = process.env.MONGODB_URL as string
  }

  init() {
    connect(this.mongodbUrl).then(() => {
      console.log('connected to database')
    })
  }
}

export default PixelDb
