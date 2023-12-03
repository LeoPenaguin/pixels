<template>
  <div class="nav-and-content">
    <div class="nav-and-content__nav">
      <slot name="nav"> Empty header </slot>
    </div>
    <div class="nav-and-content__content">
      <slot name="content"> Empty content </slot>
    </div>
  </div>
</template>

<style lang="scss" scropped>
@import '@/assets/style/theme.scss';

.nav-and-content {
  height: 100vh;
  display: flex;
  flex-direction: column;
  &__nav {
    background: rgb(7, 229, 129);
    padding: $m1;
    z-index: 1000;
    margin: 5px;
    border-radius: 5px;
  }
  &__content {
    display: contents;
    flex: 1;
    overflow: auto;
  }
}
</style>
