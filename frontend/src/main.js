import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router/index.js'
import i18n from './i18n.js'
import App from './App.vue'
import './style.css'
import { usePwaStore } from './stores/pwa.js'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(i18n)
app.use(router)

// Initialize PWA installation tracker
const pwaStore = usePwaStore(pinia)
window.addEventListener('beforeinstallprompt', (e) => {
  pwaStore.setInstallEvent(e)
})

app.mount('#app')
