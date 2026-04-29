import { toEthiopian } from 'ethiopian-calendar-new'
import i18n from '@/i18n'

/**
 * Formats a Gregorian date string into an Ethiopian calendar date string.
 * @param {string} dateStr - Gregorian date (YYYY-MM-DD or similar)
 * @param {string} locale - 'am' or 'en'
 * @returns {string} - Formatted date string
 */
export function formatEthiopian(dateStr, locale = i18n.global.locale.value) {
  if (!dateStr) return 'TBA'
  
  const date = new Date(dateStr)
  if (isNaN(date)) return 'TBA'

  // ethiopian-calendar-new months are 1-indexed
  const ethDate = toEthiopian(date.getFullYear(), date.getMonth() + 1, date.getDate())
  
  const months = i18n.global.messages.value[locale].ethiopian.months
  const monthName = months[ethDate.month - 1]

  if (locale === 'am') {
    return `${monthName} ${ethDate.day}`
  } else {
    return `${ethDate.day} ${monthName}`
  }
}


/**
 * Standardizes Gregorian years to Ethiopian season labels.
 * Currently maps 2025 -> 2018 (Ethiopian Year).
 */
export function getSeasonLabel(gregorianYear) {
  if (gregorianYear === 2025) return '2018'
  if (gregorianYear === 2024) return '2017'
  return gregorianYear
}
