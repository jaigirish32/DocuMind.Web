import { useState, useEffect } from 'react'
import { listDocuments, syncGmail, getEmailStatus } from '../api'

export default function Sidebar({ selectedDocs, onSelectDocs, onCategoriesLoaded }) {
  const [documents, setDocuments]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [syncing, setSyncing]       = useState(false)
  const [emailCount, setEmailCount] = useState(0)
  const [syncMessage, setSyncMessage] = useState('')
  const [collapsed, setCollapsed]   = useState({})

  const load = async () => {
    try {
      const docs = await listDocuments()
      setDocuments(docs)
      if (docs.length > 0) {
        onSelectDocs([docs[0]])
      }
      if (onCategoriesLoaded) {
        const cats = [...new Set(docs.map(d => d.category || 'Others'))]
        onCategoriesLoaded(cats)
      }

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

  // Group documents by category
  const grouped = documents.reduce((acc, doc) => {
    const cat = doc.category || 'Others'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(doc)
    return acc
  }, {})

  const toggleCategory = (cat) => {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  const toggleDoc = (doc) => {
    const current = selectedDocs || []
    const exists  = current.find(d => d.document_id === doc.document_id)
    if (exists) {
      const next = current.filter(d => d.document_id !== doc.document_id)
      onSelectDocs(next.length > 0 ? next : null)
    } else {
      onSelectDocs([...current, doc])
    }
  }

  const isSelected = (doc) =>
    (selectedDocs || []).some(d => d.document_id === doc.document_id)

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

      {/* All documents */}
      <div style={{ padding: '0 12px', marginBottom: '8px' }}>
        <button
          onClick={() => onSelectDocs(null)}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: !selectedDocs ? 'rgba(232,213,163,0.1)' : 'transparent',
            border: !selectedDocs ? '1px solid rgba(232,213,163,0.2)' : '1px solid transparent',
            borderRadius: 'var(--radius)',
            color: !selectedDocs ? 'var(--accent)' : 'var(--muted)',
            fontSize: '13px',
            textAlign: 'left',
            transition: 'all 0.15s',
          }}
        >
          All documents
        </button>
      </div>

      {/* Documents grouped by category */}
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

        {Object.entries(grouped).map(([cat, docs]) => (
          <div key={cat} style={{ marginBottom: '8px' }}>
            {/* Category header */}
            <button
              onClick={() => toggleCategory(cat)}
              style={{
                width: '100%',
                padding: '6px 12px',
                background: 'transparent',
                border: 'none',
                borderRadius: 'var(--radius)',
                color: 'var(--muted)',
                fontSize: '11px',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              <span style={{ fontSize: '9px' }}>
                {collapsed[cat] ? '▶' : '▼'}
              </span>
              📁 {cat}
              <span style={{ marginLeft: 'auto', fontSize: '10px' }}>
                {docs.length}
              </span>
            </button>

            {/* Documents in category */}
            {!collapsed[cat] && docs.map(doc => (
              <button
                key={doc.document_id}
                onClick={() => toggleDoc(doc)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 24px',
                  background: isSelected(doc) ? 'rgba(232,213,163,0.1)' : 'transparent',
                  border: isSelected(doc) ? '1px solid rgba(232,213,163,0.2)' : '1px solid transparent',
                  borderRadius: 'var(--radius)',
                  color: isSelected(doc) ? 'var(--accent)' : 'var(--text)',
                  fontSize: '13px',
                  textAlign: 'left',
                  marginBottom: '2px',
                  transition: 'all 0.15s',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '3px',
                  border: `1px solid ${isSelected(doc) ? 'var(--accent)' : 'var(--border)'}`,
                  background: isSelected(doc) ? 'var(--accent)' : 'transparent',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  color: '#1a1a1a',
                }}>
                  {isSelected(doc) ? '✓' : ''}
                </span>
                📄 {doc.document_name}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)', margin: '8px 12px' }} />

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

      {/* Refresh */}
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