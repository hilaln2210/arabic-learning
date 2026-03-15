const KEY_STREAK = 'arabic_streak'
const KEY_LAST = 'arabic_last_studied'
const KEY_BEST = 'arabic_best_streak'
const KEY_DAYS = 'arabic_study_days' // JSON array of unique date strings

export function getStreak() {
  try {
    const streak = parseInt(localStorage.getItem(KEY_STREAK) || '0')
    const last = localStorage.getItem(KEY_LAST)
    if (!last) return 0
    const today = new Date().toDateString()
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    if (last === today || last === yesterday) return streak
    return 0
  } catch { return 0 }
}

export function getBestStreak() {
  try { return parseInt(localStorage.getItem(KEY_BEST) || '0') } catch { return 0 }
}

export function getTotalStudyDays() {
  try {
    const days = JSON.parse(localStorage.getItem(KEY_DAYS) || '[]')
    return days.length
  } catch { return 0 }
}

export function recordStudyToday() {
  try {
    const today = new Date().toDateString()
    const last = localStorage.getItem(KEY_LAST)
    if (last === today) return // already recorded today

    // Track unique study days
    try {
      const days = JSON.parse(localStorage.getItem(KEY_DAYS) || '[]')
      if (!days.includes(today)) {
        days.push(today)
        localStorage.setItem(KEY_DAYS, JSON.stringify(days))
      }
    } catch {}

    const streak = parseInt(localStorage.getItem(KEY_STREAK) || '0')
    const bestStreak = parseInt(localStorage.getItem(KEY_BEST) || '0')
    const yesterday = new Date(Date.now() - 86400000).toDateString()
    const newStreak = (last === yesterday) ? streak + 1 : 1

    localStorage.setItem(KEY_STREAK, String(newStreak))
    localStorage.setItem(KEY_LAST, today)

    if (newStreak > bestStreak) {
      localStorage.setItem(KEY_BEST, String(newStreak))
    }
  } catch {}
}

export function getWordOfDay(allWords) {
  const dayIndex = Math.floor(Date.now() / 86400000)
  return allWords[dayIndex % allWords.length]
}
