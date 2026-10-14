<template>
  <div class="login-page">
    <div class="card" style="max-width: 420px; width: 100%">
      <h1>Handbook Admin</h1>
      <p class="muted">
        Sign in with GitHub to edit articles, navigation, and privacy copy. Only users with write
        access to the content repository can continue.
      </p>
      <p v-if="local" class="muted">Local mode is on — no OAuth required.</p>
      <div class="row" style="margin-top: 1.25rem">
        <a v-if="!local" class="btn btn-primary" href="/api/auth/login">Sign in with GitHub</a>
        <button v-else class="btn btn-primary" @click="enterLocal">Enter admin</button>
      </div>
      <p class="muted" style="margin-top: 1rem; font-size: 0.85rem">
        See <code>docs/setup/ADMIN_AND_DEPLOY.md</code> for OAuth setup.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'

const router = useRouter()
const local = ref(false)

onMounted(async () => {
  try {
    const status = await api.status()
    local.value = Boolean(status.local)
    if (status.authenticated) router.replace({ name: 'dashboard' })
  } catch {
    local.value = false
  }
})

function enterLocal() {
  router.push({ name: 'dashboard' })
}
</script>
