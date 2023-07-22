import { Router } from 'express'
import { ping_get } from '../controllers/pingController'
import { requireAuth } from './middleware/user'

const pingRouter = Router()

pingRouter.get('/api/ping', requireAuth, ping_get)

export default pingRouter
