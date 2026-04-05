// Netlify Function — Hebrew to Arabic translation proxy
// Uses Google Translate (no API key needed)
// dt=t (translation), dt=rm (romanization), dt=bd (dictionary with parts of speech)

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

exports.handler = async (event) => {
  const text = event.queryStringParameters?.text || ''
  if (!text) return { statusCode: 400, body: JSON.stringify({ error: 'Missing text' }) }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=iw&tl=ar&dt=t&dt=rm&dt=bd&q=${encodeURIComponent(text)}`

    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!resp.ok) throw new Error(`Google Translate returned ${resp.status}`)

    const data = await resp.json()

    // Primary translation
    const arabic = data[0]?.map(s => s[0]).join('') || ''
    const translit = data[0]?.[0]?.[3] || ''

    // Dictionary entries: data[1] = [[pos, [word1, word2, ...], ...], ...]
    const dictionary = []
    if (data[1]) {
      for (const entry of data[1]) {
        const pos = entry[0] || ''
        const words = entry[1] || []
        // entry[2] has detailed info: [[arabic, [hebrew_back_translations], score], ...]
        const details = entry[2] || []
        const items = details.slice(0, 4).map(d => ({
          arabic: d[0] || '',
          score: d[3] || 0,
        }))
        dictionary.push({
          pos,
          posLabel: POS_LABELS[pos] || pos,
          words: words.slice(0, 4),
          items,
        })
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ arabic, translit, source: text, dictionary })
    }
  } catch (e) {
    console.error('Translate error:', e.message)
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) }
  }
}
