// Portails personnels formateur et apprenant
// Accès sans auth via token aléatoire intégré dans l'URL
// Storage : pls_portail_formateurs / pls_portail_stagiaires

const KEY_FORMATEURS = 'pls_portail_formateurs'
const KEY_STAGIAIRES = 'pls_portail_stagiaires'

function genToken() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
}

// ---- Formateurs ----

function getPortailsFormateurs() {
  try { return JSON.parse(localStorage.getItem(KEY_FORMATEURS) || '{}') }
  catch { return {} }
}

export function getPortailFormateur(formateurId) {
  const all = getPortailsFormateurs()
  if (!all[formateurId]) {
    all[formateurId] = { token: genToken(), locked: false }
    localStorage.setItem(KEY_FORMATEURS, JSON.stringify(all))
  }
  return all[formateurId]
}

export function getLienPortailFormateur(formateurId) {
  const { token } = getPortailFormateur(formateurId)
  const base = window.location.origin + window.location.pathname
  return `${base}#portail-formateur/${formateurId}/${token}`
}

export function verifyPortailFormateur(formateurId, token) {
  const p = getPortailFormateur(formateurId)
  return p.token === token
}

export function setFormateurLocked(formateurId, locked) {
  const all = getPortailsFormateurs()
  all[formateurId] = { ...getPortailFormateur(formateurId), locked }
  localStorage.setItem(KEY_FORMATEURS, JSON.stringify(all))
}

export function isFormateurLocked(formateurId) {
  return getPortailFormateur(formateurId).locked === true
}

export function regenererTokenFormateur(formateurId) {
  const all = getPortailsFormateurs()
  all[formateurId] = { ...getPortailFormateur(formateurId), token: genToken() }
  localStorage.setItem(KEY_FORMATEURS, JSON.stringify(all))
  return all[formateurId].token
}

// ---- Stagiaires ----

function getPortailsStagiaires() {
  try { return JSON.parse(localStorage.getItem(KEY_STAGIAIRES) || '{}') }
  catch { return {} }
}

export function getPortailStagiaire(stagiaireId) {
  const all = getPortailsStagiaires()
  if (!all[stagiaireId]) {
    all[stagiaireId] = { token: genToken() }
    localStorage.setItem(KEY_STAGIAIRES, JSON.stringify(all))
  }
  return all[stagiaireId]
}

export function getLienPortailStagiaire(stagiaireId) {
  const { token } = getPortailStagiaire(stagiaireId)
  const base = window.location.origin + window.location.pathname
  return `${base}#portail-apprenant/${stagiaireId}/${token}`
}

export function verifyPortailStagiaire(stagiaireId, token) {
  const p = getPortailStagiaire(stagiaireId)
  return p.token === token
}

export function regenererTokenStagiaire(stagiaireId) {
  const all = getPortailsStagiaires()
  all[stagiaireId] = { ...getPortailStagiaire(stagiaireId), token: genToken() }
  localStorage.setItem(KEY_STAGIAIRES, JSON.stringify(all))
  return all[stagiaireId].token
}
