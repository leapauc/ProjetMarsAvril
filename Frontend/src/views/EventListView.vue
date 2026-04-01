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

      <!-- Filtres + toggle vue -->
      <div class="toolbar anim-up d2">
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
        <div class="view-toggle">
          <button class="view-btn" :class="{ active: viewMode === 'grid' }" @click="setView('grid')" title="Vue liste">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><rect x="0" y="0" width="7" height="7" rx="1"/><rect x="9" y="0" width="7" height="7" rx="1"/><rect x="0" y="9" width="7" height="7" rx="1"/><rect x="9" y="9" width="7" height="7" rx="1"/></svg>
          </button>
          <button class="view-btn" :class="{ active: viewMode === 'map' }" @click="setView('map')" title="Vue carte">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a5 5 0 0 0-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loader-wrap"><div class="loader" /></div>

      <template v-else>
        <!-- Grid -->
        <div v-if="viewMode === 'grid'">
          <div v-if="filtered.length" class="grid-3">
            <EventCard
              v-for="(ev, i) in filtered"
              :key="ev.id_event"
              :event="ev"
              class="anim-up"
              :class="`d${Math.min(i + 1, 6)}`"
            />
          </div>
          <div v-else class="empty-state">
            <div class="empty-icon">🔭</div>
            <h3>Aucun résultat</h3>
            <p>Essayez un autre terme ou revenez plus tard.</p>
          </div>
        </div>

        <!-- Map -->
        <div v-if="viewMode === 'map'" class="map-wrap">
          <div v-if="geocoding" class="map-geocoding">Chargement de la carte…</div>
          <div ref="mapContainer" class="events-map" />
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import EventCard from '../components/EventCard.vue'
import api from '../api/axios'

const events       = ref([])
const loading      = ref(true)
const query        = ref('')
const activeFilter = ref('all')
const viewMode     = ref('grid')
const mapContainer = ref(null)
const geocoding    = ref(false)
let leafletMap     = null
const geocodeCache = {}

const CITY_COORDS = {
  'paris':      { lat: 48.8566, lng: 2.3522 },
  'lyon':       { lat: 45.7640, lng: 4.8357 },
  'marseille':  { lat: 43.2965, lng: 5.3698 },
  'bordeaux':   { lat: 44.8378, lng: -0.5792 },
  'toulouse':   { lat: 43.6047, lng: 1.4442 },
  'lille':      { lat: 50.6292, lng: 3.0573 },
  'nantes':     { lat: 47.2184, lng: -1.5536 },
  'strasbourg': { lat: 48.5734, lng: 7.7521 },
  'nice':       { lat: 43.7102, lng: 7.2620 },
  'rennes':     { lat: 48.1173, lng: -1.6778 },
  'montpellier':{ lat: 43.6108, lng: 3.8767 },
  'grenoble':   { lat: 45.1885, lng: 5.7245 },
}

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

async function geocode(location) {
  if (!location) return null
  const key = location.toLowerCase().trim()
  if (geocodeCache[key]) return geocodeCache[key]

  // Lookup statique d'abord (instantané, sans dépendance externe)
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (key.includes(city)) {
      geocodeCache[key] = coords
      return coords
    }
  }

  // Fallback Nominatim pour les villes inconnues
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&countrycodes=fr`,
      { headers: { 'Accept-Language': 'fr' } }
    )
    const data = await r.json()
    if (data[0]) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      geocodeCache[key] = coords
      return coords
    }
  } catch {}
  return null
}

const customIcon = () => L.divIcon({
  html: `<div style="width:14px;height:14px;background:#7c3aed;border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 10px rgba(124,58,237,.7);"></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
})

async function initMap() {
  await nextTick()
  if (!mapContainer.value) return

  // Toujours détruire l'ancienne instance (le DOM a été recréé par v-if)
  if (leafletMap) { leafletMap.remove(); leafletMap = null }
  // Nettoyer l'attribut laissé par Leaflet sur le nœud DOM
  delete mapContainer.value._leaflet_id

  leafletMap = L.map(mapContainer.value, { zoomControl: true }).setView([46.5, 2.5], 5)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  }).addTo(leafletMap)

  geocoding.value = true
  const seen = new Set()
  for (const ev of filtered.value) {
    if (!ev.location || seen.has(ev.location)) continue
    seen.add(ev.location)
    const coords = await geocode(ev.location)
    if (!coords) continue
    const sameLocation = filtered.value.filter(e => e.location === ev.location)
    const popupContent = sameLocation.map(e => `
      <div style="margin-bottom:8px;">
        <a href="/events/${e.id_event}" style="font-weight:700;color:#7c3aed;text-decoration:none;">${e.title}</a>
        <div style="font-size:11px;color:#94a3b8;margin-top:2px;">
          ${new Date(e.event_date).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric'})}
          · ${e.remaining_spots ?? '?'} place(s)
        </div>
      </div>`).join('')
    L.marker([coords.lat, coords.lng], { icon: customIcon() })
      .addTo(leafletMap)
      .bindPopup(`<div style="min-width:180px;font-family:system-ui;background:#0d0d24;color:#f0f2ff;padding:4px;">${popupContent}</div>`, {
        className: 'map-popup'
      })
  }
  geocoding.value = false
}

function setView(mode) {
  viewMode.value = mode
  if (mode === 'map') initMap()
}

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

onUnmounted(() => {
  if (leafletMap) { leafletMap.remove(); leafletMap = null }
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

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 40px;
}
.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

/* ── View toggle ─────────────────── */
.view-toggle {
  display: flex;
  gap: 4px;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  padding: 4px;
}
.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--c-text-2);
  cursor: pointer;
  transition: var(--t-fast);
}
.view-btn:hover { color: var(--c-text); }
.view-btn.active {
  background: var(--c-primary-lite);
  color: var(--c-primary);
}

/* ── Map ─────────────────────────── */
.map-wrap { position: relative; }
.map-geocoding {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-full);
  padding: 6px 16px;
  font-size: 13px;
  color: var(--c-text-2);
}
.events-map {
  height: 540px;
  border-radius: var(--r-lg);
  overflow: hidden;
  border: 1px solid var(--c-border);
}
</style>

<style>
/* Popup Leaflet — global car injecté dans le DOM hors composant */
.map-popup .leaflet-popup-content-wrapper {
  background: #0d0d24;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,.5);
  color: #f0f2ff;
}
.map-popup .leaflet-popup-tip {
  background: #0d0d24;
}
.map-popup .leaflet-popup-content {
  margin: 12px 14px;
}
</style>
