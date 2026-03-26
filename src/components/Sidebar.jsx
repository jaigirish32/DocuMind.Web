import { useState, useEffect } from 'react'
import { listDocuments, syncGmail, getEmailStatus } from '../api'

export default function Sidebar({ selectedDoc, onSelect }) {
  const [documents, setDocuments]       = useState([])
  const [loading, setLoading]           = useState(true)
  const [syncing, setSyncing]           = useState(false)
  const [emailCount, setEmailCount]     = useState(0)
  const [syncMessage, setSyncMessage]   = useState('')

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

  const loadEmailStatus = async () => {
    try {
      const status = await getEmailStatus()
      setEmailCount(status.indexed_emails || 0)
    } catch (e) {
      console.error(e)
    }
  }

  const handleSyncGmail = async () => {
    setSyncing(true)
    setSyncMessage('')
    try {
      const result = await syncGmail(20)
      setSyncMessage(`✓ ${result.emails} emails synced`)
      loadEmailStatus()
    } catch (e) {
      setSyncMessage('✕ Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    load()
    loadEmailStatus()
  }, [])

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
      <div style={{ padding: '0 12px 16px' }}>
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

      {/* Divider */}
      <div style={{
        borderTop: '1px solid var(--border)',
        margin: '8px 12px',
      }} />

      {/* Email section */}
      <div style={{ padding: '0 12px 16px' }}>
        <p style={{
          fontSize: '10px',
          color: 'var(--muted)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding: '0 12px',
          marginBottom: '8px',
        }}>
          Emails {emailCount > 0 && `(${emailCount} indexed)`}
        </p>

        {/* Sync Gmail button */}
        <button
          onClick={handleSyncGmail}
          disabled={syncing}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: syncing ? 'var(--muted)' : 'var(--text)',
            fontSize: '13px',
            textAlign: 'left',
            transition: 'all 0.15s',
            cursor: syncing ? 'not-allowed' : 'pointer',
          }}
        >
          {syncing ? '⟳ Syncing...' : '📧 Sync Gmail'}
        </button>

        {/* Sync result message */}
        {syncMessage && (
          <p style={{
            fontSize: '12px',
            color: syncMessage.startsWith('✓') ? '#4ade80' : '#f87171',
            padding: '6px 12px 0',
          }}>
            {syncMessage}
          </p>
        )}
      </div>

      {/* Refresh button */}
      <div style={{ padding: '0 12px', marginTop: 'auto' }}>
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