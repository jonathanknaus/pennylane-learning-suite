// Émargement électronique — signature horodatée par module, par apprenant et par formateur.
// Le PDF papier (documents/Emargement.jsx) reste une solution de secours en cas de panne réseau.

const KEY = 'pls_emargements'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

function save(all) {
  localStorage.setItem(KEY, JSON.stringify(all))
}

export function getEmargementsSession(sessionId) {
  return load()[sessionId] || {}
}

export function getSignaturesModule(sessionId, moduleId) {
  return getEmargementsSession(sessionId)[moduleId] || {}
}

function cle(personType, personId) {
  return `${personType}_${personId}`
}

export function signerModule(sessionId, moduleId, personType, personId) {
  const all = load()
  if (!all[sessionId]) all[sessionId] = {}
  if (!all[sessionId][moduleId]) all[sessionId][moduleId] = {}
  all[sessionId][moduleId][cle(personType, personId)] = {
    personType, personId, signedAt: new Date().toISOString(),
  }
  save(all)
}

export function estSigne(sessionId, moduleId, personType, personId) {
  return !!getSignaturesModule(sessionId, moduleId)[cle(personType, personId)]
}

export function getSignatureDate(sessionId, moduleId, personType, personId) {
  return getSignaturesModule(sessionId, moduleId)[cle(personType, personId)]?.signedAt || null
}

// Complétude d'un module : tous les participants présents + le(s) formateur(s) responsable/appui ont signé.
export function isModuleComplet(sessionId, moduleId, participantIds, formateurIds) {
  const sigs = getSignaturesModule(sessionId, moduleId)
  const participantsOk = participantIds.every(id => sigs[cle('apprenant', id)])
  const formateursOk = formateurIds.every(id => sigs[cle('formateur', id)])
  return participantsOk && formateursOk
}
