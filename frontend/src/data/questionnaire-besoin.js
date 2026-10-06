const KEY_BESOIN = 'pls_questionnaire_besoin'
const KEY_TOKENS = 'pls_besoin_tokens'
const KEY_QUESTIONS = 'pls_qb_questions'

// Questions alignées sur le formulaire Google « Analyse des Besoins en Formation
// (maj 08/26) — Cabinets d'Expertise Comptable (Processus Qualiopi) », dans son
// ordre, à l'issue du point Optimisation Questionnaire de besoins du 2026-10-05.
//
// Trois questions du formulaire ne figurent PAS ici, et c'est voulu : le
// simulateur les pose déjà dans le même écran. Les redemander reviendrait à
// interroger deux fois sur la même chose dans un formulaire unique.
//   · « Nombre de participants prévus »      → simulateur, `simu_participants`
//   · « Présentiel / distanciel »            → simulateur, `simu_modalite`
//   · « Thématiques souhaitées »             → simulateur, `simu_modules`
//
// Deux écarts assumés avec le formulaire :
//   · La question sur le handicap y est OBLIGATOIRE. Ici elle ne l'est pas :
//     voir le commentaire qui la précède.
//   · Le formulaire écrit « À la fin de la journée… ». Les formats AFS vont de
//     la demi-heure à plusieurs journées, donc « À la fin de la formation… ».
export const DEFAULT_QUESTIONS_QB = [
  {
    id: 'contexte',
    label: 'Contexte et enjeux',
    question: 'Quel est l\'élément déclencheur de cette demande de formation ?',
    type: 'textarea',
    placeholder: 'Décrivez le contexte : changements récents, difficultés rencontrées, évolutions à venir…',
    required: true,
  },
  {
    id: 'enjeux',
    label: 'Enjeux de la structure',
    question: 'Quels sont les enjeux principaux pour votre structure actuellement ?',
    type: 'textarea',
    aide: 'Ex. : veille active sur les outils numériques et les évolutions de la facturation électronique, optimiser ses processus internes pour gagner en efficacité…',
    placeholder: 'Vos enjeux prioritaires des prochains mois…',
    required: false,
  },
  {
    // Conserve l'id historique `public` : une liste de questions personnalisée
    // ou des réponses déjà saisies continuent de s'y rattacher. Seuls le
    // libellé et le type changent — le nombre de participants venant désormais
    // du simulateur, il ne restait que les postes à demander, et les demander
    // en cases à cocher les rend exploitables au lieu d'un texte à relire.
    id: 'public',
    label: 'Public visé',
    question: 'Quels sont les postes occupés par les participants ?',
    type: 'checkbox',
    options: ['Collaborateurs', 'Chef de mission', 'Expert-comptable'],
    // Les postes dépendent de QUI est formé : « Chef de mission » ne veut rien
    // dire pour la clientèle d'un cabinet. Sans ça, un cabinet venu former ses
    // clients devait cocher des postes qui ne les décrivent pas.
    optionsParPublic: {
      clients: ['Dirigeant ou gérant', 'Comptable interne', 'Assistant administratif', 'Responsable administratif et financier'],
    },
    required: true,
  },
  {
    // Demande de Sarah (2026-10-05), reprise du formulaire Google où elle est
    // obligatoire. Trace d'accessibilité et point d'entrée du référent handicap
    // (clause 10 de la convention).
    //
    // OBLIGATOIRE, et c'est une obligation Qualiopi : le prestataire doit pouvoir
    // prouver qu'il a posé la question et qu'il en a tiré les conséquences. Ce
    // qui est exigé, c'est une RÉPONSE — « non » en est une. On ne contraint donc
    // personne à déclarer un handicap ; on s'interdit de ne pas avoir demandé.
    //
    // La réponse est enregistrée et figure dans la synthèse PDF : sans trace,
    // l'obligation n'est pas tenue. La finalité est annoncée au cabinet
    // (champ `aide`) — on ne collecte rien sans dire à quoi ça sert.
    id: 'prerequis_handicap',
    label: 'Prérequis et adaptations',
    question: 'Existe-t-il des prérequis spécifiques ou des situations de handicap dont nous devrions avoir connaissance pour adapter nos modalités ?',
    type: 'textarea',
    aide: 'Cette information sert uniquement à adapter les modalités de la formation et n\'est transmise qu\'à notre référent handicap. Si aucun aménagement n\'est nécessaire, indiquez simplement « non ».',
    placeholder: 'Ex. : supports en gros caractères, salle accessible, rythme adapté, prérequis technique sur un outil… ou « non »',
    required: true,
  },
  {
    id: 'objectifs',
    label: 'Objectifs opérationnels',
    question: 'Quelles compétences précises souhaitez-vous que les apprenants maîtrisent à l\'issue de la formation ?',
    type: 'textarea',
    placeholder: 'Ex. : maîtriser la saisie comptable, comprendre la TVA, automatiser les exports…',
    required: true,
  },
  {
    // Formulation imposée par Qualiopi : un objectif doit être évaluable. La
    // phrase à compléter y conduit mieux qu'une consigne abstraite.
    id: 'objectifs_operationnels',
    label: 'Formulation opérationnelle',
    question: '« À la fin de la formation, les stagiaires seront capables de… » : comment compléteriez-vous cette phrase ?',
    type: 'textarea',
    placeholder: 'Ex. : …de produire seuls une déclaration de TVA CA3 et d\'en contrôler le cadrage.',
    required: true,
  },
  {
    id: 'attentes_specifiques',
    label: 'Attentes spécifiques',
    question: 'Avez-vous des besoins ou attentes complémentaires qui n\'ont pas été abordés ci-dessus ?',
    type: 'textarea',
    placeholder: 'Ex. : exercices pratiques sur vos données réelles, support PDF, suivi post-formation…',
    required: false,
  },
  {
    id: 'contraintes',
    label: 'Contraintes de calendrier',
    question: 'Quelles sont vos contraintes de calendrier (dates idéales, urgence) ?',
    type: 'textarea',
    placeholder: 'Ex. : clôture comptable en mars, télétravail les lundis, 1h max par session…',
    required: false,
  },
  {
    // Le délai de 15 jours n'est pas une formalité : passé ce point, la prise en
    // charge peut être refusée alors que la session est déjà calée. La question
    // est posée tôt pour que le cabinet le sache avant de fixer une date.
    id: 'opco',
    label: 'Prise en charge OPCO',
    question: 'Souhaitez-vous solliciter une prise en charge financière par votre OPCO ?',
    type: 'radio',
    options: ['Oui', 'Non'],
    aide: 'La demande doit être déposée auprès de votre OPCO au moins 15 jours avant le début de la formation, avec les pièces qu\'il réclame. En cas de doute, consultez le site de votre organisme financeur (OPCO, FAF, FIFPL…).',
    required: true,
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

// Questions retirées du produit, à écarter des listes personnalisées déjà
// enregistrées. Sans ce filtre, `getQuestionsQB()` les conserverait — il ne
// supprime jamais ce qui est en stock — et la question réapparaîtrait à côté de
// ce qui la remplace.
//
// `niveau_depart` demandait UN niveau pour toute la formation. Remplacée le
// 2026-10-06 par un niveau PAR MODULE (ModulesRetenus) : un cabinet est
// couramment expert en tenue et débutant en TVA, et un niveau moyenné ne dit
// rien au formateur.
export const QUESTIONS_RETIREES = ['niveau_depart']

/**
 * Options à présenter pour une question, selon le public visé.
 * Hors espace cabinet (questionnaire par lien de session), `publicCible` est
 * absent : on retombe sur les options par défaut, celles du cabinet.
 */
export function optionsQuestion(q, publicCible) {
  return q?.optionsParPublic?.[publicCible] || q?.options || []
}

/**
 * Questions à afficher ET à valider. Une question masquée ne doit pas bloquer
 * l'envoi au titre de son caractère obligatoire — sinon le formulaire refuse de
 * partir pour un champ que personne ne voit.
 */
export function questionsVisibles(questions, publicCible) {
  return (questions || []).filter(q => !q.siPublic || !publicCible || q.siPublic === publicCible)
}

export function getQuestionsQB() {
  try {
    const brut = JSON.parse(localStorage.getItem(KEY_QUESTIONS) || 'null')
    if (!Array.isArray(brut) || brut.length === 0) return DEFAULT_QUESTIONS_QB
    const stored = brut.filter(q => !QUESTIONS_RETIREES.includes(q?.id))
    if (stored.length === 0) return DEFAULT_QUESTIONS_QB

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
