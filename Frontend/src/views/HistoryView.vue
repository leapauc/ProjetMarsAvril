<template>
  <div class="page">
    <div class="container">

      <!-- Header -->
      <div class="section-header anim-up">
        <h1 class="section-title">Historique des actions</h1>
        <p class="section-subtitle">Journal complet des accès et modifications de données</p>
      </div>

      <!-- Filtres -->
      <div class="hist-toolbar anim-up d1">
        <div class="search-bar">
          <span class="search-icon">🔍</span>
          <input v-model="query" class="search-input" placeholder="Rechercher un utilisateur, une action…" />
          <button v-if="query" class="search-clear" @click="query = ''">✕</button>
        </div>
        <div class="filters">
          <button
            v-for="f in filters"
            :key="f.key"
            class="filter-btn"
            :class="{ active: activeFilter === f.key }"
            @click="activeFilter = f.key"
          >
            {{ f.label }}
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loader-wrap"><div class="loader" /></div>

      <!-- Table -->
      <div v-else-if="filtered.length" class="hist-table-wrap anim-up d2">
        <table class="hist-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Utilisateur</th>
              <th>Détails</th>
              <th>Événement lié</th>
              <th>Source</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, i) in filtered" :key="i" class="hist-row">
              <td>
                <span class="badge" :class="actionClass(row.log_type)">
                  {{ actionLabel(row.log_type) }}
                </span>
              </td>
              <td class="hist-user">{{ row.user_name || '—' }}</td>
              <td class="hist-details">{{ row.details || '—' }}</td>
              <td class="hist-event">{{ row.related_event_title || '—' }}</td>
              <td>
                <span class="badge badge-muted source-badge">{{ row.source === 'consent_log' ? 'Consentement' : 'Action' }}</span>
              </td>
              <td class="hist-date">{{ formatDate(row.log_date) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty -->
      <div v-else class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>Aucun résultat</h3>
        <p>Essayez un autre filtre ou terme de recherche.</p>
      </div>

      <!-- Compteur -->
      <div v-if="!loading" class="hist-count">
        {{ filtered.length }} entrée{{ filtered.length > 1 ? 's' : '' }} affichée{{ filtered.length > 1 ? 's' : '' }}
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../api/axios'

const rows        = ref([])
const loading     = ref(true)
const query       = ref('')
const activeFilter = ref('all')

const filters = [
  { key: 'all',              label: 'Tout' },
  { key: 'consent_given',    label: 'Consentements' },
  { key: 'data_accessed',    label: 'Accès données' },
  { key: 'data_deleted',     label: 'Suppressions' },
  { key: 'user_action_log',  label: 'Actions' },
]

const filtered = computed(() => {
  let list = rows.value
  if (query.value.trim()) {
    const q = query.value.toLowerCase()
    list = list.filter(r =>
      r.user_name?.toLowerCase().includes(q) ||
      r.details?.toLowerCase().includes(q) ||
      r.log_type?.toLowerCase().includes(q) ||
      r.related_event_title?.toLowerCase().includes(q)
    )
  }
  if (activeFilter.value === 'user_action_log') {
    list = list.filter(r => r.source === 'user_action_log')
  } else if (activeFilter.value !== 'all') {
    list = list.filter(r => r.log_type === activeFilter.value)
  }
  return list
})

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function actionClass(type) {
  const map = {
    consent_given:     'badge-ok',
    consent_withdrawn: 'badge-warn',
    data_accessed:     'badge-primary',
    data_deleted:      'badge-err',
    register:          'badge-ok',
    unregister:        'badge-warn',
    update:            'badge-primary',
    delete:            'badge-err',
    create:            'badge-ok',
  }
  return map[type] || 'badge-muted'
}

function actionLabel(type) {
  const map = {
    consent_given:     '✅ Consentement donné',
    consent_withdrawn: '↩️ Consentement retiré',
    data_accessed:     '👁️ Accès données',
    data_deleted:      '🗑️ Suppression',
    register:          '📝 Inscription',
    unregister:        '❌ Désinscription',
    update:            '✏️ Modification',
    delete:            '🗑️ Suppression',
    create:            '➕ Création',
  }
  return map[type] || type
}

onMounted(async () => {
  try {
    const { data } = await api.get('/history/me')
    rows.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.hist-toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 28px;
}

.search-bar {
  position: relative;
  flex: 1;
  min-width: 240px;
}
.search-icon {
  position: absolute; left: 14px; top: 50%;
  transform: translateY(-50%);
  font-size: 14px; pointer-events: none;
}
.search-input {
  width: 100%; padding: 11px 40px;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-xl);
  color: var(--c-text); font-size: 14px; outline: none;
  transition: var(--t-fast);
}
.search-input:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(124,58,237,.15);
}
.search-input::placeholder { color: var(--c-text-3); }
.search-clear { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--c-text-2); cursor: pointer; }

.filters { display: flex; gap: 8px; flex-wrap: wrap; }
.filter-btn {
  padding: 7px 16px;
  border: 1px solid var(--c-border); border-radius: var(--r-full);
  background: transparent; color: var(--c-text-2);
  font-size: 12px; font-weight: 500; cursor: pointer; transition: var(--t-fast);
}
.filter-btn:hover, .filter-btn.active {
  background: var(--c-primary-lite); border-color: rgba(124,58,237,.4); color: var(--c-primary);
}

/* Table */
.hist-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--c-border);
  border-radius: var(--r-lg);
}
.hist-table {
  width: 100%; border-collapse: collapse;
  font-size: 13px;
}
.hist-table th {
  padding: 12px 16px;
  background: var(--c-surface-2);
  color: var(--c-text-2);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .06em;
  text-align: left;
  border-bottom: 1px solid var(--c-border);
  white-space: nowrap;
}
.hist-row { border-bottom: 1px solid var(--c-border); transition: background var(--t-fast); }
.hist-row:last-child { border-bottom: none; }
.hist-row:hover { background: var(--c-card-hov); }
.hist-row td { padding: 12px 16px; vertical-align: middle; }

.hist-user    { font-weight: 600; color: var(--c-text); white-space: nowrap; }
.hist-details { color: var(--c-text-2); max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.hist-event   { color: var(--c-accent); font-size: 12px; }
.hist-date    { color: var(--c-text-3); white-space: nowrap; font-size: 12px; }

.source-badge { font-size: 11px; }

.hist-count {
  text-align: right;
  margin-top: 12px;
  font-size: 12px;
  color: var(--c-text-3);
}

@media (max-width: 640px) {
  .hist-toolbar { flex-direction: column; align-items: stretch; }
}
</style>
