<script lang="ts" setup>
import BoardContent from '@/components/PixelBoard/BoardContent.vue';
import PixelMap from '@/components/PixelBoard/PixelMap.vue';
import BottomBar from '@/components/PixelBoard/BottomBar.vue';
</script>

<template>
  <BoardContent>
    <PixelMap />
  </BoardContent>
  <BottomBar />
</template>
