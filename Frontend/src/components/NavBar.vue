<template>
  <nav class="navbar">
    <div class="navbar-inner container">

      <!-- Logo -->
      <RouterLink to="/" class="brand">
        <span class="brand-icon">⚡</span>
        <span class="brand-name">EventFlow</span>
      </RouterLink>

      <!-- Liens centre -->
      <div class="nav-links" :class="{ open: open }">
        <RouterLink to="/" class="nav-link" @click="open = false">Accueil</RouterLink>
        <RouterLink to="/events" class="nav-link" @click="open = false">Événements</RouterLink>
        <RouterLink v-if="auth.isAuthenticated" to="/dashboard" class="nav-link" @click="open = false">Dashboard</RouterLink>
        <RouterLink to="/privacy" class="nav-link" @click="open = false">Confidentialité</RouterLink>
        <!-- Mobile-only auth actions -->
        <div class="mobile-auth" v-if="!auth.isAuthenticated">
          <RouterLink to="/login" class="btn btn-secondary btn-sm" @click="open = false">Connexion</RouterLink>
          <RouterLink to="/register" class="btn btn-primary btn-sm" @click="open = false">S'inscrire</RouterLink>
        </div>
        <div class="mobile-auth" v-else>
          <RouterLink to="/profile" class="btn btn-secondary btn-sm" @click="open = false">Mon profil</RouterLink>
          <button class="btn btn-danger btn-sm" @click="handleLogout">Déconnexion</button>
        </div>
      </div>

      <!-- Actions desktop -->
      <div class="nav-actions">
        <template v-if="!auth.isAuthenticated">
          <RouterLink to="/login"    class="btn btn-secondary btn-sm">Connexion</RouterLink>
          <RouterLink to="/register" class="btn btn-primary   btn-sm">S'inscrire</RouterLink>
        </template>
        <template v-else>
          <span class="user-chip">
            <span class="avatar">{{ initials }}</span>
            {{ auth.user?.firstname }}
          </span>
          <RouterLink to="/profile" class="btn btn-ghost btn-sm">Profil</RouterLink>
          <button class="btn btn-danger btn-sm" @click="handleLogout">Déconnexion</button>
        </template>
      </div>

      <!-- Hamburger -->
      <button class="hamburger" @click="open = !open" :class="{ active: open }" aria-label="Menu">
        <span /><span /><span />
      </button>

    </div>
  </nav>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth   = useAuthStore()
const router = useRouter()
const open   = ref(false)

const initials = computed(() => {
  if (!auth.user) return '?'
  return (auth.user.firstname?.[0] || '') + (auth.user.lastname?.[0] || '')
})

function handleLogout() {
  auth.logout()
  open.value = false
  router.push('/')
}
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: var(--z-nav);
  height: 72px;
  background: rgba(7, 7, 26, 0.88);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--c-border);
}
.navbar-inner {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 32px;
}

/* Brand */
.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  text-decoration: none;
}
.brand-icon { font-size: 22px; }
.brand-name {
  font-size: 19px;
  font-weight: 800;
  background: var(--grad-brand);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -.03em;
}

/* Nav links */
.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}
.nav-link {
  padding: 7px 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--c-text-2);
  border-radius: var(--r-sm);
  transition: var(--t-fast);
}
.nav-link:hover,
.nav-link.router-link-active {
  color: var(--c-text);
  background: var(--c-card);
}
.nav-link.router-link-exact-active { color: var(--c-primary); }

/* Desktop actions */
.nav-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.user-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--c-text-2);
}
.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--grad-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
}

/* Hamburger */
.hamburger {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  padding: 6px;
  cursor: pointer;
  margin-left: auto;
}
.hamburger span {
  display: block;
  width: 22px;
  height: 2px;
  background: var(--c-text);
  border-radius: 2px;
  transition: var(--t);
}
.hamburger.active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
.hamburger.active span:nth-child(2) { opacity: 0; }
.hamburger.active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

/* Mobile */
.mobile-auth { display: none; }

@media (max-width: 768px) {
  .nav-actions { display: none; }
  .hamburger   { display: flex; }
  .nav-links {
    display: none;
    position: absolute;
    top: 72px;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    background: var(--c-surface);
    border-bottom: 1px solid var(--c-border);
    padding: 16px;
    gap: 4px;
  }
  .nav-links.open { display: flex; }
  .mobile-auth {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--c-border);
  }
  .mobile-auth .btn { flex: 1; justify-content: center; }
}
</style>
