import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import am from './locales/am.json'

const savedLocale = localStorage.getItem('ebf-locale') || 'am'

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: savedLocale,
  fallbackLocale: 'en',
  messages: {
    en,
    am
  }
})

export default i18n

export function setLocale(newLocale) {
  i18n.global.locale.value = newLocale
  localStorage.setItem('ebf-locale', newLocale)
}
