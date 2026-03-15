import { useMemo } from 'react'
import { categories, getAllWords } from '../data/words.js'
import { getStreak, getBestStreak, getTotalStudyDays, getWordOfDay } from '../utils/streak.js'
import { getDueCount } from '../utils/srs.js'
import { getUsername, g } from '../utils/user.js'

function getProgress() {
  try {
    const raw = localStorage.getItem('arabic_progress')
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function getLevelLabel(known) {
  if (known >= 46) return g('מאסטרית', 'מאסטר')
  if (known >= 26) return g('מיומנת', 'מיומן')
  if (known >= 11) return g('מתקדמת', 'מתקדם')
  return g('מתחילה', 'מתחיל')
}

const CAT_CLASS = {
  military: 'cat-military',
  intel: 'cat-intel',
  news: 'cat-news',
  daily: 'cat-daily',
  greetings: 'cat-greetings',
  numbers: 'cat-numbers',
  family: 'cat-family',
  body: 'cat-body',
  nature: 'cat-nature',
  time: 'cat-time',
  colors: 'cat-colors',
  food: 'cat-food',
  home_items: 'cat-home-cat',
  clothes: 'cat-clothes',
  work: 'cat-work',
  transport: 'cat-transport',
  health: 'cat-health',
  education: 'cat-education',
  emotions: 'cat-emotions',
  weather: 'cat-weather',
  animals: 'cat-animals',
  places: 'cat-places',
  verbs: 'cat-verbs',
  adjectives: 'cat-adjectives',
  questions: 'cat-questions',
  professions: 'cat-professions',
  daily_verbs: 'cat-daily_verbs',
  phrases: 'cat-phrases',
  sports: 'cat-sports',
  tech: 'cat-tech',
  restaurant: 'cat-restaurant',
  shopping: 'cat-shopping',
  religion: 'cat-religion',
  law: 'cat-law',
  music_art: 'cat-music_art',
  geography: 'cat-geography',
  big_numbers: 'cat-big_numbers',
  days_months: 'cat-days_months',
  directions: 'cat-directions',
  conjunctions: 'cat-conjunctions',
  finance: 'cat-finance',
  travel: 'cat-travel',
  media: 'cat-media',
  agriculture: 'cat-agriculture',
  extended_family: 'cat-extended_family',
  housing: 'cat-housing',
  military_adv: 'cat-military_adv',
  medical_adv: 'cat-medical_adv',
  verbs2: 'cat-verbs2',
  verbs3: 'cat-verbs3',
  adjectives2: 'cat-adjectives2',
  adjectives3: 'cat-adjectives3',
  communication: 'cat-communication',
  wildlife: 'cat-wildlife',
  abstract: 'cat-abstract',
  daily_adv: 'cat-daily_adv',
  construction: 'cat-construction',
  sea: 'cat-sea',
  space: 'cat-space',
  cooking: 'cat-cooking',
  cleaning: 'cat-cleaning',
  kindergarten: 'cat-kindergarten',
  banking: 'cat-banking',
  wedding: 'cat-wedding',
  field_military: 'cat-field_military',
  politics: 'cat-politics',
  economy: 'cat-economy',
  edu_adv: 'cat-edu_adv',
  dental: 'cat-dental',
  police: 'cat-police',
  internet: 'cat-internet',
  slang: 'cat-slang',
  traffic: 'cat-traffic',
  furniture: 'cat-furniture',
  kitchen_tools: 'cat-kitchen_tools',
  fruits: 'cat-fruits',
  vegetables: 'cat-vegetables',
  describing_people: 'cat-describing_people',
  weather_adv: 'cat-weather_adv',
  clothes2: 'cat-clothes2',
  religion_adv: 'cat-religion_adv',
  games: 'cat-games',
  living: 'cat-living',
  tradition: 'cat-tradition',
  math: 'cat-math',
}

export default function Home({ onStartStudy, onStartQuiz }) {
  const progress = useMemo(() => getProgress(), [])
  const allWords = useMemo(() => getAllWords(), [])
  const streak = useMemo(() => getStreak(), [])
  const bestStreak = useMemo(() => getBestStreak(), [])
  const totalDays = useMemo(() => getTotalStudyDays(), [])
  const wod = useMemo(() => getWordOfDay(allWords), [allWords])
  const dueCount = useMemo(() => getDueCount(allWords), [allWords])

  const totalKnown = useMemo(() => {
    return allWords.filter(w => progress[w.id] === 'known').length
  }, [allWords, progress])

  const levelLabel = getLevelLabel(totalKnown)

  const getCatKnown = (cat) =>
    cat.words.filter(w => progress[w.id] === 'known').length

  const handleShare = async () => {
    const text = `למדתי ${totalKnown} מילים בערבית עם טריקים! 🧠🇵🇸\nהרמה שלי: ${levelLabel}`
    if (navigator.share) {
      try { await navigator.share({ title: 'ערבית עם טריקים', text }) } catch {}
    } else {
      try { await navigator.clipboard.writeText(text); alert('הועתק ללוח!') } catch {}
    }
  }

  return (
    <div className="home-screen">
      <div className="home-hero">
        <span className="home-emoji">🧠</span>
        <h1 className="home-welcome">{g('ברוכה הבאה', 'ברוך הבא')}, {getUsername() || g('חברה', 'חבר')}!</h1>
        <p className="home-subtitle">{g('למדי', 'למד')} ערבית עם טריקים ש{g('לא תשכחי', 'לא תשכח')}</p>
        {streak > 0 && (
          <div className="streak-badge">
            🔥 {streak} ימים ברצף
          </div>
        )}
      </div>

      {/* SRS Daily Review Banner */}
      {dueCount > 0 && (
        <button className="srs-review-banner" onClick={() => onStartStudy('__srs__')}>
          <span className="srs-review-icon">📅</span>
          <div className="srs-review-text">
            <span className="srs-review-count">{dueCount} מילים להחזרה היום</span>
            <span className="srs-review-sub">חזרי על מה שנקבע להיום לפי מרווחי חזרה</span>
          </div>
          <span className="srs-review-arrow">←</span>
        </button>
      )}

      {/* Word of the Day */}
      <div className="wod-card">
        <div className="wod-label">מילת היום</div>
        <div className="wod-arabic">{wod.arabic}</div>
        <div className="wod-translit">{wod.transliteration}</div>
        <div className="wod-hebrew">{wod.hebrew}</div>
        <div className="wod-trick">🧠 {wod.trick}</div>
      </div>

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
        <div className="stat-chip">
          <span className="stat-num level-badge-inline">{levelLabel}</span>
          <span className="stat-label">רמה</span>
        </div>
      </div>

      <p className="section-title">קטגוריות</p>
      <div className="category-grid">
        {categories.map(cat => {
          const known = getCatKnown(cat)
          const pct = Math.round((known / cat.words.length) * 100)
          const catClass = CAT_CLASS[cat.id] || ''
          return (
            <div
              key={cat.id}
              className={`category-card ${catClass}`}
              onClick={() => onStartStudy(cat.id)}
            >
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

      <div className="home-cta">
        <button className="btn-primary" onClick={() => onStartStudy(null)}>
          <span>📖</span>
          <span>{g('התחילי', 'התחל')} ללמוד</span>
        </button>
      </div>
      <div style={{ marginTop: 10 }}>
        <button className="btn-secondary" onClick={() => onStartQuiz(null)}>
          <span>🎯</span>
          <span>חידון מהיר</span>
        </button>
      </div>
      <button className="share-btn" onClick={handleShare}>
        <span>📤</span>
        <span>{g('שתפי', 'שתף')} את ההתקדמות שלך</span>
      </button>
    </div>
  )
}
