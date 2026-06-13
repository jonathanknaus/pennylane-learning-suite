/**
 * Central API client — all fetch calls to the Litestar backend.
 * Base URL: VITE_API_URL env var, defaults to http://localhost:8000
 */

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getToken() {
  const session = JSON.parse(localStorage.getItem('pls_session') || 'null')
  return session?.token || null
}

async function request(method, path, body) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw Object.assign(new Error(err.detail || 'Erreur serveur'), { status: res.status })
  }

  if (res.status === 204) return null
  return res.json()
}

const get = (path) => request('GET', path)
const post = (path, body) => request('POST', path, body)
const put = (path, body) => request('PUT', path, body)
const patch = (path, body) => request('PATCH', path, body)
const del = (path) => request('DELETE', path)

// ── Auth ────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email, password) => post('/auth/login', { email, password }),
  me: () => get('/auth/me'),
}

// ── Entreprises ─────────────────────────────────────────────────────────────
export const entreprises = {
  list: () => get('/entreprises'),
  get: (id) => get(`/entreprises/${id}`),
  create: (data) => post('/entreprises', data),
  update: (id, data) => put(`/entreprises/${id}`, data),
  delete: (id) => del(`/entreprises/${id}`),
}

// ── Stagiaires ───────────────────────────────────────────────────────────────
export const stagiaires = {
  list: () => get('/stagiaires'),
  get: (id) => get(`/stagiaires/${id}`),
  create: (data) => post('/stagiaires', data),
  update: (id, data) => put(`/stagiaires/${id}`, data),
  delete: (id) => del(`/stagiaires/${id}`),
}

// ── Formateurs ───────────────────────────────────────────────────────────────
export const formateurs = {
  list: () => get('/formateurs'),
  create: (data) => post('/formateurs', data),
  update: (id, data) => put(`/formateurs/${id}`, data),
  delete: (id) => del(`/formateurs/${id}`),
}

// ── Sessions ─────────────────────────────────────────────────────────────────
export const sessions = {
  list: () => get('/sessions'),
  get: (id) => get(`/sessions/${id}`),
  create: (data) => post('/sessions', data),
  update: (id, data) => put(`/sessions/${id}`, data),
  updateStatut: (id, statut) => patch(`/sessions/${id}/statut`, { statut }),
  delete: (id) => del(`/sessions/${id}`),
  inscrire: (sessionId, stagiaireId) => post(`/sessions/${sessionId}/inscriptions`, { session_id: sessionId, stagiaire_id: stagiaireId }),
  desinscrire: (sessionId, stagiaireId) => del(`/sessions/${sessionId}/inscriptions/${stagiaireId}`),
}

// ── Questionnaires ───────────────────────────────────────────────────────────
export const questionnaires = {
  saveReponses: (data) => post('/questionnaires/reponses', data),
  getSession: (sessionId) => get(`/questionnaires/session/${sessionId}`),
  getStagiaire: (sessionId, stagiaireId) => get(`/questionnaires/session/${sessionId}/stagiaire/${stagiaireId}`),
}

// ── Enquêtes ─────────────────────────────────────────────────────────────────
export const enquetes = {
  saveReponse: (data) => post('/enquetes/reponses', data),
  getSession: (sessionId) => get(`/enquetes/session/${sessionId}`),
  getByToken: (token) => get(`/enquetes/token/${token}`),
}

// ── Paramètres ───────────────────────────────────────────────────────────────
export const parametres = {
  list: () => get('/parametres'),
  update: (data) => put('/parametres', data),
}

// ── Emails ───────────────────────────────────────────────────────────────────
export const emails = {
  // payload: { type, sujet, session_id, destinataires: [{ email, nom, stagiaire_id, html }] }
  send: (payload) => post('/emails/send', payload),
  log: () => get('/emails/log'),
}
