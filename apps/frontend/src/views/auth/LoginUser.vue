<template>
  <form>
    <h2>Login</h2>
    <label for="email">Email</label>
    <input v-model="emailValue" type="text" name="email" />
    <div class="error">{{ emailError }}</div>
    <label for="password">Password</label>
    <input v-model="passwordValue" type="password" name="password" />
    <div class="error">{{ passwordError }}</div>
    <button @click="submit">login</button>
  </form>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { storeToRefs } from 'pinia'
import jscookie from 'js-cookie'
import { login } from '@/api/auth'

const router = useRouter()
const authStore = useAuthStore()

const { user } = storeToRefs(authStore)

const emailValue = ref('')
const passwordValue = ref('')
const emailError = ref('')
const passwordError = ref('')

async function submit(e: MouseEvent) {
  e.preventDefault()

  // reset errors
  emailError.value = ''
  passwordError.value = ''

  try {
    const data = await login(emailValue.value, passwordValue.value)
    if (data.errors) {
      emailError.value = data.errors.email
      passwordError.value = data.errors.password
    }
    if (data.user) {
      user.value = data.user
      jscookie.set('jwt', data.token, {
        expires: 3
      })
      router.push('/')
    }
  } catch (err) {
    console.log(err)
  }
}
</script>
