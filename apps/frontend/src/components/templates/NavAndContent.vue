<template>
  <div class="nav-and-content">
    <div class="nav-and-content__nav">
      <slot name="nav">
        Empty header
      </slot>
    </div>
    <div class="nav-and-content__content">
      <slot name="content">
        Empty content
      </slot>
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
    // background-color: $secondary-background-color;
    box-shadow: 0px 0px $m1 0px rgba(0, 0, 0, 0.5);
    background: linear-gradient(140deg, rgba(255,115,0,0.5) 0%, rgba(0,255,145,0.8) 50%, rgba(0,0,255,0.4) 100%);
    padding: $m2;
    z-index: 1000;
  }
  &__content {
    flex: 1;
    overflow: auto;
  }
}
</style>
