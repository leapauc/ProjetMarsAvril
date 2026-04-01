<template>
  <div class="auth-page">
    <div class="auth-orb orb1" />
    <div class="auth-orb orb2" />

    <div class="auth-card card anim-up">
      <div class="auth-header">
        <RouterLink to="/" class="auth-brand">
          <span>⚡</span><span class="grad-text">EventFlow</span>
        </RouterLink>
        <h1 class="auth-title">Bon retour !</h1>
        <p class="auth-sub">Connectez-vous à votre espace EventFlow</p>
      </div>

      <form @submit.prevent="submit" class="auth-form">
        <div class="form-group">
          <label class="form-label">Email</label>
          <input v-model="form.email" type="email" class="form-input" placeholder="vous@email.com" required />
        </div>
        <div class="form-group">
          <label class="form-label">Mot de passe</label>
          <div class="input-wrap">
            <input
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              class="form-input"
              placeholder="••••••••"
              required
            />
            <button type="button" class="pwd-toggle" @click="showPwd = !showPwd">
              {{ showPwd ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="loading">
          <span v-if="loading" class="btn-loader" />
          {{ loading ? 'Connexion…' : 'Se connecter' }}
        </button>
      </form>

      <p class="auth-footer">
        Pas encore de compte ?
        <RouterLink to="/register" class="auth-link">Créer un compte</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth   = useAuthStore()
const router = useRouter()

const form    = reactive({ email: '', password: '' })
const loading = ref(false)
const error   = ref('')
const showPwd = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(form)
    router.push(auth.isAdmin ? '/admin' : '/dashboard')
  } catch (e) {
    error.value = e.response?.data?.message || 'Email ou mot de passe incorrect'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  position: relative;
  overflow: hidden;
}
.auth-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
}
.orb1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(124,58,237,.4) 0%, transparent 70%); top: -150px; right: -150px; animation: float1 7s ease-in-out infinite; }
.orb2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(6,182,212,.3) 0%, transparent 70%); bottom: -120px; left: -100px; animation: float2 9s ease-in-out infinite; }

.auth-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 440px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.auth-header { text-align: center; }
.auth-brand  { display: inline-flex; align-items: center; gap: 6px; font-size: 22px; font-weight: 800; margin-bottom: 20px; text-decoration: none; }
.auth-title  { font-size: 26px; margin-bottom: 8px; }
.auth-sub    { color: var(--c-text-2); font-size: 14px; }

.auth-form  { display: flex; flex-direction: column; gap: 18px; }

.input-wrap { position: relative; }
.input-wrap .form-input { padding-right: 44px; }
.pwd-toggle {
  position: absolute;
  right: 12px; top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.btn-loader {
  display: inline-block;
  width: 14px; height: 14px;
  border: 2px solid rgba(255,255,255,.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}

.auth-footer { text-align: center; font-size: 14px; color: var(--c-text-2); }
.auth-link   { color: var(--c-primary); font-weight: 600; transition: color var(--t-fast); }
.auth-link:hover { color: var(--c-accent); }

.grad-text {
  background: var(--grad-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
