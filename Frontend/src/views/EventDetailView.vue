<template>
  <div class="page">
    <div class="container detail-wrap">
      <div v-if="loading" class="loader-wrap"><div class="loader" /></div>

      <template v-else-if="event">
        <!-- Back -->
        <button class="back-btn" @click="router.back()">← Retour</button>

        <div class="detail-layout">
          <!-- Main -->
          <div class="detail-main">
            <div class="detail-meta-top">
              <span class="badge badge-ok">{{
                event.is_published ? "Publié" : "Brouillon"
              }}</span>
              <span class="meta-date">📅 {{ formattedDate }}</span>
            </div>

            <h1 class="detail-title anim-up">{{ event.title }}</h1>

            <div class="detail-meta anim-up d1">
              <div class="meta-pill">📍 {{ event.location || "—" }}</div>
              <div class="meta-pill">
                👥 {{ event.remaining_spots }} places disponibles
              </div>
            </div>

            <div class="detail-desc anim-up d2" v-if="event.description">
              <h2 class="detail-section-title">À propos</h2>
              <p>{{ event.description }}</p>
            </div>
          </div>

          <!-- Sidebar -->
          <aside class="detail-aside anim-up d2">
            <div class="aside-card card">
              <div class="aside-date">
                <span class="aside-day">{{ day }}</span>
                <span class="aside-month">{{ month }}</span>
              </div>
              <div class="aside-info">
                <p class="aside-loc">📍 {{ event.location }}</p>
                <div class="aside-places-wrap">
                  <span class="meta-pill">
                    👥 {{ event.remaining_spots }} restantes
                  </span>
                  <span class="meta-pill meta-pill-total">
                    {{ event.max_participants }} places maximum
                  </span>
                </div>
              </div>

              <div class="divider" />

              <!-- Non connecté -->
              <template v-if="!auth.isAuthenticated">
                <p class="aside-hint">Connectez-vous pour vous inscrire.</p>
                <RouterLink to="/login" class="btn btn-primary btn-block"
                  >Se connecter</RouterLink
                >
              </template>

              <!-- Déjà inscrit -->
              <template v-else-if="registration">
                <div
                  :class="['badge', statusBadge]"
                  style="justify-content: center; padding: 10px"
                >
                  {{ statusLabel }}
                </div>
                <button
                  class="btn btn-danger btn-block"
                  @click="cancelReg"
                  :disabled="cancelling"
                >
                  {{ cancelling ? "Annulation…" : "Annuler l'inscription" }}
                </button>
              </template>

              <!-- S'inscrire -->
              <template v-else-if="!isOwner">
                <button
                  class="btn btn-primary btn-block"
                  @click="register"
                  :disabled="registering || event.remaining_spots === 0"
                >
                  {{
                    registering
                      ? "Inscription…"
                      : event.remaining_spots === 0
                        ? "Complet"
                        : "S'inscrire à l'événement"
                  }}
                </button>
              </template>

              <div
                v-if="regError"
                class="alert alert-error"
                style="margin-top: 12px"
              >
                {{ regError }}
              </div>
              <div
                v-if="regSuccess"
                class="alert alert-success"
                style="margin-top: 12px"
              >
                {{ regSuccess }}
              </div>
            </div>

            <!-- Organiser actions -->
            <div v-if="isOwner" class="aside-card card">
              <p class="aside-owner-label">Vous organisez cet événement</p>
              <RouterLink
                :to="`/events/${event.id_event}/edit`"
                class="btn btn-secondary btn-block"
              >
                ✏️ Modifier
              </RouterLink>
              <button
                class="btn btn-danger btn-block"
                style="margin-top: 8px"
                @click="deleteEvent"
              >
                🗑️ Supprimer
              </button>
            </div>
          </aside>
        </div>
      </template>

      <div v-else class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3>Événement introuvable</h3>
        <p>Cet événement n'existe pas ou a été supprimé.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import api from "../api/axios";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const event = ref(null);
const loading = ref(true);
const registration = ref(null);
const registering = ref(false);
const cancelling = ref(false);
const regError = ref("");
const regSuccess = ref("");

const isOwner = computed(
  () => auth.isOrganizer && event.value?.id_orga === auth.user?.id_user,
);

const formattedDate = computed(() => {
  if (!event.value?.event_date) return "—";
  return new Date(event.value.event_date).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
});
const day = computed(() =>
  event.value ? new Date(event.value.event_date).getDate() : "",
);
const month = computed(() =>
  event.value
    ? new Date(event.value.event_date)
        .toLocaleDateString("fr-FR", { month: "short" })
        .toUpperCase()
    : "",
);

const statusBadge = computed(
  () =>
    ({
      confirmed: "badge-ok",
      pending: "badge-warn",
      cancelled: "badge-err",
    })[registration.value?.status] || "badge-muted",
);

const statusLabel = computed(
  () =>
    ({
      confirmed: "✅ Inscription confirmée",
      pending: "⏳ En attente de confirmation",
      cancelled: "❌ Inscription annulée",
    })[registration.value?.status] || registration.value?.status,
);

onMounted(async () => {
  try {
    const { data } = await api.get(`/event/${route.params.id}`);
    event.value = data;
    // Cherche une inscription existante
    if (auth.isAuthenticated) {
      try {
        const regs = await api.get(`/registrations/${auth.user.id_user}`);
        registration.value =
          regs.data.find((r) => r.id_event === data.id_event) || null;
      } catch {
        /* pas d'inscription */
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

async function register() {
  regError.value = regSuccess.value = "";
  registering.value = true;
  try {
    const { data } = await api.post(
      `/registrations/${event.value.id_event}/register`,
      {
        id_user: auth.user.id_user,
      },
    );
    registration.value = data.registration;
    regSuccess.value = "Inscription réussie !";
  } catch (e) {
    regError.value =
      e.response?.data?.message || "Erreur lors de l'inscription";
  } finally {
    registering.value = false;
  }
}

async function cancelReg() {
  if (!registration.value) return;
  cancelling.value = true;
  try {
    await api.delete(`/registrations/${registration.value.id}`);
    registration.value = null;
    regSuccess.value = "Inscription annulée.";
  } catch (e) {
    regError.value = e.response?.data?.message || "Erreur";
  } finally {
    cancelling.value = false;
  }
}

async function deleteEvent() {
  if (!confirm("Supprimer cet événement définitivement ?")) return;
  try {
    await api.delete(`/event/${event.value.id_event}`);
    router.push("/events");
  } catch (e) {
    alert(e.response?.data?.message || "Erreur lors de la suppression");
  }
}
</script>

<style scoped>
.detail-wrap {
  max-width: 1100px;
}

.back-btn {
  background: none;
  border: none;
  color: var(--c-text-2);
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 32px;
  transition: color var(--t-fast);
}
.back-btn:hover {
  color: var(--c-text);
}

.detail-layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 40px;
  align-items: start;
}

.detail-meta-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 13px;
}
.meta-date {
  color: var(--c-text-2);
}

.detail-title {
  font-size: clamp(28px, 4vw, 48px);
  margin-bottom: 20px;
}

.detail-meta {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 32px;
}
.meta-pill {
  padding: 8px 16px;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-full);
  font-size: 14px;
  color: var(--c-text-2);
}

.detail-section-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.detail-desc p {
  font-size: 16px;
  line-height: 1.8;
  color: var(--c-text-2);
}

.aside-card {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 16px;
}

.aside-date {
  text-align: center;
}
.aside-day {
  display: block;
  font-size: 52px;
  font-weight: 800;
  line-height: 1;
  background: var(--grad-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.aside-month {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: var(--c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.aside-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.aside-loc,
.aside-places {
  font-size: 14px;
  color: var(--c-text-2);
}

.aside-hint {
  font-size: 13px;
  color: var(--c-text-2);
  text-align: center;
}

.aside-owner-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--c-primary);
  text-align: center;
}

.aside-places-wrap {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.meta-pill {
  padding: 6px 12px;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-full);
  font-size: 14px;
  color: var(--c-text-2);
}

.meta-pill-total {
  background: var(--c-bg-muted);
  color: var(--c-text-2);
  border-color: var(--c-border);
}

@media (max-width: 768px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
  .detail-aside {
    order: -1;
  }
}
</style>
