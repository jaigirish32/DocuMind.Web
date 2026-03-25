import { useState, useEffect } from 'react'
import { listDocuments } from '../api'

export default function Sidebar({ selectedDoc, onSelect }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading]     = useState(true)

  const load = async () => {
    try {
      const docs = await listDocuments()
      setDocuments(docs)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <aside style={{
      width: '260px',
      minHeight: '100vh',
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      flexShrink: 0,
    }}>

      {/* Logo */}
      <div style={{ padding: '0 24px 32px' }}>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '22px',
          color: 'var(--accent)',
          letterSpacing: '0.02em',
        }}>
          DocuMind
        </h1>
        <p style={{
          fontSize: '11px',
          color: 'var(--muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          marginTop: '2px',
        }}>
          Document Intelligence
        </p>
      </div>

      {/* All documents option */}
      <div style={{ padding: '0 12px', marginBottom: '8px' }}>
        <button
          onClick={() => onSelect(null)}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: !selectedDoc ? 'rgba(232,213,163,0.1)' : 'transparent',
            border: !selectedDoc ? '1px solid rgba(232,213,163,0.2)' : '1px solid transparent',
            borderRadius: 'var(--radius)',
            color: !selectedDoc ? 'var(--accent)' : 'var(--muted)',
            fontSize: '13px',
            textAlign: 'left',
            transition: 'all 0.15s',
          }}
        >
          All documents
        </button>
      </div>

      {/* Document list */}
      <div style={{ padding: '0 12px 16px', flex: 1, overflowY: 'auto' }}>
        <p style={{
          fontSize: '10px',
          color: 'var(--muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '0 12px',
          marginBottom: '8px',
        }}>
          Documents
        </p>

        {loading && (
          <p style={{ color: 'var(--muted)', fontSize: '13px', padding: '0 12px' }}>
            Loading...
          </p>
        )}

        {documents.map(doc => (
          <button
            key={doc.document_id}
            onClick={() => onSelect(doc)}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: selectedDoc?.document_id === doc.document_id
                ? 'rgba(232,213,163,0.1)' : 'transparent',
              border: selectedDoc?.document_id === doc.document_id
                ? '1px solid rgba(232,213,163,0.2)' : '1px solid transparent',
              borderRadius: 'var(--radius)',
              color: selectedDoc?.document_id === doc.document_id
                ? 'var(--accent)' : 'var(--text)',
              fontSize: '13px',
              textAlign: 'left',
              marginBottom: '4px',
              transition: 'all 0.15s',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            📄 {doc.document_name}
          </button>
        ))}
      </div>

      {/* Refresh button */}
      <div style={{ padding: '0 12px' }}>
        <button
          onClick={load}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--muted)',
            fontSize: '12px',
            transition: 'all 0.15s',
          }}
        >
          ↻ Refresh
        </button>
      </div>
    </aside>
  )
}