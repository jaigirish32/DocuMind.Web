import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { uploadDocument } from '../api'

export default function Upload({ onUploaded }) {
  const [uploading, setUploading] = useState(false)
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState(null)

  const onDrop = useCallback(async (files) => {
    const file = files[0]
    if (!file) return

    setUploading(true)
    setError(null)
    setResult(null)

    try {
      const data = await uploadDocument(file)
      setResult(data)
      onUploaded(data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [onUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading,
  })

  return (
    <div style={{ marginBottom: '32px' }}>
      <div
        {...getRootProps()}
        style={{
          border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: '40px 24px',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          background: isDragActive ? 'rgba(232,213,163,0.05)' : 'transparent',
          transition: 'all 0.2s',
        }}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div>
            <div style={{
              width: '32px',
              height: '32px',
              border: '2px solid var(--border)',
              borderTop: '2px solid var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 12px',
            }} />
            <p style={{ color: 'var(--muted)', fontSize: '14px' }}>
              Indexing document...
            </p>
          </div>
        ) : (
          <div>
            <p style={{
              fontSize: '32px',
              marginBottom: '12px',
            }}>
              {isDragActive ? '📂' : '📄'}
            </p>
            <p style={{ color: 'var(--text)', fontSize: '14px', marginBottom: '4px' }}>
              {isDragActive ? 'Drop PDF here' : 'Drag & drop a PDF'}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '12px' }}>
              or click to browse
            </p>
          </div>
        )}
      </div>

      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Result */}
      {result && (
        <div style={{
          marginTop: '12px',
          padding: '12px 16px',
          background: 'rgba(126,184,154,0.1)',
          border: '1px solid rgba(126,184,154,0.2)',
          borderRadius: 'var(--radius)',
          fontSize: '13px',
          color: 'var(--success)',
        }}>
          ✓ {result.document_name} — {result.pages} pages, {result.chunks} chunks
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: '12px',
          padding: '12px 16px',
          background: 'rgba(196,122,122,0.1)',
          border: '1px solid rgba(196,122,122,0.2)',
          borderRadius: 'var(--radius)',
          fontSize: '13px',
          color: 'var(--error)',
        }}>
          ✗ {error}
        </div>
      )}
    </div>
  )
}