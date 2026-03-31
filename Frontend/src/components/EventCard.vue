<template>
  <RouterLink :to="`/events/${event.id_event}`" class="event-card card">
    <div class="ec-top">
      <span class="ec-badge" :class="statusClass">{{ statusLabel }}</span>
      <span class="ec-date">{{ formattedDate }}</span>
    </div>

    <h3 class="ec-title">{{ event.title }}</h3>

    <p class="ec-desc" v-if="event.description">
      {{ truncated }}
    </p>

    <div class="ec-meta">
      <span class="ec-meta-item">📍 {{ event.location || '—' }}</span>
      <span class="ec-meta-item">👥 {{ event.max_participants }} places</span>
    </div>

    <div class="ec-footer">
      <span class="ec-cta">Voir l'événement <span class="arrow">→</span></span>
    </div>

    <div class="ec-glow" />
  </RouterLink>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  event: { type: Object, required: true }
})

const formattedDate = computed(() => {
  if (!props.event.event_date) return '—'
  return new Date(props.event.event_date).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
})

const truncated = computed(() => {
  const d = props.event.description || ''
  return d.length > 100 ? d.slice(0, 100) + '…' : d
})

const statusClass = computed(() => {
  if (props.event.status) {
    return { confirmed: 'badge-ok', pending: 'badge-warn', cancelled: 'badge-err' }[props.event.status] || 'badge-muted'
  }
  return props.event.is_published ? 'badge-ok' : 'badge-warn'
})

const statusLabel = computed(() => {
  if (props.event.status) {
    return { confirmed: 'Confirmé', pending: 'En attente', cancelled: 'Annulé' }[props.event.status] || props.event.status
  }
  return props.event.is_published ? 'Publié' : 'Brouillon'
})
</script>

<style scoped>
.event-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  text-decoration: none;
  overflow: hidden;
  cursor: pointer;
}

.ec-glow {
  position: absolute;
  inset: 0;
  background: var(--grad-card);
  opacity: 0;
  transition: opacity .3s;
  pointer-events: none;
  border-radius: inherit;
}
.event-card:hover .ec-glow { opacity: 1; }

.ec-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.ec-badge { font-size: 11px; }
.ec-date  { font-size: 12px; color: var(--c-text-2); }

.ec-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--c-text);
  line-height: 1.3;
}

.ec-desc {
  font-size: 13px;
  color: var(--c-text-2);
  line-height: 1.5;
  flex: 1;
}

.ec-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}
.ec-meta-item {
  font-size: 13px;
  color: var(--c-text-2);
}

.ec-footer {
  margin-top: auto;
  padding-top: 12px;
  border-top: 1px solid var(--c-border);
}
.ec-cta {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-primary);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: gap var(--t-fast);
}
.event-card:hover .ec-cta .arrow { transform: translateX(4px); }
.arrow { display: inline-block; transition: transform var(--t-fast); }
</style>
