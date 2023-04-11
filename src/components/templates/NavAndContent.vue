<template>
  <div class="nav-and-content">
    <div class="nav-and-content__nav">
      <slot name="nav">Empty header</slot>
    </div>
    <div class="nav-and-content__content">
      <slot name="content">Empty content</slot>
    </div>
  </div>
</template>

<style lang="scss" scropped>
.nav-and-content {
  height: 100vh;
  background: pink;
  display: flex;
  flex-direction: column;
  &__nav {
    background-color: rgb(27, 27, 27);
    padding: 1rem;
  }
  &__content {
    background-color: rgb(39, 39, 39);
    flex: 1;
    overflow: auto;
  }
}
</style>
