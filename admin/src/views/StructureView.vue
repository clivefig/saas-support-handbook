<template>
  <div>
    <h1 data-tour="structure-title">Structure</h1>
    <p class="muted">Edit header nav and sidebar sections. Links should match article routes.</p>
    <p v-if="error" class="muted" style="color: #b91c1c">{{ error }}</p>
    <p v-if="loading" class="muted">Loading navigation…</p>

    <div class="card" v-if="nav" data-tour="structure-editor">
      <h2>Header nav</h2>
      <div v-for="(item, i) in nav.nav" :key="'n' + i" class="row" style="margin-bottom: 0.5rem">
        <input v-model="item.text" placeholder="Label" style="max-width: 180px" />
        <input v-model="item.link" placeholder="/path" />
        <button class="btn" @click="nav.nav.splice(i, 1)">Remove</button>
      </div>
      <button class="btn" @click="nav.nav.push({ text: 'New', link: '/' })">Add nav item</button>

      <h2 style="margin-top: 1.5rem">Sidebar sections</h2>
      <div v-for="(section, si) in nav.sidebar" :key="'s' + si" class="card">
        <div class="row">
          <input v-model="section.text" placeholder="Section title" style="max-width: 220px" />
          <label style="display: flex; align-items: center; gap: 0.35rem; margin: 0">
            <input type="checkbox" v-model="section.collapsed" style="width: auto" />
            Collapsed
          </label>
          <button class="btn" @click="moveSection(si, -1)">Up</button>
          <button class="btn" @click="moveSection(si, 1)">Down</button>
          <button class="btn" @click="nav.sidebar.splice(si, 1)">Remove section</button>
        </div>
        <div
          v-for="(item, ii) in section.items || []"
          :key="'i' + si + '-' + ii"
          class="row"
          style="margin-top: 0.5rem"
        >
          <input v-model="item.text" placeholder="Label" style="max-width: 200px" />
          <input v-model="item.link" placeholder="/guide/page" />
          <button class="btn" @click="section.items.splice(ii, 1)">Remove</button>
        </div>
        <button
          class="btn"
          style="margin-top: 0.5rem"
          @click="(section.items ||= []).push({ text: 'New page', link: '/' })"
        >
          Add page
        </button>
      </div>
      <button
        class="btn"
        @click="nav.sidebar.push({ text: 'New section', collapsed: false, items: [] })"
      >
        Add section
      </button>

      <div class="row" style="margin-top: 1rem">
        <button class="btn btn-primary" :disabled="saving" @click="save">Save structure</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'
import { api } from '../api'

const toast = inject<(m: string) => void>('toast', () => {})
const nav = ref<any>(null)
const saving = ref(false)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  loading.value = true
  error.value = ''
  try {
    const data = await api.getNav()
    nav.value = {
      nav: data.nav || [],
      sidebar: data.sidebar || [],
      productSidebar: data.productSidebar || []
    }
  } catch (e: any) {
    error.value = e.message || 'Failed to load structure'
    toast(error.value)
  } finally {
    loading.value = false
  }
})

function moveSection(index: number, delta: number) {
  if (!nav.value) return
  const next = index + delta
  if (next < 0 || next >= nav.value.sidebar.length) return
  const arr = nav.value.sidebar
  const [item] = arr.splice(index, 1)
  arr.splice(next, 0, item)
}

async function save() {
  if (!nav.value) return
  saving.value = true
  try {
    await api.putNav(nav.value)
    toast('Structure saved')
  } catch (e: any) {
    toast(e.message || 'Save failed')
  } finally {
    saving.value = false
  }
}
</script>
