<script lang="ts" setup>
import BoardContent from '@/components/PixelBoard/BoardContent.vue'
import PixelMap from '@/components/PixelBoard/PixelMap.vue'
import BottomBar from '@/components/PixelBoard/BottomBar.vue'
import { useBoardStore } from '@/stores/board'
import { storeToRefs } from 'pinia'
import { onUnmounted } from 'vue'

const boardStore = useBoardStore()
const { board } = storeToRefs(boardStore)

onUnmounted(() => {
  board.value = null
})
</script>

<template>
  <BoardContent>
    <PixelMap v-if="board" :board="board" />
  </BoardContent>
  <BottomBar />
</template>
