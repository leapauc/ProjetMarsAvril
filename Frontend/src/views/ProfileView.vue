<template>
  <div class="page">
    <div class="container" style="max-width: 840px">
      <div v-if="loading" class="loader-wrap"><div class="loader" /></div>

      <template v-else-if="profileData">
        <!-- Header profil -->
        <div class="profile-hero card anim-up">
          <div class="ph-avatar">{{ initials }}</div>
          <div class="ph-info">
            <h1 class="ph-name">
              {{ profileData.firstname }} {{ profileData.lastname }}
            </h1>
            <p class="ph-email">{{ profileData.email }}</p>
            <div class="ph-badges">
              <span class="badge badge-primary">{{ profileData.role }}</span>
              <span class="badge badge-muted" v-if="profileData.is_anonymized"
                >Anonymisé</span
              >
            </div>
          </div>
          <div class="ph-meta">
            <div class="ph-meta-item">
              <span class="ph-meta-val">{{
                (profileData.events || []).length
              }}</span>
              <span class="ph-meta-label">{{
                auth.isOrganizer ? "Événements" : "Inscriptions"
              }}</span>
            </div>
            <div class="ph-meta-item">
              <span class="ph-meta-val">{{ consentVersion }}</span>
              <span class="ph-meta-label">Consentement</span>
            </div>
          </div>
        </div>

        <!-- Onglets -->
        <div class="profile-tabs anim-up d1">
          <button
            class="tab-btn"
            :class="{ active: tab === 'info' }"
            @click="tab = 'info'"
          >
            👤 Informations
          </button>
          <button
            class="tab-btn"
            :class="{ active: tab === 'rgpd' }"
            @click="tab = 'rgpd'"
          >
            🔒 Mes données RGPD
          </button>
        </div>

        <!-- ===== TAB : INFOS ===== -->
        <div v-if="tab === 'info'" class="tab-panel anim-up d2">
          <div class="info-card card">
            <div v-if="!editMode" class="info-view">
              <div class="info-grid">
                <div class="info-field">
                  <span class="info-label">Prénom</span>
                  <span class="info-val">{{ profileData.firstname }}</span>
                </div>
                <div class="info-field">
                  <span class="info-label">Nom</span>
                  <span class="info-val">{{ profileData.lastname }}</span>
                </div>
                <div class="info-field">
                  <span class="info-label">Email</span>
                  <span class="info-val">{{ profileData.email }}</span>
                </div>
                <div class="info-field">
                  <span class="info-label">Téléphone</span>
                  <span class="info-val">{{
                    profileData.phone || "Non renseigné"
                  }}</span>
                </div>
                <div class="info-field">
                  <span class="info-label">Rôle</span>
                  <span class="info-val">{{ profileData.role }}</span>
                </div>
                <div class="info-field">
                  <span class="info-label">Inscrit le</span>
                  <span class="info-val">{{
                    formatDate(profileData.created_at)
                  }}</span>
                </div>
              </div>
              <button
                class="btn btn-secondary"
                style="margin-top: 8px"
                @click="startEdit"
              >
                ✏️ Modifier mes informations
              </button>
            </div>

            <form v-else @submit.prevent="saveEdit" class="edit-form">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Prénom</label>
                  <input
                    v-model="editForm.firstname"
                    type="text"
                    class="form-input"
                    required
                  />
                </div>
                <div class="form-group">
                  <label class="form-label">Nom</label>
                  <input
                    v-model="editForm.lastname"
                    type="text"
                    class="form-input"
                    required
                  />
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input
                  v-model="editForm.email"
                  type="email"
                  class="form-input"
                  required
                />
              </div>
              <div class="form-group">
                <label class="form-label"
                  >Téléphone <span class="form-hint">(optionnel)</span></label
                >
                <input v-model="editForm.phone" type="tel" class="form-input" />
              </div>
              <div v-if="editError" class="alert alert-error">
                {{ editError }}
              </div>
              <div v-if="editSuccess" class="alert alert-success">
                {{ editSuccess }}
              </div>
              <div class="edit-actions">
                <button
                  type="button"
                  class="btn btn-secondary"
                  @click="editMode = false"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  class="btn btn-primary"
                  :disabled="editLoading"
                >
                  <span v-if="editLoading" class="btn-loader" />
                  {{ editLoading ? "Enregistrement…" : "Enregistrer" }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- ===== TAB : RGPD ===== -->
        <div v-if="tab === 'rgpd'" class="tab-panel anim-up d2">
          <!-- Export -->
          <div class="rgpd-card card">
            <h2 class="rgpd-section-title">📦 Exporter mes données</h2>
            <p class="rgpd-desc">
              Téléchargez une copie complète de vos données personnelles
              conformément au RGPD (droit à la portabilité).
            </p>
            <div class="rgpd-actions">
              <button class="btn btn-secondary" @click="exportJSON">
                📄 Export en JSON
              </button>
              <button class="btn btn-secondary" @click="exportPDF">
                📋 Export en PDF
              </button>
            </div>
          </div>

          <!-- Consentement -->
          <div class="rgpd-card card">
            <h2 class="rgpd-section-title">✅ Consentement</h2>
            <div class="consent-info">
              <div class="ci-row">
                <span>Version acceptée</span
                ><strong>{{ profileData.consent_version }}</strong>
              </div>
              <div class="ci-row">
                <span>Date d'acceptation</span
                ><strong>{{ formatDate(profileData.consent_date) }}</strong>
              </div>
            </div>
          </div>

          <!-- Anonymisation -->
          <div class="rgpd-card card danger-zone">
            <h2 class="rgpd-section-title danger">⚠️ Zone de danger</h2>
            <p class="rgpd-desc">
              L'anonymisation remplace vos données personnelles par des valeurs
              neutres. Votre compte reste actif mais vos informations seront
              effacées.
              <strong>Cette action est irréversible.</strong>
            </p>
            <button
              class="btn btn-danger"
              @click="showAnonymizeModal = true"
              :disabled="profileData.is_anonymized"
            >
              {{
                profileData.is_anonymized
                  ? "Compte déjà anonymisé"
                  : "🗑️ Anonymiser mon compte"
              }}
            </button>
          </div>
        </div>
      </template>

      <!-- Modal anonymisation -->
      <Transition name="fade">
        <div
          v-if="showAnonymizeModal"
          class="modal-overlay"
          @click.self="showAnonymizeModal = false"
        >
          <div class="modal-box">
            <h2 class="modal-title">⚠️ Confirmer l'anonymisation</h2>
            <p
              style="color: var(--c-text-2); font-size: 14px; line-height: 1.6"
            >
              Votre prénom et nom seront remplacés par "Utilisateur supprimé",
              votre email hashé, votre téléphone effacé. Cette action est
              <strong>définitive et irréversible</strong>.
            </p>
            <div v-if="anonError" class="alert alert-error">
              {{ anonError }}
            </div>
            <div class="modal-actions">
              <button
                class="btn btn-secondary"
                @click="showAnonymizeModal = false"
              >
                Annuler
              </button>
              <button
                class="btn btn-danger"
                @click="anonymize"
                :disabled="anonLoading"
              >
                <span v-if="anonLoading" class="btn-loader" />
                {{
                  anonLoading ? "Anonymisation…" : "Confirmer l'anonymisation"
                }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import api from "../api/axios";

const auth = useAuthStore();
const router = useRouter();

const profileData = ref(null);
const loading = ref(true);
const tab = ref("info");
const editMode = ref(false);
const editLoading = ref(false);
const editError = ref("");
const editSuccess = ref("");
const showAnonymizeModal = ref(false);
const anonLoading = ref(false);
const anonError = ref("");

const editForm = reactive({
  firstname: "",
  lastname: "",
  email: "",
  phone: "",
});

const initials = computed(() => {
  const d = profileData.value;
  return d ? (d.firstname?.[0] || "") + (d.lastname?.[0] || "") : "?";
});
const consentVersion = computed(
  () => profileData.value?.consent_version || "—",
);

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function startEdit() {
  const d = profileData.value;
  editForm.firstname = d.firstname;
  editForm.lastname = d.lastname;
  editForm.email = d.email;
  editForm.phone = d.phone || "";
  editError.value = editSuccess.value = "";
  editMode.value = true;
}

async function saveEdit() {
  editError.value = editSuccess.value = "";
  editLoading.value = true;
  try {
    const { data } = await api.put(`/me/${auth.user.id_user}`, editForm);
    profileData.value = { ...profileData.value, ...data.user };
    // Mettre à jour le store aussi
    auth.user.firstname = data.user.firstname;
    auth.user.lastname = data.user.lastname;
    auth.user.email = data.user.email;
    localStorage.setItem("user", JSON.stringify(auth.user));
    editSuccess.value = "Informations mises à jour !";
    setTimeout(() => {
      editMode.value = false;
    }, 1200);
  } catch (e) {
    editError.value =
      e.response?.data?.message || "Erreur lors de la mise à jour";
  } finally {
    editLoading.value = false;
  }
}

async function anonymize() {
  anonError.value = "";
  anonLoading.value = true;
  try {
    await api.delete(`/me/${auth.user.id_user}`);
    showAnonymizeModal.value = false;
    auth.logout();
    router.push("/?anonymized=1");
  } catch (e) {
    anonError.value =
      e.response?.data?.message || "Erreur lors de l'anonymisation";
  } finally {
    anonLoading.value = false;
  }
}

onMounted(async () => {
  try {
    const { data } = await api.get(`/me/${auth.user.id_user}`);
    profileData.value = data;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
});

const exportJSON = async () => {
  try {
    const response = await api.get(`/me/${auth.user.id_user}/export`, {
      responseType: "blob", // Important pour JSON également
    });
    const blob = new Blob([response.data], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_${auth.user.id_user}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Erreur export JSON", e);
  }
};

const exportPDF = async () => {
  try {
    const response = await api.get(`/me/${auth.user.id_user}/export/pdf`, {
      responseType: "blob",
    });
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `export_${auth.user.id_user}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (e) {
    console.error("Erreur export PDF", e);
  }
};
</script>

<style scoped>
/* Hero */
.profile-hero {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px 32px;
  margin-bottom: 28px;
}
.ph-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--grad-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
  text-transform: uppercase;
}
.ph-info {
  flex: 1;
}
.ph-name {
  font-size: 22px;
  font-weight: 800;
  margin-bottom: 4px;
}
.ph-email {
  font-size: 14px;
  color: var(--c-text-2);
  margin-bottom: 8px;
}
.ph-badges {
  display: flex;
  gap: 8px;
}
.ph-meta {
  display: flex;
  gap: 32px;
  margin-left: auto;
}
.ph-meta-item {
  text-align: center;
}
.ph-meta-val {
  display: block;
  font-size: 24px;
  font-weight: 800;
  background: var(--grad-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.ph-meta-label {
  font-size: 11px;
  color: var(--c-text-2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Tabs */
.profile-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--c-border);
}
.tab-btn {
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

/* Info card */
.info-card {
  padding: 28px;
}
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}
.info-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.info-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--c-text-3);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.info-val {
  font-size: 15px;
  color: var(--c-text);
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* RGPD cards */
.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.rgpd-card {
  padding: 24px;
}
.rgpd-section-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 10px;
}
.rgpd-section-title.danger {
  color: var(--c-err);
}
.rgpd-desc {
  font-size: 14px;
  color: var(--c-text-2);
  line-height: 1.6;
  margin-bottom: 16px;
}
.rgpd-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.danger-zone {
  border-color: rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.04);
}

.consent-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ci-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: var(--c-text-2);
  padding: 10px 14px;
  background: var(--c-card);
  border-radius: var(--r-md);
}
.ci-row strong {
  color: var(--c-text);
}

.btn-loader {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .profile-hero {
    flex-direction: column;
    text-align: center;
  }
  .ph-meta {
    margin-left: 0;
  }
  .info-grid,
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
