import { useState, useEffect, useRef, useCallback } from 'react'
import { categories, getAllWords, getCategoryById } from '../data/words.js'
import { recordStudyToday } from '../utils/streak.js'
import { speakArabic } from '../utils/tts.js'
import { g } from '../utils/user.js'

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
  const [dunnoCount, setDunnoCount] = useState({}) // { [wordId]: count }
  const [funnyMsg, setFunnyMsg] = useState(null)


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
  }, [])

  const words = selectedCategoryId
    ? (getCategoryById(selectedCategoryId)?.words || [])
    : getAllWords()

  const category = selectedCategoryId ? getCategoryById(selectedCategoryId) : null

  const currentWord = words[currentIndex]

  const goNext = useCallback(() => {
    setFunnyMsg(null)
    if (currentIndex < words.length - 1) {
      setCurrentIndex(i => i + 1)
      setIsFlipped(false)
    } else {
      setDone(true)
    }
  }, [currentIndex, words.length])

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
      setIsFlipped(false)
    }
  }, [currentIndex])

  const markKnown = () => {
    navigator.vibrate?.(30)
    const updated = { ...progress, [currentWord.id]: 'known' }
    setProgress(updated)
    saveProgress(updated)
    setKnown(k => k + 1)
    animateSwipe('right', goNext)
  }

  const markDunno = () => {
    navigator.vibrate?.([15, 15])
    const wordId = currentWord.id
    const newCount = (dunnoCount[wordId] || 0) + 1
    setDunnoCount(prev => ({ ...prev, [wordId]: newCount }))

    if (newCount >= 2) {
      const msgs = FUNNY_MESSAGES
      const template = msgs[Math.floor(Math.random() * msgs.length)]
      const msg = template
        .replace(/{n}/g, newCount)
        .replace(/{arabic}/g, currentWord.arabic)
        .replace(/{transliteration}/g, currentWord.transliteration)
      setFunnyMsg(msg)
      // Auto-hide after 3 seconds
      setTimeout(() => setFunnyMsg(null), 3000)
    }

    const updated = { ...progress, [currentWord.id]: 'learning' }
    setProgress(updated)
    saveProgress(updated)
    setDunno(d => d + 1)
    animateSwipe('left', goNext)
  }

  const animateSwipe = (dir, cb) => {
    setSwipeAnim(dir)
    setTimeout(() => {
      setSwipeAnim(null)
      cb()
    }, 220)
  }

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

    if (Math.abs(dy) > Math.abs(dx)) return // vertical scroll, ignore

    if (!isFlipped) {
      // Flip on horizontal swipe if not flipped
      if (Math.abs(dx) > 50) {
        setIsFlipped(true)
      }
      return
    }

    if (Math.abs(dx) > 50) {
      if (dx > 0) {
        // swipe right = know
        markKnown()
      } else {
        // swipe left = dunno
        markDunno()
      }
    }
  }

  const handleCardTap = () => {
    setIsFlipped(f => !f)
  }

  if (!selectedCategoryId && categoryId === null) {
    // Show category picker
    return (
      <div className="category-picker">
        <div className="picker-title">📖 בחרי קטגוריה</div>
        <div className="picker-sub">או למדי את כל המילים ביחד</div>
        <div className="picker-list">
          <div
            className="picker-item"
            onClick={() => setSelectedCategoryId('__all__')}
          >
            <span className="picker-emoji">🌍</span>
            <div className="picker-info">
              <div className="picker-name">כל המילים</div>
              <div className="picker-meta">{getAllWords().length} מילים</div>
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
                <div className="picker-meta">{cat.words.length} מילים</div>
              </div>
              <span className="picker-arrow">←</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Normalize __all__ to show all words
  const displayWords = (selectedCategoryId === '__all__' || !selectedCategoryId)
    ? getAllWords()
    : words

  if (done) {
    return (
      <div className="study-screen">
        <div className="study-header">
          <div className="study-top-row">
            <button className="back-btn" onClick={onBack}>←</button>
            <span className="page-title">סיימת! 🎉</span>
          </div>
        </div>
        <div className="completion-screen animate-in">
          <span className="completion-emoji">🏆</span>
          <div className="completion-title">כל הכבוד!</div>
          <div className="completion-sub">{g('סיימת', 'סיימת')} את הקטגוריה</div>
          <div className="completion-stats">
            <div className="comp-stat">
              <span className="comp-stat-num green">{known}</span>
              <span className="comp-stat-label">{g('ידועות', 'ידועים')} ✓</span>
            </div>
            <div className="comp-stat">
              <span className="comp-stat-num red">{dunno}</span>
              <span className="comp-stat-label">לתרגול ✗</span>
            </div>
          </div>
          <div className="completion-btns">
            <button
              className="btn-primary"
              onClick={() => {
                setCurrentIndex(0)
                setIsFlipped(false)
                setDone(false)
                setKnown(0)
                setDunno(0)
              }}
            >
              חזרי על הקטגוריה שוב
            </button>
            <button className="btn-secondary" onClick={onBack}>
              חזרה לבית
            </button>
          </div>
        </div>
      </div>
    )
  }

  const activeWords = displayWords
  const word = activeWords[currentIndex]
  if (!word) return null

  const pct = Math.round(((currentIndex) / activeWords.length) * 100)
  const backClass = CAT_BACK_CLASS[category?.id] || ''

  return (
    <div className="study-screen">
      <div className="study-header">
        <div className="study-top-row">
          <button className="back-btn" onClick={onBack}>←</button>
          <span className="page-title">
            {category ? `${category.emoji} ${category.name}` : '🌍 כל המילים'}
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
        onClick={handleCardTap}
      >
        <div className={`flashcard${isFlipped ? ' flipped' : ''}`}>
          {/* Front */}
          <div className="flashcard-face flashcard-front">
            <div className="arabic-word">{word.arabic}</div>
            <div className="transliteration">{word.transliteration}</div>
            <div className="tts-buttons" onClick={e => e.stopPropagation()}>
              <button className="tts-btn" onClick={(e) => { e.stopPropagation(); speakArabic(word.arabic) }}>
                🔊 שמעי
              </button>
            </div>
            <div className="tap-hint">
              <span>👆</span>
              <span>הקישי להפוך</span>
            </div>
          </div>

          {/* Back */}
          <div className={`flashcard-face flashcard-back ${backClass}`}>
            <div className="arabic-small">{word.arabic}</div>
            <div className="tts-buttons" onClick={e => e.stopPropagation()}>
              <button className="tts-btn" onClick={(e) => { e.stopPropagation(); speakArabic(word.arabic) }}>
                🔊 שמעי
              </button>
            </div>
            <div className="hebrew-translation">{word.hebrew}</div>
            <div className={`trick-box${dunnoCount[word.id] >= 2 ? ' trick-upgrade' : ''}`}>
              <div className="trick-box-header">
                <span>🧠</span>
                <span>{dunnoCount[word.id] >= 2 ? 'טריק חדש!' : 'טריק לזכירה'}</span>
              </div>
              <div className="trick-text">
                {dunnoCount[word.id] >= 2 && word.trick2 ? word.trick2 : word.trick}
              </div>
            </div>
            {word.example && (
              <div className="example-box">
                <div className="example-header">💬 דוגמה</div>
                <div className="example-ar">{word.example.ar}</div>
                <div className="example-translit">{word.example.translit}</div>
                <div className="example-he">{word.example.he}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {funnyMsg && (
        <div className="funny-toast animate-in">
          {funnyMsg}
        </div>
      )}

      {isFlipped && (
        <div className="study-actions animate-in">
          <button className="btn-dunno" onClick={markDunno}>
            עוד צריך ✗
          </button>
          <button className="btn-know" onClick={markKnown}>
            כבר יודעת ✓
          </button>
        </div>
      )}

      <div className="study-nav-row">
        <button
          className="nav-arrow-btn"
          onClick={goPrev}
          disabled={currentIndex === 0}
        >
          →
        </button>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          {isFlipped ? 'החלקי ← ✗  ✓ →' : 'הקישי לפליפ'}
        </span>
        <button
          className="nav-arrow-btn"
          onClick={() => { setIsFlipped(false); goNext() }}
          disabled={currentIndex === activeWords.length - 1}
        >
          ←
        </button>
      </div>
    </div>
  )
}
