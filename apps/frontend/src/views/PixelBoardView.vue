<template>
  <BoardContent>
    <PixelMap :board="board" />
  </BoardContent>
  <BottomBar />
</template>

<script lang="ts" setup>
import BoardContent from '@/components/pixelBoard/BoardContent.vue'
import PixelMap from '@/components/pixelBoard/PixelMap.vue'
import BottomBar from '@/components/pixelBoard/BottomBar.vue'
import { useBoardStore } from '@/stores/board'
import { storeToRefs } from 'pinia'

const boardStore = useBoardStore()
const { board } = storeToRefs(boardStore)
</script>
