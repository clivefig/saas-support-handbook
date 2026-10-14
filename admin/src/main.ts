import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import './styles.css'
import 'easymde/dist/easymde.min.css'
import 'shepherd.js/dist/css/shepherd.css'

createApp(App).use(router).mount('#app')
