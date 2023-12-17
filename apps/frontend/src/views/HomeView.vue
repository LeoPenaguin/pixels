<template>
  <div class="home">
    <h1>Lorem ipsum dolor</h1>
    <div class="home__board-list">
      <OrganismCard
        v-if="board"
        :title="board.name"
        :link="{ name: RouteNames.PIXEL_BOARD, params: { id: board._id } }"
        :link-text="'Go to board'"
      >
        <template #details> {{ board.width }}x{{ board.height }} </template>
      </OrganismCard>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getBoard } from '@/api/board'
import { ref } from 'vue'
import { RouteNames } from '@/router/types/routes'
import OrganismCard from '@/components/ds/OrganismCard.vue'
import type { IBoard } from '../../../../packages/typings/src'

const board = ref<IBoard>()

getBoard('6457f22f4c33d368b52d79c1').then((response) => {
  board.value = response
})
</script>
