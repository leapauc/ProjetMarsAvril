import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/',               component: () => import('../views/HomeView.vue') },
  { path: '/events',         component: () => import('../views/EventListView.vue') },
  // /events/create doit être avant /events/:id pour ne pas être capturé
  { path: '/events/create',  component: () => import('../views/EventFormView.vue'), meta: { requiresAuth: true, requiresOrganizer: true } },
  { path: '/events/:id/edit',component: () => import('../views/EventFormView.vue'), meta: { requiresAuth: true, requiresOrganizer: true } },
  { path: '/events/:id',     component: () => import('../views/EventDetailView.vue') },
  { path: '/login',          component: () => import('../views/LoginView.vue') },
  { path: '/register',       component: () => import('../views/RegisterView.vue') },
  { path: '/privacy',        component: () => import('../views/PrivacyView.vue') },
  { path: '/dashboard',      component: () => import('../views/DashboardView.vue'), meta: { requiresAuth: true } },
  { path: '/profile',        component: () => import('../views/ProfileView.vue'),   meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0, behavior: 'smooth' })
})

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresOrganizer && !auth.isOrganizer) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
