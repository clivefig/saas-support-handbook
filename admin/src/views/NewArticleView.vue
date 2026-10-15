<template>
  <div>
    <h1>New article</h1>
    <p class="muted">Creates a Markdown file and adds it to the sidebar.</p>
    <div class="card" style="max-width: 560px">
      <div class="field">
        <label>Sidebar section label</label>
        <input v-model="navSectionText" placeholder="e.g. Errors" list="sections" />
        <datalist id="sections">
          <option v-for="s in sectionNames" :key="s" :value="s" />
        </datalist>
      </div>
      <div class="field">
        <label>Folder under docs/ (e.g. errors, guide, tools)</label>
        <input v-model="section" placeholder="errors" />
      </div>
      <div class="field">
        <label>Slug (filename without .md)</label>
        <input v-model="slug" placeholder="my-topic" />
      </div>
      <div class="field">
        <label>Title</label>
        <input v-model="title" placeholder="My topic" />
      </div>
      <button class="btn btn-primary" :disabled="saving" @click="create">Create article</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api'

const toast = inject<(m: string) => void>('toast', () => {})
const router = useRouter()
const section = ref('guide')
const slug = ref('')
const title = ref('')
const navSectionText = ref('Start')
const sectionNames = ref<string[]>([])
const saving = ref(false)

onMounted(async () => {
  try {
    const nav = await api.getNav()
    sectionNames.value = (nav.sidebar || []).map((s: any) => s.text)
  } catch (e: any) {
    toast(e.message || 'Failed to load sections')
  }
})

async function create() {
  if (!section.value || !slug.value || !title.value) {
    toast('Fill section, slug, and title')
    return
  }
  saving.value = true
  try {
    await api.createArticle({
      section: section.value,
      slug: slug.value,
      title: title.value,
      navSectionText: navSectionText.value
    })
    toast('Article created')
    router.push({ name: 'articles' })
  } catch (e: any) {
    toast(e.message || 'Create failed')
  } finally {
    saving.value = false
  }
}
</script>
