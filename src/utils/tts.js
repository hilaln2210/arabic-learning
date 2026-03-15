// Arabic TTS — static pre-generated MP3 files (ar-EG-SalmaNeural, no tanwin)
// Falls back to Netlify function (Google Translate TTS) if file missing

let audioCtx = null
let currentSource = null

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

// Must be called synchronously inside a user gesture to unlock iOS AudioContext
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

async function playMp3Url(url) {
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

// wordId: optional — uses pre-generated /audio/{wordId}.mp3 (fastest, most consistent)
// text:   fallback to Netlify function (Google Translate TTS)
export async function speakArabic(text, wordId) {
  if (!text) return
  unlockContextSync()

  // 1. Pre-generated static file — Egyptian Arabic, no tanwin, works offline
  if (wordId) {
    try {
      await playMp3Url(`/audio/${wordId}.mp3`)
      return
    } catch {}
  }

  // 2. Netlify function fallback (Google Translate TTS + period to prevent tanwin)
  try {
    await playMp3Url(`/.netlify/functions/tts?text=${encodeURIComponent(text)}`)
  } catch (e) {
    console.warn('TTS error:', e.message)
  }
}

export function unlockAudio() {
  try { unlockContextSync() } catch {}
}

export function preloadVoices() {}
