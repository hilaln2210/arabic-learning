import { useState } from 'react'
import { setUsername, setGender } from '../utils/user.js'

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [error, setError] = useState(false)

  const handleNameSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError(true)
      return
    }
    setUsername(name)
    setStep(2)
  }

  const handleGender = (gender) => {
    setGender(gender)
    onDone()
  }

  if (step === 2) {
    return (
      <div className="onboarding-screen">
        <span className="onboarding-logo">👤</span>
        <h1 className="onboarding-title">שלום, {name}!</h1>
        <p className="onboarding-subtitle">אני רוצה לדבר איתך בצורה הנכונה 😊<br />איך לפנות אליך?</p>
        <div className="gender-picker">
          <button className="gender-btn" onClick={() => handleGender('f')}>
            <span className="gender-emoji">👩</span>
            <span className="gender-label">בנות / נקבה</span>
            <span className="gender-example">״למדי, זוכרת״</span>
          </button>
          <button className="gender-btn" onClick={() => handleGender('m')}>
            <span className="gender-emoji">👦</span>
            <span className="gender-label">בנים / זכר</span>
            <span className="gender-example">״למד, זוכר״</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-screen">
      <span className="onboarding-logo">🧠</span>
      <h1 className="onboarding-title">ברוכים הבאים!</h1>
      <p className="onboarding-subtitle">אפליקציית הערבית עם טריקי הזיכרון</p>
      <form className="onboarding-form" onSubmit={handleNameSubmit}>
        <input
          className="onboarding-input"
          type="text"
          placeholder="הזן/י את שמך"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(false) }}
          autoFocus
          autoComplete="off"
          style={error ? { borderColor: '#ef4444' } : {}}
        />
        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
          <span>המשך →</span>
        </button>
        {error && (
          <p style={{ color: '#ef4444', fontSize: 13, textAlign: 'center' }}>נא להזין שם</p>
        )}
        <p className="onboarding-note">השם שלך יוצג בברכת הפתיחה</p>
      </form>
    </div>
  )
}
