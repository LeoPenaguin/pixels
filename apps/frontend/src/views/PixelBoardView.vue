<script lang="ts" setup>
import BoardContent from '@/components/PixelBoard/BoardContent.vue'
import PixelMap from '@/components/PixelBoard/PixelMap.vue'
import BottomBar from '@/components/PixelBoard/BottomBar.vue'
import { useBoardStore } from '@/stores/board'
import { storeToRefs } from 'pinia'

const boardStore = useBoardStore()
const { board } = storeToRefs(boardStore)
</script>

<template>
  <BoardContent>
    <PixelMap :board="board" />
  </BoardContent>
  <BottomBar />
</template>
