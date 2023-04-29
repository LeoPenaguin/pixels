<template>
  <button :class="{ 'is-active': active }"
@click="$emit('click')">
    <IconComponent v-if="icon" />
    <span>{{ text }}</span>
  </button>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue'

const props = defineProps<{
  active?: Boolean
  text: String
  icon?: 'eye' | 'home' | 'logout' | 'settings' | 'user'
}>()

const IconComponent = defineAsyncComponent(() => import(`../icons/${props.icon}Icon.vue`))

defineEmits(['click'])
</script>

<style lang="scss" scoped>
@import '@/assets/style/theme.scss';

button {
  padding: 0 $m2;
  color: $text-color;
  background: rgba($background-color, 0.7);
  box-shadow: 0px 0px $m1 0px rgba($text-color, 0.4);
  outline: 0;
  border-radius: $m2;
  border: 0;
  display: flex;
  align-items: center;
  gap: $m2;
  height: 100%;
  cursor: pointer;
  &.is-active {
    color: $active-text-color;
  }
}
</style>
