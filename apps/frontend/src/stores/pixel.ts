import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import type { IBoard, IColor, IPixel } from '@pixels/typings'
import { BASE_URL } from '../api/config'

export const usePixelStore = defineStore('pixel', () => {
  const selectedPixel = <Ref<{ col: number; row: number; color: IColor } | null>>ref()

  async function postPixel(color: IColor, board: IBoard, col: number, row: number) {
    const payload = {
      colorId: color._id,
      col,
      row,
      boardId: board._id
    }

    const rawResponse = await fetch(BASE_URL + '/pixel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    return await rawResponse.json()
  }

  return { selectedPixel, postPixel }
})
