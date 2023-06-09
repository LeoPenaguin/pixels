import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useColorStore = defineStore('color', () => {
  const colors = ref()
  const selectedColor = ref()

  return { colors, selectedColor }
})
