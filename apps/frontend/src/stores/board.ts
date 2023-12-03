import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import type { IBoard, IPixel } from '@pixels/typings'

export const useBoardStore = defineStore('board', () => {
  const board = <Ref<IBoard>>ref()

  const replaceBoardPixel = (pixel: IPixel) => {
    const toBeReplacedIndex = board.value.pixels.lastIndexOf(
      (p: IPixel) => p.col === pixel.col && p.row === pixel.row
    )

    board.value.pixels.splice(toBeReplacedIndex, 1, pixel)
  }

  return { board, replaceBoardPixel }
})
