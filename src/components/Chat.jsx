import { useState, useRef, useEffect } from 'react'
import { askQuestion } from '../api'
import { getDisplayName } from '../utils/displayName'

export default function Chat({ selectedDoc, documentId, documentIds }) {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading]   = useState(false)
  // Track which citations are expanded — keys are `${msgIdx}-${citIdx}`
  const [expanded, setExpanded] = useState(new Set())
  // Track which message was just copied — shows "Copied" feedback briefly
  const [copiedIdx, setCopiedIdx] = useState(null)
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
      const history = messages.map(m => ({
        role:    m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      }))

      const data = await askQuestion(q, documentId, history, documentIds)

      setMessages(prev => [...prev, {
        role:      'assistant',
        text:      data.answer || '',
        citations: Array.isArray(data.citations) ? data.citations : [],
        pages:     Array.isArray(data.source_pages) ? data.source_pages : [],
      }])
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: 'Something went wrong. Please try again.',
        citations: [],
        pages: [],
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

  const toggleCitation = (msgIdx, citIdx) => {
    const key = `${msgIdx}-${citIdx}`
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const handleCopy = async (msgIdx, text) => {
    try {
      await navigator.clipboard.writeText(text || '')
      setCopiedIdx(msgIdx)
      setTimeout(() => setCopiedIdx(curr => (curr === msgIdx ? null : curr)), 1500)
    } catch (err) {
      // navigator.clipboard requires HTTPS or localhost — fall back to legacy method
      try {
        const ta = document.createElement('textarea')
        ta.value = text || ''
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        setCopiedIdx(msgIdx)
        setTimeout(() => setCopiedIdx(curr => (curr === msgIdx ? null : curr)), 1500)
      } catch (err2) {
        console.error('Copy failed', err2)
      }
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

        {messages.map((msg, msgIdx) => {
          const isAssistant  = msg.role === 'assistant'
          const hasCitations = msg.citations && msg.citations.length > 0
          const legacyPages  = !hasCitations && msg.pages && msg.pages.length > 0
            ? msg.pages
            : []
          const justCopied   = copiedIdx === msgIdx

          return (
            <div
              key={msgIdx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                gap: '6px',
                width: '100%',
              }}
            >
              {/* Message bubble */}
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

              {/* Actions row — copy + citation badges (assistant only) */}
              {isAssistant && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxWidth: '75%',
                  width: '100%',
                  alignItems: 'flex-start',
                }}>
                  <div style={{
                    display: 'flex',
                    gap: '4px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                  }}>
                    {/* Copy button */}
                    <button
                      onClick={() => handleCopy(msgIdx, msg.text)}
                      title="Copy answer"
                      style={{
                        padding: '2px 10px',
                        background: justCopied
                          ? 'rgba(126,184,154,0.15)'
                          : 'rgba(232,213,163,0.06)',
                        border: `1px solid ${justCopied
                          ? 'rgba(126,184,154,0.3)'
                          : 'rgba(232,213,163,0.15)'}`,
                        borderRadius: '4px',
                        fontSize: '11px',
                        color: justCopied ? '#7eb89a' : 'var(--muted)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{ fontSize: '11px' }}>
                        {justCopied ? '✓' : '📋'}
                      </span>
                      {justCopied ? 'Copied' : 'Copy'}
                    </button>

                    {/* Citation badges — clickable */}
                    {hasCitations && msg.citations.map((cit, citIdx) => {
                      const key    = `${msgIdx}-${citIdx}`
                      const isOpen = expanded.has(key)
                      const label  = cit.page != null ? `p.${cit.page}` : `[${citIdx + 1}]`

                      return (
                        <button
                          key={citIdx}
                          onClick={() => toggleCitation(msgIdx, citIdx)}
                          title={cit.quote ? cit.quote.slice(0, 80) + '…' : 'Show source'}
                          style={{
                            padding: '2px 10px',
                            background: isOpen
                              ? 'rgba(232,213,163,0.2)'
                              : 'rgba(232,213,163,0.08)',
                            border: `1px solid ${isOpen
                              ? 'rgba(232,213,163,0.4)'
                              : 'rgba(232,213,163,0.15)'}`,
                            borderRadius: '4px',
                            fontSize: '11px',
                            color: 'var(--accent)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s',
                          }}
                        >
                          <span style={{ fontSize: '9px', opacity: 0.7 }}>
                            {isOpen ? '▼' : '▶'}
                          </span>
                          {label}
                        </button>
                      )
                    })}

                    {/* Legacy page badges — non-clickable, only when no citations */}
                    {!hasCitations && legacyPages.map(p => (
                      <span
                        key={p}
                        style={{
                          padding: '2px 8px',
                          background: 'rgba(232,213,163,0.08)',
                          border: '1px solid rgba(232,213,163,0.15)',
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: 'var(--accent2, var(--accent))',
                        }}
                      >
                        p.{p}
                      </span>
                    ))}
                  </div>

                  {/* Expanded citation panels */}
                  {hasCitations && msg.citations.map((cit, citIdx) => {
                    const key = `${msgIdx}-${citIdx}`
                    if (!expanded.has(key)) return null

                    return (
                      <div
                        key={`exp-${citIdx}`}
                        style={{
                          padding: '12px 14px',
                          background: 'rgba(232,213,163,0.04)',
                          border: '1px solid rgba(232,213,163,0.15)',
                          borderRadius: '8px',
                          fontSize: '13px',
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px',
                          fontSize: '11px',
                          color: 'var(--muted)',
                          letterSpacing: '0.03em',
                        }}>
                          {cit.page != null && (
                            <span style={{ color: 'var(--accent)' }}>
                              Page {cit.page}
                            </span>
                          )}
                          {cit.doc_id && (
                            <>
                              {cit.page != null && <span>·</span>}
                              <span>{getDisplayName(cit.doc_id)}</span>
                            </>
                          )}
                          {cit.chunk_id && (
                            <>
                              <span>·</span>
                              <span style={{
                                fontFamily: 'monospace',
                                opacity: 0.6,
                              }}>
                                {cit.chunk_id.slice(0, 8)}
                              </span>
                            </>
                          )}
                        </div>
                        <div style={{
                          color: 'var(--text)',
                          fontStyle: 'italic',
                          lineHeight: '1.6',
                          borderLeft: '2px solid rgba(232,213,163,0.4)',
                          paddingLeft: '12px',
                        }}>
                          {cit.quote || '(no quote available)'}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

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
