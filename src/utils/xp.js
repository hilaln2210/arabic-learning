// /home/hila/Desktop/ArabicLearning/src/utils/xp.js
const KEY = 'arabic_xp'

// XP thresholds for each level (level 1 starts at 0 XP)
const LEVELS = [0, 100, 300, 600, 1000, 1600, 2400, 3500, 5000, 7000, 10000]
const LEVEL_NAMES = ['מתחיל', 'מתחיל+', 'לומד', 'לומד+', 'מתקדם', 'מתקדם+', 'מיומן', 'מיומן+', 'מומחה', 'מומחה+', 'מאסטר']
const XP_CORRECT = 10     // per correct answer in quiz/study
const XP_SESSION_BONUS = 20  // bonus for completing a session with >80% accuracy

export function getXP() {
  try { return parseInt(localStorage.getItem(KEY) || '0') } catch { return 0 }
}

export function getLevel(xp) {
  const x = xp ?? getXP()
  let level = 1
  for (let i = 0; i < LEVELS.length; i++) {
    if (x >= LEVELS[i]) level = i + 1
    else break
  }
  return Math.min(level, LEVELS.length)
}

export function getLevelInfo() {
  const xp = getXP()
  const level = getLevel(xp)
  const currentThreshold = LEVELS[level - 1]
  const nextThreshold = LEVELS[level] ?? null
  const progress = nextThreshold
    ? Math.round(((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100)
    : 100
  return {
    level,
    name: LEVEL_NAMES[level - 1] || 'מאסטר',
    xp,
    nextLevelXP: nextThreshold,
    currentThreshold,
    progress,
    isMax: nextThreshold === null
  }
}

// Returns { newXP, oldLevel, newLevel, leveledUp, gained }
export function addXP(amount) {
  const old = getXP()
  const oldLevel = getLevel(old)
  const newXP = old + amount
  const newLevel = getLevel(newXP)
  try { localStorage.setItem(KEY, String(newXP)) } catch {}
  return { newXP, oldLevel, newLevel, leveledUp: newLevel > oldLevel, gained: amount }
}

export { XP_CORRECT, XP_SESSION_BONUS, LEVEL_NAMES }
