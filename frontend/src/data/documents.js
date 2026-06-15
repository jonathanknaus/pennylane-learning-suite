import { getSessions, ALL_MODULES, FORMATS } from './sessions'
import { getStagiaires, getInscriptionsBySession } from './stagiaires'

export const TYPES_DOCUMENT = [
  { id: 'convocation',  label: 'Convocation',              icon: '✉️',  description: 'Envoyée avant la session à chaque participant' },
  { id: 'convention',   label: 'Convention de formation',  icon: '📄',  description: '10 clauses légales, liste participants, prix, signatures' },
  { id: 'emargement',  label: "Feuille d'émargement",      icon: '✍️',  description: 'Signée le jour J, preuve de présence Qualiopi' },
  { id: 'attestation', label: 'Attestation de formation',  icon: '🎓',  description: 'Remise à chaque participant après la session' },
]

export function getSessionData(sessionId) {
  const session = getSessions().find(s => s.id === sessionId)
  if (!session) return null

  const inscriptions = getInscriptionsBySession(sessionId)
  const stagiaires = getStagiaires()
  const participants = inscriptions
    .filter(i => i.statut !== 'annule')
    .map(ins => ({
      ...ins,
      stagiaire: stagiaires.find(s => s.id === ins.stagiaireId),
    }))
    .filter(p => p.stagiaire)

  const modules = (session.modules || [])
    .map(id => ALL_MODULES.find(m => m.id === id))
    .filter(Boolean)

  const format = FORMATS.find(f => f.id === session.format)

  const dateFormatee = session.date
    ? new Date(session.date + 'T12:00:00').toLocaleDateString('fr-FR', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      })
    : '—'

  const prix = format
    ? (session.modalite === 'visio' ? format.visio : format.presentiel)
    : null

  return { session, participants, modules, format, dateFormatee, prix }
}
