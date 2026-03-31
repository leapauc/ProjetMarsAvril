import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../api/axios'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref(JSON.parse(localStorage.getItem('user')  || 'null'))
  const token = ref(localStorage.getItem('token') || null)

  const isAuthenticated = computed(() => !!user.value)
  const isOrganizer     = computed(() => ['ORGANIZER', 'ADMIN'].includes(user.value?.role))
  const isAdmin         = computed(() => user.value?.role === 'ADMIN')

  // Reconstruit le header si on a un token en mémoire (refresh page)
  if (token.value) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
  }

  async function login(credentials) {
    const { data } = await api.post('/auth/login', credentials)
    user.value  = data.user
    token.value = data.token || null
    localStorage.setItem('user', JSON.stringify(data.user))
    if (data.token) {
      localStorage.setItem('token', data.token)
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`
    }
    return data
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register', payload)
    return data
  }

  function logout() {
    user.value  = null
    token.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
  }

  return { user, token, isAuthenticated, isOrganizer, isAdmin, login, register, logout }
})
