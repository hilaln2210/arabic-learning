import { useState, useMemo } from 'react'
import { categories, getAllWords } from '../data/words.js'
import { getStreak, getBestStreak, getTotalStudyDays } from '../utils/streak.js'
import { g } from '../utils/user.js'

function getProgress() {
  try {
    const raw = localStorage.getItem('arabic_progress')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function getLevelInfo(known) {
  if (known >= 46) return { label: g('מאסטרית', 'מאסטר'), next: null, nextAt: null }
  if (known >= 26) return { label: g('מיומנת', 'מיומן'), next: g('מאסטרית', 'מאסטר'), nextAt: 46 }
  if (known >= 11) return { label: g('מתקדמת', 'מתקדם'), next: g('מיומנת', 'מיומן'), nextAt: 26 }
  return { label: g('מתחילה', 'מתחיל'), next: g('מתקדמת', 'מתקדם'), nextAt: 11 }
}

export default function Progress({ onBack }) {
  const [progress, setProgress] = useState(getProgress)
  const allWords = useMemo(() => getAllWords(), [])
  const streak = useMemo(() => getStreak(), [])
  const bestStreak = useMemo(() => getBestStreak(), [])
  const totalDays = useMemo(() => getTotalStudyDays(), [])

  const totalKnown = allWords.filter(w => progress[w.id] === 'known').length
  const totalLearning = allWords.filter(w => progress[w.id] === 'learning').length
  const totalPct = allWords.length > 0 ? Math.round((totalKnown / allWords.length) * 100) : 0

  const levelInfo = getLevelInfo(totalKnown)
  const levelPct = levelInfo.nextAt
    ? Math.min(100, Math.round((totalKnown / levelInfo.nextAt) * 100))
    : 100

  const handleReset = () => {
    if (window.confirm('למחוק את כל ההתקדמות?')) {
      localStorage.removeItem('arabic_progress')
      setProgress({})
    }
  }

  return (
    <div className="progress-screen">
      <div className="progress-header">
        <div className="progress-title">📊 ההתקדמות שלי</div>
        <div className="progress-subtitle">מה {g('יודעת', 'יודע')}, מה עוד צריך ללמוד</div>
      </div>

      {/* Streak stats row */}
      <div className="progress-streak-row">
        <div className="progress-streak-card">
          <span className="progress-streak-num">🔥 {streak}</span>
          <span className="progress-streak-label">ימים ברצף</span>
        </div>
        <div className="progress-streak-card">
          <span className="progress-streak-num">🏆 {bestStreak}</span>
          <span className="progress-streak-label">שיא אישי</span>
        </div>
        <div className="progress-streak-card">
          <span className="progress-streak-num">📆 {totalDays}</span>
          <span className="progress-streak-label">ימי לימוד</span>
        </div>
      </div>

      <div className="progress-total-card">
        <div className="progress-total-num">{totalPct}%</div>
        <div className="progress-total-label">
          {totalKnown} מתוך {allWords.length} מילים ידועות
        </div>
        {totalLearning > 0 && (
          <div className="progress-total-sub">
            {totalLearning} מילים עוד בתרגול
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <span className="level-badge">{levelInfo.label}</span>
            {levelInfo.next && (
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                {totalKnown}/{levelInfo.nextAt} → {levelInfo.next}
              </span>
            )}
          </div>
          <div className="progress-cat-bar">
            <div className="progress-cat-fill" style={{ width: `${levelPct}%` }} />
          </div>
        </div>
      </div>

      <div className="progress-categories">
        {categories.map(cat => {
          const known = cat.words.filter(w => progress[w.id] === 'known').length
          const pct = Math.round((known / cat.words.length) * 100)
          return (
            <div key={cat.id} className="progress-cat-card">
              <div className="progress-cat-top">
                <span className="progress-cat-emoji">{cat.emoji}</span>
                <span className="progress-cat-name">{cat.name}</span>
                <span className="progress-cat-count">{known}/{cat.words.length}</span>
              </div>
              <div className="progress-cat-bar">
                <div className="progress-cat-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>

      <button className="reset-btn" onClick={handleReset}>
        🗑 {g('אפסי', 'אפס')} את כל ההתקדמות
      </button>
    </div>
  )
}
