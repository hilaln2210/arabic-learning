// Netlify Function — Hebrew to Arabic translation proxy
// Uses Google Translate (no API key needed)

exports.handler = async (event) => {
  const text = event.queryStringParameters?.text || ''
  if (!text) return { statusCode: 400, body: JSON.stringify({ error: 'Missing text' }) }

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=iw&tl=ar&dt=t&dt=rm&q=${encodeURIComponent(text)}`

    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!resp.ok) throw new Error(`Google Translate returned ${resp.status}`)

    const data = await resp.json()

    // data[0] = array of translation segments: [translated, original, ...]
    // data[0][0][1] = romanization of translation (if dt=rm)
    const arabic = data[0]?.map(s => s[0]).join('') || ''
    // Romanization comes in a separate segment
    const translit = data[0]?.[0]?.[3] || ''

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ arabic, translit, source: text })
    }
  } catch (e) {
    console.error('Translate error:', e.message)
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) }
  }
}
