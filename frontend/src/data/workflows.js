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
      { id: 'p0_enregistrement_sf', label: 'Enregistrement de la demande sur Salesforce (si nécessaire)', type: 'checkbox' },
      { id: 'p0_attribution_formation', label: 'Attribution de la formation au formateur (mail automatique SF)', type: 'checkbox' },
      { id: 'p0_confirmation_formateur', label: 'Confirmation de prise en charge par le formateur (auprès du PrM/CSM/AM/KAM/FE/support)', type: 'checkbox' },
      { id: 'p0_note_lead', label: 'La personne qui prend contact avec le client prend le lead sur l’ensemble du dossier jusqu’à la clôture de la formation.', type: 'info' },
    ],
  },
  {
    id: 'phase1_prise_contact',
    numero: 1,
    label: 'Prise de contact',
    description: 'Premier contact avec le client et recueil du besoin.',
    icon: '📞',
    substeps: [
      { id: 'p1_prise_contact', label: 'Prise de contact avec le client par téléphone ou par mail', type: 'checkbox' },
      { id: 'p1_mail_prise_contact', label: 'Envoi du mail de prise de contact + formulaire', type: 'email', templateKey: 'questionnaire_besoins' },
      { id: 'p1_tache_relance_sf', label: 'Création d’une tâche de relance sur Salesforce', type: 'checkbox' },
      { id: 'p1_log_modjo', label: 'Log de l’échange sur Modjo / Ringover (impératif)', type: 'checkbox' },
      { id: 'p1_questionnaire_besoin', label: 'Envoi du questionnaire de recueil du besoin au cabinet', type: 'email', templateKey: 'questionnaire_besoins' },
      { id: 'p1_info_sarah', label: 'Information de Sarah à réception du retour du questionnaire', type: 'checkbox' },
      { id: 'p1_relances', label: 'Relances si sans réponse (3 max, délai 1-2 jours entre chaque)', type: 'relance', maxRelances: 3 },
      { id: 'p1_cancel_note', label: 'Si aucune réponse après 3 relances : passer la fiche en statut Cancel sur Salesforce et envoyer un Chatter à la personne ayant fait la demande.', type: 'info' },
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
      { id: 'p2_date_souhaitee', label: 'Date souhaitée pour la formation ? (modifiable si besoin)', type: 'checkbox' },
      { id: 'p2_opco', label: 'OPCO ou non ?', type: 'checkbox' },
      { id: 'p2_formule', label: 'Formule de formation (présentiel/visio + contenu) ?', type: 'checkbox' },
      { id: 'p2_astuce_financement', label: 'Astuce financement : si un expert-comptable est présent, vérifier son statut (TNS ou salarié) — financement possible également pour les TNS.', type: 'info' },
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
      { id: 'p3_maj_sf', label: 'Mise à jour des informations sur Salesforce', type: 'checkbox' },
      { id: 'p3_relances', label: 'Relances si sans réponse (3 max, délai 1-2 jours entre chaque)', type: 'relance', maxRelances: 3 },
      { id: 'p3_cancel_note', label: 'Si aucune réponse après 3 relances : passer la fiche en statut Cancel sur Salesforce et envoyer un Chatter à la personne ayant fait la demande.', type: 'info' },
    ],
  },
  {
    id: 'phase4_mise_en_place',
    numero: 4,
    label: 'Mise en place de la formation',
    description: 'Devis, convention, convocations — jusqu’à J-15.',
    icon: '🛠️',
    substeps: [
      { id: 'p4_fiche_produit', label: 'Création de la fiche produit (si pas existante — contrôler Smart OF / Drive)', type: 'checkbox' },
      { id: 'p4_communication_montant', label: 'Le formateur communique le montant et le nom du programme à Sarah, complète SF, passe le statut à "Completing Admin"', type: 'checkbox' },
      { id: 'p4_devis', label: 'Création du dossier + devis sur Smart OF, adressé au cabinet (copie formateur)', type: 'email', templateKey: 'devis' },
      { id: 'p4_relance_devis', label: 'Relance si besoin (tâche Smart OF + note SF)', type: 'relance', maxRelances: 3 },
      { id: 'p4_relance_devis_note', label: 'Si aucune réponse après 3 relances : Chatter interne au formateur + owner dossier (et à la personne ayant demandé la formation, le cas échéant).', type: 'info' },
      { id: 'p4_devis_signe', label: 'Vérification / réception du devis signé', type: 'checkbox', groupe: 'Réception des documents signés' },
      { id: 'p4_liste_apprenants', label: 'Vérification de la liste des apprenants (nom, prénom, email, téléphone)', type: 'checkbox', groupe: 'Réception des documents signés' },
      { id: 'p4_statut_training', label: 'Statut SF passé à "Training" + information du formateur par Chatter', type: 'checkbox', groupe: 'Réception des documents signés' },
      { id: 'p4_transport_hotel', label: 'Réservation transport / hôtel (formation en présentiel)', type: 'checkbox', conditional: 'presentiel', groupe: 'Réception des documents signés' },
      { id: 'p4_devis_signe_smartof', label: 'Ajout du devis signé sur Smart OF et SF', type: 'checkbox', groupe: 'Réception des documents signés' },
      { id: 'p4_otr', label: 'Création de l’OTR sur SF', type: 'checkbox', groupe: 'Réception des documents signés' },
      { id: 'p4_convention', label: 'Rédaction et envoi de la convention de formation au cabinet', type: 'email', templateKey: 'convention', groupe: 'Réception des documents signés' },
      { id: 'p4_convocation', label: 'Envoi des convocations (J-15 minimum après signature de la convention)', type: 'email', templateKey: 'convocation', groupe: 'Réception des documents signés' },
    ],
  },
  {
    id: 'phase5_jour_formation',
    numero: 5,
    label: 'Jour de la formation',
    description: 'Émargement, présences, quizz pré/post-formation.',
    icon: '🎓',
    substeps: [
      { id: 'p5_lien_veille', label: '(La veille) Envoi du lien Google de la formation', type: 'checkbox' },
      { id: 'p5_emargement_declenche', label: 'Émargement déclenché par le formateur (15 minutes avant la formation)', type: 'checkbox', groupe: 'Matin' },
      { id: 'p5_verif_emargement_recu', label: 'Vérification que tous les apprenants ont bien reçu la feuille d’émargement', type: 'checkbox', groupe: 'Matin' },
      { id: 'p5_presences', label: 'Vérification des présents / absents', type: 'checkbox', groupe: 'Matin' },
      { id: 'p5_emargement_matin', label: 'Émargement des apprenants (matin) + des formateurs', type: 'checkbox', groupe: 'Matin' },
      { id: 'p5_quizz_initial', label: 'Envoi du questionnaire pré-formation via SmartOF', type: 'quizz', quizzType: 'pre', groupe: 'Matin' },
      { id: 'p5_controle_emargement_matin', label: 'Contrôle que tous les émargements ont bien été signés', type: 'checkbox', groupe: 'Matin' },
      { id: 'p5_quizz_final', label: 'Questionnaire post-formation adressé à l’apprenant (fin de module)', type: 'quizz', quizzType: 'post', groupe: 'Matin' },
      { id: 'p5_emargement_apres_midi', label: 'Émargement des apprenants (début d’après-midi) + des formateurs', type: 'checkbox', conditional: 'journee_entiere', groupe: 'Après-midi (si formation journée entière)' },
      { id: 'p5_satisfaction_am', label: 'Envoi du questionnaire de satisfaction via SmartOF', type: 'checkbox', conditional: 'journee_entiere', groupe: 'Après-midi (si formation journée entière)' },
      { id: 'p5_controle_am', label: 'Contrôle que tous les questionnaires et les émargements sont bien complétés', type: 'checkbox', conditional: 'journee_entiere', groupe: 'Après-midi (si formation journée entière)' },
      { id: 'p5_lien_csat', label: 'Envoi du lien CSAT à tous les apprenants', type: 'checkbox', conditional: 'journee_entiere', groupe: 'Après-midi (si formation journée entière)' },
    ],
  },
  {
    id: 'phase6_post_formation',
    numero: 6,
    label: 'Post-formation & clôture',
    description: 'Support, certificats, facturation et clôture du dossier.',
    icon: '🏁',
    substeps: [
      { id: 'p6_support_help_center', label: 'Envoi du support de formation au client', type: 'checkbox' },
      { id: 'p6_lien_help_center', label: 'Envoi du lien vers le Help Center Pennylane', type: 'checkbox' },
      { id: 'p6_reponses_questions', label: 'Réponses aux questions restées sans réponse pendant la formation', type: 'checkbox' },
      { id: 'p6_confirmation_cloture', label: 'Confirmation à Sarah que le dossier est clos', type: 'checkbox' },
      { id: 'p6_aleas_note', label: 'Si un problème a été rencontré pendant ou après la formation : renseigner le tableau des aléas et réclamations.', type: 'info' },
      { id: 'p6_statut_done', label: 'Statut SF passé à "Done" + Chatter à Sarah', type: 'checkbox', groupe: 'Clôture du dossier' },
      { id: 'p6_certificat', label: 'Envoi des certificats de réalisation via SmartOF', type: 'email', templateKey: 'certificat', groupe: 'Clôture du dossier' },
      { id: 'p6_attestation', label: 'Envoi des attestations de formation via SmartOF', type: 'email', templateKey: 'attestation', groupe: 'Clôture du dossier' },
      { id: 'p6_rapport_emargement', label: 'Envoi des rapports d’émargement via SmartOF', type: 'checkbox', groupe: 'Clôture du dossier' },
      { id: 'p6_facturation', label: 'Émission de la facture sur Pennylane', type: 'checkbox', groupe: 'Clôture du dossier' },
      { id: 'p6_satisfaction_froid', label: 'Questionnaire de satisfaction à froid envoyé automatiquement (J+30)', type: 'checkbox', groupe: 'Clôture du dossier' },
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
  emargement: 'p5_emargement_matin',
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
  if (substep.conditional === 'journee_entiere') return session?.format === 'journee'
  return true
}

// Les étapes informatives ne bloquent jamais l'avancement — elles ne servent qu'à afficher les consignes Notion.
function isCountable(substep) {
  return substep.type !== 'info'
}

export function isSubstepDone(substep, statuts, session, inscriptions, getResultat) {
  if (substep.type === 'info') return true
  if (substep.type === 'quizz') {
    const nbInscrits = inscriptions?.length || 0
    if (nbInscrits === 0) return false
    const nbCompletes = inscriptions.filter(ins => getResultat(session.id, ins.stagiaireId, substep.quizzType)).length
    return nbCompletes === nbInscrits
  }
  if (substep.type === 'relance') {
    return statuts[substep.id]?.relances?.resolved || statuts[substep.id]?.status === 'done'
  }
  return statuts[substep.id]?.status === 'done'
}

export function getPhaseStatus(phase, statuts, session, inscriptions, getResultat, locked = false) {
  if (locked) return 'locked'

  const applicable = phase.substeps.filter(s => isSubstepApplicable(s, session))
  const countable = applicable.filter(isCountable)
  if (countable.length === 0) return isPhaseValidated(phase.id, statuts) ? 'done' : 'ready_to_validate'

  const blocked = applicable.some(s => {
    if (s.type !== 'relance') return false
    const relances = statuts[s.id]?.relances
    return relances && relances.count >= (s.maxRelances || 3) && !relances.resolved
  })

  const doneFlags = countable.map(s => isSubstepDone(s, statuts, session, inscriptions, getResultat))
  const allDone = doneFlags.every(Boolean)

  if (isPhaseValidated(phase.id, statuts)) return 'done'
  if (blocked) return 'blocked'
  if (allDone) return 'ready_to_validate'
  if (doneFlags.some(Boolean)) return 'in_progress'
  return 'not_started'
}

export function isPhaseComplete(phase, statuts, session, inscriptions, getResultat) {
  const applicable = phase.substeps.filter(s => isSubstepApplicable(s, session) && isCountable(s))
  if (applicable.length === 0) return true
  return applicable.every(s => isSubstepDone(s, statuts, session, inscriptions, getResultat))
}

export function isPhaseValidated(phaseId, statuts) {
  return statuts[`${phaseId}__validation`]?.status === 'done'
}

export function validatePhase(sessionId, phaseId) {
  setWorkflowStep(sessionId, `${phaseId}__validation`, 'done')
}

export function invalidatePhase(sessionId, phaseId) {
  setWorkflowStep(sessionId, `${phaseId}__validation`, 'pending')
}

export function isPhaseUnlocked(phaseIndex, phases, statuts) {
  if (phaseIndex === 0) return true
  return isPhaseValidated(phases[phaseIndex - 1].id, statuts)
}

export const PHASE_STATUS_LABELS = {
  locked: 'Verrouillée',
  not_started: 'Pas commencée',
  in_progress: 'En cours',
  blocked: 'Bloquée',
  ready_to_validate: 'Prête à valider',
  done: 'Validée',
}
