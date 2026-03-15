import { useState, useEffect, useCallback, useRef } from 'react'
import { categories, getAllWords, getCategoryById } from '../data/words.js'
import { speakArabic } from '../utils/tts.js'
import { g } from '../utils/user.js'
import { playCorrect, playWrong } from '../utils/sfx.js'
import { addXP, XP_CORRECT, LEVEL_NAMES } from '../utils/xp.js'
import { checkAndUnlock, getAchievementStats, incrementQuizCount } from '../utils/achievements.js'
import { getStreak, getTotalStudyDays } from '../utils/streak.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function buildQuestion(word, allWords) {
  const correct = word.hebrew
  const distractors = shuffle(
    allWords
      .filter(w => w.id !== word.id)
      .map(w => w.hebrew)
      .filter((h, i, arr) => arr.indexOf(h) === i)
  ).slice(0, 3)

  const choices = shuffle([correct, ...distractors])
  return { word, correct, choices }
}

function getProgress() {
  try {
    const raw = localStorage.getItem('arabic_progress')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export default function QuizMode({ categoryId, onBack }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId)
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [score, setScore] = useState({ correct: 0, wrong: 0 })
  const [done, setDone] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [hearts, setHearts] = useState(3)
  const [xpFloat, setXpFloat] = useState(null)
  const [sessionXP, setSessionXP] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [lostHeartIndex, setLostHeartIndex] = useState(null)
  const [levelUpInfo, setLevelUpInfo] = useState(null)
  const autoAdvanceTimer = useRef(null)
  const xpFloatTimer = useRef(null)

  const allWords = getAllWords()

  const buildQuiz = useCallback((catId) => {
    const words = catId === '__all__' || !catId
      ? shuffle(allWords)
      : shuffle(getCategoryById(catId)?.words || [])
    setQuestions(words.map(w => buildQuestion(w, allWords)))
    setCurrentIndex(0)
    setSelected(null)
    setScore({ correct: 0, wrong: 0 })
    setDone(false)
    setGameOver(false)
    setShowFeedback(false)
    setHearts(3)
    setSessionXP(0)
    setXpFloat(null)
    setLostHeartIndex(null)
  }, [])

  useEffect(() => {
    if (selectedCategoryId) {
      buildQuiz(selectedCategoryId)
    }
  }, [selectedCategoryId, buildQuiz])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
      if (xpFloatTimer.current) clearTimeout(xpFloatTimer.current)
    }
  }, [])

  // Trigger achievements when quiz finishes
  useEffect(() => {
    if (!done || gameOver) return
    const total = score.correct + score.wrong
    const pct = total > 0 ? Math.round((score.correct / total) * 100) : 0
    const isPerfect = pct === 100
    incrementQuizCount(isPerfect)
    const stats = getAchievementStats()
    checkAndUnlock({
      streak: getStreak(),
      xp: (() => { try { return parseInt(localStorage.getItem('arabic_xp') || '0') } catch { return 0 } })(),
      quizCount: stats.quizCount || 0,
      perfectQuiz: stats.perfectQuiz || 0,
      matchCount: stats.matchCount || 0,
      totalDays: getTotalStudyDays()
    })
  }, [done, gameOver])

  const handleNext = useCallback(() => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current)
    setCurrentIndex(i => {
      const next = i + 1
      if (next >= questions.length) {
        setDone(true)
        return i
      }
      return next
    })
    setSelected(null)
    setShowFeedback(false)
  }, [questions.length])

  const handleChoice = (choice) => {
    if (selected !== null) return
    const isCorrect = choice === questions[currentIndex].correct

    if (isCorrect) {
      navigator.vibrate?.(40)
      playCorrect()
      const result = addXP(XP_CORRECT)
      if (result.leveledUp) {
        setLevelUpInfo({ newLevel: result.newLevel, name: LEVEL_NAMES[result.newLevel - 1] })
      }
      setSessionXP(prev => prev + XP_CORRECT)

      // Show floating XP animation
      if (xpFloatTimer.current) clearTimeout(xpFloatTimer.current)
      setXpFloat({ id: Date.now(), text: `+${XP_CORRECT} ⭐` })
      xpFloatTimer.current = setTimeout(() => setXpFloat(null), 800)
    } else {
      navigator.vibrate?.([20, 30, 20])
      playWrong()
      setHearts(h => {
        const newHearts = h - 1
        // Animate the heart being lost
        setLostHeartIndex(newHearts)
        setTimeout(() => setLostHeartIndex(null), 600)

        if (newHearts === 0) {
          // Game over after showing wrong feedback briefly
          autoAdvanceTimer.current = setTimeout(() => {
            setGameOver(true)
            setDone(true)
          }, 1000)
        }
        return newHearts
      })
    }

    setSelected(choice)
    setShowFeedback(true)
    setScore(s => ({
      correct: s.correct + (isCorrect ? 1 : 0),
      wrong: s.wrong + (isCorrect ? 0 : 1)
    }))

    // Auto-advance after 1.5 seconds (only if not game over)
    if (isCorrect || hearts > 1) {
      autoAdvanceTimer.current = setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(i => i + 1)
          setSelected(null)
          setShowFeedback(false)
        } else {
          setDone(true)
        }
      }, 1500)
    }
  }

  // Category picker
  if (!selectedCategoryId && categoryId === null) {
    return (
      <div className="category-picker">
        <div className="picker-title">🎯 {g('בחרי', 'בחר')} קטגוריה לחידון</div>
        <div className="picker-sub">כמה מילים {g('את יודעת', 'אתה יודע')}?</div>
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

  // Done / Game over screen
  if (done) {
    // Game over (ran out of hearts)
    if (gameOver) {
      return (
        <div className="quiz-screen">
          <div className="quiz-header">
            <div className="quiz-top-row">
              <button className="back-btn" onClick={onBack}>←</button>
              <span className="page-title">Game Over</span>
            </div>
          </div>
          <div className="completion-screen animate-in game-over-screen">
            <span className="completion-emoji">💔</span>
            <div className="hearts-display hearts-display-done">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className="heart heart-lost">❤️</span>
              ))}
            </div>
            <div className="completion-title">נגמרו הלבבות</div>
            <div className="completion-sub">
              {score.correct > 0
                ? `ענית נכון על ${score.correct} שאלות לפני הסוף`
                : 'נסה שוב — אתה יכול!'}
            </div>
            {sessionXP > 0 && (
              <div className="xp-earned-badge">
                +{sessionXP} ⭐ XP הרווחת
              </div>
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
            </div>
            <div className="completion-btns">
              <button
                className="btn-primary"
                onClick={() => buildQuiz(selectedCategoryId)}
              >
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

    // Normal completion screen
    const total = score.correct + score.wrong
    const pct = total > 0 ? Math.round((score.correct / total) * 100) : 0
    const isPerfect = pct === 100
    const emoji = isPerfect ? '💯' : pct >= 80 ? '🏆' : pct >= 60 ? '😊' : pct >= 40 ? '💪' : '📚'
    const msg = isPerfect ? 'מושלם! 💯' : pct >= 80 ? `מדהים! ${g('את כוכבת', 'אתה כוכב')}!` : pct >= 60 ? 'כל הכבוד!' : pct >= 40 ? 'יש שיפור!' : `${g('תמשיכי', 'תמשיך')} לתרגל!`

    return (
      <div className="quiz-screen">
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
        <div className="quiz-header">
          <div className="quiz-top-row">
            <button className="back-btn" onClick={onBack}>←</button>
            <span className="page-title">סיום החידון</span>
          </div>
        </div>
        <div className={`completion-screen animate-in${isPerfect ? ' perfect-score' : ''}`}>
          <span className="completion-emoji">{emoji}</span>
          <div className={`completion-title${isPerfect ? ' perfect-title' : ''}`}>{msg}</div>
          <div className="completion-sub">{pct}% תשובות נכונות</div>
          {sessionXP > 0 && (
            <div className="xp-earned-badge">
              +{sessionXP} ⭐ XP הרווחת
            </div>
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
            <button
              className="btn-primary"
              onClick={() => buildQuiz(selectedCategoryId)}
            >
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

  if (!questions.length) return null

  const q = questions[currentIndex]
  const pct = Math.round((currentIndex / questions.length) * 100)
  const isCorrect = selected === q.correct

  return (
    <div className="quiz-screen" style={{ position: 'relative' }}>
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
      {/* Floating XP animation */}
      {xpFloat && (
        <div key={xpFloat.id} className="xp-float animate-xp">
          +{XP_CORRECT} ⭐
        </div>
      )}

      <div className="quiz-header">
        <div className="quiz-top-row">
          <button className="back-btn" onClick={onBack}>←</button>
          <span className="page-title">
            חידון {currentIndex + 1}/{questions.length}
          </span>
          <div className="quiz-score">
            <span className="score-green">{score.correct}✓</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span className="score-red">{score.wrong}✗</span>
          </div>
        </div>

        {/* Hearts display */}
        <div className="hearts-display">
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className={`heart ${i >= hearts ? 'heart-lost' : ''} ${i === lostHeartIndex ? 'heart-losing' : ''}`}
            >
              ❤️
            </span>
          ))}
        </div>

        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="quiz-question-card animate-in" key={currentIndex}>
        <div className="quiz-arabic">{q.word.arabic}</div>
        <div className="quiz-translit">{q.word.transliteration}</div>
        <button className="tts-btn-quiz" onClick={() => speakArabic(q.word.arabic, q.word.id)}>
          🔊
        </button>
      </div>

      <div className="quiz-choices">
        {q.choices.map((choice, i) => {
          let cls = 'choice-btn'
          if (selected !== null) {
            if (choice === q.correct) cls += ' correct'
            else if (choice === selected && choice !== q.correct) cls += ' wrong'
            else cls += ' disabled'
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => handleChoice(choice)}
              disabled={selected !== null && choice !== q.correct && choice !== selected}
            >
              {choice}
            </button>
          )
        })}
      </div>

      {showFeedback && (
        <div className={`quiz-feedback ${isCorrect ? 'correct' : 'wrong'} animate-in`}>
          {isCorrect
            ? '✓ נכון מאוד!'
            : `✗ לא נכון — התשובה הנכונה: ${q.correct}`}
          <div className="trick-mini">🧠 {q.word.trick}</div>
        </div>
      )}

      {selected !== null && (
        <button className="next-btn animate-in" onClick={handleNext}>
          {currentIndex < questions.length - 1 ? 'שאלה הבאה ←' : 'סיום החידון 🏁'}
        </button>
      )}
    </div>
  )
}
