import { User } from '../models'
import jsonwebtoken from 'jsonwebtoken'
import { Request, Response } from 'express'

const maxAge = 3 * 24 * 60 * 60

function createToken(id: any) {
  return jsonwebtoken.sign({ id }, 'leopng', {
    expiresIn: maxAge
  })
}

function handleErrors(err: any) {
  console.log(err)
  const errors = { email: '', password: '' }

  // incorrect email
  if (err.message === 'incorrect email') {
    errors.email = 'That email is not registered'
  }

  // incorrect password
  if (err.message === 'incorrect password') {
    errors.password = 'That password is incorrect'
  }

  // duplicate email error
  if (err.code === 11000) {
    errors.email = 'that email is already registered'
    return errors
  }

  // validation errors
  if (err.message.includes('user validation failed')) {
    // @ts-ignore
    Object.values(err.errors).forEach(({ properties }) => {
      // @ts-ignore
      errors[properties.path] = properties.message
    })
  }

  return errors
}

export async function signup_post(request: Request, response: Response) {
  const { email, password } = request.body

  try {
    const user = await User.create({ email, password })
    const token = createToken(user._id)
    response.status(201).json({ user: user._id, token })
  } catch (error: any) {
    const errors = handleErrors(error)
    response.status(400).json({ errors })
  }
}

export async function login_post(request: Request, response: Response) {
  const { email, password } = request.body

  try {
    const user = await User.login(email, password)
    const token = createToken(user._id)
    response.status(200).json({ user: user._id, token })
  } catch (error: any) {
    const errors = handleErrors(error)
    response.status(400).json({ errors })
  }
}

export async function checkuser_get(request: Request, response: Response) {
  try {
    const token = request.query.token as string
    if (token) {
      jsonwebtoken.verify(token, 'leopng', async (error: any, decodedToken: any) => {
        if (error) {
          response.json(null)
        } else {
          const user = await User.findById(decodedToken.id)
          response.json(user)
        }
      })
    } else {
      response.json(null)
    }
  } catch {
    response.json(null)
  }
}
