import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCookieStore = defineStore('cookie', () => {
  const consent = ref(JSON.parse(localStorage.getItem('cookieConsent') || 'null'))

  const hasConsented = computed(() => consent.value !== null)

  function setConsent(choices) {
    consent.value = choices
    localStorage.setItem('cookieConsent', JSON.stringify(choices))
  }

  function revokeConsent() {
    consent.value = null
    localStorage.removeItem('cookieConsent')
  }

  return { consent, hasConsented, setConsent, revokeConsent }
})
