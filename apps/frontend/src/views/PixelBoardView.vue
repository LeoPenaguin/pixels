<script lang="ts" setup>
import BoardContent from '@/components/PixelBoard/BoardContent.vue';
import PixelMap from '@/components/PixelBoard/PixelMap.vue';
import BottomBar from '@/components/PixelBoard/BottomBar.vue';
import { useRoute } from 'vue-router';
import { useBoardStore } from '@/stores/board';
import { storeToRefs } from 'pinia';
import { getBoard } from '@/api/board';
import { onUnmounted } from 'vue';

const route  = useRoute()
const boardStore = useBoardStore()

const { board } = storeToRefs(boardStore)

getBoard(route.params.id as string).then((result) => {
    board.value = result
}).catch(()=>{
    console.log('lol')
})

onUnmounted(() => {
    board.value = null
})
</script>

<template>
  <BoardContent>
    <PixelMap v-if="board" />
  </BoardContent>
  <BottomBar />
</template>
