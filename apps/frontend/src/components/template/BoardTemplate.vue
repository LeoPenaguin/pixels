<template>
  <div class="board-content">
    <BoardCanvas />
    <BoardOverlay />
  </div>
</template>

<script setup lang="ts">
import BoardCanvas from '@/components/board/BoardCanvas.vue'
import BoardOverlay from '@/components/board/BoardOverlay.vue'
</script>

<style lang="scss" scoped>
.board-content {
  height: 100%;
  background-color: #3c3c3c;
  border-radius: var(--border-radius-1);
  overflow: scroll;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
</style>
