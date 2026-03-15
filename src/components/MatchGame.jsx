import { useState, useEffect, useCallback, useMemo } from 'react'
import { getAllWords, getCategoryById, categories } from '../data/words.js'
import { g } from '../utils/user.js'
import { speakArabic } from '../utils/tts.js'
import { incrementMatchCount, checkAndUnlock, getAchievementStats } from '../utils/achievements.js'
import { getStreak, getTotalStudyDays } from '../utils/streak.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function MatchGame({ categoryId, onBack }) {
  const [selectedCatId, setSelectedCatId] = useState(categoryId)
  const [pairs, setPairs] = useState([])          // { id, arabic, hebrew, wordId }
  const [selectedAr, setSelectedAr] = useState(null)  // id of selected arabic card
  const [matched, setMatched] = useState(new Set())   // set of matched pair ids
  const [shaking, setShaking] = useState(null)        // id that's shaking (wrong)
  const [score, setScore] = useState(0)
  const [errors, setErrors] = useState(0)
  const [done, setDone] = useState(false)
  const [round, setRound] = useState(1)
  const [allWordsList, setAllWordsList] = useState([])

  // Build a round of 6 pairs from the word pool
  const buildRound = useCallback((catId, wordPool) => {
    const pool = [...wordPool]
    shuffle(pool)
    const chosen = pool.slice(0, 6)
    const p = chosen.map(w => ({ id: w.id, arabic: w.arabic, hebrew: w.hebrew, wordId: w.id }))
    setPairs(p)
    setSelectedAr(null)
    setMatched(new Set())
    setShaking(null)
  }, [])

  useEffect(() => {
    if (selectedCatId) {
      const words =
        selectedCatId === '__all__'
          ? getAllWords()
          : getCategoryById(selectedCatId)?.words || []
      setAllWordsList(words)
      setScore(0)
      setErrors(0)
      setRound(1)
      setDone(false)
      buildRound(selectedCatId, words)
    }
  }, [selectedCatId, buildRound])

  // Trigger achievements when match game ends
  useEffect(() => {
    if (!done) return
    incrementMatchCount()
    const stats = getAchievementStats()
    checkAndUnlock({
      streak: getStreak(),
      xp: (() => { try { return parseInt(localStorage.getItem('arabic_xp') || '0') } catch { return 0 } })(),
      quizCount: stats.quizCount || 0,
      matchCount: stats.matchCount || 0,
      totalDays: getTotalStudyDays()
    })
  }, [done])

  // Shuffle hebrew column once per pairs change (not on every render)
  const hebrewOrder = useMemo(() => shuffle([...pairs]), [pairs])

  const handleArabicTap = (pair) => {
    if (matched.has(pair.id) || shaking) return
    setSelectedAr(pair.id === selectedAr ? null : pair.id)
    speakArabic(pair.arabic, pair.wordId)
  }

  const handleHebrewTap = (pair) => {
    if (matched.has(pair.id) || !selectedAr || shaking) return

    if (selectedAr === pair.id) {
      // Correct match
      navigator.vibrate?.(30)
      const newMatched = new Set([...matched, pair.id])
      setMatched(newMatched)
      setSelectedAr(null)
      setScore(s => s + 1)

      if (newMatched.size === pairs.length) {
        setTimeout(() => {
          if (allWordsList.length > 6) {
            setRound(r => r + 1)
            buildRound(selectedCatId, allWordsList)
          } else {
            setDone(true)
          }
        }, 600)
      }
    } else {
      // Wrong match — shake the selected arabic card
      navigator.vibrate?.([20, 30, 20])
      setErrors(e => e + 1)
      setShaking(selectedAr)
      setTimeout(() => {
        setShaking(null)
        setSelectedAr(null)
      }, 500)
    }
  }

  // ── Category picker (when no category pre-selected) ─────────────────────────
  if (!selectedCatId && categoryId === null) {
    return (
      <div className="category-picker">
        <div className="picker-title">🃏 {g('בחרי', 'בחר')} קטגוריה למשחק</div>
        <div className="picker-sub">חברי כל מילה לתרגום שלה</div>
        <div className="picker-list">
          <div className="picker-item" onClick={() => setSelectedCatId('__all__')}>
            <span className="picker-emoji">🌍</span>
            <div className="picker-info">
              <div className="picker-name">כל המילים</div>
            </div>
            <span className="picker-arrow">←</span>
          </div>
          {categories.map(cat => (
            <div
              key={cat.id}
              className="picker-item"
              onClick={() => setSelectedCatId(cat.id)}
            >
              <span className="picker-emoji">{cat.emoji}</span>
              <div className="picker-info">
                <div className="picker-name">{cat.name}</div>
              </div>
              <span className="picker-arrow">←</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Completion screen ────────────────────────────────────────────────────────
  if (done) {
    const total = score + errors
    const accuracy = total > 0 ? Math.round((score / total) * 100) : 100
    return (
      <div className="match-screen">
        <div className="quiz-header">
          <div className="quiz-top-row">
            <button className="back-btn" onClick={onBack}>←</button>
            <span className="page-title">🃏 התאמת זוגות</span>
          </div>
        </div>
        <div className="completion-screen animate-in">
          <span className="completion-emoji">
            {accuracy === 100 ? '🏆' : accuracy >= 70 ? '⭐' : '💪'}
          </span>
          <div className="completion-title">
            {accuracy === 100 ? 'מושלם בלי שגיאות!' : `${accuracy}% דיוק`}
          </div>
          <div className="completion-stats">
            <div className="comp-stat">
              <span className="comp-stat-num">{round}</span>
              <span className="comp-stat-label">סיבובים</span>
            </div>
            <div className="comp-stat">
              <span className="comp-stat-num green">{score}</span>
              <span className="comp-stat-label">זוגות נכונים</span>
            </div>
            <div className="comp-stat">
              <span className="comp-stat-num red">{errors}</span>
              <span className="comp-stat-label">שגיאות</span>
            </div>
          </div>
          <div className="completion-btns">
            <button
              className="btn-primary"
              onClick={() => {
                setRound(1)
                setScore(0)
                setErrors(0)
                setDone(false)
                buildRound(selectedCatId, allWordsList)
              }}
            >
              {g('שחקי', 'שחק')} שוב 🔄
            </button>
            <button className="btn-secondary" onClick={onBack}>
              חזרה לבית
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!pairs.length) return null

  // ── Main game board ──────────────────────────────────────────────────────────
  return (
    <div className="match-screen">
      <div className="quiz-header">
        <div className="quiz-top-row">
          <button className="back-btn" onClick={onBack}>←</button>
          <span className="page-title">🃏 התאמת זוגות</span>
          <div className="match-round-badge">סיבוב {round}</div>
        </div>
        <div className="progress-bar-wrap">
          <div
            className="progress-bar-fill"
            style={{ width: `${Math.round((matched.size / pairs.length) * 100)}%` }}
          />
        </div>
      </div>

      <div className="match-stats-row">
        <span className="match-stat green">✓ {score}</span>
        <span className="match-instructions">{g('בחרי', 'בחר')} מילה בערבית ← תרגום</span>
        <span className="match-stat red">✗ {errors}</span>
      </div>

      <div className="match-grid">
        {/* Arabic column — fixed order */}
        <div className="match-col">
          {pairs.map(pair => (
            <button
              key={pair.id + '_ar'}
              className={[
                'match-card match-card-ar',
                matched.has(pair.id) ? 'matched' : '',
                selectedAr === pair.id ? 'selected' : '',
                shaking === pair.id ? 'shake' : ''
              ].filter(Boolean).join(' ')}
              onClick={() => handleArabicTap(pair)}
              disabled={matched.has(pair.id)}
            >
              {pair.arabic}
            </button>
          ))}
        </div>

        {/* Hebrew column — shuffled once per round via useMemo */}
        <div className="match-col">
          {hebrewOrder.map(pair => (
            <button
              key={pair.id + '_he'}
              className={[
                'match-card match-card-he',
                matched.has(pair.id) ? 'matched' : '',
                selectedAr && !matched.has(pair.id) ? 'hoverable' : ''
              ].filter(Boolean).join(' ')}
              onClick={() => handleHebrewTap(pair)}
              disabled={matched.has(pair.id)}
            >
              {pair.hebrew}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
