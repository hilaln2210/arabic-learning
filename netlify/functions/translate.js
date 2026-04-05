// Netlify Function — Hebrew to Arabic translation proxy
// Uses Google Translate (no API key needed)
// Strategy: Hebrew→Arabic for primary, Hebrew→English→Arabic for dictionary (parts of speech)

const POS_LABELS = {
  noun: 'שם עצם',
  verb: 'פועל',
  adjective: 'שם תואר',
  adverb: 'תואר הפועל',
  pronoun: 'כינוי גוף',
  preposition: 'מילת יחס',
  conjunction: 'מילת חיבור',
  interjection: 'קריאה',
  article: 'ה׳ הידיעה',
  abbreviation: 'קיצור',
}

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }

async function googleTranslate(sl, tl, text, dtParams = 'dt=t&dt=rm') {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&${dtParams}&q=${encodeURIComponent(text)}`
  const resp = await fetch(url, { headers: HEADERS })
  if (!resp.ok) throw new Error(`Google Translate returned ${resp.status}`)
  return resp.json()
}

exports.handler = async (event) => {
  const text = event.queryStringParameters?.text || ''
  if (!text) return { statusCode: 400, body: JSON.stringify({ error: 'Missing text' }) }

  try {
    // Step 1: Hebrew → Arabic (primary translation + romanization)
    // Step 2: Hebrew → English (to get the English word)
    const [arData, enData] = await Promise.all([
      googleTranslate('iw', 'ar', text, 'dt=t&dt=rm'),
      googleTranslate('iw', 'en', text, 'dt=t'),
    ])

    const arabic = arData[0]?.map(s => s[0]).filter(Boolean).join('') || ''
    const translit = arData[0]?.[0]?.[3] || ''
    const englishWord = enData[0]?.[0]?.[0] || ''

    // Step 3: English → Arabic with dictionary (dt=bd gives parts of speech)
    let dictionary = []
    if (englishWord) {
      const dictData = await googleTranslate('en', 'ar', englishWord, 'dt=t&dt=rm&dt=bd')

      if (dictData[1]) {
        for (const entry of dictData[1]) {
          const pos = entry[0] || ''
          const details = entry[2] || []
          const items = details.slice(0, 4).map(d => ({
            arabic: d[0] || '',
            score: d[3] || 0,
          }))
          dictionary.push({
            pos,
            posLabel: POS_LABELS[pos] || pos,
            items,
          })
        }
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ arabic, translit, source: text, english: englishWord, dictionary })
    }
  } catch (e) {
    console.error('Translate error:', e.message)
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) }
  }
}
