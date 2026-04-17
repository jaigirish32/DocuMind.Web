import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'ngrok-skip-browser-warning': 'true',
  },
})

// ── Request interceptor — adds token to every request ──────────────────────
// This runs before EVERY api call automatically
// No need to manually add token in each function
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ── Response interceptor — handles token expiry ────────────────────────────
// If server returns 401 (unauthorized) → token expired or invalid
// Clear storage and reload → user sees login page again
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user_id')
      localStorage.removeItem('username')
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

// ── API functions — unchanged, token added automatically ───────────────────

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

export const getDocumentHints = async (documentId, documentName) => {
  const response = await api.post('/api/ask', {
    question: `List 4 specific questions a user could ask about this document "${documentName}". Return only the questions as a numbered list, nothing else.`,
    document_id: documentId,
  })
  return response.data
}

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
  return response.data   // { token, user_id, username }
}

export const register = async (username, email, password) => {
  const response = await api.post('/api/auth/register', { username, email, password })
  return response.data   // { token, user_id, username }
}

export default api