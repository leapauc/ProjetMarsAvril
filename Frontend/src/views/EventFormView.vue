<template>
  <div class="page">
    <div class="container" style="max-width:680px">

      <div class="form-page-header anim-up">
        <button class="back-btn" @click="router.back()">← Retour</button>
        <h1 class="section-title">{{ isEdit ? 'Modifier l\'événement' : 'Créer un événement' }}</h1>
        <p class="section-subtitle">{{ isEdit ? 'Mettez à jour les informations de votre événement' : 'Remplissez les informations pour publier votre événement' }}</p>
      </div>

      <div v-if="loadingPage" class="loader-wrap"><div class="loader" /></div>

      <form v-else @submit.prevent="submit" class="ef-form card anim-up d1">

        <div class="form-group">
          <label class="form-label">Titre *</label>
          <input v-model="form.title" type="text" class="form-input" placeholder="Ex : Conférence Vue.js 2026" required />
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea v-model="form.description" class="form-input" placeholder="Décrivez votre événement en détail…" rows="5" />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Date et heure *</label>
            <input v-model="form.event_date" type="datetime-local" class="form-input" required />
          </div>
          <div class="form-group">
            <label class="form-label">Lieu *</label>
            <input v-model="form.location" type="text" class="form-input" placeholder="Paris, Lyon…" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Nombre de places maximum *</label>
          <input v-model.number="form.max_participants" type="number" class="form-input" min="1" max="10000" placeholder="100" required />
        </div>

        <div class="form-group">
          <label class="publish-toggle">
            <input type="checkbox" v-model="form.is_published" />
            <div class="toggle-content">
              <span class="toggle-title">Publier l'événement</span>
              <span class="toggle-desc">L'événement sera visible par tous les participants</span>
            </div>
            <span class="badge" :class="form.is_published ? 'badge-ok' : 'badge-warn'">
              {{ form.is_published ? 'Publié' : 'Brouillon' }}
            </span>
          </label>
        </div>

        <div v-if="error"   class="alert alert-error">{{ error }}</div>
        <div v-if="success" class="alert alert-success">{{ success }}</div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="router.back()">Annuler</button>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            <span v-if="loading" class="btn-loader" />
            {{ loading ? 'Enregistrement…' : (isEdit ? 'Enregistrer' : 'Créer l\'événement') }}
          </button>
        </div>

      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import api from '../api/axios'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const isEdit    = computed(() => !!route.params.id)
const loadingPage = ref(false)
const loading   = ref(false)
const error     = ref('')
const success   = ref('')

const form = reactive({
  title: '', description: '', event_date: '',
  location: '', max_participants: null, is_published: false
})

onMounted(async () => {
  if (!isEdit.value) return
  loadingPage.value = true
  try {
    const { data } = await api.get(`/event/${route.params.id}`)
    form.title           = data.title || ''
    form.description     = data.description || ''
    form.location        = data.location || ''
    form.max_participants = data.max_participants
    form.is_published    = data.is_published
    // Formate la date pour datetime-local
    if (data.event_date) {
      form.event_date = new Date(data.event_date).toISOString().slice(0, 16)
    }
  } catch (e) {
    error.value = 'Impossible de charger l\'événement'
  } finally {
    loadingPage.value = false
  }
})

async function submit() {
  error.value = success.value = ''
  loading.value = true
  try {
    const payload = {
      ...form,
      id_orga: auth.user.id_user
    }
    if (isEdit.value) {
      await api.put(`/event/${route.params.id}`, payload)
      success.value = 'Événement mis à jour !'
      setTimeout(() => router.push(`/events/${route.params.id}`), 1200)
    } else {
      const { data } = await api.post('/event', payload)
      success.value = 'Événement créé avec succès !'
      setTimeout(() => router.push(`/events/${data.event.id_event}`), 1200)
    }
  } catch (e) {
    error.value = e.response?.data?.message || 'Une erreur est survenue'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form-page-header { text-align: center; margin-bottom: 36px; }
.back-btn { background: none; border: none; color: var(--c-text-2); font-size: 14px; cursor: pointer; margin-bottom: 16px; transition: color var(--t-fast); }
.back-btn:hover { color: var(--c-text); }

.ef-form { padding: 36px; display: flex; flex-direction: column; gap: 22px; }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.publish-toggle {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  cursor: pointer;
  transition: var(--t-fast);
}
.publish-toggle:hover { border-color: var(--c-border-hov); }
.publish-toggle input[type="checkbox"] { width: 18px; height: 18px; accent-color: var(--c-primary); flex-shrink: 0; }
.toggle-content { flex: 1; }
.toggle-title { display: block; font-weight: 600; font-size: 15px; }
.toggle-desc  { display: block; font-size: 12px; color: var(--c-text-2); }

.form-actions { display: flex; justify-content: flex-end; gap: 12px; }

.btn-loader { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .7s linear infinite; }

@media (max-width: 560px) {
  .form-row { grid-template-columns: 1fr; }
  .ef-form  { padding: 24px 20px; }
}
</style>
