const KEY = 'arabic_username'
const GENDER_KEY = 'arabic_gender'
const SOUND_KEY = 'arabic_sound'
const AUTOPLAY_KEY = 'arabic_autoplay'

export const getUsername = () => localStorage.getItem(KEY) || ''
export const setUsername = (name) => localStorage.setItem(KEY, name.trim())
export const hasUsername = () => !!localStorage.getItem(KEY)

export const getGender = () => localStorage.getItem(GENDER_KEY) || 'f'
export const setGender = (g) => localStorage.setItem(GENDER_KEY, g)
export const hasGender = () => !!localStorage.getItem(GENDER_KEY)

/** Return feminine or masculine form based on stored gender */
export const g = (feminine, masculine) =>
  getGender() === 'm' ? masculine : feminine

/** Sound on/off (default: on) */
export const isSoundEnabled = () => localStorage.getItem(SOUND_KEY) !== 'off'
export const setSoundEnabled = (v) => localStorage.setItem(SOUND_KEY, v ? 'on' : 'off')

/** Auto-play sound when card flips (default: off) */
export const isAutoplayEnabled = () => localStorage.getItem(AUTOPLAY_KEY) === 'on'
export const setAutoplayEnabled = (v) => localStorage.setItem(AUTOPLAY_KEY, v ? 'on' : 'off')
