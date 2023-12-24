<template>
  <div class="nav-user">
    <template v-if="!user">
      <NavButton text="Login" @click="goToLoginPage"></NavButton>
      <NavButton text="Sign up" @click="goToSignupPage"></NavButton>
    </template>
    <template v-else>
      <div class="nav-user__username">{{ user.username }}</div>
      <NavButton text="Logout" @click="logout"></NavButton>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { RouteNames } from '@/router/types/routes'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import NavButton from '@/components/ds/NavButton.vue'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const router = useRouter()

function goToSignupPage() {
  router.push({ name: RouteNames.AUTH_SIGNUP })
}

function goToLoginPage() {
  router.push({ name: RouteNames.AUTH_LOGIN })
}

function logout() {
  authStore.logout()
}
</script>

<style lang="scss" scoped>
.nav-user {
  display: flex;
  flex-direction: row;
  gap: var(--space0);
  height: 100%;
  justify-content: flex-end;
  box-sizing: border-box;
  &__username {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 var(--space0);
  }
}
</style>
