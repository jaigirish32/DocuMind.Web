import { useState, useRef, useEffect } from 'react'
import { askQuestion } from '../api'
import DocumentHints from './DocumentHints'

export default function Chat({ selectedDoc, documentId }) {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!question.trim() || loading) return

    const q = question.trim()
    setQuestion('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)

    try {
      // Build history from existing messages
      const history = messages.map(m => ({
        role:    m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }))

      const data = await askQuestion(q, documentId, history)
      setMessages(prev => [...prev, {
        role:  'assistant',
        text:  data.answer,
        pages: data.source_pages,
      }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Something went wrong. Please try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}>

      {/* Context indicator */}
      <div style={{
        padding: '12px 24px',
        borderBottom: '1px solid var(--border)',
        fontSize: '12px',
        color: 'var(--muted)',
      }}>
        {selectedDoc
          ? `Asking about: ${selectedDoc}`
          : 'Asking across all documents'
        }
      </div>

        {/* Document hints */}
        <DocumentHints
        selectedDoc={selectedDoc}
        documentId={documentId}
        onSelectHint={(hint) => setQuestion(hint)}
        />

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {messages.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--muted)',
            textAlign: 'center',
            padding: '60px 24px',
          }}>
            <p style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '28px',
              color: 'var(--accent)',
              marginBottom: '12px',
              fontStyle: 'italic',
            }}>
              Ask anything
            </p>
            <p style={{ fontSize: '14px' }}>
              Upload a document or ask about existing ones
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              gap: '6px',
            }}
          >
            <div style={{
              maxWidth: '75%',
              padding: '14px 18px',
              borderRadius: msg.role === 'user'
                ? '16px 16px 4px 16px'
                : '16px 16px 16px 4px',
              background: msg.role === 'user'
                ? 'rgba(232,213,163,0.15)'
                : 'var(--surface)',
              border: `1px solid ${msg.role === 'user'
                ? 'rgba(232,213,163,0.2)'
                : 'var(--border)'}`,
              fontSize: '14px',
              lineHeight: '1.6',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.text}
            </div>

            {/* Page citations */}
            {msg.pages && msg.pages.length > 0 && (
              <div style={{
                display: 'flex',
                gap: '4px',
                flexWrap: 'wrap',
              }}>
                {msg.pages.map(p => (
                  <span
                    key={p}
                    style={{
                      padding: '2px 8px',
                      background: 'rgba(232,213,163,0.08)',
                      border: '1px solid rgba(232,213,163,0.15)',
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: 'var(--accent2)',
                    }}
                  >
                    p.{p}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--muted)',
            fontSize: '13px',
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid var(--border)',
              borderTop: '2px solid var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }} />
            Thinking...
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end',
      }}>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask a question... (Enter to send)"
          rows={1}
          style={{
            flex: 1,
            padding: '12px 16px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            color: 'var(--text)',
            fontSize: '14px',
            resize: 'none',
            outline: 'none',
            lineHeight: '1.5',
            transition: 'border-color 0.15s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
        <button
          onClick={send}
          disabled={loading || !question.trim()}
          style={{
            padding: '12px 20px',
            background: loading || !question.trim()
              ? 'var(--border)'
              : 'var(--accent)',
            border: 'none',
            borderRadius: 'var(--radius)',
            color: loading || !question.trim()
              ? 'var(--muted)'
              : '#1a1a1a',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'all 0.15s',
          }}
        >
          Send
        </button>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}