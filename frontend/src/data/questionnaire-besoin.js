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
    // Demande de Sarah (2026-10-05). Sert aussi de trace pour l'accessibilité
    // et le référent handicap (clause 10 de la convention).
    //
    // Volontairement NON obligatoire : une situation de handicap relève de la
    // donnée de santé, donc sensible au sens du RGPD. On invite à la signaler
    // pour pouvoir adapter, on ne contraint personne à la déclarer.
    id: 'prerequis_handicap',
    label: 'Prérequis et adaptations',
    question: 'Existe-t-il des prérequis spécifiques ou des situations de handicap dont nous devrions avoir connaissance pour adapter nos modalités ?',
    type: 'textarea',
    placeholder: 'Ex. : besoin de supports en gros caractères, salle accessible, rythme adapté, prérequis technique sur un outil…',
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
    if (!Array.isArray(stored) || stored.length === 0) return DEFAULT_QUESTIONS_QB

    // Une liste personnalisée masquait les nouvelles questions par défaut :
    // elles n'apparaissaient qu'après réinitialisation, donc en perdant les
    // personnalisations. On complète désormais la liste stockée avec les
    // questions par défaut absentes, en respectant leur position d'origine.
    const connues = new Set(stored.map(q => q?.id).filter(Boolean))
    const manquantes = DEFAULT_QUESTIONS_QB.filter(q => !connues.has(q.id))
    if (manquantes.length === 0) return stored

    const fusion = [...stored]
    for (const q of manquantes) {
      const position = DEFAULT_QUESTIONS_QB.findIndex(d => d.id === q.id)
      const index = Math.min(position, fusion.length)
      fusion.splice(index, 0, q)
    }
    return fusion
  } catch { return DEFAULT_QUESTIONS_QB }
}

export function saveQuestionsQB(questions) {
  localStorage.setItem(KEY_QUESTIONS, JSON.stringify(questions))
}

export function resetQuestionsQB() {
  localStorage.removeItem(KEY_QUESTIONS)
}

// ── Accès portail cabinet ────────────────────────────────────────────────────
// Les codes à 6 caractères ont été retirés le 2026-10-05. Ils étaient stockés en
// localStorage, donc n'existaient que dans le navigateur qui les avait générés :
// un cabinet ne pouvait jamais s'en servir. L'accès passe désormais par une
// autorisation en base partagée et une connexion par lien email
// (voir cabinets-firebase.js et PortailCabinet.jsx).

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
