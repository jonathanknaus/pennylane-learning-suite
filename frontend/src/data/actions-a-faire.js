// Agrège, à travers toutes les sessions actives, les phases de workflow qui
// nécessitent une action (prêtes à valider ou bloquées par une relance sans
// réponse) — utilisé par la page d'accueil admin pour lister "ce qu'il reste à faire".

import { getSessions } from './sessions'
import { getInscriptionsBySession } from './stagiaires'
import { getResultat } from './questionnaires'
import { getFormateurs } from './formateurs'
import { getGestionnaires } from './gestionnaires'
import {
  WORKFLOW_PHASES, getWorkflowsForSession, getPhaseStatus, isPhaseUnlocked, getResponsableNom,
} from './workflows'
import { isModuleComplet } from './emargement'

export function getActionsAFaire() {
  const sessions = getSessions().filter(s => !['annule', 'termine'].includes(s.statut))
  const formateurs = getFormateurs()
  const gestionnaires = getGestionnaires()
  const actions = []

  for (const session of sessions) {
    const statuts = getWorkflowsForSession(session.id)
    const inscriptions = getInscriptionsBySession(session.id)

    WORKFLOW_PHASES.forEach((phase, idx) => {
      const locked = !isPhaseUnlocked(idx, WORKFLOW_PHASES, statuts)
      const status = getPhaseStatus(phase, statuts, session, inscriptions, getResultat, locked, isModuleComplet)
      if (status !== 'ready_to_validate' && status !== 'blocked') return

      const premiereSubstep = phase.substeps.find(s => s.responsable)
      const responsableNom = premiereSubstep ? getResponsableNom(premiereSubstep, session, { formateurs, gestionnaires }) : null

      actions.push({
        sessionId: session.id,
        sessionTitre: session.titre || session.client || 'Session sans titre',
        client: session.client,
        date: session.date,
        phaseId: phase.id,
        phaseLabel: `Phase ${phase.numero} — ${phase.label}`,
        status, // 'ready_to_validate' | 'blocked'
        responsableNom,
      })
    })
  }

  return actions.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'blocked' ? -1 : 1
    return (a.date || '').localeCompare(b.date || '')
  })
}
