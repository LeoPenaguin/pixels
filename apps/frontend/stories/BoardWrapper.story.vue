<template>
  <Story>
    <BoardWrapper
      v-model:translate-x="translateX"
      v-model:translate-y="translateY"
      :max-scale="11"
      :min-scale="0.4"
      background-color="rgb(75 75 75)"
    >
      <template #content> Hello </template>
      <template #interface="{ scalePercentage }">{{ `${scalePercentage}%` }} </template>
    </BoardWrapper>
  </Story>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import BoardWrapper from '@/components/ds/BoardWrapper.vue'

const translateX = ref(1)
const translateY = ref(1)
</script>
