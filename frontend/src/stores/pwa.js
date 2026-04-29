import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePwaStore = defineStore('pwa', () => {
  const installEvent = ref(null)
  const isInstallable = ref(false)

  function setInstallEvent(event) {
    event.preventDefault()
    installEvent.value = event
    isInstallable.value = true
  }

  async function triggerInstall() {
    if (!installEvent.value) return
    
    installEvent.value.prompt()
    const { outcome } = await installEvent.value.userChoice
    
    if (outcome === 'accepted') {
      isInstallable.value = false
      installEvent.value = null
    }
  }

  return {
    installEvent,
    isInstallable,
    setInstallEvent,
    triggerInstall
  }
})
