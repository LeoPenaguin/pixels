import { Board } from '../../models'

export async function savePixelToDB(x: number, y: number, color: string) {
  const defaultBoardID = process.env.DEFAULT_BOARD_ID

  const dbBoard = await Board.findById(defaultBoardID)

  if (!dbBoard) {
    console.log('Board not found')
    return
  }

  const pixelIndex = dbBoard.pixels.findIndex(
    (pixel: { x: number; y: number; color: string }) => pixel.x === x && pixel.y === y
  )

  if (pixelIndex !== -1) {
    dbBoard.pixels[pixelIndex].color = color
  } else {
    dbBoard.pixels.push({ x, y, color })
  }

  await dbBoard.save()

  return
}
