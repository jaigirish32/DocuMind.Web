import { useState, useEffect } from 'react'
import { listDocuments, syncGmail, getEmailStatus, deleteDocument } from '../api'
import { getDisplayName } from "../utils/displayName";
import { useTheme } from '../hooks/useTheme'

export default function Sidebar({
  selectedDocs,
  onSelectDocs,
  onCategoriesLoaded,
  showUpload,
  onToggleUpload,
}) {
  const [documents, setDocuments]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [syncing, setSyncing]       = useState(false)
  const [emailCount, setEmailCount] = useState(0)
  const [syncMessage, setSyncMessage] = useState('')
  const [collapsed, setCollapsed]   = useState({})
  const [hoveredDocId, setHoveredDocId] = useState(null)
  const [deletingIds, setDeletingIds]   = useState(new Set())
  const { theme, toggle: toggleTheme } = useTheme()

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

  const handleDelete = async (doc) => {
    const docCategory     = doc.category || 'Others'
    const docsInCategory  = grouped[docCategory] || []
    const isLastInCat     = docsInCategory.length === 1
    const docName         = getDisplayName(doc.document_name)

    // Smart confirm — extra warning when this is the last file in a category
    const message = isLastInCat
      ? `This is the last file in "${docCategory}".\n\nDelete "${docName}" and remove the category?`
      : `Delete "${docName}"?\n\nThis cannot be undone.`

    if (!window.confirm(message)) return

    setDeletingIds(prev => {
      const next = new Set(prev)
      next.add(doc.document_id)
      return next
    })

    try {
      await deleteDocument(doc.document_id)

      // Optimistic local update — remove from documents list
      const remainingDocs = documents.filter(d => d.document_id !== doc.document_id)
      setDocuments(remainingDocs)

      // Notify parent if the deleted doc was currently selected
      const wasSelected = (selectedDocs || []).some(
        d => d.document_id === doc.document_id
      )
      if (wasSelected) {
        const remainingSelected = (selectedDocs || []).filter(
          d => d.document_id !== doc.document_id
        )
        onSelectDocs(remainingSelected.length > 0 ? remainingSelected : null)
      }

      // Refresh parent's category list if it cares
      if (onCategoriesLoaded) {
        const cats = [...new Set(remainingDocs.map(d => d.category || 'Others'))]
        onCategoriesLoaded(cats)
      }
    } catch (e) {
      console.error('Delete failed', e)
      alert(
        'Failed to delete: ' +
        (e.response?.data?.detail || e.message || 'unknown error')
      )
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(doc.document_id)
        return next
      })
    }
  }

  const sidebarButtonStyle = {
    width: '100%',
    padding: '10px 12px',
    background: 'transparent',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--muted)',
    fontSize: '12px',
    transition: 'all 0.15s',
  }

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
      <div style={{ padding: '0 24px 20px' }}>
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
          SNAPBYTE TECHNOLOGIES
        </p>
      </div>

      {/* Upload button — under the logo */}
      {onToggleUpload && (
        <div style={{ padding: '0 12px 16px' }}>
          <button
            onClick={onToggleUpload}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: showUpload
                ? 'var(--border)'
                : 'var(--tint-accent-soft)',
              border: '1px solid var(--tint-accent-strong)',
              borderRadius: 'var(--radius)',
              color: 'var(--accent)',
              fontSize: '13px',
              fontWeight: '500',
              textAlign: 'left',
              transition: 'all 0.15s',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '14px' }}>
              {showUpload ? '✕' : '+'}
            </span>
            {showUpload ? 'Cancel upload' : 'Upload PDF'}
          </button>
        </div>
      )}

      {/* All documents */}
      <div style={{ padding: '0 12px', marginBottom: '8px' }}>
        <button
          onClick={() => onSelectDocs(null)}
          style={{
            width: '100%',
            padding: '10px 12px',
            background: !selectedDocs ? 'var(--tint-accent)' : 'transparent',
            border: !selectedDocs ? '1px solid var(--tint-accent-strong)' : '1px solid transparent',
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

            {!collapsed[cat] && docs.map(doc => {
              const selected   = isSelected(doc)
              const hovered    = hoveredDocId === doc.document_id
              const isDeleting = deletingIds.has(doc.document_id)

              return (
                <div
                  key={doc.document_id}
                  onClick={() => !isDeleting && toggleDoc(doc)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isDeleting) {
                      e.preventDefault()
                      toggleDoc(doc)
                    }
                  }}
                  onMouseEnter={() => setHoveredDocId(doc.document_id)}
                  onMouseLeave={() => setHoveredDocId(null)}
                  role="button"
                  tabIndex={0}
                  style={{
                    width: '100%',
                    padding: '8px 8px 8px 24px',
                    background: selected ? 'var(--tint-accent)' : 'transparent',
                    border: selected
                      ? '1px solid var(--tint-accent-strong)'
                      : '1px solid transparent',
                    borderRadius: 'var(--radius)',
                    color: selected ? 'var(--accent)' : 'var(--text)',
                    fontSize: '13px',
                    textAlign: 'left',
                    marginBottom: '2px',
                    transition: 'all 0.15s',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: isDeleting ? 'wait' : 'pointer',
                    opacity: isDeleting ? 0.5 : 1,
                    outline: 'none',
                  }}
                >
                  <span style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '3px',
                    border: `1px solid ${selected ? 'var(--accent)' : 'var(--muted)'}`,
                    background: selected ? 'var(--accent)' : 'transparent',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    color: 'var(--bg)',
                  }}>
                    {selected ? '✓' : ''}
                  </span>

                  <span style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    📄 {getDisplayName(doc.document_name)}
                  </span>

                  {/* Delete — always visible and discoverable.
                      Idle opacity 0.7 so it's clearly present, not just "technically rendered".
                      Brightens to 1.0 on row hover, turns red on icon hover for destructive intent. */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(doc)
                    }}
                    disabled={isDeleting}
                    title={isDeleting ? 'Deleting…' : 'Delete document'}
                    aria-label={`Delete ${getDisplayName(doc.document_name)}`}
                    style={{
                      padding: '4px 8px',
                      marginLeft: '4px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: '4px',
                      color: 'var(--muted)',
                      fontSize: '15px',
                      cursor: isDeleting ? 'wait' : 'pointer',
                      flexShrink: 0,
                      lineHeight: 1,
                      opacity: isDeleting ? 0.5 : (hovered ? 1 : 0.7),
                      transition: 'opacity 0.15s, color 0.15s, background 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isDeleting) {
                        e.currentTarget.style.color = 'var(--error)'
                        e.currentTarget.style.background = 'var(--tint-error, rgba(196,122,122,0.1))'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isDeleting) {
                        e.currentTarget.style.color = 'var(--muted)'
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    {isDeleting ? '⋯' : '✕'}
                  </button>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid var(--border)', margin: '8px 12px' }} />

      {/* Email section (hidden) */}
      <div style={{ padding: '0 12px 16px', display: 'none' }}>
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
            color: syncMessage.startsWith('✓') ? 'var(--success)' : 'var(--error)',
            padding: '6px 12px 0',
          }}>
            {syncMessage}
          </p>
        )}
      </div>

      {/* Bottom controls — theme toggle only */}
      <div style={{
        padding: '0 12px',
        marginTop: 'auto',
      }}>
        <button
          onClick={toggleTheme}
          style={sidebarButtonStyle}
          title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? '🌙 Dark mode' : '☀️ Light mode'}
        </button>
      </div>
    </aside>
  )
}
