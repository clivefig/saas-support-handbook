<template>
  <div>
    <h1>Reset to default</h1>
    <div class="card" style="max-width: 640px">
      <p>
        Restores factory Markdown, <code>nav.json</code>, and legal pages from the
        <code>defaults/</code> snapshot. Does not wipe <code>docs/product/local/</code>.
      </p>
      <p class="muted">This cannot be undone except via git history.</p>
      <label style="display: flex; gap: 0.5rem; align-items: center; margin: 1rem 0">
        <input v-model="confirmed" type="checkbox" style="width: auto" />
        I understand this overwrites handbook content
      </label>
      <button class="btn btn-danger" :disabled="!confirmed || saving" @click="runReset">
        Reset to defaults
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, ref } from 'vue'
import { api } from '../api'

const toast = inject<(m: string) => void>('toast', () => {})
const confirmed = ref(false)
const saving = ref(false)

async function runReset() {
  saving.value = true
  try {
    const result = await api.reset()
    toast(`Restored ${result.restored?.length ?? 0} files`)
  } catch (e: any) {
    toast(e.message || 'Reset failed')
  } finally {
    saving.value = false
  }
}
</script>
