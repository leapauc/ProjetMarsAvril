import { defineStore } from 'pinia'
import { ref } from 'vue'

function getPreferredTheme() {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(value) {
  document.documentElement.setAttribute('data-theme', value)
}

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(getPreferredTheme())
  applyTheme(theme.value)

  function setTheme(value) {
    theme.value = value
    localStorage.setItem('theme', value)
    applyTheme(value)
  }

  function toggleTheme() {
    setTheme(theme.value === 'dark' ? 'light' : 'dark')
  }

  return { theme, setTheme, toggleTheme }
})
