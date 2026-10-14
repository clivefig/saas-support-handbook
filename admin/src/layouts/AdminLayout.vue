<template>
  <div class="layout">
    <aside class="sidebar" data-tour="sidebar">
      <div class="brand">Handbook Admin</div>
      <p class="muted" style="color: #9ca3af; font-size: 0.8rem; margin: 0 0 1rem">
        {{ loginLabel }}
      </p>
      <nav>
        <router-link to="/">Dashboard</router-link>
        <router-link to="/branding" data-tour="nav-branding">Branding</router-link>
        <router-link to="/articles" data-tour="nav-articles">Articles</router-link>
        <router-link to="/structure" data-tour="nav-structure">Structure</router-link>
        <router-link to="/new">New article</router-link>
        <router-link to="/privacy">Privacy</router-link>
        <router-link to="/reset">Reset</router-link>
      </nav>
      <div style="margin-top: 2rem">
        <button class="btn" style="width: 100%" @click="startTour">Tour</button>
        <button class="btn" style="width: 100%; margin-top: 0.5rem" @click="logout">
          Log out
        </button>
        <a
          href="/"
          style="display: block; margin-top: 0.75rem; color: #d1d5db; font-size: 0.85rem"
          >View handbook</a
        >
      </div>
    </aside>
    <main class="main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'
import { startFirstRunTour } from '../tours'

const router = useRouter()
const loginLabel = ref('…')

onMounted(async () => {
  const status = await api.status()
  loginLabel.value = status.local ? 'Local admin mode' : `@${status.login}`
  if (!localStorage.getItem('ssh-tour-done')) {
    setTimeout(() => {
      startFirstRunTour()
      localStorage.setItem('ssh-tour-done', '1')
    }, 600)
  }
})

async function logout() {
  await api.logout()
  router.push({ name: 'login' })
}

function startTour() {
  startFirstRunTour()
}
</script>
