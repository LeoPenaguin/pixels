import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import { postPixel } from '@/api/pixel'
import type { IColor } from '@pixels/typings'

export const usePixelStore = defineStore('pixel', () => {
  const selectedPixel = <Ref<{ col: number; row: number; color: IColor } | null>>ref()

  return { selectedPixel, postPixel }
})
