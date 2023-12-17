<template>
  <div class="breadcrumb">
    <RouterLink :to="{ name: RouteNames.HOME }">Home</RouterLink>
  </div>
</template>

<script lang="ts" setup>
import { RouterLink } from 'vue-router'
import { RouteNames } from '@/router/types/routes'
</script>
