// Arabic TTS — fetch → AudioContext (bypasses autoplay policy)
// iOS Safari fix: resume ctx synchronously inside user gesture, before any await

let currentSource = null
let audioCtx = null

function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

// Resume + play 1-sample silence to fully unlock iOS Safari AudioContext
function unlockContextSync() {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    ctx.resume()
    // Play inaudible buffer — required to unlock iOS AudioContext
    const buf = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start(0)
  }
}

function decodeAudio(ctx, arrayBuf) {
  // Use callback form for iOS 14 compatibility
  return new Promise((resolve, reject) => {
    ctx.decodeAudioData(arrayBuf, resolve, reject)
  })
}

export async function speakArabic(text) {
  if (!text) return

  // MUST happen synchronously inside the click handler (user gesture)
  // — before any await — so iOS Safari allows audio to play
  unlockContextSync()
  stopAll()

  const url = `/tts?text=${encodeURIComponent(text)}&slow=0`

  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const arrayBuf = await res.arrayBuffer()

    const ctx = getAudioContext()
    const decoded = await decodeAudio(ctx, arrayBuf)

    const source = ctx.createBufferSource()
    source.buffer = decoded
    source.connect(ctx.destination)
    source.start(0)
    currentSource = source
  } catch (e) {
    console.warn('TTS error:', e.message)
  }
}

function stopAll() {
  try { currentSource?.stop() } catch {}
  currentSource = null
}

export function unlockAudio() {
  try { unlockContextSync() } catch {}
}

export function preloadVoices() {}
