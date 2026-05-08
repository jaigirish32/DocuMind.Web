import { useState, useCallback, useEffect, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadDocument, listDocuments } from '../api'
import { getDisplayName } from "../utils/displayName";

const MAX_SIZE_MB    = 5
const MAX_CONCURRENT = 3

export default function Upload({ onUploaded }) {
  const [queue, setQueue]                 = useState([])
  const [category, setCategory]           = useState('Others')
  const [newCategory, setNewCategory]     = useState('')
  const [showNew, setShowNew]             = useState(false)
  const [allCategories, setAllCategories] = useState(['Others'])

  const startedRef = useRef(new Set())

  useEffect(() => {
    listDocuments().then(docs => {
      const cats = [...new Set(docs.map(d => d.category || 'Others'))]
      setAllCategories(cats.length > 0 ? cats : ['Others'])
    }).catch(() => {})
  }, [])

  // The committed destination — what files actually upload to
  const destination = category || 'Others'

  const updateItem = (id, patch) => {
    setQueue(q => q.map(x => x.id === id ? { ...x, ...patch } : x))
  }

  const uploadOne = async (item) => {
    updateItem(item.id, { status: 'uploading' })
    try {
      const data = await uploadDocument(item.file, item.category)
      updateItem(item.id, { status: 'done', result: data })
      onUploaded(data)
    } catch (e) {
      updateItem(item.id, {
        status: 'error',
        error: e.response?.data?.detail || 'Upload failed',
      })
    }
  }

  useEffect(() => {
    const inFlight = queue.filter(q => q.status === 'uploading').length
    const slots    = MAX_CONCURRENT - inFlight
    if (slots <= 0) return

    const next = queue
      .filter(q => q.status === 'queued' && !startedRef.current.has(q.id))
      .slice(0, slots)

    next.forEach(item => {
      startedRef.current.add(item.id)
      uploadOne(item)
    })
  }, [queue])

  const onDrop = useCallback((files) => {
    if (!files || files.length === 0) return
    const captured = destination

    const newItems = files.map(file => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const sizeMb = file.size / (1024 * 1024)
      if (sizeMb > MAX_SIZE_MB) {
        return {
          id, file, category: captured,
          status: 'error',
          error: `Too large (${sizeMb.toFixed(1)} MB, max ${MAX_SIZE_MB} MB)`,
          result: null,
        }
      }
      return {
        id, file, category: captured,
        status: 'queued', error: null, result: null,
      }
    })

    setQueue(q => [...q, ...newItems])
  }, [destination])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    multiple: true,
  })

  const clearCompleted = () => {
    setQueue(q => q.filter(x => x.status !== 'done' && x.status !== 'error'))
  }

  const handleCreateCategory = () => {
    const name = newCategory.trim()
    if (!name) return
    // Add to known categories if not already present
    setAllCategories(prev => prev.includes(name) ? prev : [...prev, name])
    // Select the new category
    setCategory(name)
    // Close the create form, clear the input
    setShowNew(false)
    setNewCategory('')
  }

  const handleCancelCreate = () => {
    setShowNew(false)
    setNewCategory('')
  }

  const queuedCount    = queue.filter(q => q.status === 'queued').length
  const uploadingCount = queue.filter(q => q.status === 'uploading').length
  const doneCount      = queue.filter(q => q.status === 'done').length
  const errorCount     = queue.filter(q => q.status === 'error').length
  const completedCount = doneCount + errorCount

  return (
    <div style={{ marginBottom: '16px' }}>

      {/* ── Category section ─────────────────────────────────────────── */}
      <div style={{ marginBottom: '16px' }}>
        <p style={{
          fontSize: '11px',
          color: 'var(--muted)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: '4px',
        }}>
          Save to category
        </p>
        <p style={{
          fontSize: '12px',
          color: 'var(--muted)',
          marginBottom: '10px',
          lineHeight: '1.5',
        }}>
          Categories group your documents in the sidebar and help filter searches.
        </p>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {allCategories.map(cat => {
            const active = !showNew && category === cat
            return (
              <button
                key={cat}
                onClick={() => { setShowNew(false); setCategory(cat) }}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: `1px solid ${active ? 'rgba(232,213,163,0.45)' : 'var(--border)'}`,
                  background: active ? 'rgba(232,213,163,0.12)' : 'transparent',
                  color: active ? 'var(--accent)' : 'var(--muted)',
                  fontSize: '12px',
                  fontWeight: active ? '500' : 'normal',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s',
                }}
              >
                {active && <span style={{ fontSize: '8px' }}>●</span>}
                {cat}
              </button>
            )
          })}
          <button
            onClick={() => setShowNew(v => !v)}
            style={{
              padding: '5px 12px',
              borderRadius: '20px',
              border: '1px dashed var(--border)',
              background: showNew ? 'rgba(232,213,163,0.08)' : 'transparent',
              color: 'var(--muted)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            + Create new
          </button>
        </div>

        {showNew && (
          <div style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '8px',
          }}>
            <input
              autoFocus
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleCreateCategory()
                if (e.key === 'Escape') handleCancelCreate()
              }}
              placeholder="Name your category (e.g. Invoices, Legal, HR)"
              maxLength={40}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--text)',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              onClick={handleCreateCategory}
              disabled={!newCategory.trim()}
              style={{
                padding: '6px 14px',
                background: newCategory.trim() ? 'rgba(232,213,163,0.15)' : 'transparent',
                border: '1px solid rgba(232,213,163,0.3)',
                borderRadius: 'var(--radius)',
                color: newCategory.trim() ? 'var(--accent)' : 'var(--muted)',
                fontSize: '12px',
                cursor: newCategory.trim() ? 'pointer' : 'not-allowed',
                whiteSpace: 'nowrap',
              }}
            >
              Create
            </button>
            <button
              onClick={handleCancelCreate}
              style={{
                padding: '6px 14px',
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                color: 'var(--muted)',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* ── Destination callout — clear & prominent ──────────────────── */}
      <div style={{
        padding: '10px 14px',
        marginBottom: '12px',
        background: 'rgba(232,213,163,0.06)',
        border: '1px solid rgba(232,213,163,0.18)',
        borderRadius: 'var(--radius)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <div style={{ fontSize: '13px', color: 'var(--text)' }}>
          Files will upload to:{' '}
          <strong style={{ color: 'var(--accent)' }}>{destination}</strong>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
          Max {MAX_SIZE_MB} MB per file
        </div>
      </div>

      {/* ── Drop zone ────────────────────────────────────────────────── */}
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: '32px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragActive ? 'rgba(232,213,163,0.05)' : 'transparent',
          transition: 'all 0.2s',
        }}
      >
        <input {...getInputProps()} />
        <div>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>
            {isDragActive ? '📂' : '📄'}
          </p>
          <p style={{ color: 'var(--text)', fontSize: '14px', marginBottom: '4px' }}>
            {isDragActive ? 'Drop PDFs here' : 'Drag & drop PDFs'}
          </p>
          <p style={{ color: 'var(--muted)', fontSize: '12px' }}>
            or click to browse · multiple files supported
          </p>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Queue list ───────────────────────────────────────────────── */}
      {queue.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}>
            <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
              {uploadingCount > 0 && <span>⏳ {uploadingCount} uploading · </span>}
              {queuedCount > 0    && <span>{queuedCount} queued · </span>}
              {doneCount > 0      && <span style={{ color: 'var(--success)' }}>✓ {doneCount} done</span>}
              {errorCount > 0     && <span style={{ color: 'var(--error)' }}>{doneCount > 0 ? ' · ' : ''}✗ {errorCount} failed</span>}
            </p>
            {completedCount > 0 && (
              <button
                onClick={clearCompleted}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--muted)',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}
              >
                Clear completed
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {queue.map(item => (
              <QueueItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function QueueItem({ item }) {
  const { status, file, error, result } = item

  const statusStyles = {
    queued:    { bg: 'transparent',                  border: 'var(--border)',          color: 'var(--muted)' },
    uploading: { bg: 'rgba(232,213,163,0.05)',       border: 'rgba(232,213,163,0.3)',  color: 'var(--accent)' },
    done:      { bg: 'rgba(126,184,154,0.1)',        border: 'rgba(126,184,154,0.2)',  color: 'var(--success)' },
    error:     { bg: 'rgba(196,122,122,0.1)',        border: 'rgba(196,122,122,0.2)',  color: 'var(--error)' },
  }
  const s = statusStyles[status]

  const icon = {
    queued:    '◷',
    uploading: null,
    done:      '✓',
    error:     '✗',
  }[status]

  const label = {
    queued:    'Queued',
    uploading: 'Uploading…',
    done:      result ? `${result.pages} pages → ${result.category}` : 'Done',
    error:     error || 'Failed',
  }[status]

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 12px',
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: 'var(--radius)',
      fontSize: '13px',
    }}>
      <span style={{ color: s.color, fontSize: '14px', minWidth: '16px', textAlign: 'center' }}>
        {status === 'uploading' ? (
          <span style={{
            display: 'inline-block', width: '12px', height: '12px',
            border: '2px solid var(--border)', borderTop: '2px solid var(--accent)',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite',
          }} />
        ) : icon}
      </span>
      <span style={{
        color: 'var(--text)', flex: 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {getDisplayName(file.name)}
      </span>
      <span style={{ color: s.color, fontSize: '12px' }}>
        {label}
      </span>
    </div>
  )
}
