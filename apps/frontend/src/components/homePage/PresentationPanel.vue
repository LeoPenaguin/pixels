<template>
  <div class="presentation-panel">
    <slot name="content">
      Empty
    </slot>
    <slot name="action" />
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/style/theme.scss';

.presentation-panel {
  background: $secondary-background-color;
  padding: $m5;
  display: block;
  border-radius: $m3;
}
</style>
