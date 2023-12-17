import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import type { IColor } from '@pixels/typings'

export const useColorStore = defineStore('color', () => {
  const colors = <Ref<IColor[]>>ref()
  const selectedColor = <Ref<IColor>>ref()

  function getColorById(id: string) {
    return colors.value.find((color) => color._id === id)
  }

  return { colors, selectedColor, getColorById }
})
