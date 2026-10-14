<template>
  <div>
    <h1>Privacy / disclaimer</h1>
    <p class="muted">
      Public page at <code>/legal/privacy</code>. Credit this free handbook and Shepherd.js here.
    </p>
    <div class="card">
      <div class="row" style="justify-content: flex-end; margin-bottom: 0.75rem">
        <button class="btn btn-primary" :disabled="saving || !ready" @click="save">Save</button>
      </div>
      <textarea ref="textareaEl" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import EasyMDE from 'easymde'
import { api } from '../api'

const toast = inject<(m: string) => void>('toast', () => {})
const textareaEl = ref<HTMLTextAreaElement | null>(null)
const saving = ref(false)
const ready = ref(false)
let editor: EasyMDE | null = null
const path = 'docs/legal/privacy.md'

onMounted(async () => {
  let initial = ''
  try {
    const file = await api.getFile(path)
    initial = file.content
  } catch (e: any) {
    toast(e.message || 'Failed to load privacy page')
  }
  await nextTick()
  if (!textareaEl.value) return
  editor = new EasyMDE({
    element: textareaEl.value,
    initialValue: initial,
    spellChecker: false,
    status: false,
    minHeight: '480px'
  })
  ready.value = true
})

onBeforeUnmount(() => {
  editor?.toTextArea()
  editor = null
})

async function save() {
  if (!editor) return
  saving.value = true
  try {
    await api.putFile({
      path,
      content: editor.value(),
      message: 'admin: update privacy / disclaimer'
    })
    toast('Privacy page saved')
  } catch (e: any) {
    toast(e.message || 'Save failed')
  } finally {
    saving.value = false
  }
}
</script>
