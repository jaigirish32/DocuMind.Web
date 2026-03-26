import axios from 'axios'

const getBaseURL = () => {
  // Check for Vercel injected env variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // Default to localhost for local dev
  return 'http://localhost:8000'
}

const api = axios.create({
  baseURL: getBaseURL(),
})

export const uploadDocument = async (file) => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

export const askQuestion = async (question, documentId) => {
  const response = await api.post('/api/ask', {
    question,
    document_id: documentId || null,
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
  const response = await api.post('/api/email/search', {
    question,
  })
  return response.data
}

export const getEmailStatus = async () => {
  const response = await api.get('/api/email/status')
  return response.data
}