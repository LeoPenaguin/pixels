import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import type { IBoard } from '@pixels/typings'

export const useBoardStore = defineStore('board', () => {
  const board = <Ref<IBoard>>ref()

  return { board }
})
