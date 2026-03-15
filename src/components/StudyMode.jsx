import { useState, useEffect, useRef, useCallback } from 'react'
import { categories, getAllWords, getCategoryById } from '../data/words.js'
import { recordStudyToday, getStreak, getTotalStudyDays } from '../utils/streak.js'
import { updateSRS, getDueWords } from '../utils/srs.js'
import { speakArabic } from '../utils/tts.js'
import { g, isSoundEnabled, isAutoplayEnabled } from '../utils/user.js'
import { addXP, XP_CORRECT, LEVEL_NAMES } from '../utils/xp.js'
import { checkAndUnlock, getAchievementStats, ACHIEVEMENTS } from '../utils/achievements.js'
import { playCorrect, playWrong } from '../utils/sfx.js'

function recordDailyWord() {
  try {
    const today = new Date().toDateString()
    const raw = localStorage.getItem('arabic_daily_progress')
    const cur = raw ? JSON.parse(raw) : { date: today, count: 0 }
    const count = cur.date === today ? cur.count + 1 : 1
    localStorage.setItem('arabic_daily_progress', JSON.stringify({ date: today, count }))
  } catch {}
}

function getProgress() {
  try {
    const raw = localStorage.getItem('arabic_progress')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveProgress(progress) {
  try {
    localStorage.setItem('arabic_progress', JSON.stringify(progress))
  } catch {}
}

const CAT_BACK_CLASS = {
  military: 'back-military',
  intel: 'back-intel',
  news: 'back-news',
  daily: 'back-daily',
  greetings: 'back-greetings',
  numbers: 'back-numbers',
  family: 'back-family',
  body: 'back-body',
  nature: 'back-nature',
  time: 'back-time',
  colors: 'back-colors',
  food: 'back-food',
  home_items: 'back-home-cat',
  clothes: 'back-clothes',
  work: 'back-work',
  transport: 'back-transport',
  health: 'back-health',
  education: 'back-education',
  emotions: 'back-emotions',
  weather: 'back-weather',
  animals: 'back-animals',
  places: 'back-places',
  verbs: 'back-verbs',
  adjectives: 'back-adjectives',
  questions: 'back-questions',
  professions: 'back-professions',
  daily_verbs: 'back-daily_verbs',
  phrases: 'back-phrases',
  sports: 'back-sports',
  tech: 'back-tech',
  restaurant: 'back-restaurant',
  shopping: 'back-shopping',
  religion: 'back-religion',
  law: 'back-law',
  music_art: 'back-music_art',
  geography: 'back-geography',
  big_numbers: 'back-big_numbers',
  days_months: 'back-days_months',
  directions: 'back-directions',
  conjunctions: 'back-conjunctions',
  finance: 'back-finance',
  travel: 'back-travel',
  media: 'back-media',
  agriculture: 'back-agriculture',
  extended_family: 'back-extended_family',
  housing: 'back-housing',
  military_adv: 'back-military_adv',
  medical_adv: 'back-medical_adv',
  verbs2: 'back-verbs2',
  verbs3: 'back-verbs3',
  adjectives2: 'back-adjectives2',
  adjectives3: 'back-adjectives3',
  communication: 'back-communication',
  wildlife: 'back-wildlife',
  abstract: 'back-abstract',
  daily_adv: 'back-daily_adv',
  construction: 'back-construction',
  sea: 'back-sea',
  space: 'back-space',
  cooking: 'back-cooking',
  cleaning: 'back-cleaning',
  kindergarten: 'back-kindergarten',
  banking: 'back-banking',
  wedding: 'back-wedding',
  field_military: 'back-field_military',
  politics: 'back-politics',
  economy: 'back-economy',
  edu_adv: 'back-edu_adv',
  dental: 'back-dental',
  police: 'back-police',
  internet: 'back-internet',
  slang: 'back-slang',
  traffic: 'back-traffic',
  furniture: 'back-furniture',
  kitchen_tools: 'back-kitchen_tools',
  fruits: 'back-fruits',
  vegetables: 'back-vegetables',
  describing_people: 'back-describing_people',
  weather_adv: 'back-weather_adv',
  clothes2: 'back-clothes2',
  religion_adv: 'back-religion_adv',
  games: 'back-games',
  living: 'back-living',
  tradition: 'back-tradition',
  math: 'back-math',
}

export default function StudyMode({ categoryId, onBack }) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(categoryId)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [progress, setProgress] = useState(getProgress)
  const [known, setKnown] = useState(0)
  const [dunno, setDunno] = useState(0)
  const [done, setDone] = useState(false)
  const [swipeAnim, setSwipeAnim] = useState(null)
  const [dunnoCount, setDunnoCount] = useState({})
  const [funnyMsg, setFunnyMsg] = useState(null)
  const [trickAlt, setTrickAlt] = useState({})
  const [missedIds, setMissedIds] = useState([]) // words marked dunno this session
  const [reviewWords, setReviewWords] = useState(null) // null = normal, array = review mode
  const [levelUpInfo, setLevelUpInfo] = useState(null)
  const [achievementToast, setAchievementToast] = useState(null)

  const FUNNY_MESSAGES = [
    `נו באמת, זו כבר הפעם ה-{n}! 😅 החלפתי לך טריק חדש 👇`,
    `המילה הזו ממש מתעקשת לברוח לך מהראש 🏃‍♂️ ננסה גישה אחרת!`,
    `הטריק הישן לא עובד? ${g('קבלי', 'קבל')} אחד חדש ↓ 🧠✨`,
    `פעם {n}! טיפ: ${g('תגידי', 'תגיד')} בקול — {transliteration}, {transliteration}, {transliteration} 🗣️`,
    `פעם {n}! המילה הזו צריכה קעקוע על היד 💪 ${g('בדקי', 'בדוק')} את הטריק החדש`,
    `היי, לפחות ${g('את עקבית', 'אתה עקבי')} 😂 הפעם ניסיתי טריק אחר`,
    `שקט! המילה הזו שומעת ש${g('את לא זוכרת', 'אתה לא זוכר')} 🤫 רענון למטה!`,
    `אל דאגה, אפילו מי שמדבר ערבית שוכח מילים 😄`,
    `פעם {n}... ${g('את שוברת', 'אתה שובר')} שיאים! 🏆 טריק מוחלף לך`,
    `המוח שלך עדיין מעבד 🔄 ננסה זווית אחרת`,
    `אולי ${g('תנסי', 'תנסה')} לשיר? 🎵 {arabic}~ ← הצצה לטריק חדש`,
    `יאללה, {transliteration} — ${g('בדקי', 'בדוק')} את הטריק החדש למטה! 🆕`,
  ]

  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  useEffect(() => {
    recordStudyToday()
    if (selectedCategoryId && selectedCategoryId !== '__srs__' && selectedCategoryId !== '__all__') {
      try { localStorage.setItem('arabic_last_category', selectedCategoryId) } catch {}
    }
  }, [selectedCategoryId])

  // Build the active word list
  const activeWords = reviewWords || (() => {
    if (selectedCategoryId === '__srs__') return getDueWords(getAllWords())
    if (selectedCategoryId === '__all__' || !selectedCategoryId) return getAllWords()
    return getCategoryById(selectedCategoryId)?.words || []
  })()

  const category = selectedCategoryId && selectedCategoryId !== '__all__' && selectedCategoryId !== '__srs__'
    ? getCategoryById(selectedCategoryId)
    : null

  const word = activeWords[currentIndex]

  const goNext = useCallback(() => {
    setFunnyMsg(null)
    if (currentIndex < activeWords.length - 1) {
      setCurrentIndex(i => i + 1)
      setIsFlipped(false)
    } else {
      setDone(true)
    }
  }, [currentIndex, activeWords.length])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
      setIsFlipped(false)
    }
  }, [currentIndex])

  const animateSwipe = useCallback((dir, cb) => {
    setSwipeAnim(dir)
    setTimeout(() => {
      setSwipeAnim(null)
      cb()
    }, 220)
  }, [])

  const markKnown = useCallback(() => {
    if (!word) return
    navigator.vibrate?.(30)
    playCorrect()
    updateSRS(word.id, true)
    const xpResult = addXP(XP_CORRECT)
    if (xpResult.leveledUp) {
      setLevelUpInfo({ newLevel: xpResult.newLevel, name: LEVEL_NAMES[xpResult.newLevel - 1] })
    }
    recordDailyWord()
    const updated = { ...progress, [word.id]: 'known' }
    setProgress(updated)
    saveProgress(updated)
    const totalKnown = Object.values(updated).filter(v => v === 'known').length
    const stats = getAchievementStats()
    const newAch = checkAndUnlock({ totalKnown, streak: getStreak(), xp: xpResult.newXP, quizCount: stats.quizCount || 0, perfectQuiz: stats.perfectQuiz || 0, matchCount: stats.matchCount || 0, totalDays: getTotalStudyDays() })
    if (newAch.length > 0) {
      const ach = ACHIEVEMENTS.find(a => a.id === newAch[0])
      if (ach) { setAchievementToast(ach); setTimeout(() => setAchievementToast(null), 2500) }
    }
    setKnown(k => k + 1)
    animateSwipe('right', goNext)
  }, [word, progress, goNext, animateSwipe])

  const markDunno = useCallback(() => {
    if (!word) return
    navigator.vibrate?.([15, 15])
    playWrong()
    updateSRS(word.id, false)
    const wordId = word.id
    const newCount = (dunnoCount[wordId] || 0) + 1
    setDunnoCount(prev => ({ ...prev, [wordId]: newCount }))
    setMissedIds(prev => prev.includes(wordId) ? prev : [...prev, wordId])

    if (newCount >= 2) {
      const template = FUNNY_MESSAGES[Math.floor(Math.random() * FUNNY_MESSAGES.length)]
      const msg = template
        .replace(/{n}/g, newCount)
        .replace(/{arabic}/g, word.arabic)
        .replace(/{transliteration}/g, word.transliteration)
      setFunnyMsg(msg)
      setTimeout(() => setFunnyMsg(null), 3000)
    }

    const updated = { ...progress, [word.id]: 'learning' }
    setProgress(updated)
    saveProgress(updated)
    setDunno(d => d + 1)
    animateSwipe('left', goNext)
  }, [word, dunnoCount, progress, goNext, animateSwipe])

  // 🔊 Auto-play when card flips to back
  useEffect(() => {
    if (isFlipped && word && isSoundEnabled() && isAutoplayEnabled()) {
      speakArabic(word.arabic, word.id)
    }
  }, [isFlipped]) // eslint-disable-line react-hooks/exhaustive-deps

  // ⌨️ Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e) => {
      if (done) return
      if (['Space', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
      if (e.code === 'Space') {
        setIsFlipped(f => !f)
      } else if (e.code === 'ArrowRight' && isFlipped) {
        markKnown()
      } else if (e.code === 'ArrowLeft' && isFlipped) {
        markDunno()
      } else if ((e.key === 't' || e.key === 'T') && word && isSoundEnabled()) {
        speakArabic(word.arabic, word.id)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isFlipped, done, word, markKnown, markDunno])

  // Touch/swipe handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    const dy = e.changedTouches[0].clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null

    if (Math.abs(dy) > Math.abs(dx)) return

    if (!isFlipped) {
      if (Math.abs(dx) > 50) setIsFlipped(true)
      return
    }

    if (Math.abs(dx) > 50) {
      if (dx > 0) markKnown()
      else markDunno()
    }
  }

  // Category picker
  if (!selectedCategoryId && categoryId === null) {
    return (
      <div className="category-picker">
        <div className="picker-title">📖 {g('בחרי', 'בחר')} קטגוריה</div>
        <div className="picker-sub">או {g('למדי', 'למד')} את כל המילים ביחד</div>
        <div className="picker-list">
          <div className="picker-item" onClick={() => setSelectedCategoryId('__all__')}>
            <span className="picker-emoji">🌍</span>
            <div className="picker-info">
              <div className="picker-name">כל המילים</div>
              <div className="picker-meta">{getAllWords().length} מילים</div>
            </div>
            <span className="picker-arrow">←</span>
          </div>
          {categories.map(cat => (
            <div key={cat.id} className="picker-item" onClick={() => setSelectedCategoryId(cat.id)}>
              <span className="picker-emoji">{cat.emoji}</span>
              <div className="picker-info">
                <div className="picker-name">{cat.name}</div>
                <div className="picker-meta">{cat.words.length} מילים</div>
              </div>
              <span className="picker-arrow">←</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Session summary / done screen
  if (done) {
    const missed = activeWords.filter(w => missedIds.includes(w.id))
    const isReviewMode = !!reviewWords
    const accuracy = activeWords.length > 0
      ? Math.round((known / (known + dunno)) * 100) || 0
      : 0

    const startReviewMistakes = () => {
      setReviewWords(missed)
      setCurrentIndex(0)
      setIsFlipped(false)
      setDone(false)
      setKnown(0)
      setDunno(0)
      setMissedIds([])
      setFunnyMsg(null)
    }

    const restartSame = () => {
      setReviewWords(null)
      setCurrentIndex(0)
      setIsFlipped(false)
      setDone(false)
      setKnown(0)
      setDunno(0)
      setMissedIds([])
      setFunnyMsg(null)
    }

    return (
      <div className="study-screen">
        <div className="study-header">
          <div className="study-top-row">
            <button className="back-btn" onClick={onBack}>←</button>
            <span className="page-title">
              {isReviewMode ? '🔁 חזרה על טעויות' : 'סיימת! 🎉'}
            </span>
          </div>
        </div>
        <div className="completion-screen animate-in">
          <span className="completion-emoji">{accuracy >= 80 ? '🏆' : accuracy >= 50 ? '👍' : '💪'}</span>
          <div className="completion-title">
            {accuracy >= 80 ? 'כל הכבוד!' : accuracy >= 50 ? 'יפה מאוד!' : 'ממשיכים להתאמן!'}
          </div>

          <div className="session-accuracy-ring">
            <span className="session-accuracy-num">{accuracy}%</span>
            <span className="session-accuracy-label">דיוק</span>
          </div>

          <div className="completion-stats">
            <div className="comp-stat">
              <span className="comp-stat-num green">{known}</span>
              <span className="comp-stat-label">{g('ידועות', 'ידועים')} ✓</span>
            </div>
            <div className="comp-stat">
              <span className="comp-stat-num red">{dunno}</span>
              <span className="comp-stat-label">לתרגול ✗</span>
            </div>
            <div className="comp-stat">
              <span className="comp-stat-num">{activeWords.length}</span>
              <span className="comp-stat-label">סה"כ</span>
            </div>
          </div>

          {missed.length > 0 && (
            <div className="missed-words-section">
              <div className="missed-words-title">מילים לחזרה:</div>
              <div className="missed-words-list">
                {missed.slice(0, 8).map(w => (
                  <span key={w.id} className="missed-word-chip">{w.arabic} · {w.hebrew}</span>
                ))}
                {missed.length > 8 && <span className="missed-word-chip">+{missed.length - 8}</span>}
              </div>
            </div>
          )}

          <div className="completion-btns">
            {missed.length > 0 && (
              <button className="btn-primary btn-review-mistakes" onClick={startReviewMistakes}>
                🔁 {g('תרגלי', 'תרגל')} רק את {missed.length} הטעויות
              </button>
            )}
            <button className="btn-secondary" onClick={restartSame}>
              {isReviewMode ? 'שוב מההתחלה' : g('חזרי', 'חזור')} על {isReviewMode ? 'הטעויות' : 'הקטגוריה'}
            </button>
            <button className="btn-secondary" onClick={onBack}>
              חזרה לבית
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!word) return null

  const pct = Math.round((currentIndex / activeWords.length) * 100)
  const backClass = CAT_BACK_CLASS[category?.id] || ''
  const isSRSMode = selectedCategoryId === '__srs__'
  const isReviewMode = !!reviewWords

  return (
    <div className="study-screen">
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
      {achievementToast && (
        <div className="achievement-toast">
          <span>{achievementToast.emoji}</span>
          <div>
            <div className="ach-toast-title">🏅 הישג חדש!</div>
            <div className="ach-toast-name">{achievementToast.title}</div>
          </div>
        </div>
      )}
      <div className="study-header">
        <div className="study-top-row">
          <button className="back-btn" onClick={onBack}>←</button>
          <span className="page-title">
            {isReviewMode ? '🔁 חזרה על טעויות' :
              isSRSMode ? '📅 חזרה יומית' :
              category ? `${category.emoji} ${category.name}` : '🌍 כל המילים'}
          </span>
          <span className="study-counter">{currentIndex + 1}/{activeWords.length}</span>
        </div>
        <div className="progress-bar-wrap">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div
        className={`flashcard-scene${swipeAnim === 'left' ? ' swipe-left' : swipeAnim === 'right' ? ' swipe-right' : ''}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setIsFlipped(f => !f)}
      >
        <div className={`flashcard${isFlipped ? ' flipped' : ''}`}>
          {/* Front */}
          <div className="flashcard-face flashcard-front">
            <div className="arabic-word">{word.arabic}</div>
            <div className="transliteration">{word.transliteration}</div>
            <div className="tts-buttons" onClick={e => e.stopPropagation()}>
              <button className="tts-btn" onClick={(e) => { e.stopPropagation(); if (isSoundEnabled()) speakArabic(word.arabic, word.id) }}>
                🔊 {g('שמעי', 'שמע')}
              </button>
            </div>
            <div className="tap-hint">
              <span>👆</span>
              <span>{g('הקישי', 'הקש')} להפוך</span>
            </div>
          </div>

          {/* Back */}
          <div className={`flashcard-face flashcard-back ${backClass}`}>
            <div className="arabic-small">{word.arabic}</div>
            <div className="tts-buttons" onClick={e => e.stopPropagation()}>
              <button className="tts-btn" onClick={(e) => { e.stopPropagation(); if (isSoundEnabled()) speakArabic(word.arabic, word.id) }}>
                🔊 {g('שמעי', 'שמע')}
              </button>
            </div>
            <div className="hebrew-translation">{word.hebrew}</div>
            <div className={`trick-box${(trickAlt[word.id] || dunnoCount[word.id] >= 2) && word.trick2 ? ' trick-upgrade' : ''}`}>
              <div className="trick-box-header">
                <span>🧠</span>
                <span>{(trickAlt[word.id] || dunnoCount[word.id] >= 2) && word.trick2 ? 'טריק חלופי' : 'טריק לזכירה'}</span>
                {word.trick2 && (
                  <button
                    className="trick-swap-btn"
                    onClick={e => { e.stopPropagation(); setTrickAlt(prev => ({ ...prev, [word.id]: !prev[word.id] })) }}
                    title="החלף טריק"
                  >
                    🔄
                  </button>
                )}
              </div>
              <div className="trick-text">
                {(trickAlt[word.id] || dunnoCount[word.id] >= 2) && word.trick2 ? word.trick2 : word.trick}
              </div>
            </div>
            {word.example && (
              <div className="example-box">
                <div className="example-header">
                  <span>💬 דוגמה</span>
                  {isSoundEnabled() && (
                    <button
                      className="example-tts-btn"
                      onClick={e => { e.stopPropagation(); speakArabic(word.example.ar, word.id + '_example') }}
                    >🔊</button>
                  )}
                </div>
                <div className="example-ar">{word.example.ar}</div>
                <div className="example-translit">{word.example.translit}</div>
                <div className="example-he">{word.example.he}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {funnyMsg && (
        <div className="funny-toast animate-in">{funnyMsg}</div>
      )}

      {isFlipped && (
        <div className="study-actions animate-in">
          <button className="btn-dunno" onClick={markDunno}>
            עוד צריך ✗
          </button>
          <button className="btn-know" onClick={markKnown}>
            {g('כבר יודעת', 'כבר יודע')} ✓
          </button>
        </div>
      )}

      <div className="study-nav-row">
        <button className="nav-arrow-btn" onClick={goPrev} disabled={currentIndex === 0}>→</button>
        <span className="study-nav-hint">
          {isFlipped ? 'החלקי ← ✗  ✓ →' : g('הקישי', 'הקש') + ' לפליפ'}
        </span>
        <button
          className="nav-arrow-btn"
          onClick={() => { setIsFlipped(false); goNext() }}
          disabled={currentIndex === activeWords.length - 1}
        >
          ←
        </button>
      </div>

      {/* Desktop keyboard hint — shown on non-touch only */}
      <div className="keyboard-hint">
        <span>⌨️ Space = הפוך</span>
        <span>→ = יודע</span>
        <span>← = לא יודע</span>
        <span>T = 🔊</span>
      </div>
    </div>
  )
}
