import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { categories, getAllWords, getCategoryById } from '../data/words.js'
import { speakArabic } from '../utils/tts.js'
import { g, isSoundEnabled } from '../utils/user.js'
import { addXP, XP_CORRECT, LEVEL_NAMES } from '../utils/xp.js'
import { playCorrect, playWrong, playLevelUp } from '../utils/sfx.js'
import { incrementQuizCount, getAchievementStats, checkAndUnlock, ACHIEVEMENTS } from '../utils/achievements.js'
import { getStreak, getTotalStudyDays, recordStudyToday } from '../utils/streak.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function ListeningQuiz({ categoryId, onBack }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId)

  const allWords = useMemo(() => getAllWords(), [])

  const words = useMemo(() => {
    if (!selectedCategoryId) return []
    return shuffle(
      selectedCategoryId === '__all__' || selectedCategoryId === null
        ? allWords
        : getCategoryById(selectedCategoryId)?.words || []
    )
  }, [selectedCategoryId, allWords])

  const [currentIndex, setCurrentIndex] = useState(0)
  const [hearts, setHearts] = useState(3)
  const [score, setScore] = useState({ correct: 0, wrong: 0 })
  const [answered, setAnswered] = useState(null) // null | 'correct' | 'wrong'
  const [selectedChoice, setSelectedChoice] = useState(null)
  const [levelUpInfo, setLevelUpInfo] = useState(null)
  const [achievementToast, setAchievementToast] = useState(null)
  const [done, setDone] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [sessionXP, setSessionXP] = useState(0)
  const [choices, setChoices] = useState([])

  const advanceTimer = useRef(null)
  const toastTimer = useRef(null)

  // Build 4 choices for current word
  const buildChoices = useCallback((word) => {
    const distractors = shuffle(
      allWords.filter(w => w.id !== word.id)
    ).slice(0, 3)
    setChoices(shuffle([word, ...distractors]))
  }, [allWords])

  // Auto-play audio + build choices when question changes
  useEffect(() => {
    if (!words.length || answered !== null) return
    const word = words[currentIndex]
    if (!word) return
    buildChoices(word)
    speakArabic(word.arabic, word.id)
  }, [currentIndex, words, answered, buildChoices])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current)
      if (toastTimer.current) clearTimeout(toastTimer.current)
    }
  }, [])

  // Trigger achievements + quiz count when done
  useEffect(() => {
    if (!done || gameOver || !words.length) return
    const total = score.correct + score.wrong
    const isPerfect = total > 0 && score.correct === total
    incrementQuizCount(isPerfect)
    recordStudyToday()
    const stats = getAchievementStats()
    const newIds = checkAndUnlock({
      streak: getStreak(),
      xp: (() => { try { return parseInt(localStorage.getItem('arabic_xp') || '0') } catch { return 0 } })(),
      quizCount: stats.quizCount || 0,
      perfectQuiz: stats.perfectQuiz || 0,
      matchCount: stats.matchCount || 0,
      totalDays: getTotalStudyDays()
    })
    if (newIds.length > 0) {
      const ach = ACHIEVEMENTS.find(a => a.id === newIds[0])
      if (ach) showAchievementToast(ach)
    }
  }, [done, gameOver])

  const showAchievementToast = (ach) => {
    setAchievementToast(ach)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setAchievementToast(null), 2500)
  }

  const advance = useCallback(() => {
    setCurrentIndex(i => {
      const next = i + 1
      if (next >= words.length) {
        setDone(true)
        return i
      }
      setAnswered(null)
      setSelectedChoice(null)
      return next
    })
  }, [words.length])

  const handleChoice = (choice) => {
    if (answered !== null) return
    const word = words[currentIndex]
    setSelectedChoice(choice)

    if (choice.id === word.id) {
      // Correct
      setAnswered('correct')
      playCorrect()
      navigator.vibrate?.(40)
      const result = addXP(XP_CORRECT)
      setSessionXP(prev => prev + XP_CORRECT)
      if (result.leveledUp) {
        setLevelUpInfo({ newLevel: result.newLevel, name: LEVEL_NAMES[result.newLevel - 1] })
        try { playLevelUp?.() } catch {}
      }
      // Check achievements mid-session
      const newIds = checkAndUnlock({
        streak: getStreak(),
        xp: result.newXP,
        quizCount: getAchievementStats().quizCount || 0,
        perfectQuiz: getAchievementStats().perfectQuiz || 0,
        matchCount: getAchievementStats().matchCount || 0,
        totalDays: getTotalStudyDays()
      })
      if (newIds.length > 0) {
        const ach = ACHIEVEMENTS.find(a => a.id === newIds[0])
        if (ach) showAchievementToast(ach)
      }
      setScore(s => ({ ...s, correct: s.correct + 1 }))
      advanceTimer.current = setTimeout(advance, 1000)
    } else {
      // Wrong
      setAnswered('wrong')
      playWrong()
      navigator.vibrate?.([20, 30, 20])
      setScore(s => ({ ...s, wrong: s.wrong + 1 }))
      const newHearts = hearts - 1
      setHearts(newHearts)
      if (newHearts === 0) {
        advanceTimer.current = setTimeout(() => {
          setGameOver(true)
          setDone(true)
        }, 1200)
      } else {
        advanceTimer.current = setTimeout(advance, 1200)
      }
    }
  }

  const resetQuiz = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current)
    setCurrentIndex(0)
    setHearts(3)
    setScore({ correct: 0, wrong: 0 })
    setAnswered(null)
    setSelectedChoice(null)
    setLevelUpInfo(null)
    setDone(false)
    setGameOver(false)
    setSessionXP(0)
    setChoices([])
    // Re-shuffle words by triggering re-mount via key change — just reset state
    // words are already shuffled via useMemo; force new shuffle by toggling category
    const cat = selectedCategoryId
    setSelectedCategoryId(null)
    setTimeout(() => setSelectedCategoryId(cat), 0)
  }

  // ── Category picker ──────────────────────────────────────────────
  if (!selectedCategoryId) {
    return (
      <div className="category-picker">
        <div className="picker-title">🎧 {g('בחרי', 'בחר')} קטגוריה להאזנה</div>
        <div className="picker-sub">{g('שמעי', 'שמע')} את המילה ובחרי את התרגום הנכון</div>
        <div className="picker-list">
          <div className="picker-item" onClick={() => setSelectedCategoryId('__all__')}>
            <span className="picker-emoji">🌍</span>
            <div className="picker-info">
              <div className="picker-name">כל המילים</div>
              <div className="picker-meta">{allWords.length} שאלות</div>
            </div>
            <span className="picker-arrow">←</span>
          </div>
          {categories.map(cat => (
            <div
              key={cat.id}
              className="picker-item"
              onClick={() => setSelectedCategoryId(cat.id)}
            >
              <span className="picker-emoji">{cat.emoji}</span>
              <div className="picker-info">
                <div className="picker-name">{cat.name}</div>
                <div className="picker-meta">{cat.words.length} שאלות</div>
              </div>
              <span className="picker-arrow">←</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Done / Game Over screens ─────────────────────────────────────
  if (done) {
    if (gameOver) {
      return (
        <div className="listen-screen">
          <div className="listen-header">
            <div className="listen-top-row">
              <button className="back-btn" onClick={onBack}>←</button>
              <span className="page-title">נגמרו הלבבות 💔</span>
            </div>
          </div>
          <div className="completion-screen animate-in game-over-screen">
            <span className="completion-emoji">💔</span>
            <div className="completion-title">נגמרו הלבבות</div>
            <div className="completion-sub">
              {score.correct > 0
                ? `ענית נכון על ${score.correct} שאלות לפני הסוף`
                : `${g('נסי', 'נסה')} שוב — ${g('את יכולה', 'אתה יכול')}!`}
            </div>
            <div className="completion-stats">
              <div className="comp-stat">
                <span className="comp-stat-num green">{score.correct}</span>
                <span className="comp-stat-label">נכון ✓</span>
              </div>
              <div className="comp-stat">
                <span className="comp-stat-num red">{score.wrong}</span>
                <span className="comp-stat-label">שגוי ✗</span>
              </div>
            </div>
            <div className="completion-btns">
              <button className="btn-primary" onClick={resetQuiz}>
                {g('נסי', 'נסה')} שוב 🔄
              </button>
              <button className="btn-secondary" onClick={onBack}>
                חזרה לבית
              </button>
            </div>
          </div>
        </div>
      )
    }

    // Normal completion
    const total = score.correct + score.wrong
    const pct = total > 0 ? Math.round((score.correct / total) * 100) : 0
    const isPerfect = pct === 100
    const emoji = isPerfect ? '💯' : pct >= 80 ? '🏆' : pct >= 60 ? '😊' : pct >= 40 ? '💪' : '📚'
    const msg = isPerfect
      ? 'מושלם! 💯'
      : pct >= 80 ? `מדהים! ${g('את כוכבת', 'אתה כוכב')}!`
      : pct >= 60 ? 'כל הכבוד!'
      : pct >= 40 ? 'יש שיפור!'
      : `${g('תמשיכי', 'תמשיך')} לתרגל!`

    return (
      <div className="listen-screen">
        {isPerfect && Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-20px',
              animationDelay: `${Math.random() * 0.8}s`,
              background: ['#f59e0b', '#ec4899', '#3b82f6', '#22c55e', '#8b5cf6'][i % 5]
            }}
          />
        ))}
        <div className="listen-header">
          <div className="listen-top-row">
            <button className="back-btn" onClick={onBack}>←</button>
            <span className="page-title">🎧 סיום האזנה</span>
          </div>
        </div>
        <div className={`completion-screen animate-in${isPerfect ? ' perfect-score' : ''}`}>
          <span className="completion-emoji">{emoji}</span>
          <div className={`completion-title${isPerfect ? ' perfect-title' : ''}`}>{msg}</div>
          <div className="completion-sub">{pct}% תשובות נכונות</div>
          {sessionXP > 0 && (
            <div className="xp-earned-badge">+{sessionXP} ⭐ XP הרווחת</div>
          )}
          <div className="completion-stats">
            <div className="comp-stat">
              <span className="comp-stat-num green">{score.correct}</span>
              <span className="comp-stat-label">נכון ✓</span>
            </div>
            <div className="comp-stat">
              <span className="comp-stat-num red">{score.wrong}</span>
              <span className="comp-stat-label">שגוי ✗</span>
            </div>
            <div className="comp-stat">
              <span className="comp-stat-num" style={{ color: '#f59e0b' }}>{sessionXP}</span>
              <span className="comp-stat-label">XP ⭐</span>
            </div>
          </div>
          <div className="completion-btns">
            <button className="btn-primary" onClick={resetQuiz}>
              חידון חדש 🔄
            </button>
            <button className="btn-secondary" onClick={onBack}>
              חזרה לבית
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!words.length || !choices.length) return null

  const word = words[currentIndex]
  const progressPct = Math.round((currentIndex / words.length) * 100)

  // ── Main quiz screen ─────────────────────────────────────────────
  return (
    <div className="listen-screen" style={{ position: 'relative' }}>
      {/* Level up overlay */}
      {levelUpInfo && (
        <div className="levelup-overlay" onClick={() => setLevelUpInfo(null)}>
          <div className="levelup-card" onClick={e => e.stopPropagation()}>
            <div className="levelup-stars">⭐⭐⭐</div>
            <div className="levelup-label">עלית רמה!</div>
            <div className="levelup-level">רמה {levelUpInfo.newLevel}</div>
            <div className="levelup-name">{levelUpInfo.name}</div>
            <button className="levelup-btn" onClick={() => setLevelUpInfo(null)}>המשך →</button>
          </div>
        </div>
      )}

      {/* Achievement toast */}
      {achievementToast && (
        <div className="achievement-toast">
          <span>{achievementToast.emoji}</span>
          <div>
            <div className="ach-toast-title">🏅 הישג חדש!</div>
            <div className="ach-toast-name">{achievementToast.title}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="listen-header">
        <div className="listen-top-row">
          <button className="back-btn" onClick={onBack}>←</button>
          <span className="page-title">🎧 האזנה</span>
          {/* Hearts */}
          <div className="hearts-display" style={{ marginBottom: 0 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`heart ${i >= hearts ? 'heart-lost' : ''}`}>❤️</span>
            ))}
          </div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
          {currentIndex + 1} / {words.length}
        </div>
        {/* Progress bar */}
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {/* Play button */}
      <div className="listen-play-area" key={currentIndex}>
        <button
          className="listen-play-btn"
          onClick={() => speakArabic(word.arabic, word.id)}
        >
          <span className="listen-icon">🔊</span>
          <span className="listen-hint">הקישי לשמוע שוב</span>
        </button>
      </div>

      {/* Choices grid */}
      <div className="listen-choices">
        {choices.map((c) => (
          <button
            key={c.id}
            className={`listen-choice ${
              answered === null ? '' :
              c.id === word.id ? 'correct' :
              c.id === selectedChoice?.id ? 'wrong' : 'dim'
            }`}
            onClick={() => handleChoice(c)}
            disabled={answered !== null}
          >
            {c.hebrew}
          </button>
        ))}
      </div>
    </div>
  )
}
