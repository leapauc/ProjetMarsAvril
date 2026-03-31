<template>
  <div class="auth-page">
    <div class="auth-orb orb1" />
    <div class="auth-orb orb2" />

    <div class="auth-card card anim-up">
      <div class="auth-header">
        <RouterLink to="/" class="auth-brand">
          <span>⚡</span><span class="grad-text">EventFlow</span>
        </RouterLink>
        <h1 class="auth-title">Créer un compte</h1>
        <p class="auth-sub">Rejoignez la communauté EventFlow</p>
      </div>

      <form @submit.prevent="submit" class="auth-form">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Prénom *</label>
            <input v-model="form.firstname" type="text" class="form-input" placeholder="Marie" required />
          </div>
          <div class="form-group">
            <label class="form-label">Nom *</label>
            <input v-model="form.lastname" type="text" class="form-input" placeholder="Dupont" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Email *</label>
          <input v-model="form.email" type="email" class="form-input" placeholder="vous@email.com" required />
        </div>

        <div class="form-group">
          <label class="form-label">Mot de passe *</label>
          <div class="input-wrap">
            <input
              v-model="form.password"
              :type="showPwd ? 'text' : 'password'"
              class="form-input"
              placeholder="8 caractères minimum"
              required minlength="6"
            />
            <button type="button" class="pwd-toggle" @click="showPwd = !showPwd">
              {{ showPwd ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Téléphone <span class="form-hint">(optionnel)</span></label>
          <input v-model="form.phone" type="tel" class="form-input" placeholder="06 00 00 00 00" />
        </div>

        <div class="form-group">
          <label class="form-label">Je m'inscris en tant que *</label>
          <select v-model="form.role" class="form-input">
            <option value="USER">Participant</option>
            <option value="ORGANIZER">Organisateur</option>
          </select>
        </div>

        <div class="divider" />

        <!-- RGPD Consent -->
        <div class="rgpd-block">
          <h3 class="rgpd-title">🔒 Consentement RGPD</h3>
          <label class="checkbox-row">
            <input type="checkbox" v-model="form.consent" required />
            <span class="consent-text">
              J'accepte la
              <RouterLink to="/privacy" class="auth-link" target="_blank">politique de confidentialité</RouterLink>
              et le traitement de mes données personnelles. (version v1)
            </span>
          </label>
        </div>

        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="success" class="alert alert-success">{{ success }}</div>

        <button type="submit" class="btn btn-primary btn-block btn-lg" :disabled="loading || !form.consent">
          <span v-if="loading" class="btn-loader" />
          {{ loading ? 'Création…' : 'Créer mon compte' }}
        </button>
      </form>

      <p class="auth-footer">
        Déjà un compte ?
        <RouterLink to="/login" class="auth-link">Se connecter</RouterLink>
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

const form = reactive({
  firstname: '', lastname: '', email: '', password: '',
  phone: '', role: 'USER', consent: false
})
const loading = ref(false)
const error   = ref('')
const success = ref('')
const showPwd = ref(false)

async function submit() {
  error.value = success.value = ''
  loading.value = true
  try {
    await auth.register({
      firstname: form.firstname,
      lastname:  form.lastname,
      email:     form.email,
      password:  form.password,
      phone:     form.phone || undefined,
      role:      form.role,
      consentVersion: 'v1'
    })
    success.value = 'Compte créé avec succès ! Redirection…'
    setTimeout(() => router.push('/login'), 1500)
  } catch (e) {
    error.value = e.response?.data?.message || 'Erreur lors de la création du compte'
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
  padding: 40px 24px;
  position: relative;
  overflow: hidden;
}
.auth-orb { position: absolute; border-radius: 50%; filter: blur(100px); pointer-events: none; }
.orb1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(124,58,237,.4) 0%, transparent 70%); top: -150px; right: -150px; animation: float1 7s ease-in-out infinite; }
.orb2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(6,182,212,.3) 0%, transparent 70%); bottom: -120px; left: -100px; animation: float2 9s ease-in-out infinite; }

.auth-card {
  position: relative; z-index: 1;
  width: 100%; max-width: 500px;
  padding: 40px;
  display: flex; flex-direction: column; gap: 24px;
}

.auth-header { text-align: center; }
.auth-brand  { display: inline-flex; align-items: center; gap: 6px; font-size: 22px; font-weight: 800; margin-bottom: 16px; text-decoration: none; }
.auth-title  { font-size: 24px; margin-bottom: 6px; }
.auth-sub    { color: var(--c-text-2); font-size: 14px; }

.auth-form { display: flex; flex-direction: column; gap: 16px; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

.input-wrap { position: relative; }
.input-wrap .form-input { padding-right: 44px; }
.pwd-toggle { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; font-size: 16px; }

.rgpd-block {
  background: var(--c-primary-lite);
  border: 1px solid rgba(124,58,237,.25);
  border-radius: var(--r-md);
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.rgpd-title { font-size: 14px; font-weight: 700; }
.consent-text { font-size: 13px; color: var(--c-text-2); line-height: 1.5; }

.btn-loader { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }

.auth-footer { text-align: center; font-size: 14px; color: var(--c-text-2); }
.auth-link   { color: var(--c-primary); font-weight: 600; }
.auth-link:hover { color: var(--c-accent); }

.grad-text { background: var(--grad-brand); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

@media (max-width: 480px) {
  .form-row { grid-template-columns: 1fr; }
  .auth-card { padding: 28px 20px; }
}
</style>
