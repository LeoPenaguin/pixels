import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const usePixelStore = defineStore('pixel', () => {
  const selectedPixel = ref<{ x: number; y: number } | null>()

  const uiSelectedPixelPosition = computed(() => {
    if (!selectedPixel.value) return
    return {
      x: selectedPixel.value.x + 1,
      y: selectedPixel.value.y + 1
    }
  })

  return { selectedPixel, uiSelectedPixelPosition }
})
