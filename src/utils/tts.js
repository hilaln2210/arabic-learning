// Arabic TTS — always uses Google Translate TTS via server proxy
// Consistent pronunciation across all devices (no tanwin, no dialect variance)
// iOS AudioContext is unlocked synchronously inside the user gesture

let audioCtx = null
let currentSource = null

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

// Call synchronously inside user gesture to unlock iOS AudioContext
function unlockContextSync() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume()
      const buf = ctx.createBuffer(1, 1, 22050)
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.connect(ctx.destination)
      src.start(0)
    }
  } catch {}
}

async function speakViaServer(text) {
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

export async function speakArabic(text) {
  if (!text) return
  // Unlock AudioContext synchronously (must be inside user gesture, before any await)
  unlockContextSync()
  try {
    await speakViaServer(text)
  } catch (e) {
    console.warn('TTS error:', e.message)
  }
}

export function unlockAudio() {
  try { unlockContextSync() } catch {}
}

// kept for backwards compat
export function preloadVoices() {}
