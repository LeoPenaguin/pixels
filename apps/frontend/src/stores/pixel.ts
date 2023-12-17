import { ref, type Ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const usePixelStore = defineStore('pixel', () => {
  const selectedPixel = <Ref<{ col: number; row: number } | null>>ref()

  const uiSelectedPixelPosition = computed(() => {
    if (!selectedPixel.value) return
    return {
      col: selectedPixel.value.col + 1,
      row: selectedPixel.value.row + 1
    }
  })

  return { selectedPixel, uiSelectedPixelPosition }
})
