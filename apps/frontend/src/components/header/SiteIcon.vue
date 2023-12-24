<template>
  <div class="siteicon">
    <img :src="grumpyLogo" alt="The grumpy logo" />
  </div>
</template>

<script setup lang="ts">
import grumpyLogo from '@/assets/grumpy.png'
</script>

<style scoped>
.siteicon {
  display: block;
  img {
    width: auto;
    height: 40px;
  }
}
</style>
