import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'

const routes = [
  {
    path: '/',
    name: 'standings',
    component: () => import('@/views/StandingsView.vue'),
    meta: { title: 'Live Standings – EHF League' },
  },
  {
    path: '/matches',
    name: 'matches',
    component: () => import('@/views/MatchesView.vue'),
    meta: { title: 'Match Schedule – EHF League' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'League Controller Login – EHF', guestOnly: true },
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminDashboard.vue'),
    meta: { title: 'Admin Dashboard – EHF', requiresAuth: true },
  },
  {
    path: '/admin/scores',
    name: 'score-entry',
    component: () => import('@/views/ScoreEntryView.vue'),
    meta: { title: 'Score Entry – EHF', requiresAuth: true },
  },
  {
    path: '/admin/rounds',
    name: 'round-manager',
    component: () => import('@/views/RoundManagerView.vue'),
    meta: { title: 'Round Manager – EHF', requiresAuth: true },
  },
  {
    path: '/admin/teams',
    name: 'team-manager',
    component: () => import('@/views/TeamManagerView.vue'),
    meta: { title: 'Team Manager – EHF', requiresAuth: true },
  },
  {
    path: '/admin/scheduler',
    name: 'match-scheduler',
    component: () => import('@/views/MatchSchedulerView.vue'),
    meta: { title: 'Match Scheduler – EHF', requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach(async (to, _from, next) => {
  // Update document title
  document.title = to.meta.title || 'EHF League Management System'

  const authStore = useAuthStore()

  // Wait for initial auth check if still loading
  if (authStore.loading) {
    await authStore.initAuth()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return next({ name: 'login', query: { redirect: to.fullPath } })
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return next({ name: 'admin' })
  }

  next()
})

export default router
