import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { getAllWords } from '../data/words.js'
import { speakArabic } from '../utils/tts.js'

export default function Dictionary({ onBack }) {
  const [query, setQuery] = useState('')
  const [translated, setTranslated] = useState(null)
  const [translating, setTranslating] = useState(false)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)
  const allWords = useMemo(() => getAllWords(), [])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo(() => {
    const q = query.trim()
    if (!q) return []
    const exact = []
    const startsWith = []
    const contains = []
    for (const w of allWords) {
      const heb = w.hebrew
      if (heb === q) exact.push(w)
      else if (heb.startsWith(q)) startsWith.push(w)
      else if (heb.includes(q)) contains.push(w)
      else if (w.transliteration?.includes(q)) contains.push(w)
      else if (w.arabic?.includes(q)) contains.push(w)
    }
    return [...exact, ...startsWith, ...contains].slice(0, 20)
  }, [query, allWords])

  // Auto-translate when no local results
  const fetchTranslation = useCallback(async (text) => {
    setTranslating(true)
    setTranslated(null)
    try {
      const resp = await fetch(`/.netlify/functions/translate?text=${encodeURIComponent(text)}`)
      if (!resp.ok) throw new Error('Translation failed')
      const data = await resp.json()
      if (data.arabic) setTranslated(data)
    } catch (e) {
      console.warn('Translate error:', e.message)
    } finally {
      setTranslating(false)
    }
  }, [])

  useEffect(() => {
    const q = query.trim()
    if (!q || results.length > 0) {
      setTranslated(null)
      setTranslating(false)
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchTranslation(q), 500)
    return () => clearTimeout(debounceRef.current)
  }, [query, results.length, fetchTranslation])

  const renderWordCard = (word) => (
    <div key={word.id} className="dictionary-card">
      <div className="dictionary-card-top">
        <div className="dictionary-arabic">{word.arabic}</div>
        <button
          className="dictionary-speak-btn"
          onClick={() => speakArabic(word.arabic, word.id)}
          title="השמע"
        >
          🔊
        </button>
      </div>
      <div className="dictionary-translit">{word.transliteration}</div>
      <div className="dictionary-hebrew">{word.hebrew}</div>
      {word.trick && (
        <div className="dictionary-trick">
          <span className="trick-label">💡 טיפ:</span> {word.trick}
        </div>
      )}
      {word.example && (
        <div className="dictionary-example">
          <div className="example-ar">{word.example.ar}</div>
          <div className="example-translit">{word.example.translit}</div>
          <div className="example-he">{word.example.he}</div>
        </div>
      )}
    </div>
  )

  return (
    <div className="dictionary-page">
      <div className="dictionary-header">
        <button className="back-btn" onClick={onBack}>→</button>
        <h2>📖 מילון</h2>
      </div>

      <div className="dictionary-search-box">
        <input
          ref={inputRef}
          type="text"
          className="dictionary-input"
          placeholder="חפשי מילה בעברית, ערבית או תעתיק..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          dir="auto"
        />
        {query && (
          <button className="dictionary-clear" onClick={() => setQuery('')}>✕</button>
        )}
      </div>

      {!query && (
        <div className="dictionary-hint">
          <span className="dictionary-hint-icon">💡</span>
          <p>הקלידי מילה בעברית כדי למצוא את התרגום בערבית</p>
          <p className="dictionary-hint-example">לדוגמה: בננה, צבא, שלום...</p>
        </div>
      )}

      <div className="dictionary-results">
        {results.map(renderWordCard)}

        {query && results.length === 0 && translating && (
          <div className="dictionary-translating">
            <div className="dictionary-spinner" />
            <p>מתרגם...</p>
          </div>
        )}

        {query && results.length === 0 && !translating && translated && (
          <div className="dictionary-card dictionary-card-translated">
            <div className="dictionary-card-source">Google Translate</div>
            <div className="dictionary-card-top">
              <div className="dictionary-arabic">{translated.arabic}</div>
              <button
                className="dictionary-speak-btn"
                onClick={() => speakArabic(translated.arabic)}
                title="השמע"
              >
                🔊
              </button>
            </div>
            {translated.translit && (
              <div className="dictionary-translit">{translated.translit}</div>
            )}
            <div className="dictionary-hebrew">{translated.source}</div>
          </div>
        )}

        {query && results.length === 0 && !translating && !translated && (
          <div className="dictionary-empty">
            <span className="dictionary-empty-icon">🔍</span>
            <p>לא נמצאו תוצאות עבור "{query}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
