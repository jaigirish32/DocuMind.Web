import { useState } from 'react'
import { login, register } from '../api'

export default function Login({ onLogin }) {
  const [mode, setMode]         = useState('login')    // 'login' or 'register'
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async () => {
    setError('')

    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required')
      return
    }
    if (mode === 'register' && !email.trim()) {
      setError('Email is required')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      const data = mode === 'login'
        ? await login(username.trim(), password)
        : await register(username.trim(), email.trim(), password)

      // Store credentials in localStorage
      localStorage.setItem('token',    data.token)
      localStorage.setItem('user_id',  String(data.user_id))
      localStorage.setItem('username', data.username)

      // Tell App.jsx we are logged in
      onLogin(data.username)

    } catch (err) {
      const msg = err.response?.data?.detail
      if (msg) {
        setError(msg)
      } else {
        setError(mode === 'login'
          ? 'Invalid username or password'
          : 'Registration failed — try a different username'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'center',
      height:          '100vh',
      background:      'var(--bg, #0f0f0f)',
      color:           'var(--text, #e8e8e8)',
    }}>

      {/* Logo */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{
          fontFamily:  "'DM Serif Display', serif",
          fontSize:    '32px',
          fontWeight:  'normal',
          color:       'var(--accent, #e8d5a3)',
          marginBottom: '4px',
        }}>
          DocuMind
        </h1>
        <p style={{
          fontSize:    '12px',
          letterSpacing: '0.15em',
          color:       'var(--text-muted, #888)',
          textTransform: 'uppercase',
        }}>
          Document Intelligence
        </p>
      </div>

      {/* Card */}
      <div style={{
        width:        '340px',
        background:   'var(--surface, #1a1a1a)',
        border:       '1px solid var(--border, #2a2a2a)',
        borderRadius: '12px',
        padding:      '32px',
      }}>

        {/* Mode toggle */}
        <div style={{
          display:       'flex',
          marginBottom:  '24px',
          background:    'var(--bg, #0f0f0f)',
          borderRadius:  '8px',
          padding:       '4px',
        }}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError('') }}
              style={{
                flex:         1,
                padding:      '8px',
                border:       'none',
                borderRadius: '6px',
                cursor:       'pointer',
                fontSize:     '13px',
                fontWeight:   mode === m ? '500' : 'normal',
                background:   mode === m
                  ? 'var(--surface, #1a1a1a)'
                  : 'transparent',
                color: mode === m
                  ? 'var(--accent, #e8d5a3)'
                  : 'var(--text-muted, #888)',
                transition:   'all 0.15s',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          <input
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={inputStyle}
          />

          {mode === 'register' && (
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={inputStyle}
            />
          )}

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={inputStyle}
          />

          {/* Error message */}
          {error && (
            <p style={{
              color:     '#e87a7a',
              fontSize:  '12px',
              margin:    0,
              padding:   '8px 12px',
              background: 'rgba(232,122,122,0.1)',
              borderRadius: '6px',
              border:    '1px solid rgba(232,122,122,0.2)',
            }}>
              {error}
            </p>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding:      '10px',
              marginTop:    '4px',
              borderRadius: '8px',
              border:       '1px solid rgba(232,213,163,0.3)',
              background:   loading
                ? 'transparent'
                : 'rgba(232,213,163,0.1)',
              color:        'var(--accent, #e8d5a3)',
              fontSize:     '14px',
              cursor:       loading ? 'not-allowed' : 'pointer',
              transition:   'all 0.15s',
              opacity:      loading ? 0.6 : 1,
            }}
          >
            {loading
              ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
              : (mode === 'login' ? 'Sign In' : 'Create Account')
            }
          </button>

        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  padding:      '10px 12px',
  borderRadius: '8px',
  border:       '1px solid var(--border, #2a2a2a)',
  background:   'var(--bg, #0f0f0f)',
  color:        'var(--text, #e8e8e8)',
  fontSize:     '14px',
  outline:      'none',
  width:        '100%',
  boxSizing:    'border-box',
}