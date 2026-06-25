const KEY_BESOIN = 'pls_questionnaire_besoin'
const KEY_TOKENS = 'pls_besoin_tokens'

function genToken() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
}

function getAllBesoin() {
  try { return JSON.parse(localStorage.getItem(KEY_BESOIN) || '{}') } catch { return {} }
}

function saveBesoin(sessionId, data) {
  const all = getAllBesoin()
  all[sessionId] = data
  localStorage.setItem(KEY_BESOIN, JSON.stringify(all))
}

export function getBesoinToken(sessionId) {
  try {
    const tokens = JSON.parse(localStorage.getItem(KEY_TOKENS) || '{}')
    if (!tokens[sessionId]) {
      tokens[sessionId] = genToken()
      localStorage.setItem(KEY_TOKENS, JSON.stringify(tokens))
    }
    return tokens[sessionId]
  } catch {
    return genToken()
  }
}

export function verifyBesoinToken(sessionId, token) {
  try {
    const tokens = JSON.parse(localStorage.getItem(KEY_TOKENS) || '{}')
    return tokens[sessionId] === token
  } catch {
    return false
  }
}

export function regenererBesoinToken(sessionId) {
  const tokens = JSON.parse(localStorage.getItem(KEY_TOKENS) || '{}')
  tokens[sessionId] = genToken()
  localStorage.setItem(KEY_TOKENS, JSON.stringify(tokens))
  return tokens[sessionId]
}

export function getLienBesoin(sessionId) {
  const token = getBesoinToken(sessionId)
  const base = window.location.origin + window.location.pathname
  return `${base}#questionnaire-besoin/${sessionId}/${token}`
}

export function getBesoin(sessionId) {
  return getAllBesoin()[sessionId] || null
}

export function saveBesoinReponses(sessionId, reponses) {
  const existing = getBesoin(sessionId)
  saveBesoin(sessionId, {
    ...existing,
    reponses,
    soumisAt: new Date().toISOString(),
    verrouille: false,
  })
}

export function verrouillerBesoin(sessionId) {
  const existing = getBesoin(sessionId) || {}
  saveBesoin(sessionId, { ...existing, verrouille: true, verrouilleAt: new Date().toISOString() })
}

export function deverrouillerBesoin(sessionId) {
  const existing = getBesoin(sessionId) || {}
  saveBesoin(sessionId, { ...existing, verrouille: false })
}

export function addPrecisionBesoin(sessionId, texte) {
  const existing = getBesoin(sessionId) || {}
  const precisions = existing.precisions || []
  precisions.push({ texte, ajoutAt: new Date().toISOString(), verrouille: false })
  saveBesoin(sessionId, { ...existing, precisions })
}

export function verrouillerPrecision(sessionId, index) {
  const existing = getBesoin(sessionId) || {}
  const precisions = existing.precisions || []
  if (precisions[index]) precisions[index].verrouille = true
  saveBesoin(sessionId, { ...existing, precisions })
}
