import { Router } from 'express'
import { ping_get } from '../controllers/pingController'

const pingRouter = Router()

pingRouter.get('/api/ping', ping_get)

export default pingRouter
