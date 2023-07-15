import { Schema } from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcrypt'
import { IUser, UserModel } from '@pixels/typings'

const userSchema = new Schema<IUser, UserModel>({
  email: {
    type: String,
    required: [true, 'Please enter an email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    minlength: [6, 'Minimum password length is 6 characters']
  }
})

// fire a function before doc saved to db
userSchema.pre('save', async function (next) {
  const salt = await bcrypt.genSalt()
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// static method to login user
userSchema.static('login', async function (email, password) {
  const user = await this.findOne({ email })
  if (user) {
    const auth = await bcrypt.compare(password, user.password)
    if (auth) {
      return user
    }
    throw new Error('incorrect password')
  }
  throw new Error('incorrect email')
})

export default userSchema
