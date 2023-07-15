<template>
  <div class="home">
    <PageContent>
      <h1>Lorem ipsum dolor</h1>
      <button @click="ping">Click !</button>
      <p>
        Mollitia beatae nulla doloremque aut delectus ducimus praesentium officia numquam quis
        libero, tempora at dicta deserunt sapiente culpa exercitationem adipisci! Expedita, ab.
        Dolore voluptatem quae cum voluptatum perferendis? Corrupti placeat minima odio dolorum vel
        labore amet. Deserunt perspiciatis eius temporibus quod deleniti in doloribus rerum,
        repellat, repudiandae laudantium sint iusto quaerat saepe? Facilis esse magni, illum ab
        distinctio, repellat sapiente quas necessitatibus, velit ut deserunt molestias non enim quis
        assumenda alias neque quia maxime! Consequuntur natus eligendi et, voluptate suscipit sunt
        qui. Alias placeat itaque animi quam facilis.
      </p>
      <PresentationPanel>
        <template #content>
          <div v-if="boards">
            <RouterLink
              v-for="board in boards"
              :key="board._id"
              :to="{ name: 'pixel-board', params: { id: board._id } }"
            >
              {{ board.name }} - {{ board.width }}x{{ board.height }}<br />
            </RouterLink>
          </div>
          Laborum iste ad corrupti, ut sequi eum hic? Perferendis, minus! Ducimus at cupiditate sit
          earum totam temporibus in? Et quod molestias, aliquam earum soluta maxime culpa fugit
          vitae quasi doloribus. Autem beatae optio, cumque, deserunt earum sint ut quasi fugit cum
          explicabo aperiam quae, dignissimos ratione error minima. Sequi similique tempore ea eum,
          qui sint. Fugiat cupiditate itaque ea magni quaerat officia, a rem et? Reprehenderit autem
          quis incidunt facere atque? Voluptas accusamus est atque, quo architecto ut! Ea recusandae
          illo repellendus.
        </template>
      </PresentationPanel>
    </PageContent>
  </div>
</template>

<script lang="ts" setup>
import { getBoards } from '@/api/board'
import { getColors } from '@/api/color'
import PresentationPanel from '@/components/homePage/PresentationPanel.vue'
import PageContent from '@/components/templates/PageContent.vue'
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useColorStore } from '@/stores/color'
import { storeToRefs } from 'pinia'
import { BASE_URL } from '../api/config'

const colorStore = useColorStore()
const { colors } = storeToRefs(colorStore)
const boards = ref()

async function ping() {
  console.log('ping')
  const rawResponse = await fetch(BASE_URL + '/ping')
  console.log(rawResponse)
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
