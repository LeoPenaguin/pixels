import { Router } from 'express'
import * as boardController from '../controllers/boardController'
import { requireAuth } from './middleware/user'

const boardsRouter = Router()

boardsRouter.get('/api/boards', boardController.board_get)
boardsRouter.get('/api/board/:id', requireAuth, boardController.oneBoard_get)
boardsRouter.post('/api/board', requireAuth, boardController.board_post)

export default boardsRouter
