<template>
  <div>
    <h1 data-tour="articles-title">Articles</h1>
    <p class="muted">Select an article, edit in Markdown, then save.</p>
    <div class="grid-2">
      <div class="card" data-tour="article-list">
        <input v-model="filter" placeholder="Filter…" style="margin-bottom: 0.75rem" />
        <div class="article-list">
          <button
            v-for="a in filtered"
            :key="a.path"
            :class="{ active: a.path === selected }"
            @click="open(a.path)"
          >
            <strong>{{ a.title }}</strong>
            <div class="muted" style="font-size: 0.75rem">{{ a.path }}</div>
          </button>
        </div>
      </div>
      <div class="card" data-tour="article-editor">
        <div v-if="!selected" class="muted">Choose an article on the left.</div>
        <template v-else>
          <div class="row" style="justify-content: space-between; margin-bottom: 0.75rem">
            <code>{{ selected }}</code>
            <button class="btn btn-primary" :disabled="saving" @click="save">Save</button>
          </div>
          <textarea ref="textareaEl" />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import EasyMDE from 'easymde'
import { api } from '../api'

const toast = inject<(m: string) => void>('toast', () => {})
const articles = ref<{ path: string; title: string }[]>([])
const filter = ref('')
const selected = ref('')
const saving = ref(false)
const textareaEl = ref<HTMLTextAreaElement | null>(null)
let editor: EasyMDE | null = null

const filtered = computed(() => {
  const q = filter.value.toLowerCase()
  return articles.value.filter(
    (a) => a.path.toLowerCase().includes(q) || a.title.toLowerCase().includes(q)
  )
})

onMounted(async () => {
  const data = await api.articles()
  articles.value = data.articles
})

onBeforeUnmount(() => {
  editor?.toTextArea()
  editor = null
})

async function open(path: string) {
  selected.value = path
  const file = await api.getFile(path)
  await nextTick()
  if (editor) {
    editor.toTextArea()
    editor = null
  }
  if (!textareaEl.value) return
  editor = new EasyMDE({
    element: textareaEl.value,
    initialValue: file.content,
    spellChecker: false,
    status: false,
    minHeight: '420px'
  })
}

async function save() {
  if (!selected.value || !editor) return
  saving.value = true
  try {
    await api.putFile({
      path: selected.value,
      content: editor.value(),
      message: `admin: edit ${selected.value}`
    })
    toast('Article saved')
  } catch (e: any) {
    toast(e.message || 'Save failed')
  } finally {
    saving.value = false
  }
}
</script>
