// Arabic TTS
// Strategy: Web Speech API first (works on iOS/Android with built-in Arabic voices)
//           Fall back to server proxy (Netlify function / local dev proxy)

// ── Web Speech API ────────────────────────────────────────────────────────────
let voices = []

function loadVoices() {
  voices = window.speechSynthesis?.getVoices() || []
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices()
  window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
}

function getArabicVoice() {
  const arabic = voices.filter(v => v.lang.startsWith('ar'))
  if (!arabic.length) return null

  // Microsoft Arabic voices (MSA) add tanwin to isolated words: بيت → "baytun"
  // Prefer Google voices or Egyptian dialect which pronounce correctly: "bayt"
  return arabic.find(v => v.name.includes('Google') && v.lang === 'ar-EG') ||
         arabic.find(v => v.name.includes('Google')) ||
         arabic.find(v => v.lang === 'ar-EG') ||
         arabic.find(v => !v.name.includes('Microsoft')) ||
         arabic[0] // last resort — may add tanwin
}

function speakViaSpeechAPI(text) {
  const voice = getArabicVoice()
  if (!voice) return false
  // If only Microsoft voice available (adds tanwin), prefer server TTS
  if (voice.name.includes('Microsoft')) return false
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.voice = voice
  utt.lang = voice.lang || 'ar'
  utt.rate = 0.9
  utt.pitch = 1
  window.speechSynthesis.speak(utt)
  return true
}

// ── AudioContext (server fallback) ────────────────────────────────────────────
let audioCtx = null
let currentSource = null

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

// Call synchronously inside user gesture to unlock iOS AudioContext
function unlockContextSync() {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    ctx.resume()
    const buf = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start(0)
  }
}

async function speakViaServer(text) {
  // Netlify function in production, Vite proxy in dev
  const url = `/.netlify/functions/tts?text=${encodeURIComponent(text)}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const arrayBuf = await res.arrayBuffer()
  const ctx = getAudioContext()
  const decoded = await new Promise((resolve, reject) => {
    ctx.decodeAudioData(arrayBuf, resolve, reject)
  })
  try { currentSource?.stop() } catch {}
  const source = ctx.createBufferSource()
  source.buffer = decoded
  source.connect(ctx.destination)
  source.start(0)
  currentSource = source
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function speakArabic(text) {
  if (!text) return

  // Unlock AudioContext synchronously (inside user gesture, before any await)
  unlockContextSync()

  // iOS Safari / Android: use built-in Arabic voice if available
  // Give voices a moment to load on first call
  if (voices.length === 0) {
    loadVoices()
    if (voices.length === 0) {
      await new Promise(r => setTimeout(r, 200))
      loadVoices()
    }
  }

  if (speakViaSpeechAPI(text)) return

  // No Arabic voice — fall back to server (Netlify function / local proxy)
  try {
    await speakViaServer(text)
  } catch (e) {
    console.warn('TTS error:', e.message)
  }
}

export function unlockAudio() {
  try { unlockContextSync() } catch {}
  loadVoices()
}

export function preloadVoices() {
  loadVoices()
}
