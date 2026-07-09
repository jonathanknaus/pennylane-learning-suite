const STORAGE_KEY = 'pls_workflows'
const MIGRATION_FLAG_KEY = 'pls_workflows_migrated_v2'

export const WORKFLOW_PHASES = [
  {
    id: 'phase0_reception',
    numero: 0,
    label: 'Réception de la demande',
    description: 'Canal Salesforce ou Slack #afs-demande-formation. Toujours interne (CSM/BDR/AM), jamais direct client.',
    icon: '📥',
    substeps: [
      { id: 'p0_enregistrement_sf', label: 'Enregistrement de la demande sur SF', type: 'checkbox' },
      { id: 'p0_attribution_formation', label: 'Attribution de la formation', type: 'checkbox' },
      { id: 'p0_confirmation_formateur', label: 'Confirmation de prise en charge par le formateur', type: 'checkbox' },
    ],
  },
  {
    id: 'phase1_prise_contact',
    numero: 1,
    label: 'Prise de contact',
    description: 'Premier contact avec le client et recueil du besoin.',
    icon: '📞',
    substeps: [
      { id: 'p1_mail_prise_contact', label: 'Envoi mail de prise de contact + formulaire', type: 'email', templateKey: 'questionnaire_besoins' },
      { id: 'p1_log_modjo', label: 'Log de l’échange sur Modjo / Ringover', type: 'checkbox' },
      { id: 'p1_questionnaire_besoin', label: 'Envoi du questionnaire de recueil du besoin', type: 'email', templateKey: 'questionnaire_besoins' },
      { id: 'p1_relances', label: 'Relances si sans réponse (3 max)', type: 'relance', maxRelances: 3 },
    ],
  },
  {
    id: 'phase2_rdv_cadrage',
    numero: 2,
    label: 'RDV de cadrage',
    description: '5 questions obligatoires à valider avec le client.',
    icon: '🗒️',
    substeps: [
      { id: 'p2_formulaire_rempli', label: 'Le formulaire a-t-il été rempli ?', type: 'checkbox' },
      { id: 'p2_nb_participants', label: 'Nombre de participants ?', type: 'checkbox' },
      { id: 'p2_date_souhaitee', label: 'Date souhaitée pour la formation ?', type: 'checkbox' },
      { id: 'p2_opco', label: 'OPCO ou non ?', type: 'checkbox' },
      { id: 'p2_formule', label: 'Formule de formation (présentiel/visio + contenu) ?', type: 'checkbox' },
    ],
  },
  {
    id: 'phase3_post_rdv',
    numero: 3,
    label: 'Post RDV',
    description: 'Compte-rendu du RDV de cadrage et mise à jour du dossier.',
    icon: '📤',
    substeps: [
      { id: 'p3_rdv_modjo', label: 'RDV enregistré sur Modjo', type: 'checkbox' },
      { id: 'p3_mail_recap', label: 'Envoi du mail récap du RDV de cadrage', type: 'email', templateKey: 'collecte_dates' },
      { id: 'p3_maj_sf', label: 'Mise à jour des informations sur SF', type: 'checkbox' },
      { id: 'p3_relances', label: 'Relances si sans réponse (3 max)', type: 'relance', maxRelances: 3 },
    ],
  },
  {
    id: 'phase4_mise_en_place',
    numero: 4,
    label: 'Mise en place de la formation',
    description: 'Devis, convention, convocations — jusqu’à J-15.',
    icon: '🛠️',
    substeps: [
      { id: 'p4_fiche_produit', label: 'Création de la fiche produit', type: 'checkbox' },
      { id: 'p4_devis', label: 'Devis établi sur Smart OF', type: 'email', templateKey: 'devis' },
      { id: 'p4_devis_signe', label: 'Réception du devis signé', type: 'checkbox' },
      { id: 'p4_liste_apprenants', label: 'Vérification de la liste des apprenants', type: 'checkbox' },
      { id: 'p4_statut_training', label: 'Statut SF passé à "Training"', type: 'checkbox' },
      { id: 'p4_transport_hotel', label: 'Réservation transport / hôtel', type: 'checkbox', conditional: 'presentiel' },
      { id: 'p4_otr', label: 'Création de l’OTR sur SF', type: 'checkbox' },
      { id: 'p4_convention', label: 'Convention envoyée au cabinet', type: 'email', templateKey: 'convention' },
      { id: 'p4_convocation', label: 'Convocations envoyées (J-15 minimum)', type: 'email', templateKey: 'convocation' },
    ],
  },
  {
    id: 'phase5_jour_formation',
    numero: 5,
    label: 'Jour de la formation',
    description: 'Émargement, présences, quizz pré/post-formation.',
    icon: '🎓',
    substeps: [
      { id: 'p5_lien_veille', label: 'Envoi du lien Google (la veille)', type: 'checkbox' },
      { id: 'p5_emargement', label: 'Émargement + rapport formateur', type: 'email', templateKey: 'emargement' },
      { id: 'p5_presences', label: 'Vérification des présences', type: 'checkbox' },
      { id: 'p5_quizz_initial', label: 'Quizz initial (positionnement)', type: 'quizz', quizzType: 'pre' },
      { id: 'p5_quizz_final', label: 'Quizz final (évaluation)', type: 'quizz', quizzType: 'post' },
      { id: 'p5_lien_csat', label: 'Envoi du lien CSAT', type: 'checkbox' },
    ],
  },
  {
    id: 'phase6_post_formation',
    numero: 6,
    label: 'Post-formation & clôture',
    description: 'Support, certificats, facturation et clôture du dossier.',
    icon: '🏁',
    substeps: [
      { id: 'p6_support_help_center', label: 'Envoi du support + lien Help Center', type: 'checkbox' },
      { id: 'p6_confirmation_cloture', label: 'Confirmation de clôture du dossier', type: 'checkbox' },
      { id: 'p6_statut_done', label: 'Statut SF passé à "Done"', type: 'checkbox' },
      { id: 'p6_certificat', label: 'Certificat de réalisation (SmartOF)', type: 'email', templateKey: 'certificat' },
      { id: 'p6_attestation', label: 'Attestation individuelle (SmartOF)', type: 'email', templateKey: 'attestation' },
      { id: 'p6_facturation', label: 'Facturation émise sur Pennylane', type: 'checkbox' },
      { id: 'p6_satisfaction_froid', label: 'Questionnaire satisfaction à froid (J+30)', type: 'checkbox' },
    ],
  },
]

export const ALL_SUBSTEPS = WORKFLOW_PHASES.flatMap(phase =>
  phase.substeps.map(s => ({ ...s, phaseId: phase.id }))
)

const LEGACY_STEP_MAPPING = {
  questionnaire_besoins: 'p1_questionnaire_besoin',
  collecte_dates: 'p3_mail_recap',
  devis: 'p4_devis',
  convention: 'p4_convention',
  convocation: 'p4_convocation',
  emargement: 'p5_emargement',
  quizz_initial: 'p5_quizz_initial',
  quizz_final: 'p5_quizz_final',
  certificat: 'p6_certificat',
  attestation: 'p6_attestation',
}

function migrateLegacyWorkflows() {
  try {
    if (localStorage.getItem(MIGRATION_FLAG_KEY)) return
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    for (const sessionId of Object.keys(all)) {
      const entries = all[sessionId]
      for (const [legacyId, newId] of Object.entries(LEGACY_STEP_MAPPING)) {
        if (entries[legacyId] && !entries[newId]) {
          entries[newId] = { ...entries[legacyId] }
        }
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
    localStorage.setItem(MIGRATION_FLAG_KEY, '1')
  } catch {}
}

export function getWorkflowsForSession(sessionId) {
  migrateLegacyWorkflows()
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
      ...(all[sessionId][stepId] || {}),
      status,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {}
}

export function addRelance(sessionId, substepId) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    if (!all[sessionId]) all[sessionId] = {}
    const entry = all[sessionId][substepId] || { status: 'pending', relances: { count: 0, dates: [], resolved: false } }
    const relances = entry.relances || { count: 0, dates: [], resolved: false }
    if (relances.count >= 3) return
    relances.count += 1
    relances.dates = [...relances.dates, new Date().toISOString()]
    all[sessionId][substepId] = { ...entry, relances, updatedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {}
}

export function resolveRelance(sessionId, substepId) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    if (!all[sessionId]?.[substepId]) return
    const entry = all[sessionId][substepId]
    const relances = { ...(entry.relances || { count: 0, dates: [] }), resolved: true }
    all[sessionId][substepId] = { ...entry, status: 'done', relances, updatedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {}
}

function isSubstepApplicable(substep, session) {
  if (!substep.conditional) return true
  if (substep.conditional === 'presentiel') return session?.modalite === 'presentiel'
  return true
}

export function isSubstepDone(substep, statuts, session, inscriptions, getResultat) {
  if (substep.type === 'quizz') {
    const nbInscrits = inscriptions?.length || 0
    if (nbInscrits === 0) return false
    const nbCompletes = inscriptions.filter(ins => getResultat(session.id, ins.stagiaireId, substep.quizzType)).length
    return nbCompletes === nbInscrits
  }
  return statuts[substep.id]?.status === 'done'
}

export function getPhaseStatus(phase, statuts, session, inscriptions, getResultat) {
  const applicable = phase.substeps.filter(s => isSubstepApplicable(s, session))
  if (applicable.length === 0) return 'not_started'

  const blocked = applicable.some(s => {
    if (s.type !== 'relance') return false
    const relances = statuts[s.id]?.relances
    return relances && relances.count >= (s.maxRelances || 3) && !relances.resolved
  })
  if (blocked) return 'blocked'

  const doneFlags = applicable.map(s => {
    if (s.type === 'relance') return statuts[s.id]?.relances?.resolved || statuts[s.id]?.status === 'done'
    return isSubstepDone(s, statuts, session, inscriptions, getResultat)
  })

  if (doneFlags.every(Boolean)) return 'done'
  if (doneFlags.some(Boolean)) return 'in_progress'
  return 'not_started'
}

export const PHASE_STATUS_LABELS = {
  not_started: 'Pas commencée',
  in_progress: 'En cours',
  blocked: 'Bloquée',
  done: 'Terminée',
}
