<template>
  <div v-if="board" class="board-sidebar">
    <h1>{{ board.name }}</h1>
    <p>
      {{ board.description }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { useBoardStore } from '@/stores/board'
import { storeToRefs } from 'pinia'

const boardStore = useBoardStore()

const { board } = storeToRefs(boardStore)
</script>

<style lang="scss" scoped>
.board-sidebar {
  height: 100%;
  background: #22c1c3;
  background: linear-gradient(322deg, rgba(34, 193, 195, 1) 0%, rgba(253, 187, 45, 1) 100%);
  padding: var(--space0);
  border-radius: var(--border-radius-1);
  box-sizing: border-box;
}
</style>
