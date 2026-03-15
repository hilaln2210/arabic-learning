// Spaced Repetition System — SM-2 simplified
// Per-word: { interval (days), ease (factor), reps (count), due (timestamp) }

const KEY = 'arabic_srs'

function getSRSData() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

function saveSRSData(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)) } catch {}
}

export function updateSRS(wordId, correct) {
  const data = getSRSData()
  const now = Date.now()
  const e = data[wordId] || { interval: 1, ease: 2.5, reps: 0, due: now }
  if (correct) {
    const reps = e.reps + 1
    const interval = reps === 1 ? 1 : reps === 2 ? 3 : Math.round(e.interval * e.ease)
    data[wordId] = { interval, ease: Math.min(3.0, e.ease + 0.1), reps, due: now + interval * 86400000 }
  } else {
    data[wordId] = { interval: 1, ease: Math.max(1.3, e.ease - 0.2), reps: 0, due: now + 86400000 }
  }
  saveSRSData(data)
}

export function getDueWords(allWords) {
  const data = getSRSData()
  const now = Date.now()
  return allWords.filter(w => {
    const e = data[w.id]
    return !e || e.due <= now
  })
}

export function getDueCount(allWords) {
  return getDueWords(allWords).length
}
