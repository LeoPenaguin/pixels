<template>
  <BoardPageTemplate>
    <template #content>
      <BoardContent />
    </template>
    <template #sidebar>
      <BoardSidebar />
    </template>
  </BoardPageTemplate>
</template>

<script lang="ts" setup>
import BoardPageTemplate from '@/components/templates/BoardPageTemplate.vue'
import BoardSidebar from '@/components/boardPage/BoardSidebar.vue'
import BoardContent from '@/components/boardPage/BoardContent.vue'
</script>

<style lang="scss" scoped>
.board {
  height: 100%;
  border-radius: var(--border-radius-1);
  overflow: hidden;
}
</style>
