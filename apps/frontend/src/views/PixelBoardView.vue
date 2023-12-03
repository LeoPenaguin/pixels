<template>
  <BoardWrapper v-if="board" v-model:translate-x="translateX" v-model:translate-y="translateY">
    <template #content>
      <PixelMap />
    </template>
    <template #interface>
      <BottomBar v-if="board" />
    </template>
  </BoardWrapper>
</template>

<script lang="ts" setup>
import BoardWrapper from '@/components/ds/BoardWrapper.vue'
import PixelMap from '@/components/pixelBoard/PixelMap.vue'
import BottomBar from '@/components/ds/BoardBar.vue'
import { useBoardStore } from '@/stores/board'
import { storeToRefs } from 'pinia'
import { onMounted, ref } from 'vue'
import { useColorStore } from '@/stores/color'
import { getColors } from '@/api/color'
import { getBoard } from '@/api/board'
import { useRoute } from 'vue-router'

const colorStore = useColorStore()
const boardStore = useBoardStore()
const route = useRoute()

const { colors } = storeToRefs(colorStore)
const { board } = storeToRefs(boardStore)

const translateX = ref(1)
const translateY = ref(1)

onMounted(async () => {
  colors.value = await getColors()
  board.value = await getBoard(route.params.id as string)
})
</script>
