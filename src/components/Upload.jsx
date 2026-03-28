import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadDocument, listDocuments } from '../api'

const MAX_SIZE_MB = 5

export default function Upload({ onUploaded }) {
  const [uploading, setUploading]         = useState(false)
  const [result, setResult]               = useState(null)
  const [error, setError]                 = useState(null)
  const [category, setCategory]           = useState('')
  const [newCategory, setNewCategory]     = useState('')
  const [showNew, setShowNew]             = useState(false)
  const [allCategories, setAllCategories] = useState(['Others'])

  useEffect(() => {
    listDocuments().then(docs => {
      const cats = [...new Set(docs.map(d => d.category || 'Others'))]
      setAllCategories(cats.length > 0 ? cats : ['Others'])
    }).catch(() => {})
  }, [])

  const finalCategory = showNew
    ? (newCategory.trim() || 'Others')
    : (category || 'Others')

  const onDrop = useCallback(async (files) => {
    const file = files[0]
    if (!file) return
    const sizeMb = file.size / (1024 * 1024)
    if (sizeMb > MAX_SIZE_MB) {
      setError(`File too large. Max ${MAX_SIZE_MB} MB. Your file is ${sizeMb.toFixed(1)} MB.`)
      return
    }
    setUploading(true)
    setError(null)
    setResult(null)
    try {
      const data = await uploadDocument(file, finalCategory)
      setResult(data)
      onUploaded(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [onUploaded, finalCategory])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>
          Category
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => { setShowNew(false); setCategory(cat) }}
              style={{
                padding: '4px 12px', borderRadius: '20px',
                border: `1px solid ${!showNew && (category === cat || (!category && cat === 'Others')) ? 'rgba(232,213,163,0.4)' : 'var(--border)'}`,
                background: !showNew && (category === cat || (!category && cat === 'Others')) ? 'rgba(232,213,163,0.1)' : 'transparent',
                color: !showNew && (category === cat || (!category && cat === 'Others')) ? 'var(--accent)' : 'var(--muted)',
                fontSize: '12px', cursor: 'pointer',
              }}
            >
              {cat}
            </button>
          ))}
          <button
            onClick={() => setShowNew(v => !v)}
            style={{
              padding: '4px 12px', borderRadius: '20px',
              border: '1px dashed var(--border)',
              background: showNew ? 'rgba(232,213,163,0.1)' : 'transparent',
              color: 'var(--muted)', fontSize: '12px', cursor: 'pointer',
            }}
          >
            + New
          </button>
        </div>
        {showNew && (
          <input
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            placeholder="e.g. Finance, Legal, HR"
            style={{
              width: '100%', padding: '8px 12px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', color: 'var(--text)',
              fontSize: '13px', outline: 'none', boxSizing: 'border-box',
            }}
          />
        )}
      </div>

      <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
        Max {MAX_SIZE_MB} MB · Category: <strong style={{ color: 'var(--accent)' }}>{finalCategory}</strong>
      </p>

      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)', padding: '32px 24px', textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          background: isDragActive ? 'rgba(232,213,163,0.05)' : 'transparent',
          transition: 'all 0.2s',
        }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div>
            <div style={{
              width: '32px', height: '32px',
              border: '2px solid var(--border)', borderTop: '2px solid var(--accent)',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }} />
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Indexing into <strong>{finalCategory}</strong>...</p>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>{isDragActive ? '📂' : '📄'}</p>
            <p style={{ color: 'var(--text)', fontSize: '14px', marginBottom: '4px' }}>
              {isDragActive ? 'Drop PDF here' : 'Drag & drop a PDF'}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '12px' }}>or click to browse</p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {result && (
        <div style={{
          marginTop: '12px', padding: '12px 16px',
          background: 'rgba(126,184,154,0.1)', border: '1px solid rgba(126,184,154,0.2)',
          borderRadius: 'var(--radius)', fontSize: '13px', color: 'var(--success)',
        }}>
          ✓ {result.document_name} → {result.category} — {result.pages} pages
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '12px', padding: '12px 16px',
          background: 'rgba(196,122,122,0.1)', border: '1px solid rgba(196,122,122,0.2)',
          borderRadius: 'var(--radius)', fontSize: '13px', color: 'var(--error)',
        }}>
          ✗ {error}
        </div>
      )}
    </div>
  )
}