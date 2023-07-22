import jsonwebtoken from 'jsonwebtoken'
import type { Request, Response } from 'express'

const requireAuth = (request: Request, response: Response, next: any) => {
  const token = request.headers.authorization?.split(' ')[1]

  console.log(token)

  if (token) {
    jsonwebtoken.verify(token, 'leopng', (error: any) => {
      if (error) {
        response.status(401).json({ message: 'Unauthorized' })
      } else {
        next()
      }
    })
  } else {
    response.status(401).json({ message: 'Unauthorized' })
  }
}

export { requireAuth }
