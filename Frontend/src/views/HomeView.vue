<template>
  <div class="home">

    <!-- ===== HERO ===== -->
    <section class="hero">
      <div class="hero-orb orb1" />
      <div class="hero-orb orb2" />
      <div class="hero-grid" />

      <div class="container hero-content">
        <div class="hero-tag anim-up">🚀 Plateforme de gestion d'événements</div>
        <h1 class="hero-title anim-up d1">
          Vivez des événements<br />
          <span class="grad-text">extraordinaires</span>
        </h1>
        <p class="hero-sub anim-up d2">
          Découvrez, rejoignez et organisez des conférences, meetups et formations.<br />
          Une expérience pensée pour vous, en conformité RGPD.
        </p>
        <div class="hero-actions anim-up d3">
          <RouterLink to="/events" class="btn btn-primary btn-lg">
            Explorer les événements
          </RouterLink>
          <RouterLink v-if="!auth.isAuthenticated" to="/register" class="btn btn-secondary btn-lg">
            Rejoindre gratuitement
          </RouterLink>
          <RouterLink v-else to="/dashboard" class="btn btn-secondary btn-lg">
            Mon espace
          </RouterLink>
        </div>

        <!-- Stats -->
        <div class="hero-stats anim-up d4">
          <div class="stat">
            <span class="stat-val">{{ stats.events }}+</span>
            <span class="stat-label">Événements</span>
          </div>
          <div class="stat-sep" />
          <div class="stat">
            <span class="stat-val">{{ stats.users }}+</span>
            <span class="stat-label">Participants</span>
          </div>
          <div class="stat-sep" />
          <div class="stat">
            <span class="stat-val">{{ stats.organizers }}+</span>
            <span class="stat-label">Organisateurs</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== FEATURED EVENTS ===== -->
    <section class="section container">
      <div class="section-header">
        <h2 class="section-title">Prochains événements</h2>
        <p class="section-subtitle">Les événements publiés qui vous attendent</p>
      </div>

      <div v-if="loading" class="loader-wrap"><div class="loader" /></div>

      <div v-else-if="events.length" class="grid-3">
        <EventCard
          v-for="(ev, i) in events.slice(0, 6)"
          :key="ev.id_event"
          :event="ev"
          class="anim-up"
          :class="`d${i + 1}`"
        />
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">📅</div>
        <h3>Aucun événement disponible</h3>
        <p>Revenez bientôt, de nouveaux événements arrivent !</p>
      </div>

      <div class="see-all">
        <RouterLink to="/events" class="btn btn-secondary">Voir tous les événements →</RouterLink>
      </div>
    </section>

    <!-- ===== CTA ===== -->
    <section class="cta-section container" v-if="!auth.isAuthenticated">
      <div class="cta-card card">
        <div class="cta-orb" />
        <h2 class="cta-title">Prêt à vous lancer ?</h2>
        <p class="cta-sub">Créez votre compte en 30 secondes et rejoignez notre communauté.</p>
        <RouterLink to="/register" class="btn btn-primary btn-lg">Créer mon compte</RouterLink>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import EventCard from '../components/EventCard.vue'
import api from '../api/axios'

const auth   = useAuthStore()
const events = ref([])
const loading = ref(true)
const stats  = reactive({ events: 0, users: 0, organizers: 0 })

onMounted(async () => {
  try {
    const [eventsRes, statsRes] = await Promise.all([
      api.get('/event'),
      api.get('/stats'),
    ])
    events.value = eventsRes.data
    stats.events     = statsRes.data.events     ?? eventsRes.data.length
    stats.users      = statsRes.data.users      ?? 0
    stats.organizers = statsRes.data.organizers ?? 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
/* ---- HERO ---- */
.hero {
  position: relative;
  min-height: 90vh;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.hero-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(120px);
  pointer-events: none;
}
.orb1 {
  width: 700px; height: 700px;
  background: radial-gradient(circle, rgba(124,58,237,.45) 0%, transparent 70%);
  top: -250px; right: -200px;
  animation: float1 8s ease-in-out infinite;
}
.orb2 {
  width: 600px; height: 600px;
  background: radial-gradient(circle, rgba(6,182,212,.35) 0%, transparent 70%);
  bottom: -200px; left: -150px;
  animation: float2 10s ease-in-out infinite;
}
.hero-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 24px;
  padding-top: 80px;
  padding-bottom: 80px;
}

.hero-tag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: var(--c-primary-lite);
  border: 1px solid rgba(124,58,237,.3);
  border-radius: var(--r-full);
  font-size: 13px;
  font-weight: 600;
  color: var(--c-primary);
  letter-spacing: .03em;
}

.hero-title {
  font-size: clamp(36px, 6vw, 72px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -.04em;
}

.grad-text {
  background: var(--grad-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-sub {
  font-size: clamp(15px, 2vw, 19px);
  color: var(--c-text-2);
  max-width: 580px;
  line-height: 1.7;
}

.hero-actions {
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  justify-content: center;
}

.hero-stats {
  display: flex;
  align-items: center;
  gap: 32px;
  margin-top: 16px;
  padding: 20px 32px;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-xl);
  backdrop-filter: blur(10px);
}
.stat { text-align: center; }
.stat-val   { display: block; font-size: 28px; font-weight: 800; background: var(--grad-brand); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.stat-label { font-size: 12px; color: var(--c-text-2); text-transform: uppercase; letter-spacing: .06em; }
.stat-sep   { width: 1px; height: 36px; background: var(--c-border); }

/* ---- FEATURED ---- */
.section { padding: 80px 0; }
.see-all  { text-align: center; margin-top: 40px; }

/* ---- CTA ---- */
.cta-section { padding-bottom: 80px; }
.cta-card {
  position: relative;
  text-align: center;
  padding: 60px 40px;
  overflow: hidden;
}
.cta-orb {
  position: absolute;
  width: 400px; height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(124,58,237,.3) 0%, transparent 70%);
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  filter: blur(80px);
  pointer-events: none;
}
.cta-title { font-size: clamp(24px, 3vw, 36px); margin-bottom: 12px; }
.cta-sub   { color: var(--c-text-2); font-size: 16px; margin-bottom: 28px; }

@media (max-width: 600px) {
  .hero-stats { gap: 20px; padding: 16px 20px; }
  .stat-val   { font-size: 22px; }
}
</style>
