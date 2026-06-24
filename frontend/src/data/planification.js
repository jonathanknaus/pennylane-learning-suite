// Planification des envois automatiques pour une session
// Storage key : pls_planification_{sessionId}

const KEY_PREFIX = 'pls_planification_'

export const DEFAULT_PLANIFICATION = {
  // Quizz pré-formation : envoyé au démarrage de la session (J0 à l'heure H)
  quizz_pre: {
    actif: true,
    delai_type: 'debut_session',  // 'debut_session' | 'manuel'
    delai_minutes: 0,             // 0 = au démarrage
    objet_mail: 'Questionnaire pré-formation — {titre}',
    corps_mail: `Bonjour {prenom},

Bienvenue dans votre formation "{titre}" !

Avant de commencer, merci de répondre à ce court questionnaire pré-formation (5 min) :
👉 {lien}

Ce questionnaire nous permet d'adapter la formation à votre niveau.

Bonne formation !
L'équipe AFS Pennylane`,
  },

  // Évaluation post-formation + satisfaction à chaud : envoyé en fin de session
  eval_post: {
    actif: true,
    delai_type: 'fin_session',    // 'fin_session' | 'manuel'
    delai_minutes: 0,
    rappels: [1, 2, 3],           // J+1, J+2, J+3 si non répondu
    objet_mail: 'Évaluation de fin de formation — {titre}',
    corps_mail: `Bonjour {prenom},

Votre formation "{titre}" vient de se terminer.

Merci de prendre 5 minutes pour compléter votre évaluation (questionnaire post-formation + enquête de satisfaction) :
👉 {lien}

Vos retours sont précieux et contribuent à l'amélioration continue de nos formations (Qualiopi).

Merci d'avance,
L'équipe AFS Pennylane`,
    objet_rappel: 'Rappel — Évaluation en attente : {titre}',
    corps_rappel: `Bonjour {prenom},

Nous n'avons pas encore reçu votre évaluation pour la formation "{titre}".

Il vous reste quelques minutes pour y répondre :
👉 {lien}

Merci pour votre retour !
L'équipe AFS Pennylane`,
  },

  // Satisfaction à froid : 30 jours après la fin de la session
  satisfaction_froid: {
    actif: true,
    delai_jours: 30,              // jours après fin de session
    objet_mail: 'Enquête de satisfaction à froid — {titre}',
    corps_mail: `Bonjour {prenom},

Il y a maintenant {delai_jours} jours que vous avez suivi la formation "{titre}".

Nous aimerions connaître l'impact de cette formation sur votre pratique professionnelle. Cela ne prend que 2 minutes :
👉 {lien}

Votre retour nous aide à améliorer nos formations.

Merci,
L'équipe AFS Pennylane`,
  },
}

export function getPlanification(sessionId) {
  try {
    const stored = localStorage.getItem(KEY_PREFIX + sessionId)
    if (!stored) return JSON.parse(JSON.stringify(DEFAULT_PLANIFICATION))
    // Fusion avec les défauts pour éviter les clés manquantes après une MAJ
    const parsed = JSON.parse(stored)
    return {
      quizz_pre: { ...DEFAULT_PLANIFICATION.quizz_pre, ...parsed.quizz_pre },
      eval_post: { ...DEFAULT_PLANIFICATION.eval_post, ...parsed.eval_post },
      satisfaction_froid: { ...DEFAULT_PLANIFICATION.satisfaction_froid, ...parsed.satisfaction_froid },
    }
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_PLANIFICATION))
  }
}

export function savePlanification(sessionId, planification) {
  localStorage.setItem(KEY_PREFIX + sessionId, JSON.stringify(planification))
}

export function getDateEnvoi(session, type) {
  if (!session.date) return null
  const base = new Date(session.date + 'T' + (session.heure || '09:00') + ':00')

  if (type === 'quizz_pre') return base

  if (type === 'eval_post') {
    const plan = getPlanification(session.id)
    const dureeH = session.format ? parseDureeFormat(session.format) : 0
    const fin = new Date(base.getTime() + dureeH * 60 * 60 * 1000)
    return fin
  }

  if (type === 'satisfaction_froid') {
    const plan = getPlanification(session.id)
    const jours = plan.satisfaction_froid.delai_jours || 30
    return new Date(base.getTime() + jours * 24 * 60 * 60 * 1000)
  }

  return null
}

function parseDureeFormat(formatId) {
  // Extrait les heures depuis l'id format (ex: "2h" -> 2, "demi-journee" -> 3.5, "journee" -> 7)
  if (!formatId) return 0
  const m = formatId.match(/(\d+)h/)
  if (m) return parseInt(m[1])
  if (formatId.includes('demi')) return 3.5
  if (formatId.includes('journee') || formatId.includes('jour')) return 7
  return 0
}
