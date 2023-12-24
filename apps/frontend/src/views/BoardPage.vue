<template>
  <BoardPageLayout>
    <template #content>
      <BoardTemplate v-if="board" />
    </template>
    <template #sidebar>
      <SideBar />
    </template>
  </BoardPageLayout>
</template>

<script lang="ts" setup>
import BoardPageLayout from '@/components/layouts/BoardPageLayout.vue'
import SideBar from '@/components/sidebar/SideBar.vue'
import BoardTemplate from '@/components/template/BoardTemplate.vue'
import { useBoardStore } from '@/stores/board'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { getDefaultBoard } from '@/api/board'

const boardStore = useBoardStore()

const { board } = storeToRefs(boardStore)

console.log('hello')

onMounted(async () => {
  console.log('mounted')
  board.value = await getDefaultBoard()
})
</script>

<style lang="scss" scoped>
.board {
  height: 100%;
  border-radius: var(--border-radius-1);
  overflow: hidden;
}
</style>
