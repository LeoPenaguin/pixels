<template>
  <div v-if="board" class="nav-current-board">
    <span>{{ board.name }}</span>
  </div>
</template>

<script setup lang="ts">
import { useBoardStore } from '@/stores/board'
import { storeToRefs } from 'pinia'

const boardStore = useBoardStore()

const { board } = storeToRefs(boardStore)
</script>

<style lang="scss" scoped>
@import '@/assets/style/theme.scss';

.nav-current-board {
  box-sizing: border-box;
  padding: 0 $m4;
  color: $text-color;
  background: white;
  border-radius: $m2;
  display: flex;
  align-items: center;
  height: 100%;
}
</style>
