import { useState, useMemo } from 'react'
import { categories, getAllWords } from '../data/words.js'
import { getStreak, getBestStreak, getTotalStudyDays } from '../utils/streak.js'
import { g } from '../utils/user.js'
import { getLevelInfo } from '../utils/xp.js'
import { ACHIEVEMENTS, getAllUnlocked } from '../utils/achievements.js'

function getProgress() {
  try {
    const raw = localStorage.getItem('arabic_progress')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export default function Progress({ onBack }) {
  const [progress, setProgress] = useState(getProgress)
  const allWords = useMemo(() => getAllWords(), [])
  const streak = useMemo(() => getStreak(), [])
  const bestStreak = useMemo(() => getBestStreak(), [])
  const totalDays = useMemo(() => getTotalStudyDays(), [])
  const levelInfo = useMemo(() => getLevelInfo(), [])
  const unlocked = useMemo(() => getAllUnlocked(), [])

  const totalKnown = allWords.filter(w => progress[w.id] === 'known').length
  const totalLearning = allWords.filter(w => progress[w.id] === 'learning').length
  const totalPct = allWords.length > 0 ? Math.round((totalKnown / allWords.length) * 100) : 0

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

      {/* XP / Level card */}
      <div className="progress-xp-card">
        <div className="progress-xp-top">
          <span className="xp-level-badge">Lv.{levelInfo.level}</span>
          <span className="xp-level-name">{levelInfo.name}</span>
          <span className="xp-total">⭐ {levelInfo.xp} XP</span>
        </div>
        <div className="progress-cat-bar">
          <div className="progress-cat-fill" style={{ width: `${levelInfo.progress}%` }} />
        </div>
        {!levelInfo.isMax && (
          <div className="progress-xp-sub">
            עוד {levelInfo.nextLevelXP - levelInfo.xp} XP לרמה {levelInfo.level + 1}
          </div>
        )}
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

      {/* Achievements section */}
      <div className="achievements-section">
        <div className="achievements-title">🏅 הישגים</div>
        <div className="achievements-grid">
          {ACHIEVEMENTS.map(ach => {
            const isUnlocked = !!unlocked[ach.id]
            return (
              <div key={ach.id} className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                <div className="achievement-emoji">{ach.emoji}</div>
                <div className="achievement-title">{ach.title}</div>
                <div className="achievement-desc">{ach.desc}</div>
                {isUnlocked && <div className="achievement-check">✓</div>}
              </div>
            )
          })}
        </div>
        <div className="achievements-count">{Object.keys(unlocked).length}/{ACHIEVEMENTS.length} הישגים</div>
      </div>

      <button className="reset-btn" onClick={handleReset}>
        🗑 {g('אפסי', 'אפס')} את כל ההתקדמות
      </button>
    </div>
  )
}
