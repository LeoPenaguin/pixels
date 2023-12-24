<template>
  <div v-if="board" class="sidebar">
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
.sidebar {
  height: 100%;
  background: #46a059;
  color: white;
  padding: 30px;
  border-radius: 10px;
  box-sizing: border-box;
  h1 {
    font-size: 30px;
    margin: 0;
  }
  p {
    font-size: 15px;
  }
}
</style>
