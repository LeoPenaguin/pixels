<template>
  <NavButton v-if="board" :text="board.name" icon="settings" @click="goToBoard" />
</template>

<script setup lang="ts">
import { useBoardStore } from '@/stores/board'
import { storeToRefs } from 'pinia'
import NavButton from './NavButton.vue'
import { useRouter } from 'vue-router'

const boardStore = useBoardStore()
const router = useRouter()

const { board } = storeToRefs(boardStore)

function goToBoard() {
  router.push({ name: 'pixel-board', params: { id: board.value._id } })
}
</script>

<style lang="scss" scoped>
@import '@/assets/style/theme.scss';

.nav-current-board {
  box-sizing: border-box;
  padding: 0 $m4;
  color: $text-color;
  box-shadow: 0px 0px $m1 0px rgba(0, 0, 0, 0.5);
  background: rgba($background-color, 0.7);
  outline: 0;
  border-radius: $m2;
  display: flex;
  align-items: center;
  gap: $m2;
  cursor: pointer;
  height: 100%;
}
</style>
