<script lang="ts" setup>
import { getBoards } from '@/api/board';
import PresentationPanel from '@/components/homePage/PresentationPanel.vue';
import PageContent from '@/components/templates/PageContent.vue';
import { onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router'

const boards = ref()

onMounted(() => {
    getBoards().then((response) => {
        boards.value = response
    })
})
</script>

<template>
  <div class="home">
    <PageContent>
      <h1>Lorem ipsum dolor</h1>
      <p>
        Mollitia beatae nulla doloremque aut delectus ducimus praesentium officia numquam quis libero, tempora at dicta deserunt sapiente culpa exercitationem adipisci! Expedita, ab.
        Dolore voluptatem quae cum voluptatum perferendis? Corrupti placeat minima odio dolorum vel labore amet. Deserunt perspiciatis eius temporibus quod deleniti in doloribus rerum, repellat, repudiandae laudantium sint iusto quaerat saepe?
        Facilis esse magni, illum ab distinctio, repellat sapiente quas necessitatibus, velit ut deserunt molestias non enim quis assumenda alias neque quia maxime! Consequuntur natus eligendi et, voluptate suscipit sunt qui.
        Alias placeat itaque animi quam facilis.
      </p>
      {{ boards }}
      <div v-if="boards">
        <RouterLink
          v-for="board in boards"
          :key="board._id"
          :to="{ name: 'pixel-board', params: { id: board._id } }"
        >
          {{ board.name }} - {{ board.width }}x{{ board.height }}<br>
        </RouterLink>
      </div>
      <PresentationPanel>
        <template #content>
          Praesentium, ea commodi. Magnam, reiciendis natus, odit esse dolorum dignissimos debitis cumque sed beatae excepturi laboriosam? Architecto nulla ducimus sunt, dolorem voluptatibus unde facere.
          Nisi sed labore suscipit nihil recusandae necessitatibus explicabo, earum esse aut asperiores deleniti. Blanditiis, molestias. Tenetur, dolores. Accusantium fuga velit expedita odit praesentium veniam dolorum, quos est molestias. Distinctio, laboriosam.
          Officiis magnam, iure obcaecati adipisci quos exercitationem reprehenderit ut, est, dolore architecto molestiae! Error ratione rem, qui nisi vero ducimus a sit delectus quidem voluptatem illo! Fuga atque ipsum molestias?
          Fugiat maxime cumque tenetur accusamus nam, odio ea laudantium, quisquam deleniti inventore corrupti eligendi ipsam animi aliquam ut earum perspiciatis modi officiis? Deleniti pariatur et eveniet aperiam ullam mollitia culpa!
          Eaque odit nam saepe cum mollitia beatae quisquam eligendi facilis facere laboriosam praesentium error expedita recusandae non, quae eos nostrum neque fugit nisi provident! Vero veritatis eveniet quaerat quisquam cumque.
          Quae aut deserunt hic expedita quam est. Necessitatibus, at esse. Quisquam deserunt ex eligendi consequuntur, esse nobis illum ad soluta harum, accusantium tempora asperiores vero dicta eaque quo. Voluptatem, enim!
          Reprehenderit asperiores nulla aperiam eaque, soluta laudantium quibusdam qui vitae possimus delectus explicabo facere aliquid, amet nisi rem deserunt, rerum laboriosam. Vel voluptatibus in debitis nam esse, modi quisquam cupiditate.
          Ex quisquam at libero, ea consectetur nesciunt doloribus, qui neque, in odio perspiciatis possimus repellat debitis aliquam quia beatae voluptate nostrum! Repellendus odio expedita adipisci quis ea. Quos, quia vitae.
          Quo ipsa, numquam voluptatum deserunt assumenda sunt adipisci vero ea illum aliquam. Laborum iste ad corrupti, ut sequi eum hic? Perferendis, minus! Ducimus at cupiditate sit earum totam temporibus in?
          Et quod molestias, aliquam earum soluta maxime culpa fugit vitae quasi doloribus. Autem beatae optio, cumque, deserunt earum sint ut quasi fugit cum explicabo aperiam quae, dignissimos ratione error minima.
          Sequi similique tempore ea eum, qui sint. Fugiat cupiditate itaque ea magni quaerat officia, a rem et? Reprehenderit autem quis incidunt facere atque? Voluptas accusamus est atque, quo architecto ut!
          Ea recusandae illo repellendus.
        </template>
      </PresentationPanel>
      <h2>sit amet consectetur adipisicing elit</h2>
      <p>
        Architecto voluptate atque autem dicta ratione laudantium quis, consequatur sequi non provident commodi at tenetur quaerat? Perspiciatis, distinctio omnis!
        Esse, animi quasi. Ipsam, culpa cumque quibusdam accusamus velit incidunt ipsa sunt provident expedita placeat quisquam magni perspiciatis rem eligendi sapiente, tempora est. Officia beatae non eligendi et, inventore nostrum?
        Consequuntur expedita aut libero accusantium veniam adipisci quas sed hic earum. Inventore corporis, sit provident laborum deleniti minima itaque impedit ab esse qui numquam explicabo hic dolorum, a placeat? Soluta?
        Corrupti fuga mollitia eos a tempora animi veritatis expedita error molestias quisquam suscipit cupiditate consectetur at reiciendis, consequatur neque quibusdam temporibus eveniet accusantium. Mollitia, eos rem. Provident perferendis quos quasi.
        Eum laborum error eaque blanditiis illum consequuntur mollitia necessitatibus perspiciatis possimus quas quos numquam nemo eveniet repellendus repellat, consectetur quisquam voluptas facilis vitae recusandae quam? Beatae consequatur aspernatur quod modi?
        Sint est nulla ducimus voluptatem aliquam porro doloribus. Alias autem est facere illo eaque ipsa. Eos, accusamus nesciunt sed laborum quod corporis sunt dolorum unde nam molestiae soluta ab culpa.
        Totam eligendi doloribus minima tenetur officiis amet omnis id ipsum obcaecati nisi voluptas libero maxime unde fugit magni molestiae distinctio mollitia numquam corrupti aut, praesentium, sunt quibusdam odio! Asperiores, praesentium!
        Saepe, cum culpa dolorum vitae aliquid voluptatum aut a non et voluptates est porro necessitatibus at consequatur autem recusandae rem itaque exercitationem eligendi dolore consequuntur. Dolor ab pariatur unde in!
        Unde maiores culpa rem quibusdam voluptatem repudiandae in vitae enim, molestiae corrupti consectetur vel amet numquam quod porro labore blanditiis. Voluptatum repellat excepturi sapiente cupiditate amet laudantium, vel labore ipsam.
        Reprehenderit maiores similique animi labore voluptate cum rerum velit ducimus eius quod quidem explicabo asperiores corrupti officiis odio quis accusamus dolores est eveniet inventore cupiditate voluptas, ipsam laboriosam nobis. At.
        Vitae tempore in ullam obcaecati cumque laudantium, accusantium, corporis, deleniti ratione tempora aperiam. Dolores, atque veniam rerum laudantium, iusto aspernatur culpa facilis eaque ex nostrum ipsa error dolore veritatis quidem.
        Aperiam perferendis, dignissimos fugit voluptatem nisi totam, voluptate et voluptatibus, distinctio ut adipisci deleniti odit officia. Impedit esse consequatur commodi recusandae enim natus eveniet ipsam dolor iste, placeat, odio incidunt.
        Porro suscipit omnis quia deleniti expedita vero et error labore ipsa aliquid nemo libero impedit atque ipsam nostrum deserunt cumque, eligendi id saepe. Illo cupiditate fugit, quis at aut sit?
        Numquam qui natus necessitatibus dolore atque, totam deleniti odio. Corrupti doloribus natus, necessitatibus neque aut ipsum, minima assumenda expedita quas autem magni facere officiis eaque quisquam eum dolor alias dolorum.
        Quas consequuntur magnam rerum consectetur tempore officiis autem ipsum distinctio, id omnis optio fugit dolore. Hic dolorum sit nulla nostrum molestias, illo aliquid et neque recusandae nobis dolore nam perferendis.
        Molestias voluptatibus fugit voluptatem suscipit modi quae sapiente asperiores officiis ipsam, eum illum culpa quaerat voluptates numquam labore non illo, hic amet maxime quasi dignissimos magnam deleniti. Natus, iste ducimus.
      </p>
    </PageContent>
  </div>
</template>
