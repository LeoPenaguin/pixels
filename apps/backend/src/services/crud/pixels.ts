import { Board, Color, Pixel } from '../../models'

export async function savePixelToDB(x: number, y: number, colorId: string) {
  const defaultBoardID = process.env.DEFAULT_BOARD_ID

  const dbBoard = await Board.findById(defaultBoardID)

  if (!dbBoard) {
    console.log('Board not found')
    return
  }

  const colorExists = await Color.exists({ _id: colorId })

  if (!colorExists) {
    console.log('Color not found')
    return
  }

  const newPixel = new Pixel({ col: x, row: y, color: colorId })
  await newPixel.save()

  dbBoard.pixels.push(newPixel._id)
  await dbBoard.save()

  return
}
