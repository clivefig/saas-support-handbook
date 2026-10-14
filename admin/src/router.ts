import { createRouter, createWebHistory } from 'vue-router'
import { api } from './api'
import LoginView from './views/LoginView.vue'
import DashboardView from './views/DashboardView.vue'
import BrandingView from './views/BrandingView.vue'
import ArticlesView from './views/ArticlesView.vue'
import StructureView from './views/StructureView.vue'
import NewArticleView from './views/NewArticleView.vue'
import PrivacyView from './views/PrivacyView.vue'
import ResetView from './views/ResetView.vue'
import AdminLayout from './layouts/AdminLayout.vue'

export const router = createRouter({
  history: createWebHistory('/admin/'),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    {
      path: '/',
      component: AdminLayout,
      children: [
        { path: '', name: 'dashboard', component: DashboardView },
        { path: 'branding', name: 'branding', component: BrandingView },
        { path: 'articles', name: 'articles', component: ArticlesView },
        { path: 'structure', name: 'structure', component: StructureView },
        { path: 'new', name: 'new', component: NewArticleView },
        { path: 'privacy', name: 'privacy', component: PrivacyView },
        { path: 'reset', name: 'reset', component: ResetView }
      ]
    }
  ]
})

router.beforeEach(async (to) => {
  if (to.meta.public) return true
  try {
    const status = await api.status()
    if (!status.authenticated) return { name: 'login' }
    return true
  } catch {
    return { name: 'login' }
  }
})
