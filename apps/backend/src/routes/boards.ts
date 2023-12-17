import { Router } from 'express'
import * as boardController from '../controllers/boardController'
import { requireAuth } from './middleware/user'

const boardsRouter = Router()

boardsRouter.get('/api/board/:id', requireAuth, boardController.oneBoard_get)

export default boardsRouter
