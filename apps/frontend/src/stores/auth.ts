import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'
import jscookie from 'js-cookie'
import { useRouter } from 'vue-router'
import { BASE_URL } from '../api/config'

export const useAuthStore = defineStore('auth', () => {
  const user = <Ref<any>>ref('')
  const router = useRouter()

  async function checkAuth() {
    const token = jscookie.get('jwt')

    if (!token) {
      user.value = null
    }

    const checkUser = await fetch(BASE_URL + `/checkuser?token=${token}`)
    const fetchedUser = await checkUser.json()

    if (!fetchedUser) {
      user.value = null
      jscookie.remove('jwt')
    }

    user.value = fetchedUser
  }

  function logout() {
    user.value = ''
    jscookie.remove('jwt')

    router.push('/')
  }

  return { user, logout, checkAuth }
})
