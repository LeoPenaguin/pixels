import jsonwebtoken from 'jsonwebtoken'
import type { Request, Response } from 'express'

const requireAuth = (request: Request, response: Response, next: any) => {
  const token = request.cookies.jwt

  // check json web token exists & is verified
  if (token) {
    jsonwebtoken.verify(token, 'leopng', (error: any, decodedToken: any) => {
      if (error) {
        console.log(error.message)
        response.redirect('/login')
      } else {
        console.log(decodedToken)
        next()
      }
    })
  } else {
    response.redirect('/login')
  }
}

export { requireAuth }
