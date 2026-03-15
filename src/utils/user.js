const KEY = 'arabic_username'
const GENDER_KEY = 'arabic_gender'

export const getUsername = () => localStorage.getItem(KEY) || ''
export const setUsername = (name) => localStorage.setItem(KEY, name.trim())
export const hasUsername = () => !!localStorage.getItem(KEY)

export const getGender = () => localStorage.getItem(GENDER_KEY) || 'f'
export const setGender = (g) => localStorage.setItem(GENDER_KEY, g)
export const hasGender = () => !!localStorage.getItem(GENDER_KEY)

/** Return feminine or masculine form based on stored gender */
export const g = (feminine, masculine) =>
  getGender() === 'm' ? masculine : feminine
