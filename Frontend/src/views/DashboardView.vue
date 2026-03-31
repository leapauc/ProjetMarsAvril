<template>
  <div class="page">
    <div class="container">

      <!-- Header -->
      <div class="dash-header anim-up">
        <div class="dash-welcome">
          <div class="dash-avatar">{{ initials }}</div>
          <div>
            <h1 class="dash-title">Bonjour, {{ auth.user?.firstname }} 👋</h1>
            <p class="dash-sub">{{ roleLabel }} · Membre depuis {{ joinDate }}</p>
          </div>
        </div>
        <RouterLink v-if="auth.isOrganizer" to="/events/create" class="btn btn-primary">
          ➕ Créer un événement
        </RouterLink>
      </div>

      <!-- Tabs -->
      <div class="dash-tabs anim-up d1">
        <button class="tab-btn" :class="{ active: tab === 'events' }" @click="tab = 'events'">
          {{ auth.isOrganizer ? '🗂 Mes événements' : '📋 Mes inscriptions' }}
          <span class="tab-count" v-if="items.length">{{ items.length }}</span>
        </button>
        <button class="tab-btn" :class="{ active: tab === 'profile' }" @click="tab = 'profile'">
          👤 Mon profil
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loader-wrap"><div class="loader" /></div>

      <!-- Empty -->
      <div v-else-if="!items.length && tab === 'events'" class="empty-state anim-up d2">
        <div class="empty-icon">{{ auth.isOrganizer ? '📅' : '🎟️' }}</div>
        <h3>{{ auth.isOrganizer ? 'Aucun événement créé' : 'Aucune inscription' }}</h3>
        <p>{{ auth.isOrganizer ? 'Créez votre premier événement !' : 'Explorez les événements disponibles.' }}</p>
        <RouterLink :to="auth.isOrganizer ? '/events/create' : '/events'" class="btn btn-primary" style="margin-top:16px">
          {{ auth.isOrganizer ? 'Créer un événement' : 'Voir les événements' }}
        </RouterLink>
      </div>

      <!-- ORGANIZER : mes événements -->
      <div v-else-if="auth.isOrganizer && tab === 'events'" class="items-list">
        <div v-for="(ev, i) in items" :key="ev.id_event" class="item-card card anim-up" :class="`d${Math.min(i+2,6)}`">
          <div class="item-info">
            <div class="item-top">
              <span class="badge" :class="ev.is_published ? 'badge-ok' : 'badge-warn'">
                {{ ev.is_published ? 'Publié' : 'Brouillon' }}
              </span>
              <span class="item-date">{{ formatDate(ev.event_date) }}</span>
            </div>
            <h3 class="item-title">{{ ev.title }}</h3>
            <p class="item-meta">📍 {{ ev.location }} · 👥 {{ ev.max_participants }} places</p>
          </div>
          <div class="item-actions">
            <RouterLink :to="`/events/${ev.id_event}`" class="btn btn-ghost btn-sm">Voir</RouterLink>
            <RouterLink :to="`/events/${ev.id_event}/edit`" class="btn btn-secondary btn-sm">Modifier</RouterLink>
            <button class="btn btn-danger btn-sm" @click="deleteEvent(ev)">Supprimer</button>
          </div>
        </div>
      </div>

      <!-- USER : mes inscriptions -->
      <div v-else-if="!auth.isOrganizer && tab === 'events'" class="items-list">
        <div v-for="(reg, i) in items" :key="reg.id" class="item-card card anim-up" :class="`d${Math.min(i+2,6)}`">
          <div class="item-info">
            <div class="item-top">
              <span class="badge" :class="statusClass(reg.status)">{{ statusLabel(reg.status) }}</span>
              <span class="item-date">{{ formatDate(reg.event_date) }}</span>
            </div>
            <h3 class="item-title">{{ reg.title }}</h3>
            <p class="item-meta">Inscrit le {{ formatDate(reg.registered_at) }}</p>
          </div>
          <div class="item-actions">
            <RouterLink :to="`/events/${reg.id_event}`" class="btn btn-ghost btn-sm">Voir</RouterLink>
            <button class="btn btn-danger btn-sm" @click="cancelReg(reg)" :disabled="reg.status === 'cancelled'">
              Annuler
            </button>
          </div>
        </div>
      </div>

      <!-- Profil résumé -->
      <div v-if="tab === 'profile'" class="profile-summary anim-up d2">
        <div class="ps-card card">
          <div class="ps-header">
            <div class="ps-avatar">{{ initials }}</div>
            <div>
              <h2>{{ auth.user?.firstname }} {{ auth.user?.lastname }}</h2>
              <p class="ps-email">{{ auth.user?.email }}</p>
              <span class="badge badge-primary">{{ auth.user?.role }}</span>
            </div>
          </div>
          <div class="divider" />
          <RouterLink to="/profile" class="btn btn-primary btn-block">Gérer mes données RGPD →</RouterLink>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import api from '../api/axios'

const auth    = useAuthStore()
const items   = ref([])
const loading = ref(true)
const tab     = ref('events')

const initials = computed(() => {
  const u = auth.user
  return u ? (u.firstname?.[0] || '') + (u.lastname?.[0] || '') : '?'
})
const roleLabel = computed(() => ({ USER: 'Participant', ORGANIZER: 'Organisateur', ADMIN: 'Administrateur' }[auth.user?.role] || auth.user?.role))
const joinDate  = computed(() => auth.user?.created_at ? new Date(auth.user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }) : '')

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
function statusClass(s) { return { confirmed: 'badge-ok', pending: 'badge-warn', cancelled: 'badge-err' }[s] || 'badge-muted' }
function statusLabel(s) { return { confirmed: 'Confirmé', pending: 'En attente', cancelled: 'Annulé' }[s] || s }

onMounted(async () => {
  try {
    if (auth.isOrganizer) {
      const { data } = await api.get(`/me/${auth.user.id_user}`)
      items.value = data.events || []
    } else {
      const { data } = await api.get(`/registrations/${auth.user.id_user}`)
      items.value = Array.isArray(data) ? data : []
    }
  } catch (e) {
    items.value = []
  } finally {
    loading.value = false
  }
})

async function deleteEvent(ev) {
  if (!confirm(`Supprimer "${ev.title}" ?`)) return
  try {
    await api.delete(`/event/${ev.id_event}`)
    items.value = items.value.filter(e => e.id_event !== ev.id_event)
  } catch (e) {
    alert(e.response?.data?.message || 'Erreur')
  }
}

async function cancelReg(reg) {
  if (!confirm('Annuler cette inscription ?')) return
  try {
    await api.delete(`/registrations/${reg.id}`)
    const idx = items.value.findIndex(r => r.id === reg.id)
    if (idx !== -1) items.value[idx] = { ...items.value[idx], status: 'cancelled' }
  } catch (e) {
    alert(e.response?.data?.message || 'Erreur')
  }
}
</script>

<style scoped>
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 36px;
}
.dash-welcome { display: flex; align-items: center; gap: 20px; }
.dash-avatar {
  width: 60px; height: 60px;
  border-radius: 50%;
  background: var(--grad-brand);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 700; color: #fff;
  text-transform: uppercase; flex-shrink: 0;
}
.dash-title { font-size: clamp(20px, 3vw, 28px); margin-bottom: 4px; }
.dash-sub   { font-size: 14px; color: var(--c-text-2); }

.dash-tabs  { display: flex; gap: 4px; margin-bottom: 32px; border-bottom: 1px solid var(--c-border); }
.tab-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 20px;
  background: none; border: none;
  font-size: 14px; font-weight: 500;
  color: var(--c-text-2); cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: var(--t-fast);
}
.tab-btn:hover  { color: var(--c-text); }
.tab-btn.active { color: var(--c-primary); border-bottom-color: var(--c-primary); }
.tab-count {
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px;
  background: var(--c-primary-lite);
  color: var(--c-primary);
  border-radius: var(--r-full);
  font-size: 11px; font-weight: 700;
}

.items-list { display: flex; flex-direction: column; gap: 14px; }
.item-card  { padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.item-info  { flex: 1; min-width: 0; }
.item-top   { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.item-date  { font-size: 12px; color: var(--c-text-2); }
.item-title { font-size: 16px; font-weight: 700; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.item-meta  { font-size: 13px; color: var(--c-text-2); }
.item-actions { display: flex; gap: 8px; flex-shrink: 0; }

.ps-card    { padding: 28px; max-width: 500px; }
.ps-header  { display: flex; align-items: center; gap: 20px; margin-bottom: 0; }
.ps-avatar  { width: 56px; height: 56px; border-radius: 50%; background: var(--grad-brand); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: #fff; flex-shrink: 0; }
.ps-email   { font-size: 14px; color: var(--c-text-2); margin: 4px 0 8px; }

@media (max-width: 640px) {
  .dash-header  { flex-direction: column; align-items: flex-start; }
  .item-card    { flex-direction: column; align-items: flex-start; }
  .item-actions { width: 100%; }
  .item-actions .btn { flex: 1; justify-content: center; }
}
</style>
