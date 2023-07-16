import jsonwebtoken from 'jsonwebtoken'
import type { Request, Response } from 'express'

const requireAuth = (request: Request, response: Response, next: any) => {
  const token = request.body.token

  if (token) {
    jsonwebtoken.verify(token, 'leopng', (error: any, decodedToken: any) => {
      if (error) {
        console.log(error.message)
      } else {
        console.log(decodedToken)
        next()
      }
    })
  }
}

export { requireAuth }
