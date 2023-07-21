import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export const useCursorStore = defineStore('cursor', () => {
  const cursorPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 })

  const uiCursorPosition = computed(() => {
    if (!cursorPosition.value) return
    return {
      x: cursorPosition.value.x + 1,
      y: cursorPosition.value.y + 1
    }
  })

  return { cursorPosition, uiCursorPosition }
})
