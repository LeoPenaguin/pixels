<template>
  <form>
    <h2>Sign up</h2>
    <label for="email">Email</label>
    <input v-model="emailValue" type="text" name="email" />
    <div class="error">{{ emailError }}</div>
    <label for="password">Password</label>
    <input v-model="passwordValue" type="password" name="password" />
    <div class="error">{{ passwordError }}</div>
    <button @click="submit">Sign up</button>
  </form>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { BASE_URL } from '../../api/config'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { storeToRefs } from 'pinia'
import jscookie from 'js-cookie'

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

  const maxAge = 3 * 24 * 60 * 60

  try {
    const res = await fetch(BASE_URL + '/signup', {
      method: 'POST',
      body: JSON.stringify({ email: emailValue.value, password: passwordValue.value }),
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    console.log(data)
    if (data.errors) {
      emailError.value = data.errors.email
      passwordError.value = data.errors.password
    }
    if (data.user) {
      user.value = data.user
      jscookie.set('jwt', data.token, {
        expires: maxAge * 1000
      })
      router.push('/')
    }
  } catch (err) {
    console.log(err)
  }
}
</script>
