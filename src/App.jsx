import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Upload from './components/Upload'
import Chat from './components/Chat'

export default function App() {
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [showUpload, setShowUpload]   = useState(false)
  const [refreshKey, setRefreshKey]   = useState(0)

  const handleUploaded = (result) => {
    setRefreshKey(k => k + 1)
    setShowUpload(false)
    setSelectedDoc(result.document_name)
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
    }}>

      {/* Sidebar */}
      <Sidebar
        key={refreshKey}
        selectedDoc={selectedDoc}
        onSelect={setSelectedDoc}
      />

      {/* Main content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Header */}
        <header style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '18px',
            color: 'var(--text)',
            fontWeight: 'normal',
          }}>
            {selectedDoc?.document_name || 'All Documents'}
          </h2>

          <button
            onClick={() => setShowUpload(v => !v)}
            style={{
              padding: '8px 16px',
              background: showUpload ? 'var(--border)' : 'rgba(232,213,163,0.1)',
              border: '1px solid rgba(232,213,163,0.2)',
              borderRadius: 'var(--radius)',
              color: 'var(--accent)',
              fontSize: '13px',
              transition: 'all 0.15s',
            }}
          >
            {showUpload ? '✕ Cancel' : '+ Upload PDF'}
          </button>
        </header>

        {/* Upload panel */}
        {showUpload && (
          <div style={{
            padding: '24px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
          }}>
            <Upload onUploaded={handleUploaded} />
          </div>
        )}

        {/* Chat */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          <Chat
            selectedDoc={selectedDoc?.document_name}
            documentId={selectedDoc?.document_id}
          />
        </div>

      </main>
    </div>
  )
}