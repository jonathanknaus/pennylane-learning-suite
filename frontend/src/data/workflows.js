const STORAGE_KEY = 'pls_workflows'

export const WORKFLOW_STEPS = [
  {
    id: 'questionnaire_besoins',
    groupe: 'client',
    label: 'Questionnaire des besoins',
    description: 'Envoi auto du questionnaire initial au client pour qualifier la demande.',
    icon: '📋',
    awsRequired: true,
  },
  {
    id: 'collecte_dates',
    groupe: 'client',
    label: 'Collecte date & apprenants',
    description: 'Demande de confirmation de la date prévisionnelle et de la liste des apprenants.',
    icon: '📅',
    awsRequired: true,
  },
  {
    id: 'devis',
    groupe: 'client',
    label: 'Devis + relances',
    description: 'Envoi du devis depuis la session, relances auto à J+3 et indicateur de signature.',
    icon: '📄',
    awsRequired: true,
  },
  {
    id: 'convention',
    groupe: 'client',
    label: 'Convention + validation Sarah',
    description: 'Envoi de la convention et du programme pour validation interne (Sarah Briden).',
    icon: '✍️',
    awsRequired: true,
  },
  {
    id: 'convocation',
    groupe: 'apprenants',
    label: 'Convocation + lien Meet',
    description: 'Envoi de la convocation à chaque apprenant avec le lien Meet ou lieu présentiel.',
    icon: '📨',
    awsRequired: true,
  },
  {
    id: 'emargement',
    groupe: 'apprenants',
    label: 'Émargement + rapport formateur',
    description: 'Lancement du recueil d\'émargement et du rapport de fin de session.',
    icon: '📝',
    awsRequired: true,
  },
  {
    id: 'quizz_initial',
    groupe: 'apprenants',
    label: 'Quizz initial',
    description: 'Envoi du lien de positionnement pré-formation à tous les apprenants.',
    icon: '🧪',
    awsRequired: true,
  },
  {
    id: 'quizz_final',
    groupe: 'apprenants',
    label: 'Quizz final',
    description: 'Envoi du lien d\'évaluation post-formation à tous les apprenants.',
    icon: '✅',
    awsRequired: true,
  },
  {
    id: 'certificat',
    groupe: 'client',
    label: 'Certificat de réalisation',
    description: 'Envoi auto du certificat au client 24h après la fin de la formation.',
    icon: '🏆',
    awsRequired: true,
  },
  {
    id: 'attestation',
    groupe: 'apprenants',
    label: 'Attestation de formation',
    description: 'Envoi de l\'attestation individuelle à chaque apprenant (mail + extranet).',
    icon: '📜',
    awsRequired: true,
  },
]

export function getWorkflowsForSession(sessionId) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return all[sessionId] || {}
  } catch {
    return {}
  }
}

export function setWorkflowStep(sessionId, stepId, status) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    if (!all[sessionId]) all[sessionId] = {}
    all[sessionId][stepId] = {
      status,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {}
}
