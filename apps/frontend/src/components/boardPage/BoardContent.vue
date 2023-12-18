<template>
  <div class="board-content">
    <PixelMap v-if="board" />
    <PixelMapBar v-if="board" class="board-content__bottom" />
  </div>
</template>

<script setup lang="ts">
import PixelMap from '@/components/boardPage/PixelMap.vue'
import PixelMapBar from '@/components/boardPage/PixelMapBar.vue'
import { useBoardStore } from '@/stores/board'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { getDefaultBoard } from '@/api/board'

const boardStore = useBoardStore()

const { board } = storeToRefs(boardStore)

onMounted(async () => {
  board.value = await getDefaultBoard()
})
</script>

<style lang="scss" scoped>
.board-content {
  height: 100%;
  background-color: var(--board-background-color);
  border-radius: var(--border-radius-1);
  overflow: scroll;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.board-content__bottom {
  position: absolute;
  bottom: var(--space1);
  left: 0;
  right: 0;
  padding: 0 var(--space1);
  z-index: 1000;
}
</style>
