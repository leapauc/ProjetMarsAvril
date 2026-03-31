<template>
  <div class="page">
    <div class="container">

      <div class="page-header anim-up">
        <h1 class="section-title">Tous les événements</h1>
        <p class="section-subtitle">Trouvez et rejoignez l'événement qui vous inspire</p>
      </div>

      <!-- Recherche -->
      <div class="search-bar anim-up d1">
        <span class="search-icon">🔍</span>
        <input
          v-model="query"
          class="search-input"
          type="text"
          placeholder="Rechercher par titre, lieu…"
        />
        <button v-if="query" class="search-clear" @click="query = ''">✕</button>
      </div>

      <!-- Filtres rapides -->
      <div class="filters anim-up d2">
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

      <!-- Loading -->
      <div v-if="loading" class="loader-wrap"><div class="loader" /></div>

      <!-- Grid -->
      <div v-else-if="filtered.length" class="grid-3">
        <EventCard
          v-for="(ev, i) in filtered"
          :key="ev.id_event"
          :event="ev"
          class="anim-up"
          :class="`d${Math.min(i + 1, 6)}`"
        />
      </div>

      <!-- Empty -->
      <div v-else class="empty-state">
        <div class="empty-icon">🔭</div>
        <h3>Aucun résultat</h3>
        <p>Essayez un autre terme ou revenez plus tard.</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import EventCard from '../components/EventCard.vue'
import api from '../api/axios'

const events      = ref([])
const loading     = ref(true)
const query       = ref('')
const activeFilter = ref('all')

const filters = [
  { key: 'all',      label: 'Tous' },
  { key: 'upcoming', label: 'À venir' },
  { key: 'paris',    label: 'Paris' },
  { key: 'lyon',     label: 'Lyon' },
]

const filtered = computed(() => {
  let list = events.value
  if (query.value.trim()) {
    const q = query.value.toLowerCase()
    list = list.filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.location?.toLowerCase().includes(q) ||
      e.description?.toLowerCase().includes(q)
    )
  }
  if (activeFilter.value === 'upcoming') {
    list = list.filter(e => new Date(e.event_date) >= new Date())
  } else if (activeFilter.value !== 'all') {
    list = list.filter(e => e.location?.toLowerCase().includes(activeFilter.value))
  }
  return list
})

onMounted(async () => {
  try {
    const { data } = await api.get('/event')
    events.value = data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-header { text-align: center; margin-bottom: 40px; }

.search-bar {
  position: relative;
  max-width: 560px;
  margin: 0 auto 24px;
}
.search-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  pointer-events: none;
}
.search-input {
  width: 100%;
  padding: 13px 44px;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-xl);
  color: var(--c-text);
  font-size: 15px;
  outline: none;
  transition: var(--t-fast);
}
.search-input:focus {
  border-color: var(--c-primary);
  box-shadow: 0 0 0 3px rgba(124,58,237,.15);
}
.search-input::placeholder { color: var(--c-text-3); }
.search-clear {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--c-text-2);
  cursor: pointer;
  font-size: 14px;
}

.filters {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 40px;
}
.filter-btn {
  padding: 7px 18px;
  border: 1px solid var(--c-border);
  border-radius: var(--r-full);
  background: transparent;
  color: var(--c-text-2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--t-fast);
}
.filter-btn:hover,
.filter-btn.active {
  background: var(--c-primary-lite);
  border-color: rgba(124,58,237,.4);
  color: var(--c-primary);
}
</style>
