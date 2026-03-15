import { useState, useEffect } from 'react'
import Home from './components/Home.jsx'
import StudyMode from './components/StudyMode.jsx'
import QuizMode from './components/QuizMode.jsx'
import MatchGame from './components/MatchGame.jsx'
import Progress from './components/Progress.jsx'
import Settings from './components/Settings.jsx'
import Onboarding from './components/Onboarding.jsx'
import { hasUsername } from './utils/user.js'
import { unlockAudio } from './utils/tts.js'

export default function App() {
  useEffect(() => {
    const handler = () => { unlockAudio(); document.removeEventListener('touchstart', handler) }
    document.addEventListener('touchstart', handler, { once: true })
    return () => document.removeEventListener('touchstart', handler)
  }, [])

  const [ready, setReady] = useState(hasUsername())
  const [activeTab, setActiveTab] = useState('home')
  const [studyCategoryId, setStudyCategoryId] = useState(null)
  const [progressKey, setProgressKey] = useState(0)

  const handleStartStudy = (categoryId) => {
    setStudyCategoryId(categoryId)
    setActiveTab('study')
  }

  const handleStartQuiz = (categoryId) => {
    setStudyCategoryId(categoryId)
    setActiveTab('quiz')
  }

  const handleStartMatch = (categoryId) => {
    setStudyCategoryId(categoryId)
    setActiveTab('match')
  }

  const handleBackToHome = () => {
    setActiveTab('home')
    setStudyCategoryId(null)
    setProgressKey(k => k + 1)
  }

  if (!ready) {
    return <Onboarding onDone={() => setReady(true)} />
  }

  return (
    <div className="app-container">
      <main className="app-main">
        {activeTab === 'home' && (
          <Home
            key={progressKey}
            onStartStudy={handleStartStudy}
            onStartQuiz={handleStartQuiz}
            onStartMatch={handleStartMatch}
          />
        )}
        {activeTab === 'study' && (
          <StudyMode categoryId={studyCategoryId} onBack={handleBackToHome} />
        )}
        {activeTab === 'quiz' && (
          <QuizMode categoryId={studyCategoryId} onBack={handleBackToHome} />
        )}
        {activeTab === 'match' && (
          <MatchGame categoryId={studyCategoryId} onBack={handleBackToHome} />
        )}
        {activeTab === 'progress' && (
          <Progress onBack={handleBackToHome} />
        )}
        {activeTab === 'settings' && (
          <Settings onDone={handleBackToHome} />
        )}
      </main>

      <nav className="bottom-nav">
        <button className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => { setActiveTab('home'); setProgressKey(k => k + 1) }}>
          <span className="nav-icon">🏠</span>
          <span className="nav-label">בית</span>
        </button>
        <button className={`nav-btn ${activeTab === 'study' ? 'active' : ''}`}
          onClick={() => { setStudyCategoryId(null); setActiveTab('study') }}>
          <span className="nav-icon">📖</span>
          <span className="nav-label">למידה</span>
        </button>
        <button className={`nav-btn ${activeTab === 'quiz' ? 'active' : ''}`}
          onClick={() => { setStudyCategoryId(null); setActiveTab('quiz') }}>
          <span className="nav-icon">🎯</span>
          <span className="nav-label">חידון</span>
        </button>
        <button className={`nav-btn ${activeTab === 'match' ? 'active' : ''}`}
          onClick={() => { setStudyCategoryId(null); setActiveTab('match') }}>
          <span className="nav-icon">🃏</span>
          <span className="nav-label">התאמה</span>
        </button>
        <button className={`nav-btn ${activeTab === 'progress' ? 'active' : ''}`}
          onClick={() => setActiveTab('progress')}>
          <span className="nav-icon">📊</span>
          <span className="nav-label">התקדמות</span>
        </button>
        <button className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}>
          <span className="nav-icon">⚙️</span>
          <span className="nav-label">הגדרות</span>
        </button>
      </nav>
    </div>
  )
}
