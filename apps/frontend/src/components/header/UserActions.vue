<template>
  <div class="nav-user">
    <template v-if="!user">
      <AtomButton text="Login" outlined @click="goToLoginPage"></AtomButton>
      <AtomButton text="Sign up" @click="goToSignupPage"></AtomButton>
    </template>
    <template v-else>
      <div class="nav-user__username">{{ user.username }}</div>
      <AtomButton icon="logout" type="warning" outlined @click="logout"></AtomButton>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { useRouter } from 'vue-router'
import { RouteNames } from '@/router/types/routes'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import AtomButton from '@/components/ds/AtomButton.vue'

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
