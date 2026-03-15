// /home/hila/Desktop/ArabicLearning/src/utils/sfx.js
function getCtx() {
  try { return new (window.AudioContext || window.webkitAudioContext)() } catch { return null }
}

function isSoundOn() {
  return localStorage.getItem('arabic_sound') !== 'off'
}

// Correct answer — two ascending notes (C5 → E5)
export function playCorrect() {
  if (!isSoundOn()) return
  const ctx = getCtx(); if (!ctx) return
  const t = ctx.currentTime
  ;[[523, 0, 0.08], [659, 0.1, 0.15]].forEach(([freq, delay, dur]) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'; o.frequency.value = freq
    g.gain.setValueAtTime(0.18, t + delay)
    g.gain.exponentialRampToValueAtTime(0.001, t + delay + dur)
    o.start(t + delay); o.stop(t + delay + dur + 0.05)
  })
}

// Wrong answer — low descending buzz
export function playWrong() {
  if (!isSoundOn()) return
  const ctx = getCtx(); if (!ctx) return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.connect(g); g.connect(ctx.destination)
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(220, t)
  o.frequency.linearRampToValueAtTime(140, t + 0.2)
  g.gain.setValueAtTime(0.15, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
  o.start(t); o.stop(t + 0.3)
}

// Level up — 4-note ascending fanfare
export function playLevelUp() {
  if (!isSoundOn()) return
  const ctx = getCtx(); if (!ctx) return
  const t = ctx.currentTime
  ;[[523, 0], [659, 0.12], [784, 0.24], [1047, 0.36]].forEach(([freq, delay]) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'; o.frequency.value = freq
    g.gain.setValueAtTime(0.2, t + delay)
    g.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.3)
    o.start(t + delay); o.stop(t + delay + 0.35)
  })
}

// Streak — sparkle-like ascending arpeggio
export function playStreak() {
  if (!isSoundOn()) return
  const ctx = getCtx(); if (!ctx) return
  const t = ctx.currentTime
  ;[523, 659, 784, 1047, 1319].forEach((freq, i) => {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.connect(g); g.connect(ctx.destination)
    o.type = 'sine'; o.frequency.value = freq
    const d = i * 0.07
    g.gain.setValueAtTime(0.12, t + d)
    g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.15)
    o.start(t + d); o.stop(t + d + 0.2)
  })
}

// Match correct pair — high ping
export function playMatchCorrect() {
  if (!isSoundOn()) return
  const ctx = getCtx(); if (!ctx) return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.connect(g); g.connect(ctx.destination)
  o.type = 'sine'; o.frequency.value = 880
  g.gain.setValueAtTime(0.15, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
  o.start(t); o.stop(t + 0.25)
}
