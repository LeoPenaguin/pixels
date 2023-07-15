<template>
  <div class="home">
    <PageContent>
      <h1>Lorem ipsum dolor</h1>
      <button @click="pingBackend">[test] Ping the backend</button>
      <hr />
      <RouterLink
        v-for="board in boards"
        :key="board._id"
        :to="{ name: 'pixel-board', params: { id: board._id } }"
      >
        {{ board.name }} - {{ board.width }}x{{ board.height }}<br />
      </RouterLink>
    </PageContent>
  </div>
</template>

<script lang="ts" setup>
import { getBoards } from '@/api/board'
import { getColors } from '@/api/color'
import PageContent from '@/components/templates/PageContent.vue'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useColorStore } from '@/stores/color'
import { storeToRefs } from 'pinia'
import { ping } from '@/api/ping'

const colorStore = useColorStore()
const { colors } = storeToRefs(colorStore)
const boards = ref()

async function pingBackend() {
  await ping()
}

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
  getColors().then((response) => {
    colors.value = response
  })
})
</script>
