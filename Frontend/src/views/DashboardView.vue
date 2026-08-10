<template>
  <div>
  <div class="page">
    <div class="container">
      <!-- Header -->
      <div class="dash-header anim-up">
        <div class="dash-welcome">
          <div class="dash-avatar">{{ initials }}</div>
          <div>
            <h1 class="dash-title">Bonjour, {{ auth.user?.firstname }} 👋</h1>
            <p class="dash-sub">
              {{ roleLabel }} · Membre depuis {{ joinDate }}
            </p>
          </div>
        </div>
        <RouterLink
          v-if="auth.isOrganizer"
          to="/events/create"
          class="btn btn-primary"
        >
          ➕ Créer un événement
        </RouterLink>
      </div>

      <!-- Tabs -->
      <div class="dash-tabs anim-up d1">
        <button
          class="tab-btn"
          :class="{ active: tab === 'events' }"
          @click="tab = 'events'"
        >
          {{ auth.isOrganizer ? "🗂 Mes événements" : "📋 Mes inscriptions" }}
          <span class="tab-count" v-if="items.length">{{ items.length }}</span>
        </button>
        <button
          v-if="auth.isOrganizer"
          class="tab-btn"
          :class="{ active: tab === 'validations' }"
          @click="tab = 'validations'"
        >
          ✅ Validations
          <span class="tab-count tab-count-warn" v-if="pendingCount">{{ pendingCount }}</span>
        </button>
        <button
          v-if="auth.isOrganizer"
          class="tab-btn"
          :class="{ active: tab === 'myregs' }"
          @click="tab = 'myregs'"
        >
          🎟 Mes inscriptions
          <span class="tab-count" v-if="myRegs.length">{{ myRegs.length }}</span>
        </button>
        <button
          class="tab-btn"
          :class="{ active: tab === 'profile' }"
          @click="tab = 'profile'"
        >
          👤 Mon profil
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loader-wrap"><div class="loader" /></div>

      <!-- Empty -->
      <div
        v-else-if="!items.length && tab === 'events'"
        class="empty-state anim-up d2"
      >
        <div class="empty-icon">{{ auth.isOrganizer ? "📅" : "🎟️" }}</div>
        <h3>
          {{ auth.isOrganizer ? "Aucun événement créé" : "Aucune inscription" }}
        </h3>
        <p>
          {{
            auth.isOrganizer
              ? "Créez votre premier événement !"
              : "Explorez les événements disponibles."
          }}
        </p>
        <RouterLink
          :to="auth.isOrganizer ? '/events/create' : '/events'"
          class="btn btn-primary"
          style="margin-top: 16px"
        >
          {{ auth.isOrganizer ? "Créer un événement" : "Voir les événements" }}
        </RouterLink>
      </div>

      <!-- ONGLET "MES ÉVÉNEMENTS" et "MES INSCRIPTIONS" : rendu unifié list / calendrier -->
      <div v-else-if="tab === 'events'">
        <div class="view-switch-wrap">
          <div class="segmented-view">
            <button class="segment-btn" :class="{ active: registrationView === 'list' }" @click="registrationView = 'list'">
              Liste
            </button>
            <button class="segment-btn" :class="{ active: registrationView === 'calendar' }" @click="registrationView = 'calendar'">
              Calendrier par mois
            </button>
          </div>
        </div>

        <div v-if="registrationView === 'list'" class="items-list">
          <div
            v-if="auth.isOrganizer"
            v-for="(ev, i) in items"
            :key="ev.id_event"
            class="item-card card anim-up"
            :class="`d${Math.min(i + 2, 6)}`"
          >
            <div class="item-info">
              <div class="item-top">
                <span
                  class="badge"
                  :class="ev.is_published ? 'badge-ok' : 'badge-warn'"
                >
                  {{ ev.is_published ? "Publié" : "Brouillon" }}
                </span>
                <span class="item-date">{{ formatDate(ev.event_date) }}</span>
              </div>
              <h3 class="item-title">{{ ev.title }}</h3>
              <p class="item-meta">
                📍 {{ ev.location }} · 👥 {{ ev.max_participants }} places
              </p>
            </div>
            <div class="item-actions">
              <RouterLink
                :to="`/events/${ev.id_event}`"
                class="btn btn-ghost btn-sm"
                >Voir</RouterLink
              >
              <RouterLink
                :to="`/events/${ev.id_event}/edit`"
                class="btn btn-secondary btn-sm"
                >Modifier</RouterLink
              >
              <button class="btn btn-danger btn-sm" @click="openDeleteModal(ev)">
                Supprimer
              </button>
            </div>
          </div>

          <div
            v-else
            v-for="(reg, i) in items"
            :key="reg.id"
            class="item-card card anim-up"
            :class="`d${Math.min(i + 2, 6)}`"
          >
            <div class="item-info">
              <div class="item-top">
                <span class="badge" :class="statusClass(reg.status)">{{
                  statusLabel(reg.status)
                }}</span>
                <span class="item-date">{{ formatDate(reg.event_date) }}</span>
              </div>
              <h3 class="item-title">{{ reg.title }}</h3>
              <p class="item-meta">
                Inscrit le {{ formatDate(reg.registered_at) }}
              </p>
            </div>
            <div class="item-actions">
              <RouterLink
                :to="`/events/${reg.id_event}`"
                class="btn btn-ghost btn-sm"
                >Voir</RouterLink
              >
              <button
                class="btn btn-danger btn-sm"
                @click="openCancelModal(reg)"
                :disabled="reg.status === 'cancelled'"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>

        <div v-else class="calendar-view card anim-up d2">
          <div class="calendar-top">
            <button class="icon-btn" @click="monthShift(-1)">‹</button>
            <h3 class="calendar-title">{{ monthTitle }}</h3>
            <button class="icon-btn" @click="monthShift(1)">›</button>
          </div>
          <div class="calendar-weekdays">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mer</span>
            <span>Jeu</span>
            <span>Ven</span>
            <span>Sam</span>
            <span>Dim</span>
          </div>
          <div class="calendar-grid">
            <div v-for="day in calendarDays" :key="day.key" class="calendar-cell" :class="{ 'is-empty': day.isEmpty }">
              <div class="calendar-cell-head">
                <span>{{ day.date }}</span>
              </div>
              <div class="calendar-cell-events">
                <RouterLink
                  v-for="ev in day.events"
                  :key="`${ev.id_event}-${ev.event_date}`"
                  :to="`/events/${ev.id_event}`"
                  class="calendar-event"
                >
                  <span>{{ ev.title }}</span>
                  <small>{{ new Date(ev.event_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}</small>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ORGANIZER : mes inscriptions en tant que participant -->
      <div v-else-if="auth.isOrganizer && tab === 'myregs'">
        <div class="view-switch-wrap">
          <div class="segmented-view">
            <button class="segment-btn" :class="{ active: registrationView === 'list' }" @click="registrationView = 'list'">
              Liste
            </button>
            <button class="segment-btn" :class="{ active: registrationView === 'calendar' }" @click="registrationView = 'calendar'">
              Calendrier par mois
            </button>
          </div>
        </div>

        <div v-if="registrationView === 'list'" class="items-list anim-up d2">
          <div v-if="!myRegs.length" class="empty-state">
            <div class="empty-icon">🎟️</div>
            <h3>Aucune inscription</h3>
            <p>Explorez les événements disponibles.</p>
            <RouterLink to="/events" class="btn btn-primary" style="margin-top:16px">Voir les événements</RouterLink>
          </div>
          <div
            v-for="(reg, i) in myRegs"
            :key="reg.id"
            class="item-card card anim-up"
            :class="`d${Math.min(i + 2, 6)}`"
          >
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
              <button
                class="btn btn-danger btn-sm"
                @click="openCancelOrgaRegModal(reg)"
                :disabled="reg.status === 'cancelled'"
              >Annuler</button>
            </div>
          </div>
        </div>

        <div v-else class="calendar-view card anim-up d2">
          <div class="calendar-top">
            <button class="icon-btn" @click="monthShift(-1)">‹</button>
            <h3 class="calendar-title">{{ monthTitle }}</h3>
            <button class="icon-btn" @click="monthShift(1)">›</button>
          </div>
          <div class="calendar-weekdays">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mer</span>
            <span>Jeu</span>
            <span>Ven</span>
            <span>Sam</span>
            <span>Dim</span>
          </div>
          <div class="calendar-grid">
            <div v-for="day in calendarDays" :key="day.key" class="calendar-cell" :class="{ 'is-empty': day.isEmpty }">
              <div class="calendar-cell-head">
                <span>{{ day.date }}</span>
              </div>
              <div class="calendar-cell-events">
                <RouterLink
                  v-for="ev in day.events"
                  :key="`${ev.id_event}-${ev.event_date}`"
                  :to="`/events/${ev.id_event}`"
                  class="calendar-event"
                >
                  <span>{{ ev.title }}</span>
                  <small>{{ new Date(ev.event_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }}</small>
                </RouterLink>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ORGANIZER : validations inscriptions -->
      <div v-if="auth.isOrganizer && tab === 'validations'" class="items-list anim-up d2">
        <div v-if="!validations.length" class="empty-state">
          <div class="empty-icon">✅</div>
          <h3>Aucune inscription</h3>
          <p>Les inscriptions à vos événements apparaîtront ici.</p>
        </div>
        <div
          v-for="(reg, i) in validations"
          :key="reg.registration_id"
          class="item-card card anim-up"
          :class="`d${Math.min(i + 2, 6)}`"
        >
          <div class="item-info">
            <div class="item-top">
              <span class="badge" :class="statusClass(reg.status)">{{ statusLabel(reg.status) }}</span>
              <span class="item-date">{{ formatDate(reg.event_date) }}</span>
            </div>
            <h3 class="item-title">{{ reg.title }}</h3>
            <p class="item-meta">👤 {{ reg.firstname }} {{ reg.lastname }} · {{ reg.email }}</p>
            <p class="item-meta">Inscrit le {{ formatDate(reg.registered_at) }}</p>
          </div>
          <div class="item-actions" v-if="reg.status === 'pending'">
            <button class="btn btn-ok btn-sm" @click="openValidateModal(reg)">✔ Valider</button>
            <button class="btn btn-danger btn-sm" @click="openRefuseModal(reg)">✘ Refuser</button>
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
          <RouterLink to="/profile" class="btn btn-primary btn-block"
            >Gérer mes données RGPD →</RouterLink
          >
        </div>
      </div>
    </div>
  </div>

  <!-- Modal de confirmation -->
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modal.show" class="modal-overlay" @click.self="closeModal">
        <div class="modal-box card">
          <h3 class="modal-title">{{ modal.title }}</h3>
          <p class="modal-msg">{{ modal.message }}</p>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="closeModal">Annuler</button>
            <button class="btn" :class="modal.btnClass" @click="confirmModal">{{ modal.btnLabel }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Toast notification -->
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="toast.show" class="toast" :class="`toast-${toast.type}`">
        {{ toast.message }}
      </div>
    </Transition>
  </Teleport>
</div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAuthStore } from "../stores/auth";
import api from "../api/axios";

const auth = useAuthStore();
const items = ref([]);
const validations = ref([]);
const myRegs = ref([]);
const loading = ref(true);
const tab = ref("events");
const registrationView = ref("list");
const calendarCursor = ref(new Date());

// ── Modal & Toast ──────────────────────────────────────────────────────────
const modal = ref({ show: false, title: "", message: "", btnLabel: "Confirmer", btnClass: "btn-danger", pending: null });
const toast = ref({ show: false, message: "", type: "success" });

function showToast(message, type = "success") {
  toast.value = { show: true, message, type };
  setTimeout(() => { toast.value.show = false; }, 3000);
}
function closeModal() { modal.value.show = false; }
function confirmModal() {
  if (modal.value.pending) modal.value.pending();
  closeModal();
}

// ── Computed ────────────────────────────────────────────────────────────────
const pendingCount = computed(() => validations.value.filter((r) => r.status === "pending").length);

const monthTitle = computed(() => {
  return new Date(calendarCursor.value.getFullYear(), calendarCursor.value.getMonth(), 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
});

const activeCalendarItems = computed(() => {
  if (tab.value === 'myregs' && auth.isOrganizer) {
    return myRegs.value;
  }
  return items.value;
});

const calendarDays = computed(() => {
  const year = calendarCursor.value.getFullYear();
  const month = calendarCursor.value.getMonth();
  const start = new Date(year, month, 1);
  const firstWeekDay = (start.getDay() + 6) % 7;
  const startGrid = new Date(year, month, 1 - firstWeekDay);
  const days = [];

  const source = activeCalendarItems.value;

  for (let i = 0; i < 42; i += 1) {
    const d = new Date(startGrid.getFullYear(), startGrid.getMonth(), startGrid.getDate() + i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    const events = source.filter((ev) => {
      const evDate = new Date(ev.event_date);
      return (
        evDate.getFullYear() === d.getFullYear() &&
        evDate.getMonth() === d.getMonth() &&
        evDate.getDate() === d.getDate()
      );
    });

    days.push({
      key,
      date: d.getDate(),
      isEmpty: d.getMonth() !== month,
      events,
    });
  }

  return days;
});

const initials = computed(() => {
  const u = auth.user;
  return u ? (u.firstname?.[0] || "") + (u.lastname?.[0] || "") : "?";
});
const roleLabel = computed(
  () =>
    ({
      USER: "Participant",
      ORGANIZER: "Organisateur",
      ADMIN: "Administrateur",
    })[auth.user?.role] || auth.user?.role,
);
const joinDate = computed(() =>
  auth.user?.created_at
    ? new Date(auth.user.created_at).toLocaleDateString("fr-FR", {
        month: "long",
        year: "numeric",
      })
    : "",
);

// ── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function statusClass(s) {
  return (
    { confirmed: "badge-ok", pending: "badge-warn", cancelled: "badge-err" }[s] || "badge-muted"
  );
}
function statusLabel(s) {
  return (
    { confirmed: "Confirmé", pending: "En attente", cancelled: "Refusé" }[s] || s
  );
}

// ── Data loading ────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    if (auth.isOrganizer) {
      const [eventsRes, regsRes, myRegsRes] = await Promise.all([
        api.get(`/me/${auth.user.id_user}`),
        api.get(`/registrations/orga/${auth.user.id_user}/event`),
        api.get(`/registrations/${auth.user.id_user}`),
      ]);
      items.value = eventsRes.data.events || [];
      validations.value = Array.isArray(regsRes.data) ? regsRes.data : [];
      myRegs.value = Array.isArray(myRegsRes.data) ? myRegsRes.data : [];
    } else {
      const { data } = await api.get(`/registrations/${auth.user.id_user}`);
      items.value = Array.isArray(data) ? data : [];
      if (items.value.length) {
        const first = new Date(items.value[0].event_date);
        calendarCursor.value = new Date(first.getFullYear(), first.getMonth(), 1);
      }
    }
  } catch (e) {
    items.value = [];
  } finally {
    loading.value = false;
  }
});

function monthShift(value) {
  const next = new Date(calendarCursor.value);
  next.setMonth(next.getMonth() + value);
  calendarCursor.value = next;
}

// ── Modal openers ────────────────────────────────────────────────────────────
function openDeleteModal(ev) {
  modal.value = {
    show: true,
    title: "🗑 Supprimer l'événement",
    message: `Êtes-vous sûr de vouloir supprimer "${ev.title}" ? Cette action est irréversible.`,
    btnLabel: "Supprimer",
    btnClass: "btn-danger",
    pending: () => doDeleteEvent(ev),
  };
}

function openCancelOrgaRegModal(reg) {
  modal.value = {
    show: true,
    title: "Annuler l'inscription",
    message: `Annuler votre inscription à "${reg.title}" ?`,
    btnLabel: "Annuler l'inscription",
    btnClass: "btn-danger",
    pending: async () => {
      try {
        await api.delete(`/registrations/${reg.id}`);
        const idx = myRegs.value.findIndex((r) => r.id === reg.id);
        if (idx !== -1) myRegs.value[idx] = { ...myRegs.value[idx], status: "cancelled" };
        showToast("Inscription annulée");
      } catch (e) {
        showToast(e.response?.data?.message || "Erreur", "error");
      }
    },
  };
}

function openCancelModal(reg) {
  modal.value = {
    show: true,
    title: "Annuler l'inscription",
    message: `Annuler votre inscription à "${reg.title}" ?`,
    btnLabel: "Annuler l'inscription",
    btnClass: "btn-danger",
    pending: () => doCancelReg(reg),
  };
}

function openValidateModal(reg) {
  modal.value = {
    show: true,
    title: "✅ Valider l'inscription",
    message: `Valider l'inscription de ${reg.firstname} ${reg.lastname} à "${reg.title}" ?`,
    btnLabel: "Valider",
    btnClass: "btn-ok",
    pending: () => doUpdateStatus(reg, "confirmed"),
  };
}

function openRefuseModal(reg) {
  modal.value = {
    show: true,
    title: "❌ Refuser l'inscription",
    message: `Refuser l'inscription de ${reg.firstname} ${reg.lastname} à "${reg.title}" ?`,
    btnLabel: "Refuser",
    btnClass: "btn-danger",
    pending: () => doUpdateStatus(reg, "cancelled"),
  };
}

// ── Actions ──────────────────────────────────────────────────────────────────
async function doDeleteEvent(ev) {
  try {
    await api.delete(`/event/${ev.id_event}`);
    items.value = items.value.filter((e) => e.id_event !== ev.id_event);
    showToast(`"${ev.title}" supprimé avec succès`);
  } catch (e) {
    showToast(e.response?.data?.message || "Erreur lors de la suppression", "error");
  }
}

async function doCancelReg(reg) {
  try {
    await api.delete(`/registrations/${reg.id}`);
    const idx = items.value.findIndex((r) => r.id === reg.id);
    if (idx !== -1) items.value[idx] = { ...items.value[idx], status: "cancelled" };
    showToast("Inscription annulée");
  } catch (e) {
    showToast(e.response?.data?.message || "Erreur", "error");
  }
}

async function doUpdateStatus(reg, status) {
  try {
    await api.patch(`/registrations/${reg.registration_id}/status`, { status });
    const idx = validations.value.findIndex((r) => r.registration_id === reg.registration_id);
    if (idx !== -1) validations.value[idx] = { ...validations.value[idx], status };
    showToast(status === "confirmed" ? "Inscription validée ✓" : "Inscription refusée");
  } catch (e) {
    showToast(e.response?.data?.message || "Erreur", "error");
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
.dash-welcome {
  display: flex;
  align-items: center;
  gap: 20px;
}
.dash-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--grad-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  flex-shrink: 0;
}
.dash-title {
  font-size: clamp(20px, 3vw, 28px);
  margin-bottom: 4px;
}
.dash-sub {
  font-size: 14px;
  color: var(--c-text-2);
}

.dash-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 32px;
  border-bottom: 1px solid var(--c-border);
}
.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: none;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: var(--c-text-2);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: var(--t-fast);
}
.tab-btn:hover {
  color: var(--c-text);
}
.tab-btn.active {
  color: var(--c-primary);
  border-bottom-color: var(--c-primary);
}
.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: var(--c-primary-lite);
  color: var(--c-primary);
  border-radius: var(--r-full);
  font-size: 11px;
  font-weight: 700;
}

.view-switch-wrap {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}
.segmented-view {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  border-radius: var(--r-md);
  background: var(--c-card);
  border: 1px solid var(--c-border);
}
.segment-btn {
  border: none;
  background: transparent;
  color: var(--c-text-2);
  padding: 8px 14px;
  font-size: 13px;
  border-radius: var(--r-sm);
  cursor: pointer;
}
.segment-btn.active {
  background: var(--c-primary);
  color: white;
}

.calendar-view {
  padding: 20px;
}
.calendar-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
.calendar-title {
  font-size: 18px;
  margin: 0;
}
.icon-btn {
  border: 1px solid var(--c-border);
  background: var(--c-card);
  color: var(--c-text);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
}
.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(52px, 1fr));
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  color: var(--c-text-2);
  text-align: center;
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(52px, 1fr));
  gap: 8px;
}
.calendar-cell {
  min-height: 104px;
  background: var(--c-card);
  border-radius: var(--r-sm);
  border: 1px solid var(--c-border);
  padding: 8px;
}
.calendar-cell.is-empty {
  opacity: 0.45;
}
.calendar-cell-head {
  display: flex;
  justify-content: flex-end;
  font-size: 12px;
  color: var(--c-text-2);
}
.calendar-cell-events {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}
.calendar-event {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px;
  background: var(--c-primary-lite);
  border-left: 3px solid var(--c-primary);
  border-radius: 6px;
  text-decoration: none;
  color: var(--c-text);
  font-size: 11px;
  line-height: 1.2;
}
.calendar-event small {
  color: var(--c-text-2);
}
.items-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.item-card {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.item-info {
  flex: 1;
  min-width: 0;
}
.item-top {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.item-date {
  font-size: 12px;
  color: var(--c-text-2);
}
.item-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.item-meta {
  font-size: 13px;
  color: var(--c-text-2);
}
.item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.ps-card {
  padding: 28px;
  max-width: 500px;
}
.ps-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 0;
}
.ps-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--grad-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.ps-email {
  font-size: 14px;
  color: var(--c-text-2);
  margin: 4px 0 8px;
}

@media (max-width: 640px) {
  .dash-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .item-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .item-actions {
    width: 100%;
  }
  .item-actions .btn {
    flex: 1;
    justify-content: center;
  }
}

/* ── Modal ──────────────────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}
.modal-box {
  max-width: 440px;
  width: 100%;
  padding: 28px;
}
.modal-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
}
.modal-msg {
  font-size: 14px;
  color: var(--c-text-2);
  line-height: 1.6;
  margin-bottom: 24px;
}
.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

/* Modal transition */
.modal-enter-active, .modal-leave-active { transition: all 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.95); }

/* ── Toast ──────────────────────────────────────── */
.toast {
  position: fixed;
  bottom: 28px;
  right: 28px;
  padding: 13px 22px;
  border-radius: var(--r-sm);
  font-size: 14px;
  font-weight: 500;
  z-index: 2000;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  pointer-events: none;
}
.toast-success { background: var(--c-ok); color: #fff; }
.toast-error   { background: var(--c-err); color: #fff; }
.toast-enter-active, .toast-leave-active { transition: all 0.3s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(10px); }

/* ── Bouton valider ─────────────────────────────── */
.btn-ok {
  background: var(--c-ok);
  color: #fff;
  border-color: transparent;
}
.btn-ok:hover { background: #059669; }

/* ── Badge pending en warning dans validations ───── */
.tab-count-warn {
  background: rgba(245, 158, 11, 0.2);
  color: #f59e0b;
}
</style>
