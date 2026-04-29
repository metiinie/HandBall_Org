import i18n from '@/i18n'

const teamMapping = {
  'ሀዋሳ ከተማ': 'Hawassa City',
  'ወልቂጤ ከተማ': 'Welkite City',
  'ፋሲል ከነማ': 'Fasil Kenema',
  'ኢትዮጵያ ስፖርት አካዳሚ': 'Ethiopian Sports Academy',
  'ጋምቤላ ከተማ': 'Gambella City',
  'ሸገር ከተማ': 'Sheger City',
  'ባህርዳር ከተማ': 'Bahir Dar City'
};

const initialsMapping = {
  'ሀዋሳ ከተማ': 'HW',
  'ወልቂጤ ከተማ': 'WC',
  'ፋሲል ከነማ': 'FK',
  'ኢትዮጵያ ስፖርት አካዳሚ': 'AS',
  'ጋምቤላ ከተማ': 'GM',
  'ሸገር ከተማ': 'SC',
  'ባህርዳር ከተማ': 'BD'
};

/**
 * Returns the team name in the current locale
 * @param {Object} team - Team object from DB
 * @returns {string} - Localized name
 */
export function getTeamName(team) {
  if (!team) return ''
  const locale = i18n.global.locale.value
  
  if (locale === 'en') {
    // Check if name_en exists in DB, otherwise fallback to mapping
    return team.name_en || teamMapping[team.name] || team.name
  }
  
  return team.name
}

/**
 * Returns team initials (e.g. GM, AS)
 * @param {Object} team
 * @returns {string}
 */
export function getTeamInitials(team) {
  if (!team) return ''
  if (initialsMapping[team.name]) return initialsMapping[team.name]
  
  // Fallback: take first letter of each word if name is English, or just first 2 chars
  const name = team.name_en || team.name
  if (name.includes(' ')) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3)
  }
  return name.slice(0, 2).toUpperCase()
}
