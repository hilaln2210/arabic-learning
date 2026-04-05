// Netlify Function — Arabic TTS proxy
// Proxies to Google Translate TTS (no API key needed)

exports.handler = async (event) => {
  const text = event.queryStringParameters?.text || ''
  if (!text) return { statusCode: 400, body: 'Missing text' }

  try {
    // Prevent tanwin (nunation: mawzun→mawz):
    // 1. For single words without ال, prepend definite article to force pausal form
    // 2. For sentences/phrases, append period
    const isSingleWord = !text.includes(' ')
    const hasArticle = text.startsWith('ال') || text.startsWith('أل')
    let ttsText
    if (isSingleWord && !hasArticle) {
      ttsText = 'ال' + text + '.'
    } else {
      ttsText = /[.،؟!]$/.test(text) ? text : text + '.'
    }
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(ttsText)}&tl=ar&client=tw-ob&ttsspeed=0.9`

    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    })

    if (!resp.ok) throw new Error(`Google TTS returned ${resp.status}`)

    const buf = Buffer.from(await resp.arrayBuffer())

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*'
      },
      body: buf.toString('base64'),
      isBase64Encoded: true
    }
  } catch (e) {
    console.error('TTS error:', e.message)
    return { statusCode: 500, body: e.message }
  }
}
