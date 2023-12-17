<template>
  <div class="board-content">
    <PixelMap v-if="board" />
    <div class="board-content__bottom">
      <PixelMapBar v-if="board" />
    </div>
  </div>
</template>

<script setup lang="ts">
import PixelMap from '@/components/boardPage/PixelMap.vue'
import PixelMapBar from '@/components/boardPage/PixelMapBar.vue'
import { useBoardStore } from '@/stores/board'
import { storeToRefs } from 'pinia'
import { onMounted } from 'vue'
import { useColorStore } from '@/stores/color'
import { getColors } from '@/api/color'
import { getBoard } from '@/api/board'
import { useRoute } from 'vue-router'

const colorStore = useColorStore()
const boardStore = useBoardStore()
const route = useRoute()

const { colors } = storeToRefs(colorStore)
const { board } = storeToRefs(boardStore)

onMounted(async () => {
  colors.value = await getColors()
  board.value = await getBoard(route.params.id as string)
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
}

.board-content__bottom {
  position: absolute;
  bottom: var(--space1);
  width: 100%;
  display: flex;
  justify-content: center;
}
</style>
