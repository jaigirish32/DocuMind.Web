import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Upload from './components/Upload'
import Chat from './components/Chat'

export default function App() {
  const [selectedDocs, setSelectedDocs] = useState(null)  // array or null
  const [showUpload, setShowUpload]     = useState(false)
  const [refreshKey, setRefreshKey]     = useState(0)
  

  const handleUploaded = (result) => {
    setRefreshKey(k => k + 1)
    setShowUpload(false)
    setSelectedDocs([{
      document_id:   result.document_id,
      document_name: result.document_name,
      category:      result.category,
    }])
  }

  const handleSelectDocs = (docs) => {
    setSelectedDocs(docs)
    // Extract unique categories from all docs for Upload component
    if (docs) {
      const cats = [...new Set(docs.map(d => d.category).filter(Boolean))]
      setCategories(prev => [...new Set([...prev, ...cats])])
    }
  }

  // For chat — if single doc selected use its id, if multiple use null (search all selected)
  const chatDocumentId = selectedDocs?.length === 1
    ? selectedDocs[0].document_id
    : null

  const chatDocumentIds = selectedDocs?.length > 1
    ? selectedDocs.map(d => d.document_id)
    : null

  // Header title
  const headerTitle = !selectedDocs || selectedDocs.length === 0
    ? 'All Documents'
    : selectedDocs.length === 1
      ? selectedDocs[0].document_name
      : `${selectedDocs.length} documents selected`

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
    }}>

      {/* Sidebar */}
      <Sidebar
        key={refreshKey}
        selectedDocs={selectedDocs}
        onSelectDocs={handleSelectDocs}
        onCategoriesLoaded={setCategories}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '18px',
              color: 'var(--text)',
              fontWeight: 'normal',
            }}>
              {headerTitle}
            </h2>

            {/* Permanent accuracy badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'rgba(126,184,154,0.1)',
              border: '1px solid rgba(126,184,154,0.2)',
              borderRadius: '20px',
            }}>
              <span style={{ fontSize: '10px' }}>⚡</span>
              <span style={{
                fontSize: '11px',
                color: '#7eb89a',
                fontWeight: '500',
                letterSpacing: '0.05em',
              }}>
                ~95% answer accuracy
              </span>
            </div>
          </div>

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
            maxHeight: '400px',
            overflowY: 'auto',
            position: 'relative',
          }}>
            <Upload
              onUploaded={handleUploaded}
            />
          </div>
        )}

        {/* Chat */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          <Chat
            selectedDoc={!selectedDocs ? null : selectedDocs.length === 1 ? selectedDocs[0].document_name : `${selectedDocs.length} documents selected`}
            documentId={chatDocumentId}
            documentIds={chatDocumentIds}
          />
        </div>

      </main>
    </div>
  )
}