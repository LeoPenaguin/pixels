import express, {Request, Response} from 'express'
import { Pixel } from '../models/pixel';

var pixelsRouter = express.Router();

pixelsRouter.get('/api/pixels', async (req:Request, res:Response) => {
    const {name, position, boardId} = req.body

    const pixel = await Pixel.find({_board: boardId})
    res.json(pixel)
})

pixelsRouter.post('/api/pixel', async (req:Request, res:Response) => {
    const {name, position, boardId} = req.body

    const pixel = new Pixel({name, position, _board: boardId})
    await pixel.save()

    res.status(201).json(pixel)
})

export default pixelsRouter;