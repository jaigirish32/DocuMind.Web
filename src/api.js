import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
})

// ── Request interceptor — adds token to every request ──────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor — handles token expiry ────────────────────────────
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user_id')
      localStorage.removeItem('username')
      localStorage.removeItem('company')
      window.location.href = window.location.origin
    }
    return Promise.reject(error)
  }
)

// ── Document API functions ─────────────────────────────────────────────────

export const uploadDocument = async (file, category = 'Others') => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('category', category)
  const response = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const askQuestion = async (question, documentId, history = [], documentIds = null) => {
  const response = await api.post('/api/ask', {
    question,
    document_id:  documentId || null,
    document_ids: documentIds || null,
    history,
  })
  return response.data
}

export const listDocuments = async () => {
  const response = await api.get('/api/documents')
  return response.data.documents
}

export const deleteDocument = async (documentId) => {
  const response = await api.delete(
    `/api/documents/${encodeURIComponent(documentId)}`
  )
  return response.data
}

export const getDocumentHints = async (documentId, documentName) => {
  const response = await api.post('/api/ask', {
    question: `List 4 specific questions a user could ask about this document "${documentName}". Return only the questions as a numbered list, nothing else.`,
    document_id: documentId,
  })
  return response.data
}

// ── Email API functions ────────────────────────────────────────────────────

export const syncGmail = async (maxResults = 10) => {
  const response = await api.post('/api/email/sync/gmail', {
    max_results: maxResults,
  })
  return response.data
}

export const searchEmails = async (question) => {
  const response = await api.post('/api/email/search', { question })
  return response.data
}

export const getEmailStatus = async () => {
  const response = await api.get('/api/email/status')
  return response.data
}

// ── Auth API functions ─────────────────────────────────────────────────────

export const login = async (username, password) => {
  const response = await api.post('/api/auth/login', { username, password })
  return response.data   // { token, user_id, username, company }
}

export const register = async (username, email, password, company) => {
  const response = await api.post('/api/auth/register', {
    username,
    email,
    password,
    company,
  })
  return response.data   // { token, user_id, username, company }
}

export default api