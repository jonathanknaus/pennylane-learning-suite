// Bilan qualité par session — champs de synthèse saisis manuellement par le
// formateur/gestionnaire, en complément des indicateurs calculés automatiquement
// (satisfaction, incidents, résultats d'évaluation) dans BilanAnnuel.jsx.

const KEY = 'pls_bilan_session'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

function save(all) {
  localStorage.setItem(KEY, JSON.stringify(all))
}

const CHAMPS_DEFAUT = {
  points_positifs: '',
  points_ameliorer: '',
  besoins_complementaires: '',
  precisions_satisfaction: '',
  precisions_evaluation: '',
  actions_amelioration: '',
  delai_action: '',
}

export function getBilanSession(sessionId) {
  return { ...CHAMPS_DEFAUT, ...(load()[sessionId] || {}) }
}

export function saveBilanSession(sessionId, champs) {
  const all = load()
  all[sessionId] = { ...getBilanSession(sessionId), ...champs, updatedAt: new Date().toISOString() }
  save(all)
  return all[sessionId]
}
