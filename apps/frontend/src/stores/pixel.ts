import { ref, type Ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { postPixel } from '@/api/pixel'
import type { IColor } from '@pixels/typings'

export const usePixelStore = defineStore('pixel', () => {
  const selectedPixel = <Ref<{ col: number; row: number; color: IColor } | null>>ref()

  const uiSelectedPixelPosition = computed(() => {
    if (!selectedPixel.value) return
    return {
      col: selectedPixel.value.col + 1,
      row: selectedPixel.value.row + 1
    }
  })

  return { selectedPixel, postPixel, uiSelectedPixelPosition }
})
