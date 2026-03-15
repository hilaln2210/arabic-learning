// Achievement definitions + tracking

const ACHIEVEMENTS = [
  { id: 'first_word',      emoji: '🌱', title: 'ראשית הדרך',     desc: 'למדת את המילה הראשונה' },
  { id: 'words_10',        emoji: '📚', title: 'מתחיל',          desc: '10 מילים ידועות' },
  { id: 'words_50',        emoji: '🎓', title: 'לומד',           desc: '50 מילים ידועות' },
  { id: 'words_100',       emoji: '🏆', title: 'מתקדם',          desc: '100 מילים ידועות' },
  { id: 'words_500',       emoji: '👑', title: 'שליט השפה',      desc: '500 מילים ידועות' },
  { id: 'streak_3',        emoji: '🔥', title: 'רצף קטן',        desc: '3 ימים ברצף' },
  { id: 'streak_7',        emoji: '🔥🔥', title: 'שבוע שלם',    desc: '7 ימים ברצף' },
  { id: 'streak_30',       emoji: '🌋', title: 'חודש ברצף',      desc: '30 ימים ברצף' },
  { id: 'xp_100',          emoji: '⭐', title: 'צובר XP',        desc: '100 XP הרווחת' },
  { id: 'xp_500',          emoji: '💫', title: 'אלוף XP',        desc: '500 XP הרווחת' },
  { id: 'xp_2000',         emoji: '🌟', title: 'מלך ה-XP',       desc: '2,000 XP הרווחת' },
  { id: 'first_quiz',      emoji: '🎯', title: 'חידון ראשון',    desc: 'השלמת חידון' },
  { id: 'perfect_quiz',    emoji: '💯', title: 'מושלם!',         desc: 'ציון 100% בחידון' },
  { id: 'quizzes_10',      emoji: '🧠', title: 'חידונאי',        desc: '10 חידונים הושלמו' },
  { id: 'first_match',     emoji: '🃏', title: 'משחק ראשון',     desc: 'השלמת משחק התאמה' },
  { id: 'study_days_7',    emoji: '📆', title: 'שבוע לימוד',     desc: '7 ימי לימוד בסך הכל' },
  { id: 'study_days_30',   emoji: '🗓️', title: 'חודש לימוד',    desc: '30 ימי לימוד בסך הכל' },
]

export { ACHIEVEMENTS }

function getUnlocked() {
  try { return JSON.parse(localStorage.getItem('arabic_achievements') || '{}') } catch { return {} }
}

function saveUnlocked(u) {
  try { localStorage.setItem('arabic_achievements', JSON.stringify(u)) } catch {}
}

// Returns array of newly unlocked achievement IDs
export function checkAndUnlock({ totalKnown = 0, streak = 0, xp = 0, quizCount = 0, perfectQuiz = 0, matchCount = 0, totalDays = 0 } = {}) {
  const unlocked = getUnlocked()
  const newlyUnlocked = []

  const checks = [
    ['first_word',   totalKnown >= 1],
    ['words_10',     totalKnown >= 10],
    ['words_50',     totalKnown >= 50],
    ['words_100',    totalKnown >= 100],
    ['words_500',    totalKnown >= 500],
    ['streak_3',     streak >= 3],
    ['streak_7',     streak >= 7],
    ['streak_30',    streak >= 30],
    ['xp_100',       xp >= 100],
    ['xp_500',       xp >= 500],
    ['xp_2000',      xp >= 2000],
    ['first_quiz',   quizCount >= 1],
    ['perfect_quiz', perfectQuiz >= 1],
    ['quizzes_10',   quizCount >= 10],
    ['first_match',  matchCount >= 1],
    ['study_days_7', totalDays >= 7],
    ['study_days_30',totalDays >= 30],
  ]

  for (const [id, condition] of checks) {
    if (condition && !unlocked[id]) {
      unlocked[id] = Date.now()
      newlyUnlocked.push(id)
    }
  }

  if (newlyUnlocked.length > 0) saveUnlocked(unlocked)
  return newlyUnlocked
}

export function getAchievementStats() {
  try {
    return JSON.parse(localStorage.getItem('arabic_achievement_stats') || '{}')
  } catch { return {} }
}

export function incrementQuizCount(isPerfect = false) {
  try {
    const s = getAchievementStats()
    s.quizCount = (s.quizCount || 0) + 1
    if (isPerfect) s.perfectQuiz = (s.perfectQuiz || 0) + 1
    localStorage.setItem('arabic_achievement_stats', JSON.stringify(s))
  } catch {}
}

export function incrementMatchCount() {
  try {
    const s = getAchievementStats()
    s.matchCount = (s.matchCount || 0) + 1
    localStorage.setItem('arabic_achievement_stats', JSON.stringify(s))
  } catch {}
}

export function getAllUnlocked() {
  return getUnlocked()
}
