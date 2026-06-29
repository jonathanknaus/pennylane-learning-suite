const KEY_BESOIN = 'pls_questionnaire_besoin'
const KEY_TOKENS = 'pls_besoin_tokens'
const KEY_QUESTIONS = 'pls_qb_questions'

export const DEFAULT_QUESTIONS_QB = [
  {
    id: 'contexte',
    label: 'Contexte de la formation',
    question: 'Quelle est la situation qui motive cette demande de formation ?',
    type: 'textarea',
    placeholder: 'Décrivez le contexte : changements récents, difficultés rencontrées, évolutions à venir…',
    required: true,
  },
  {
    id: 'objectifs',
    label: 'Objectifs visés',
    question: 'Quels sont les principaux objectifs que vous souhaitez atteindre ?',
    type: 'textarea',
    placeholder: 'Ex. : maîtriser la saisie comptable, comprendre la TVA, automatiser les exports…',
    required: true,
  },
  {
    id: 'public',
    label: 'Public concerné',
    question: 'Qui sera formé ? Quel est leur niveau actuel sur le sujet ?',
    type: 'textarea',
    placeholder: 'Ex. : 4 collaborateurs, débutants sur Pennylane, utilisateurs depuis 6 mois…',
    required: true,
  },
  {
    id: 'niveau_depart',
    label: 'Niveau de départ',
    question: 'Comment évaluez-vous le niveau actuel de vos équipes sur les sujets à former ?',
    type: 'radio',
    options: ['Débutant — premier contact avec le sujet', 'Intermédiaire — notions de base acquises', 'Avancé — pratique régulière, perfectionnement souhaité'],
    required: true,
  },
  {
    id: 'contraintes',
    label: 'Contraintes pratiques',
    question: 'Y a-t-il des contraintes de planning, de disponibilité ou d\'organisation à prendre en compte ?',
    type: 'textarea',
    placeholder: 'Ex. : clôture comptable en mars, télétravail les lundis, 1h max par session…',
    required: false,
  },
  {
    id: 'attentes_specifiques',
    label: 'Attentes spécifiques',
    question: 'Avez-vous des attentes particulières sur le déroulement ou le format de la formation ?',
    type: 'textarea',
    placeholder: 'Ex. : exercices pratiques sur vos données réelles, support PDF, suivi post-formation…',
    required: false,
  },
  {
    id: 'indicateurs_succes',
    label: 'Indicateurs de succès',
    question: 'Comment saurez-vous que la formation a atteint ses objectifs ?',
    type: 'textarea',
    placeholder: 'Ex. : les collaborateurs gèrent seuls la TVA, gain de temps de X heures par semaine…',
    required: false,
  },
]

export function getQuestionsQB() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY_QUESTIONS) || 'null')
    return stored || DEFAULT_QUESTIONS_QB
  } catch { return DEFAULT_QUESTIONS_QB }
}

export function saveQuestionsQB(questions) {
  localStorage.setItem(KEY_QUESTIONS, JSON.stringify(questions))
}

export function resetQuestionsQB() {
  localStorage.removeItem(KEY_QUESTIONS)
}

// ── Codes d'accès portail cabinet ────────────────────────────────────────────
const KEY_CABINET_CODES = 'pls_cabinet_codes'

function genCodeCabinet() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export function getCodeCabinet(email) {
  if (!email) return null
  try {
    const codes = JSON.parse(localStorage.getItem(KEY_CABINET_CODES) || '{}')
    const key = email.toLowerCase()
    if (!codes[key]) {
      codes[key] = genCodeCabinet()
      localStorage.setItem(KEY_CABINET_CODES, JSON.stringify(codes))
    }
    return codes[key]
  } catch { return null }
}

export function verifyCodeCabinet(email, code) {
  if (!email || !code) return false
  try {
    const codes = JSON.parse(localStorage.getItem(KEY_CABINET_CODES) || '{}')
    return codes[email.toLowerCase()] === code.toUpperCase().trim()
  } catch { return false }
}

export function regenererCodeCabinet(email) {
  if (!email) return null
  try {
    const codes = JSON.parse(localStorage.getItem(KEY_CABINET_CODES) || '{}')
    codes[email.toLowerCase()] = genCodeCabinet()
    localStorage.setItem(KEY_CABINET_CODES, JSON.stringify(codes))
    return codes[email.toLowerCase()]
  } catch { return null }
}

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
