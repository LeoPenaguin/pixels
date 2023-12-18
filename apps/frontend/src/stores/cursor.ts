import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useCursorStore = defineStore('cursor', () => {
  const cursorPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 })

  return { cursorPosition }
})
