import { useState } from 'react'
import {
  getUsername, setUsername,
  getGender, setGender,
  isSoundEnabled, setSoundEnabled,
  isAutoplayEnabled, setAutoplayEnabled,
  g
} from '../utils/user.js'

function Toggle({ value, onChange, label, sub }) {
  return (
    <div className="settings-row" onClick={() => onChange(!value)}>
      <div className="settings-row-text">
        <span className="settings-row-label">{label}</span>
        {sub && <span className="settings-row-sub">{sub}</span>}
      </div>
      <div className={`settings-toggle ${value ? 'on' : ''}`}>
        <div className="settings-toggle-thumb" />
      </div>
    </div>
  )
}

export default function Settings({ onDone }) {
  const [name, setNameState] = useState(getUsername)
  const [gender, setGenderState] = useState(getGender)
  const [sound, setSoundState] = useState(isSoundEnabled)
  const [autoplay, setAutoplayState] = useState(isAutoplayEnabled)
  const [nameEdit, setNameEdit] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleGender = (val) => {
    setGenderState(val)
    setGender(val)
    flash()
  }

  const handleSoundToggle = (val) => {
    setSoundState(val)
    setSoundEnabled(val)
    flash()
  }

  const handleAutoplayToggle = (val) => {
    setAutoplayState(val)
    setAutoplayEnabled(val)
    flash()
  }

  const handleNameSave = () => {
    if (name.trim()) {
      setUsername(name.trim())
      setNameEdit(false)
      flash()
    }
  }

  const flash = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const handleResetProgress = () => {
    if (window.confirm('למחוק את כל ההתקדמות? (מניין המילים הידועות יאופס)')) {
      localStorage.removeItem('arabic_progress')
      flash()
    }
  }

  const handleResetSRS = () => {
    if (window.confirm('למחוק את לוח הזמנים של החזרות? (SRS יאופס)')) {
      localStorage.removeItem('arabic_srs')
      flash()
    }
  }

  const handleResetAll = () => {
    if (window.confirm('למחוק הכל ולהתחיל מחדש? פעולה זו אינה הפיכה.')) {
      const keys = ['arabic_progress', 'arabic_srs', 'arabic_streak',
        'arabic_last_studied', 'arabic_best_streak', 'arabic_study_days']
      keys.forEach(k => localStorage.removeItem(k))
      flash()
    }
  }

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <div className="settings-title">⚙️ הגדרות</div>
        {saved && <span className="settings-saved">✓ נשמר</span>}
      </div>

      {/* Profile */}
      <div className="settings-section">
        <div className="settings-section-title">פרופיל</div>

        <div className="settings-row">
          <div className="settings-row-text">
            <span className="settings-row-label">שם</span>
            {nameEdit ? (
              <div className="settings-name-edit">
                <input
                  className="settings-name-input"
                  value={name}
                  onChange={e => setNameState(e.target.value)}
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleNameSave()}
                />
                <button className="settings-name-save" onClick={handleNameSave}>✓</button>
                <button className="settings-name-cancel" onClick={() => { setNameState(getUsername()); setNameEdit(false) }}>✕</button>
              </div>
            ) : (
              <span className="settings-row-sub">{name || '—'}</span>
            )}
          </div>
          {!nameEdit && (
            <button className="settings-edit-btn" onClick={() => setNameEdit(true)}>עריכה</button>
          )}
        </div>

        <div className="settings-row">
          <div className="settings-row-text">
            <span className="settings-row-label">פנייה</span>
            <span className="settings-row-sub">{gender === 'f' ? 'נקבה (למדי, יודעת)' : 'זכר (למד, יודע)'}</span>
          </div>
          <div className="gender-pill-group">
            <button
              className={`gender-pill ${gender === 'f' ? 'active' : ''}`}
              onClick={() => handleGender('f')}
            >👩 נקבה</button>
            <button
              className={`gender-pill ${gender === 'm' ? 'active' : ''}`}
              onClick={() => handleGender('m')}
            >👦 זכר</button>
          </div>
        </div>
      </div>

      {/* Sound */}
      <div className="settings-section">
        <div className="settings-section-title">שמע</div>
        <Toggle
          value={sound}
          onChange={handleSoundToggle}
          label="🔊 שמע מופעל"
          sub="השמעת מילים בערבית"
        />
        <Toggle
          value={autoplay}
          onChange={handleAutoplayToggle}
          label="▶️ השמע אוטומטי"
          sub={`${g('שמעי', 'שמע')} את המילה אוטומטית כשהופכים כרטיס`}
        />
      </div>

      {/* Reset */}
      <div className="settings-section">
        <div className="settings-section-title">איפוס</div>
        <button className="settings-danger-btn" onClick={handleResetProgress}>
          🗑 אפס התקדמות (מילים ידועות)
        </button>
        <button className="settings-danger-btn" onClick={handleResetSRS}>
          📅 אפס לוח חזרות (SRS)
        </button>
        <button className="settings-danger-btn danger-red" onClick={handleResetAll}>
          ⚠️ אפס הכל מחדש
        </button>
      </div>

      <div className="settings-version">ערבית עם טריקים · v1.0</div>
    </div>
  )
}
