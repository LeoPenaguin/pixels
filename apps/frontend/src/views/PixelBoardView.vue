<script lang="ts" setup>
import BoardContent from '@/components/PixelBoard/BoardContent.vue';
import PixelMap from '@/components/PixelBoard/PixelMap.vue';
import BottomBar from '@/components/PixelBoard/BottomBar.vue';
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useBoardStore } from '@/stores/board';
import { storeToRefs } from 'pinia';
import { getBoard } from '@/api/board';

const route  = useRoute()
const boardStore = useBoardStore()

const {board} = storeToRefs(boardStore)

onMounted(async () => {
    console.log(route.params.id)
    board.value = await getBoard(route.params.id as string)
})
</script>

<template>
  <BoardContent>
    <PixelMap />
  </BoardContent>
  <BottomBar />
</template>
