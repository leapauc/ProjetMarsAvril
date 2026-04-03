<template>
  <div>
    <div class="page">
      <div class="container">
        <!-- Header -->
        <div class="admin-header anim-up">
          <div class="admin-title-wrap">
            <div class="admin-badge">ADMIN</div>
            <div>
              <h1 class="admin-title">Espace administrateur</h1>
              <p class="admin-sub">
                Gestion globale de la plateforme EventFlow
              </p>
            </div>
          </div>
          <!-- Stats rapides -->
          <div class="admin-stats">
            <div class="stat-chip">
              <span class="stat-num">{{ stats.events }}</span>
              <span class="stat-label">Événements</span>
            </div>
            <div class="stat-chip">
              <span class="stat-num">{{ stats.users }}</span>
              <span class="stat-label">Utilisateurs</span>
            </div>
            <div class="stat-chip">
              <span class="stat-num">{{ stats.pending }}</span>
              <span class="stat-label">Inscriptions en attente</span>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="dash-tabs anim-up d1">
          <button
            class="tab-btn"
            :class="{ active: tab === 'events' }"
            @click="tab = 'events'"
          >
            📅 Événements
            <span class="tab-count">{{ events.length }}</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: tab === 'users' }"
            @click="tab = 'users'"
          >
            👥 Utilisateurs
            <span class="tab-count">{{ users.length }}</span>
          </button>
          <button
            class="tab-btn"
            :class="{ active: tab === 'activity' }"
            @click="tab = 'activity'"
          >
            📋 Activité globale
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loader-wrap"><div class="loader" /></div>

        <!-- ── ONGLET ÉVÉNEMENTS ─────────────────────────────────── -->
        <div v-else-if="tab === 'events'">
          <!-- Barre de recherche/filtres -->
          <div class="toolbar anim-up d2">
            <input
              v-model="eventSearch"
              class="search-input"
              placeholder="🔍 Rechercher un événement..."
            />
            <div class="select-wrap2">
              <select v-model="eventFilter" class="filter-select">
                <option value="all">Tous</option>
                <option value="published">Publiés</option>
                <option value="draft">Brouillons</option>
              </select>
            </div>
          </div>

          <div v-if="!filteredEvents.length" class="empty-state">
            <div class="empty-icon">📅</div>
            <h3>Aucun événement trouvé</h3>
          </div>

          <div class="items-list anim-up d2">
            <div
              v-for="(ev, i) in filteredEvents"
              :key="ev.id_event"
              class="item-card card"
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
                  📍 {{ ev.location }} · 👥 {{ ev.max_participants }} places ·
                  <span class="orga-chip"
                    >par {{ ev.orga_firstname }} {{ ev.orga_lastname }}</span
                  >
                </p>
              </div>
              <div class="item-actions">
                <RouterLink
                  :to="`/events/${ev.id_event}`"
                  class="btn btn-ghost btn-sm"
                  >Voir</RouterLink
                >
                <button
                  class="btn btn-danger btn-sm"
                  @click="openDeleteEventModal(ev)"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ── ONGLET UTILISATEURS ──────────────────────────────── -->
        <div v-else-if="tab === 'users'">
          <div class="toolbar anim-up d2">
            <input
              v-model="userSearch"
              class="search-input"
              placeholder="🔍 Nom, email..."
            />
            <div class="select-wrap2">
              <select v-model="roleFilter" class="filter-select">
                <option value="all">Tous les rôles</option>
                <option value="USER">USER</option>
                <option value="ORGANIZER">ORGANIZER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>

          <div v-if="!filteredUsers.length" class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>Aucun utilisateur trouvé</h3>
          </div>

          <div class="items-list anim-up d2">
            <div
              v-for="(u, i) in filteredUsers"
              :key="u.id_user"
              class="item-card card"
              :class="`d${Math.min(i + 2, 6)}`"
            >
              <div class="item-info">
                <div class="item-top">
                  <span class="badge" :class="roleClass(u.role)">{{
                    u.role
                  }}</span>
                  <span v-if="u.is_anonymized" class="badge badge-err"
                    >Anonymisé</span
                  >
                  <span class="item-date"
                    >Inscrit le {{ formatDate(u.created_at) }}</span
                  >
                </div>
                <h3 class="item-title">
                  {{
                    u.is_anonymized
                      ? "Utilisateur anonymisé"
                      : `${u.firstname} ${u.lastname}`
                  }}
                </h3>
                <p class="item-meta">{{ u.is_anonymized ? "—" : u.email }}</p>
              </div>
              <div class="item-actions" v-if="!u.is_anonymized">
                <!-- Changement de rôle -->
                <div class="select-wrap2">
                  <select
                    class="role-select"
                    :value="u.role"
                    @change="openChangeRoleModal(u, $event.target.value)"
                  >
                    <option value="USER">USER</option>
                    <option value="ORGANIZER">ORGANIZER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </div>
                <button
                  class="btn btn-danger btn-sm"
                  @click="openAnonymizeModal(u)"
                >
                  Anonymiser
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- ── ONGLET ACTIVITÉ ──────────────────────────────────── -->
        <div v-else-if="tab === 'activity'">
          <div class="toolbar anim-up d2">
            <input
              v-model="activitySearch"
              class="search-input"
              placeholder="🔍 Utilisateur, action, événement..."
            />
            <div class="select-wrap2">
              <select v-model="activityFilter" class="filter-select">
                <option value="all">Toutes les actions</option>
                <option value="consent_log">Consentements</option>
                <option value="user_action_log">Actions utilisateurs</option>
              </select>
            </div>
          </div>

          <div v-if="!filteredActivity.length" class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>Aucune activité trouvée</h3>
          </div>

          <div class="activity-table card anim-up d2">
            <table>
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Action</th>
                  <th>Événement lié</th>
                  <th>Date</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="log in filteredActivity"
                  :key="`${log.source}-${log.log_date}-${log.user_id}`"
                >
                  <td>{{ log.user_name || "—" }}</td>
                  <td>
                    <span class="badge" :class="actionClass(log.log_type)">{{
                      formatAction(log.log_type)
                    }}</span>
                  </td>
                  <td class="td-event">{{ log.related_event_title || "—" }}</td>
                  <td class="td-date">{{ formatDateTime(log.log_date) }}</td>
                  <td>
                    <span class="source-chip">{{ log.source }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="modal.show" class="modal-overlay" @click.self="closeModal">
          <div class="modal-box card">
            <h3 class="modal-title">{{ modal.title }}</h3>
            <p class="modal-msg">{{ modal.message }}</p>
            <div class="modal-actions">
              <button class="btn btn-secondary" @click="closeModal">
                Annuler
              </button>
              <button class="btn" :class="modal.btnClass" @click="confirmModal">
                {{ modal.btnLabel }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast -->
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
import api from "../api/axios";

// ── State ────────────────────────────────────────────────────────────────────
const loading = ref(true);
const tab = ref("events");
const events = ref([]);
const users = ref([]);
const activity = ref([]);

const eventSearch = ref("");
const eventFilter = ref("all");
const userSearch = ref("");
const roleFilter = ref("all");
const activitySearch = ref("");
const activityFilter = ref("all");

const modal = ref({
  show: false,
  title: "",
  message: "",
  btnLabel: "Confirmer",
  btnClass: "btn-danger",
  pending: null,
});
const toast = ref({ show: false, message: "", type: "success" });

// ── Stats ────────────────────────────────────────────────────────────────────
const stats = computed(() => ({
  events: events.value.length,
  users: users.value.filter((u) => !u.is_anonymized).length,
  pending: 0, // sera rempli si endpoint dispo
}));

// ── Filtered ─────────────────────────────────────────────────────────────────
const filteredEvents = computed(() => {
  return events.value.filter((ev) => {
    const matchSearch =
      !eventSearch.value ||
      ev.title.toLowerCase().includes(eventSearch.value.toLowerCase()) ||
      (ev.location || "")
        .toLowerCase()
        .includes(eventSearch.value.toLowerCase());
    const matchFilter =
      eventFilter.value === "all" ||
      (eventFilter.value === "published" && ev.is_published) ||
      (eventFilter.value === "draft" && !ev.is_published);
    return matchSearch && matchFilter;
  });
});

const filteredUsers = computed(() => {
  return users.value.filter((u) => {
    const q = userSearch.value.toLowerCase();
    const matchSearch =
      !q ||
      (u.firstname || "").toLowerCase().includes(q) ||
      (u.lastname || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q);
    const matchRole = roleFilter.value === "all" || u.role === roleFilter.value;
    return matchSearch && matchRole;
  });
});

const filteredActivity = computed(() => {
  return activity.value.filter((log) => {
    const q = activitySearch.value.toLowerCase();
    const matchSearch =
      !q ||
      (log.user_name || "").toLowerCase().includes(q) ||
      (log.log_type || "").toLowerCase().includes(q) ||
      (log.related_event_title || "").toLowerCase().includes(q);
    const matchFilter =
      activityFilter.value === "all" || log.source === activityFilter.value;
    return matchSearch && matchFilter;
  });
});

// ── Data loading ─────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const [evRes, usersRes, actRes] = await Promise.all([
      api.get("/event/all"),
      api.get("/user"),
      api.get("/history"),
    ]);
    events.value = Array.isArray(evRes.data) ? evRes.data : [];
    users.value = Array.isArray(usersRes.data) ? usersRes.data : [];
    activity.value = Array.isArray(actRes.data) ? actRes.data : [];
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function roleClass(r) {
  return (
    { USER: "badge-muted", ORGANIZER: "badge-primary", ADMIN: "badge-admin" }[
      r
    ] || "badge-muted"
  );
}
function actionClass(a) {
  if (!a) return "badge-muted";
  if (a.includes("deleted") || a.includes("cancelled") || a.includes("refused"))
    return "badge-err";
  if (
    a.includes("validated") ||
    a.includes("confirmed") ||
    a.includes("exported")
  )
    return "badge-ok";
  if (a.includes("registered") || a.includes("created")) return "badge-primary";
  return "badge-warn";
}
const ACTION_LABELS = {
  user_registered: "Inscription",
  user_registration_validated: "Validation inscription",
  user_data_modified: "Modification données",
  event_registration: "Inscrit à event",
  event_registration_cancelled: "Annulation event",
  notification_sent: "Notification",
  event_created: "Event créé",
  event_updated: "Event modifié",
  event_deleted: "Event supprimé",
  data_deleted: "Anonymisation",
  data_viewed: "Consultation données",
  data_exported_pdf: "Export PDF",
  data_exported: "Export JSON",
  consent_given: "Consentement donné",
  consent_withdrawn: "Consentement retiré",
  consent_updated: "Consentement modifié",
};
function formatAction(a) {
  return ACTION_LABELS[a] || a;
}

// ── Modal / Toast ─────────────────────────────────────────────────────────────
function showToast(message, type = "success") {
  toast.value = { show: true, message, type };
  setTimeout(() => {
    toast.value.show = false;
  }, 3000);
}
function closeModal() {
  modal.value.show = false;
}
function confirmModal() {
  if (modal.value.pending) modal.value.pending();
  closeModal();
}

// ── Modal openers ─────────────────────────────────────────────────────────────
function openDeleteEventModal(ev) {
  modal.value = {
    show: true,
    title: "🗑 Supprimer l'événement",
    message: `Supprimer définitivement "${ev.title}" ? Toutes les inscriptions liées seront perdues.`,
    btnLabel: "Supprimer",
    btnClass: "btn-danger",
    pending: () => doDeleteEvent(ev),
  };
}
function openAnonymizeModal(u) {
  modal.value = {
    show: true,
    title: "🔒 Anonymiser l'utilisateur",
    message: `Anonymiser ${u.firstname} ${u.lastname} (${u.email}) ? Cette action est irréversible (RGPD).`,
    btnLabel: "Anonymiser",
    btnClass: "btn-danger",
    pending: () => doAnonymize(u),
  };
}
function openChangeRoleModal(u, newRole) {
  if (newRole === u.role) return;
  modal.value = {
    show: true,
    title: "🔑 Changer le rôle",
    message: `Passer ${u.firstname} ${u.lastname} de ${u.role} à ${newRole} ?`,
    btnLabel: "Confirmer",
    btnClass: "btn-primary",
    pending: () => doChangeRole(u, newRole),
  };
}

// ── Actions ───────────────────────────────────────────────────────────────────
async function doDeleteEvent(ev) {
  try {
    await api.delete(`/event/${ev.id_event}`);
    events.value = events.value.filter((e) => e.id_event !== ev.id_event);
    showToast(`"${ev.title}" supprimé`);
  } catch (e) {
    showToast(e.response?.data?.message || "Erreur", "error");
  }
}
async function doAnonymize(u) {
  try {
    await api.delete(`/user/${u.id_user}`);
    const idx = users.value.findIndex((x) => x.id_user === u.id_user);
    if (idx !== -1)
      users.value[idx] = {
        ...users.value[idx],
        is_anonymized: true,
        firstname: "Utilisateur supprimé",
        lastname: "Utilisateur supprimé",
        email: "—",
      };
    showToast("Utilisateur anonymisé (RGPD)");
  } catch (e) {
    showToast(e.response?.data?.message || "Erreur", "error");
  }
}
async function doChangeRole(u, newRole) {
  try {
    await api.put(`/user/${u.id_user}`, { role: newRole });
    const idx = users.value.findIndex((x) => x.id_user === u.id_user);
    if (idx !== -1) users.value[idx] = { ...users.value[idx], role: newRole };
    showToast(`Rôle mis à jour : ${newRole}`);
  } catch (e) {
    showToast(e.response?.data?.message || "Erreur", "error");
  }
}
</script>

<style scoped>
/* ── Header admin ───────────────────────────────── */
.admin-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 36px;
  flex-wrap: wrap;
}
.admin-title-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
}
.admin-badge {
  padding: 4px 10px;
  background: linear-gradient(135deg, #7c3aed, #dc2626);
  border-radius: var(--r-sm);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #fff;
  flex-shrink: 0;
}
.admin-title {
  font-size: clamp(20px, 3vw, 28px);
  margin-bottom: 4px;
}
.admin-sub {
  font-size: 14px;
  color: var(--c-text-2);
}

/* Stats rapides */
.admin-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.stat-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
  min-width: 90px;
}
.stat-num {
  font-size: 26px;
  font-weight: 800;
  background: var(--grad-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.stat-label {
  font-size: 11px;
  color: var(--c-text-2);
  margin-top: 2px;
  text-align: center;
}

/* ── Toolbar ─────────────────────────────────────── */
.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 14px;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  color: var(--c-text);
  font-size: 14px;
  outline: none;
  transition: var(--t-fast);
}
.search-input:focus {
  border-color: var(--c-primary);
}
.filter-select {
  padding: 10px 14px;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  color: var(--c-text);
  font-size: 14px;
  cursor: pointer;
  outline: none;
}

/* ── Items list ──────────────────────────────────── */
.items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.item-card {
  padding: 18px 22px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}
.item-info {
  flex: 1;
  min-width: 0;
}
.item-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}
.item-date {
  font-size: 12px;
  color: var(--c-text-2);
}
.item-title {
  font-size: 15px;
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
  align-items: center;
}
.orga-chip {
  color: var(--c-primary);
  font-size: 12px;
}

/* Role select */
.role-select {
  padding: 6px 10px;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-sm);
  color: var(--c-text);
  font-size: 13px;
  cursor: pointer;
}

/* ── Activity table ──────────────────────────────── */
.activity-table {
  overflow-x: auto;
  padding: 0;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
thead tr {
  border-bottom: 1px solid var(--c-border);
}
th {
  padding: 12px 16px;
  text-align: left;
  font-size: 11px;
  font-weight: 700;
  color: var(--c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
}
td {
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  vertical-align: middle;
}
tbody tr:hover {
  background: rgba(255, 255, 255, 0.02);
}
.td-date {
  color: var(--c-text-2);
  white-space: nowrap;
}
.td-event {
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.source-chip {
  display: inline-block;
  padding: 2px 8px;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-full);
  font-size: 11px;
  color: var(--c-text-2);
}

/* Badge admin */
.badge-admin {
  background: rgba(220, 38, 38, 0.15);
  color: #f87171;
}

/* ── Modal ───────────────────────────────────────── */
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
.modal-enter-active,
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* ── Toast ───────────────────────────────────────── */
.toast {
  position: fixed;
  bottom: 28px;
  right: 28px;
  padding: 13px 22px;
  border-radius: var(--r-sm);
  font-size: 14px;
  font-weight: 500;
  z-index: 2000;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  pointer-events: none;
}
.toast-success {
  background: var(--c-ok);
  color: #fff;
}
.toast-error {
  background: var(--c-err);
  color: #fff;
}
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* ── Loader ──────────────────────────────────────── */
.loader-wrap {
  display: flex;
  justify-content: center;
  padding: 60px;
}
.loader {
  width: 36px;
  height: 36px;
  border: 3px solid var(--c-border);
  border-top-color: var(--c-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* ── Empty state ─────────────────────────────────── */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--c-text-2);
}
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}
.empty-state h3 {
  font-size: 18px;
  color: var(--c-text);
  margin-bottom: 8px;
}

/* Tabs (réutilise les variables globales) */
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

@media (max-width: 640px) {
  .admin-header {
    flex-direction: column;
  }
  .item-card {
    flex-direction: column;
    align-items: flex-start;
  }
  .item-actions {
    width: 100%;
  }
  .item-actions .btn,
  .item-actions .role-select {
    flex: 1;
  }
  th:nth-child(4),
  td:nth-child(4),
  th:nth-child(5),
  td:nth-child(5) {
    display: none;
  }
}
</style>
