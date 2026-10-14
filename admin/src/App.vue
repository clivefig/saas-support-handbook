<template>
  <router-view />
  <div v-if="toast" class="toast">{{ toast }}</div>
</template>

<script setup lang="ts">
import { provide, ref } from 'vue'

const toast = ref('')
let timer: ReturnType<typeof setTimeout> | undefined

function showToast(message: string) {
  toast.value = message
  clearTimeout(timer)
  timer = setTimeout(() => {
    toast.value = ''
  }, 3200)
}

provide('toast', showToast)
</script>
