<template>
  <div class="home">
    <PageContent>
      <h1>Lorem ipsum dolor</h1>
      <div class="home__board-list">
        <div v-for="board in boards" :key="board._id">
          <OrganismCard
            :title="board.name"
            :link="{ name: RouteNames.PIXEL_BOARD, params: { id: board._id } }"
            :link-text="'Go to board'"
          >
            <template #details> {{ board.width }}x{{ board.height }} </template>
          </OrganismCard>
        </div>
      </div>
    </PageContent>
  </div>
</template>

<script lang="ts" setup>
import { getBoards } from '@/api/board'
import PageContent from '@/components/templates/PageContent.vue'
import { onMounted, ref } from 'vue'
import { RouteNames } from '@/router/types/routes'
import OrganismCard from '@/components/ds/OrganismCard.vue'

const boards = ref()

function initWebSocket() {
  const connection = new WebSocket('ws://localhost:3007')

  connection.onmessage = function (event: MessageEvent) {
    console.log('on message', event.data)
  }

  connection.onopen = () => {
    console.log('Successfully connected to the echo websocket server...')
    connection.send('Hello Server!')
  }
}

onMounted(() => {
  initWebSocket()
  getBoards().then((response) => {
    boards.value = response
  })
})
</script>

<style lang="scss" scoped></style>
