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
      { id: 'p0_enregistrement_sf', label: 'Enregistrement de la demande sur Salesforce (si nécessaire)', type: 'checkbox', responsable: 'commercial' },
      { id: 'p0_attribution_formation', label: 'Attribution de la formation au formateur (mail automatique SF)', type: 'checkbox', responsable: 'commercial' },
      { id: 'p0_confirmation_formateur', label: 'Confirmation de prise en charge par le formateur (auprès du PrM/CSM/AM/KAM/FE/support)', type: 'checkbox', responsable: 'formateur' },
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
      { id: 'p1_prise_contact', label: 'Prise de contact avec le client par téléphone ou par mail', type: 'checkbox', responsable: 'formateur' },
      { id: 'p1_mail_prise_contact', label: 'Envoi du mail de prise de contact + formulaire', type: 'email', templateKey: 'questionnaire_besoins', responsable: 'formateur' },
      { id: 'p1_tache_relance_sf', label: 'Création d’une tâche de relance sur Salesforce', type: 'checkbox', responsable: 'formateur' },
      { id: 'p1_log_modjo', label: 'Log de l’échange sur Modjo / Ringover (impératif)', type: 'checkbox', responsable: 'formateur' },
      { id: 'p1_questionnaire_besoin', label: 'Envoi du questionnaire de recueil du besoin au cabinet', type: 'email', templateKey: 'questionnaire_besoins', responsable: 'formateur' },
      { id: 'p1_info_sarah', label: 'Information du gestionnaire à réception du retour du questionnaire', type: 'checkbox', notifieGestionnaire: true, responsable: 'formateur' },
      { id: 'p1_relances', label: 'Relances si sans réponse (3 max, délai 1-2 jours entre chaque)', type: 'relance', maxRelances: 3, responsable: 'formateur' },
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
      { id: 'p2_formulaire_rempli', label: 'Le formulaire a-t-il été rempli ?', type: 'checkbox', responsable: 'formateur' },
      { id: 'p2_nb_participants', label: 'Nombre de participants ?', type: 'checkbox', responsable: 'formateur' },
      { id: 'p2_date_souhaitee', label: 'Date souhaitée pour la formation ? (modifiable si besoin)', type: 'checkbox', responsable: 'formateur' },
      { id: 'p2_opco', label: 'OPCO ou non ?', type: 'checkbox', responsable: 'formateur' },
      { id: 'p2_formule', label: 'Formule de formation (présentiel/visio + contenu) ?', type: 'checkbox', responsable: 'formateur' },
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
      { id: 'p3_rdv_modjo', label: 'RDV enregistré sur Modjo', type: 'checkbox', responsable: 'formateur' },
      { id: 'p3_mail_recap', label: 'Envoi du mail récap du RDV de cadrage', type: 'email', templateKey: 'collecte_dates', responsable: 'formateur' },
      { id: 'p3_maj_sf', label: 'Mise à jour des informations sur Salesforce', type: 'checkbox', responsable: 'formateur' },
      { id: 'p3_relances', label: 'Relances si sans réponse (3 max, délai 1-2 jours entre chaque)', type: 'relance', maxRelances: 3, responsable: 'formateur' },
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
      { id: 'p4_fiche_produit', label: 'Création de la fiche produit (module détaillé) si pas déjà présente au catalogue', type: 'checkbox', outil: { label: 'Ouvrir le Catalogue AFS', page: 'catalogue' }, responsable: 'formateur' },
      { id: 'p4_communication_montant', label: 'Le formateur communique le montant et le nom du programme au gestionnaire, complète SF, passe le statut à "Completing Admin"', type: 'montant_devis', notifieGestionnaire: true, responsable: 'formateur' },
      { id: 'p4_devis', label: 'Création du dossier + devis, adressé au cabinet (copie formateur)', type: 'email', templateKey: 'devis', outil: { label: 'Ouvrir Devis & Factures', tab: 'finance' }, responsable: 'gestionnaire' },
      { id: 'p4_relance_devis', label: 'Relance si besoin (tâche + note SF)', type: 'relance', maxRelances: 3, responsable: 'gestionnaire' },
      { id: 'p4_relance_devis_note', label: 'Si aucune réponse après 3 relances : Chatter interne au formateur + owner dossier (et à la personne ayant demandé la formation, le cas échéant).', type: 'info' },
      { id: 'p4_devis_signe', label: 'Vérification / réception du devis signé', type: 'checkbox', groupe: 'Réception des documents signés', outil: { label: 'Ouvrir Devis & Factures', tab: 'finance' }, responsable: 'gestionnaire' },
      { id: 'p4_liste_apprenants', label: 'Vérification de la liste des apprenants (nom, prénom, email, téléphone)', type: 'checkbox', groupe: 'Réception des documents signés', outil: { label: 'Ouvrir Participants', tab: 'participants' }, responsable: 'gestionnaire' },
      { id: 'p4_statut_training', label: 'Statut SF passé à "Training" + information du formateur par Chatter', type: 'checkbox', groupe: 'Réception des documents signés', responsable: 'gestionnaire' },
      { id: 'p4_transport_hotel', label: 'Réservation transport / hôtel (formation en présentiel)', type: 'checkbox', conditional: 'presentiel', groupe: 'Réception des documents signés', responsable: 'formateur' },
      { id: 'p4_devis_signe_smartof', label: 'Ajout du devis signé au dossier', type: 'checkbox', groupe: 'Réception des documents signés', outil: { label: 'Ouvrir Devis & Factures', tab: 'finance' }, responsable: 'gestionnaire' },
      { id: 'p4_otr', label: 'Création de l’OTR sur SF', type: 'checkbox', groupe: 'Réception des documents signés', responsable: 'gestionnaire' },
      { id: 'p4_convention', label: 'Rédaction et envoi de la convention de formation au cabinet', type: 'email', templateKey: 'convention', groupe: 'Réception des documents signés', outil: { label: 'Ouvrir Documents', tab: 'documents' }, responsable: 'gestionnaire' },
      { id: 'p4_convocation', label: 'Envoi des convocations (J-15 minimum après signature de la convention)', type: 'email', templateKey: 'convocation', groupe: 'Réception des documents signés', outil: { label: 'Ouvrir Documents', tab: 'documents' }, responsable: 'gestionnaire' },
    ],
  },
  {
    id: 'phase5_jour_formation',
    numero: 5,
    label: 'Jour de la formation',
    description: 'Émargement, présences, quizz pré/post-formation.',
    icon: '🎓',
    substeps: [
      { id: 'p5_lien_veille', label: '(La veille) Envoi du lien Google de la formation', type: 'checkbox', responsable: 'formateur' },
      { id: 'p5_emargement_declenche', label: 'Émargement déclenché par le formateur (15 minutes avant la formation)', type: 'checkbox', groupe: 'Matin', responsable: 'formateur' },
      { id: 'p5_verif_emargement_recu', label: 'Vérification que tous les apprenants ont bien reçu le lien d’émargement électronique', type: 'checkbox', groupe: 'Matin', responsable: 'formateur' },
      { id: 'p5_presences', label: 'Vérification des présents / absents', type: 'checkbox', groupe: 'Matin', responsable: 'formateur' },
      { id: 'p5_emargement_matin', label: 'Émargement électronique des apprenants + des formateurs, par module', type: 'emargement', groupe: 'Matin', responsable: 'formateur' },
      { id: 'p5_quizz_initial', label: 'Envoi du questionnaire pré-formation', type: 'quizz', quizzType: 'pre', groupe: 'Matin', responsable: 'formateur' },
      { id: 'p5_quizz_final', label: 'Questionnaire post-formation adressé à l’apprenant (fin de module)', type: 'quizz', quizzType: 'post', groupe: 'Matin', responsable: 'formateur' },
      { id: 'p5_emargement_apres_midi', label: 'Émargement électronique des apprenants + des formateurs (après-midi)', type: 'emargement', conditional: 'journee_entiere', groupe: 'Après-midi (si formation journée entière)', responsable: 'formateur' },
      { id: 'p5_satisfaction_am', label: 'Envoi du questionnaire de satisfaction', type: 'checkbox', conditional: 'journee_entiere', groupe: 'Après-midi (si formation journée entière)', outil: { label: 'Ouvrir Satisfaction', tab: 'satisfaction' }, responsable: 'formateur' },
      { id: 'p5_controle_am', label: 'Contrôle que tous les questionnaires et les émargements sont bien complétés', type: 'checkbox', conditional: 'journee_entiere', groupe: 'Après-midi (si formation journée entière)', responsable: 'formateur' },
      { id: 'p5_lien_csat', label: 'Envoi du lien CSAT à tous les apprenants', type: 'checkbox', conditional: 'journee_entiere', groupe: 'Après-midi (si formation journée entière)', responsable: 'formateur' },
    ],
  },
  {
    id: 'phase6_post_formation',
    numero: 6,
    label: 'Post-formation & clôture',
    description: 'Support, certificats, facturation et clôture du dossier.',
    icon: '🏁',
    substeps: [
      { id: 'p6_support_help_center', label: 'Envoi du support de formation au client', type: 'checkbox', responsable: 'formateur' },
      { id: 'p6_lien_help_center', label: 'Envoi du lien vers le Help Center Pennylane', type: 'checkbox', responsable: 'formateur' },
      { id: 'p6_reponses_questions', label: 'Réponses aux questions restées sans réponse pendant la formation', type: 'checkbox', responsable: 'formateur' },
      { id: 'p6_confirmation_cloture', label: 'Confirmation au gestionnaire que le dossier est clos', type: 'checkbox', notifieGestionnaire: true, responsable: 'formateur' },
      { id: 'p6_aleas_note', label: 'Si un problème a été rencontré pendant ou après la formation : renseigner le tableau des aléas et réclamations.', type: 'info' },
      { id: 'p6_statut_done', label: 'Statut SF passé à "Done" + Chatter au gestionnaire', type: 'checkbox', groupe: 'Clôture du dossier', notifieGestionnaire: true, responsable: 'formateur' },
      { id: 'p6_certificat', label: 'Envoi des certificats de réalisation', type: 'email', templateKey: 'certificat', groupe: 'Clôture du dossier', outil: { label: 'Ouvrir Documents', tab: 'documents' }, responsable: 'gestionnaire' },
      { id: 'p6_attestation', label: 'Envoi des attestations de formation', type: 'email', templateKey: 'attestation', groupe: 'Clôture du dossier', outil: { label: 'Ouvrir Documents', tab: 'documents' }, responsable: 'gestionnaire' },
      { id: 'p6_rapport_emargement', label: 'Envoi des rapports d’émargement', type: 'checkbox', groupe: 'Clôture du dossier', outil: { label: 'Ouvrir Documents', tab: 'documents' }, responsable: 'gestionnaire' },
      { id: 'p6_facturation', label: 'Émission de la facture sur Pennylane', type: 'checkbox', groupe: 'Clôture du dossier', outil: { label: 'Ouvrir Devis & Factures', tab: 'finance' }, responsable: 'gestionnaire' },
      { id: 'p6_satisfaction_froid', label: 'Questionnaire de satisfaction à froid envoyé automatiquement (J+30)', type: 'checkbox', groupe: 'Clôture du dossier', responsable: 'systeme' },
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
    if (!all[sessionId]) all[sessionId] = {}
    const entry = all[sessionId][substepId] || { status: 'pending' }
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

export function isSubstepDone(substep, statuts, session, inscriptions, getResultat, isModuleCompletFn) {
  if (substep.type === 'info') return true
  if (substep.type === 'quizz') {
    const nbInscrits = inscriptions?.length || 0
    if (nbInscrits === 0) return false
    const nbCompletes = inscriptions.filter(ins => getResultat(session.id, ins.stagiaireId, substep.quizzType)).length
    return nbCompletes === nbInscrits
  }
  if (substep.type === 'emargement') {
    if (!isModuleCompletFn) return statuts[substep.id]?.status === 'done'
    const moduleIds = session.modules || []
    if (moduleIds.length === 0) return false
    const participantIds = (inscriptions || []).filter(i => i.presence !== false).map(i => i.stagiaireId)
    const formateurIds = [session.formateurId, session.formateurAppuiId].filter(Boolean)
    return moduleIds.every(mid => isModuleCompletFn(session.id, mid, participantIds, formateurIds))
  }
  if (substep.type === 'relance') {
    return statuts[substep.id]?.relances?.resolved || statuts[substep.id]?.status === 'done'
  }
  return statuts[substep.id]?.status === 'done'
}

export function getPhaseStatus(phase, statuts, session, inscriptions, getResultat, locked = false, isModuleCompletFn) {
  if (locked) return 'locked'

  const applicable = phase.substeps.filter(s => isSubstepApplicable(s, session))
  const countable = applicable.filter(isCountable)
  if (countable.length === 0) return isPhaseValidated(phase.id, statuts) ? 'done' : 'ready_to_validate'

  const blocked = applicable.some(s => {
    if (s.type !== 'relance') return false
    const relances = statuts[s.id]?.relances
    return relances && relances.count >= (s.maxRelances || 3) && !relances.resolved
  })

  const doneFlags = countable.map(s => isSubstepDone(s, statuts, session, inscriptions, getResultat, isModuleCompletFn))
  const allDone = doneFlags.every(Boolean)

  if (isPhaseValidated(phase.id, statuts)) return 'done'
  if (blocked) return 'blocked'
  if (allDone) return 'ready_to_validate'
  if (doneFlags.some(Boolean)) return 'in_progress'
  return 'not_started'
}

export function isPhaseComplete(phase, statuts, session, inscriptions, getResultat, isModuleCompletFn) {
  const applicable = phase.substeps.filter(s => isSubstepApplicable(s, session) && isCountable(s))
  if (applicable.length === 0) return true
  return applicable.every(s => isSubstepDone(s, statuts, session, inscriptions, getResultat, isModuleCompletFn))
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

export const RESPONSABLE_LABELS = {
  formateur: 'Formateur',
  gestionnaire: 'Gestionnaire',
  commercial: 'Commercial (CSM/BDR/AM)',
  systeme: 'Automatique',
}

// Nom réel de la personne responsable d'une sous-étape pour une session donnée,
// utilisé pour afficher "Formateur — Timothy RATSIMA" plutôt que juste "Formateur".
export function getResponsableNom(substep, session, { formateurs, gestionnaires } = {}) {
  if (!substep.responsable) return null
  if (substep.responsable === 'formateur') {
    const fmt = formateurs?.find(f => f.id === session.formateurId)
    return fmt ? `${fmt.prenom} ${fmt.nom}` : (session.formateur || RESPONSABLE_LABELS.formateur)
  }
  if (substep.responsable === 'gestionnaire') {
    const gest = gestionnaires?.find(g => g.id === session.gestionnaireId)
    return gest ? `${gest.prenom} ${gest.nom}` : RESPONSABLE_LABELS.gestionnaire
  }
  return RESPONSABLE_LABELS[substep.responsable] || null
}
