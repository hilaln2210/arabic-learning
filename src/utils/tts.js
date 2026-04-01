// Arabic TTS — static pre-generated MP3 files (ar-EG-SalmaNeural, no tanwin)
// Falls back to Netlify function (Google Translate TTS) if file missing
// iOS: Uses HTML5 Audio element (bypasses silent-mode mute + better gesture handling)

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

let audioCtx = null
let currentSource = null
let currentAudioEl = null   // HTML5 Audio element for iOS
let contextResumed = false  // track if we've successfully resumed

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

// Must be called synchronously inside a user gesture to unlock iOS AudioContext
function unlockContextSync() {
  try {
    const ctx = getAudioContext()
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => { contextResumed = true })
      // Play silent buffer to fully unlock on iOS
      const buf = ctx.createBuffer(1, 1, 22050)
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.connect(ctx.destination)
      src.start(0)
    } else {
      contextResumed = true
    }
  } catch {}
}

// iOS: play via HTML5 Audio element — works even in silent mode, no gesture chain issues
function playViaAudioElement(url) {
  return new Promise((resolve, reject) => {
    if (currentAudioEl) {
      currentAudioEl.pause()
      currentAudioEl.removeAttribute('src')
      currentAudioEl.load()
    }
    const audio = new Audio(url)
    audio.setAttribute('playsinline', '')
    audio.preload = 'auto'
    currentAudioEl = audio
    audio.addEventListener('ended', resolve, { once: true })
    audio.addEventListener('error', () => reject(new Error(`Audio load failed: ${url}`)), { once: true })
    const playPromise = audio.play()
    if (playPromise) playPromise.catch(reject)
  })
}

// Desktop: play via Web Audio API (lower latency)
async function playViaWebAudio(url) {
  const ctx = getAudioContext()
  // Ensure context is resumed before playing
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const arrayBuf = await res.arrayBuffer()
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

async function playMp3Url(url) {
  if (isIOS) {
    return playViaAudioElement(url)
  }
  return playViaWebAudio(url)
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
  try {
    unlockContextSync()
    // iOS: also create and play a silent Audio element to unlock HTML5 Audio
    if (isIOS) {
      const a = new Audio()
      a.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYoRwMHAAAAAAD/+1DEAAAGAANIAAAAIQAY1IAAAABMQU1FMy4xMDBVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7UMQbAAADSAAAAAAAAANIAAAAAFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'
      a.play().catch(() => {})
    }
  } catch {}
}

export function preloadVoices() {}
