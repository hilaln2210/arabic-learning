const KEY_STREAK = 'arabic_streak'
const KEY_LAST = 'arabic_last_studied'

export function getStreak() {
  try {
    const streak = parseInt(localStorage.getItem(KEY_STREAK) || '0')
    const last = localStorage.getItem(KEY_LAST)
    if (!last) return 0
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    if (last === today) return streak
    if (last === yesterday) return streak // still valid
    return 0 // streak broken
  } catch { return 0 }
}

export function recordStudyToday() {
  try {
    const today = new Date().toDateString()
    const last = localStorage.getItem(KEY_LAST)
    const streak = parseInt(localStorage.getItem(KEY_STREAK) || '0')
    if (last === today) return
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    const newStreak = (last === yesterday) ? streak + 1 : 1
    localStorage.setItem(KEY_STREAK, String(newStreak))
    localStorage.setItem(KEY_LAST, today)
  } catch {}
}

export function getWordOfDay(allWords) {
  const dayIndex = Math.floor(Date.now() / 86400000)
  return allWords[dayIndex % allWords.length]
}
