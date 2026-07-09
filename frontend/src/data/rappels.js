import { getSessions } from './sessions'
import { getWorkflowsForSession } from './workflows'
import { getBesoin } from './questionnaire-besoin'
import { getFormateurs } from './formateurs'
import { getGestionnaires, resolveResponsable } from './gestionnaires'
import { addNotificationOnce } from './notifications'

const DELAI_RELANCE_MS = 48 * 60 * 60 * 1000

// Étapes d'envoi du questionnaire de besoin dont on mesure le délai de réponse.
const ETAPES_ENVOI_BESOIN = ['p1_mail_prise_contact', 'p1_questionnaire_besoin']

function formateurDeSession(session) {
  const formateurs = getFormateurs()
  return formateurs.find(f => f.id === session.formateurId) || null
}

// Parcourt toutes les sessions et génère les notifications de rappel 48h (cabinet sans réponse
// au questionnaire de besoin) et de supervision pour le gestionnaire attitré. Idempotent : à
// rappeler à chaque chargement de page (TableauDeBord, Sessions, PortailFormateur).
export function scanRappels() {
  const sessions = getSessions()

  for (const session of sessions) {
    if (['annule', 'termine'].includes(session.statut)) continue

    const statuts = getWorkflowsForSession(session.id)
    const envoyeAt = ETAPES_ENVOI_BESOIN
      .map(id => statuts[id]?.status === 'done' ? statuts[id].updatedAt : null)
      .filter(Boolean)
      .sort()[0]
    if (!envoyeAt) continue

    const besoin = getBesoin(session.id)
    const aRepondu = !!besoin?.reponses
    if (aRepondu) continue

    const elapsed = Date.now() - new Date(envoyeAt).getTime()
    if (elapsed < DELAI_RELANCE_MS) continue

    const formateur = formateurDeSession(session)
    if (formateur) {
      addNotificationOnce({
        destinataireType: 'formateur',
        destinataireId: formateur.id,
        type: 'rappel_48h',
        sessionId: session.id,
        titre: 'Cabinet sans réponse depuis 48h',
        message: `${session.client || session.titre} n'a pas répondu au questionnaire de besoin envoyé le ${new Date(envoyeAt).toLocaleDateString('fr-FR')}. Une relance est requise (Phase 1 — Prise de contact).`,
        dedupeKey: `rappel_48h_besoin_${session.id}`,
      })
    }

    if (session.gestionnaireId) {
      const effectifId = resolveResponsable(session.gestionnaireId)
      addNotificationOnce({
        destinataireType: 'gestionnaire',
        destinataireId: effectifId,
        type: 'rappel_48h_supervision',
        sessionId: session.id,
        titre: 'Relance à superviser',
        message: `${formateur ? `${formateur.prenom} ${formateur.nom}` : 'Le formateur'} doit relancer ${session.client || session.titre} — sans réponse depuis 48h au questionnaire de besoin.`,
        dedupeKey: `rappel_48h_supervision_${session.id}`,
      })
    }
  }
}

export function getGestionnairesEmails() {
  return getGestionnaires().map(g => ({ id: g.id, nom: `${g.prenom} ${g.nom}`, email: g.email }))
}
