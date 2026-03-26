import { useState, useEffect } from 'react'
import { getDocumentHints } from '../api'

export default function DocumentHints({ selectedDoc, documentId, onSelectHint }) {
  const [hints, setHints]   = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!documentId) {
      setHints([])
      return
    }
    loadHints()
  }, [documentId])

  const loadHints = async () => {
    setLoading(true)
    setHints([])
    try {
      const data = await getDocumentHints(documentId, selectedDoc)
      const text = data.answer || ''

      // Parse numbered list into array
      const lines = text
        .split('\n')
        .map(l => l.replace(/^\d+\.\s*/, '').trim())
        .filter(l => l.length > 10)

      setHints(lines.slice(0, 4))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (!documentId) return null

  return (
    <div style={{
      padding: '12px 24px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
    }}>
      <p style={{
        fontSize: '11px',
        color: 'var(--muted)',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        marginBottom: '8px',
      }}>
        Suggested questions
      </p>

      {loading && (
        <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
          Analysing document...
        </p>
      )}

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        {hints.map((hint, i) => (
          <button
            key={i}
            onClick={() => onSelectHint(hint)}
            style={{
              padding: '6px 12px',
              background: 'rgba(232,213,163,0.06)',
              border: '1px solid rgba(232,213,163,0.15)',
              borderRadius: '20px',
              color: 'var(--text)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s',
              textAlign: 'left',
            }}
            onMouseEnter={e => {
              e.target.style.background = 'rgba(232,213,163,0.12)'
              e.target.style.borderColor = 'rgba(232,213,163,0.3)'
            }}
            onMouseLeave={e => {
              e.target.style.background = 'rgba(232,213,163,0.06)'
              e.target.style.borderColor = 'rgba(232,213,163,0.15)'
            }}
          >
            {hint}
          </button>
        ))}
      </div>
    </div>
  )
}