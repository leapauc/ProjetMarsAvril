<template>
  <Transition name="banner">
    <div v-if="!cookieStore.hasConsented" class="cookie-banner">
      <div class="cookie-inner">

        <div class="cookie-header">
          <span class="cookie-icon">🍪</span>
          <div>
            <h3 class="cookie-title">Gestion des cookies</h3>
            <p class="cookie-desc">
              Nous utilisons des cookies pour assurer le bon fonctionnement du site et, avec votre accord,
              améliorer votre expérience. Vos choix sont enregistrés localement.
            </p>
          </div>
        </div>

        <div v-if="showDetails" class="cookie-categories">
          <label class="cat-item">
            <input type="checkbox" checked disabled />
            <div class="cat-info">
              <span class="cat-name">Essentiels <span class="badge badge-ok">Obligatoires</span></span>
              <span class="cat-desc">Authentification, session, préférences de base. Ne peuvent pas être désactivés.</span>
            </div>
          </label>
          <label class="cat-item">
            <input type="checkbox" v-model="choices.analytics" />
            <div class="cat-info">
              <span class="cat-name">Analytiques</span>
              <span class="cat-desc">Mesure d'audience anonyme pour améliorer le service.</span>
            </div>
          </label>
          <label class="cat-item">
            <input type="checkbox" v-model="choices.marketing" />
            <div class="cat-info">
              <span class="cat-name">Marketing</span>
              <span class="cat-desc">Personnalisation et publicités adaptées à vos intérêts.</span>
            </div>
          </label>
        </div>

        <div class="cookie-actions">
          <button class="btn btn-ghost btn-sm" @click="showDetails = !showDetails">
            {{ showDetails ? 'Masquer' : 'Personnaliser' }}
          </button>
          <button class="btn btn-secondary btn-sm" @click="rejectAll">Tout refuser</button>
          <button v-if="showDetails" class="btn btn-secondary btn-sm" @click="saveChoices">Enregistrer mes choix</button>
          <button class="btn btn-primary btn-sm" @click="acceptAll">Tout accepter</button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useCookieStore } from '../stores/cookie'

const cookieStore = useCookieStore()
const showDetails = ref(false)
const choices = reactive({ analytics: false, marketing: false })

function acceptAll() {
  cookieStore.setConsent({ essential: true, analytics: true, marketing: true })
}
function rejectAll() {
  cookieStore.setConsent({ essential: true, analytics: false, marketing: false })
}
function saveChoices() {
  cookieStore.setConsent({ essential: true, ...choices })
}
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: var(--z-toast);
  padding: 0 16px 16px;
}
.cookie-inner {
  max-width: 900px;
  margin: 0 auto;
  background: var(--c-surface-2);
  border: 1px solid var(--c-border);
  border-radius: var(--r-xl) var(--r-xl) var(--r-sm) var(--r-sm);
  border-radius: var(--r-xl);
  padding: 24px;
  box-shadow: var(--sh-lg);
  backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.cookie-header { display: flex; gap: 14px; align-items: flex-start; }
.cookie-icon   { font-size: 28px; flex-shrink: 0; }
.cookie-title  { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
.cookie-desc   { font-size: 13px; color: var(--c-text-2); line-height: 1.5; }

.cookie-categories {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--c-card);
  border: 1px solid var(--c-border);
  border-radius: var(--r-md);
}
.cat-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  cursor: pointer;
}
.cat-item input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--c-primary);
  flex-shrink: 0;
  margin-top: 3px;
  cursor: pointer;
}
.cat-info { display: flex; flex-direction: column; gap: 2px; }
.cat-name { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.cat-desc { font-size: 12px; color: var(--c-text-2); }

.cookie-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

/* Transition */
.banner-enter-active { transition: transform .4s cubic-bezier(.4,0,.2,1), opacity .4s; }
.banner-leave-active { transition: transform .3s cubic-bezier(.4,0,.2,1), opacity .3s; }
.banner-enter-from  { transform: translateY(100%); opacity: 0; }
.banner-leave-to    { transform: translateY(100%); opacity: 0; }

@media (max-width: 600px) {
  .cookie-actions { justify-content: stretch; }
  .cookie-actions .btn { flex: 1; justify-content: center; }
}
</style>
