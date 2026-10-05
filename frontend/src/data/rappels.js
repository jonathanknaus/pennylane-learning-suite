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

// Date d'échéance des accès apprenant : 3 mois après la session, conformément
// à la clause 4 de la convention de formation.
export function echeanceAccesSupports(dateSession) {
  if (!dateSession) return null
  const d = new Date(dateSession)
  if (Number.isNaN(d.getTime())) return null
  // setMonth ne borne PAS au dernier jour du mois cible : un 31 janvier + 3 mois
  // donnerait « 31 avril », que JavaScript fait basculer au 1er mai. On met donc
  // le jour à 1 avant de décaler, puis on le replace en le bornant.
  const jour = d.getDate()
  const echeance = new Date(d)
  echeance.setDate(1)
  echeance.setMonth(echeance.getMonth() + 3)
  const dernierJourDuMois = new Date(echeance.getFullYear(), echeance.getMonth() + 1, 0).getDate()
  echeance.setDate(Math.min(jour, dernierJourDuMois))
  return echeance
}

// Rappelle de fermer l'extranet 3 mois après la session.
//
// ⚠️ Pourquoi un rappel et non un automatisme : la fermeture se fait dans
// SmartOF, qui est en consultation seule — on n'y écrit jamais. Le rappel est
// donc la contrepartie de la clause 4 de la convention, qui promet une
// désactivation des accès au bout de 3 mois. Sans ce garde-fou, l'organisme
// s'engagerait sur une échéance que personne ne déclencherait.
export function scanFermetureExtranet() {
  const maintenant = Date.now()

  for (const session of getSessions()) {
    if (session.statut === 'annule') continue
    const echeance = echeanceAccesSupports(session.date)
    if (!echeance || maintenant < echeance.getTime()) continue

    const libelle = session.client || session.titre || `Session ${session.id}`
    const message = `Les accès aux supports de ${libelle} ont dépassé les 3 mois prévus par la convention (échéance du ${echeance.toLocaleDateString('fr-FR')}). Désactive l'extranet de cette session dans SmartOF.`

    if (session.gestionnaireId) {
      addNotificationOnce({
        destinataireType: 'gestionnaire',
        destinataireId: resolveResponsable(session.gestionnaireId),
        type: 'fermeture_extranet',
        sessionId: session.id,
        titre: 'Extranet à fermer (3 mois écoulés)',
        message,
        dedupeKey: `fermeture_extranet_${session.id}`,
      })
    }
  }
}

export function getGestionnairesEmails() {
  return getGestionnaires().map(g => ({ id: g.id, nom: `${g.prenom} ${g.nom}`, email: g.email }))
}
