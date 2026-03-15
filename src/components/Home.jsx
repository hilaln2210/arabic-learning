import { useMemo } from 'react'
import { categories, getAllWords, getCategoryById } from '../data/words.js'
import { getStreak, getBestStreak, getTotalStudyDays, getWordOfDay } from '../utils/streak.js'
import { getUsername, g } from '../utils/user.js'
import { getLevelInfo } from '../utils/xp.js'
import { speakArabic } from '../utils/tts.js'

function getProgress() {
  try {
    const raw = localStorage.getItem('arabic_progress')
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function getLastCategory() {
  try { return localStorage.getItem('arabic_last_category') } catch { return null }
}

function getDailyGoal() {
  try { return parseInt(localStorage.getItem('arabic_daily_goal') || '10') } catch { return 10 }
}

function getDailyProgress() {
  try {
    const today = new Date().toDateString()
    const raw = localStorage.getItem('arabic_daily_progress')
    if (!raw) return 0
    const { date, count } = JSON.parse(raw)
    return date === today ? count : 0
  } catch { return 0 }
}

const CAT_CLASS = {
  military: 'cat-military', intel: 'cat-intel', news: 'cat-news', daily: 'cat-daily',
  greetings: 'cat-greetings', numbers: 'cat-numbers', family: 'cat-family', body: 'cat-body',
  nature: 'cat-nature', time: 'cat-time', colors: 'cat-colors', food: 'cat-food',
  home_items: 'cat-home-cat', clothes: 'cat-clothes', work: 'cat-work', transport: 'cat-transport',
  health: 'cat-health', education: 'cat-education', emotions: 'cat-emotions', weather: 'cat-weather',
  animals: 'cat-animals', places: 'cat-places', verbs: 'cat-verbs', adjectives: 'cat-adjectives',
  questions: 'cat-questions', professions: 'cat-professions', daily_verbs: 'cat-daily_verbs',
  phrases: 'cat-phrases', sports: 'cat-sports', tech: 'cat-tech', restaurant: 'cat-restaurant',
  shopping: 'cat-shopping', religion: 'cat-religion', law: 'cat-law', music_art: 'cat-music_art',
  geography: 'cat-geography', big_numbers: 'cat-big_numbers', days_months: 'cat-days_months',
  directions: 'cat-directions', conjunctions: 'cat-conjunctions', finance: 'cat-finance',
  travel: 'cat-travel', media: 'cat-media', agriculture: 'cat-agriculture',
  extended_family: 'cat-extended_family', housing: 'cat-housing', military_adv: 'cat-military_adv',
  medical_adv: 'cat-medical_adv', verbs2: 'cat-verbs2', verbs3: 'cat-verbs3',
  adjectives2: 'cat-adjectives2', adjectives3: 'cat-adjectives3', communication: 'cat-communication',
  wildlife: 'cat-wildlife', abstract: 'cat-abstract', daily_adv: 'cat-daily_adv',
  construction: 'cat-construction', sea: 'cat-sea', space: 'cat-space', cooking: 'cat-cooking',
  cleaning: 'cat-cleaning', kindergarten: 'cat-kindergarten', banking: 'cat-banking',
  wedding: 'cat-wedding', field_military: 'cat-field_military', politics: 'cat-politics',
  economy: 'cat-economy', edu_adv: 'cat-edu_adv', dental: 'cat-dental', police: 'cat-police',
  internet: 'cat-internet', slang: 'cat-slang', traffic: 'cat-traffic', furniture: 'cat-furniture',
  kitchen_tools: 'cat-kitchen_tools', fruits: 'cat-fruits', vegetables: 'cat-vegetables',
  describing_people: 'cat-describing_people', weather_adv: 'cat-weather_adv', clothes2: 'cat-clothes2',
  religion_adv: 'cat-religion_adv', games: 'cat-games', living: 'cat-living',
  tradition: 'cat-tradition', math: 'cat-math',
}

export default function Home({ onStartStudy, onStartQuiz, onStartMatch, onStartListen }) {
  const progress = useMemo(() => getProgress(), [])
  const allWords = useMemo(() => getAllWords(), [])
  const streak = useMemo(() => getStreak(), [])
  const bestStreak = useMemo(() => getBestStreak(), [])
  const totalDays = useMemo(() => getTotalStudyDays(), [])
  const wod = useMemo(() => getWordOfDay(allWords), [allWords])
  const lastCatId = useMemo(() => getLastCategory(), [])
  const lastCat = useMemo(() => lastCatId ? getCategoryById(lastCatId) : null, [lastCatId])
  const levelInfo = useMemo(() => getLevelInfo(), [])
  const dailyGoal = useMemo(() => getDailyGoal(), [])
  const dailyDone = useMemo(() => getDailyProgress(), [])

  const totalKnown = useMemo(() =>
    allWords.filter(w => progress[w.id] === 'known').length
  , [allWords, progress])

  const dailyPct = Math.min(100, Math.round((dailyDone / dailyGoal) * 100))
  const goalReached = dailyDone >= dailyGoal

  const getCatKnown = (cat) =>
    cat.words.filter(w => progress[w.id] === 'known').length

  const handleShare = async () => {
    const text = `למדתי ${totalKnown} מילים בערבית! רמה ${levelInfo.level} — ${levelInfo.name} 🧠\nסטריק: ${streak} ימים 🔥`
    if (navigator.share) {
      try { await navigator.share({ title: 'ערבית עם טריקים', text }) } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); alert('הועתק ללוח!') } catch {}
    }
  }

  return (
    <div className="home-screen">
      {/* Hero */}
      <div className="home-hero">
        <span className="home-emoji">🧠</span>
        <h1 className="home-welcome">{g('ברוכה הבאה', 'ברוך הבא')}, {getUsername() || g('חברה', 'חבר')}!</h1>
        <p className="home-subtitle">{g('למדי', 'למד')} ערבית עם טריקים ש{g('לא תשכחי', 'לא תשכח')}</p>
        {streak > 0 && <div className="streak-badge">🔥 {streak} ימים ברצף</div>}
      </div>

      {/* XP + Level bar */}
      <div className="xp-level-bar">
        <div className="xp-level-left">
          <span className="xp-level-badge">Lv.{levelInfo.level}</span>
          <span className="xp-level-name">{levelInfo.name}</span>
        </div>
        <div className="xp-bar-wrap">
          <div className="xp-bar-fill" style={{ width: `${levelInfo.progress}%` }} />
        </div>
        <span className="xp-amount">{levelInfo.xp} ⭐</span>
      </div>

      {/* Daily goal ring */}
      <div className={`daily-goal-card ${goalReached ? 'goal-reached' : ''}`}>
        <div className="daily-goal-ring">
          <svg viewBox="0 0 36 36" className="daily-goal-svg">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3"/>
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={goalReached ? '#4ade80' : '#a78bfa'}
              strokeWidth="3"
              strokeDasharray={`${dailyPct} ${100 - dailyPct}`}
              strokeDashoffset="25"
              strokeLinecap="round"
            />
          </svg>
          <span className="daily-goal-pct">{goalReached ? '✓' : `${dailyPct}%`}</span>
        </div>
        <div className="daily-goal-text">
          <span className="daily-goal-title">{goalReached ? '🎉 יעד היום הושג!' : 'יעד יומי'}</span>
          <span className="daily-goal-sub">{dailyDone}/{dailyGoal} מילים היום</span>
        </div>
      </div>

      {/* Continue banner */}
      {lastCat && (
        <button className="continue-banner" onClick={() => onStartStudy(lastCat.id)}>
          <span className="continue-icon">{lastCat.emoji}</span>
          <div className="continue-text">
            <span className="continue-title">המשיכי מהיכן שעצרת</span>
            <span className="continue-sub">{lastCat.name}</span>
          </div>
          <span className="continue-arrow">←</span>
        </button>
      )}

      {/* Word of the Day */}
      <div className="wod-card">
        <div className="wod-label">מילת היום</div>
        <button className="wod-play-btn" onClick={() => speakArabic(wod.arabic, wod.id)} title="האזיני למילה">🔊</button>
        <div className="wod-arabic">{wod.arabic}</div>
        <div className="wod-translit">{wod.transliteration}</div>
        <div className="wod-hebrew">{wod.hebrew}</div>
        <div className="wod-trick">🧠 {wod.trick}</div>
      </div>

      {/* Stats */}
      <div className="home-stats-row">
        <div className="stat-chip">
          <span className="stat-num">{totalKnown}</span>
          <span className="stat-label">מילים {g('ידועות', 'ידועים')}</span>
        </div>
        <div className="stat-chip">
          <span className="stat-num">{streak}</span>
          <span className="stat-label">🔥 ברצף</span>
        </div>
        {bestStreak > streak && (
          <div className="stat-chip">
            <span className="stat-num">{bestStreak}</span>
            <span className="stat-label">🏆 שיא</span>
          </div>
        )}
        <div className="stat-chip">
          <span className="stat-num">{totalDays}</span>
          <span className="stat-label">📆 ימי לימוד</span>
        </div>
      </div>

      {/* Game modes row */}
      <div className="game-modes-row">
        <button className="game-mode-btn mode-study" onClick={() => onStartStudy(null)}>
          <span className="mode-icon">📖</span>
          <span className="mode-label">כרטיסיות</span>
        </button>
        <button className="game-mode-btn mode-quiz" onClick={() => onStartQuiz(null)}>
          <span className="mode-icon">🎯</span>
          <span className="mode-label">חידון</span>
        </button>
        <button className="game-mode-btn mode-match" onClick={() => onStartMatch?.(null)}>
          <span className="mode-icon">🃏</span>
          <span className="mode-label">התאמה</span>
        </button>
        <button className="game-mode-btn mode-listen" onClick={() => onStartListen?.(null)}>
          <span className="mode-icon">🎧</span>
          <span className="mode-label">האזנה</span>
        </button>
      </div>

      <p className="section-title">קטגוריות</p>
      <div className="category-grid">
        {categories.map(cat => {
          const known = getCatKnown(cat)
          const pct = Math.round((known / cat.words.length) * 100)
          const catClass = CAT_CLASS[cat.id] || ''
          return (
            <div key={cat.id} className={`category-card ${catClass}`} onClick={() => onStartStudy(cat.id)}>
              <span className="category-emoji">{cat.emoji}</span>
              <div className="category-name">{cat.name}</div>
              <div className="category-progress-bar">
                <div className="category-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="category-progress-text">{known}/{cat.words.length} {g('ידועות', 'ידועים')}</div>
            </div>
          )
        })}
      </div>

      <button className="share-btn" onClick={handleShare}>
        <span>📤</span>
        <span>{g('שתפי', 'שתף')} את ההתקדמות שלך</span>
      </button>
    </div>
  )
}
