<template>
  <BoardContent v-if="board">
    <PixelMap />
  </BoardContent>
  <BottomBar v-if="board" />
</template>

<script lang="ts" setup>
import BoardContent from '@/components/pixelBoard/BoardContent.vue'
import PixelMap from '@/components/pixelBoard/PixelMap.vue'
import BottomBar from '@/components/pixelBoard/BottomBar.vue'
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
