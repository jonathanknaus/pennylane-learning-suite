import { THEMATIQUES, TARIFS } from './catalogue-afs'
import { uid } from './ids.js'

export const FORMATS = Object.entries(TARIFS)
  .filter(([k]) => k !== 'journee_sur_mesure')
  .map(([id, t]) => ({ id, ...t }))

export const FORMATEURS = [
  { id: 'f1', nom: 'Équipe AFS', email: 'afs@pennylane.com' },
]

export const ALL_MODULES = THEMATIQUES.flatMap(t =>
  t.modules.map(m => ({ ...m, thematique: t.titre, thematiqueId: t.id }))
)

const STORAGE_KEY = 'pls_sessions'

export function getSessions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function saveSession(session) {
  const sessions = getSessions()
  const idx = sessions.findIndex(s => s.id === session.id)
  if (idx >= 0) {
    sessions[idx] = session
  } else {
    sessions.push({ ...session, id: uid('s'), createdAt: new Date().toISOString() })
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  return sessions
}

export function deleteSession(id) {
  const sessions = getSessions().filter(s => s.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  return sessions
}

export const STATUTS = [
  { id: 'brouillon', label: 'Brouillon', color: '#9CA3AF' },
  { id: 'confirme', label: 'Confirmée', color: '#3B82F6' },
  { id: 'en_cours', label: 'En cours', color: '#F59E0B' },
  { id: 'termine', label: 'Terminée', color: '#10B981' },
  { id: 'annule', label: 'Annulée', color: '#EF4444' },
]

export const MODALITES = [
  { id: 'visio', label: 'Visio' },
  { id: 'presentiel', label: 'Présentiel' },
]

// Données de démonstration
export function seedDemoSessions() {
  if (getSessions().length > 0) return
  const demos = [
    {
      id: 's_demo_1',
      titre: 'Saisie comptable & TVA',
      modules: ['saisie_comptable', 'tva'],
      format: 'session_2h',
      modalite: 'visio',
      statut: 'confirme',
      date: '2026-06-20',
      heure: '10:00',
      formateur: 'Équipe AFS',
      participants_max: 15,
      participants_inscrits: 4,
      client: 'Cabinet Martin & Associés',
      notes: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 's_demo_2',
      titre: 'Analytique & Trésorerie — Journée complète',
      modules: ['famille_analytique', 'plans_tresorerie', 'outils_analyse', 'posture'],
      format: 'journee',
      modalite: 'presentiel',
      statut: 'brouillon',
      date: '2026-07-03',
      heure: '09:00',
      formateur: 'Équipe AFS',
      participants_max: 15,
      participants_inscrits: 0,
      client: 'Fiduciaire du Nord',
      notes: 'À confirmer après devis validé',
      createdAt: new Date().toISOString(),
    },
    {
      id: 's_demo_3',
      titre: 'Onboarding client — Webinaire',
      modules: ['webinaire_embarquement'],
      format: 'session_1h',
      modalite: 'visio',
      statut: 'termine',
      date: '2026-06-05',
      heure: '14:00',
      formateur: 'Équipe AFS',
      participants_max: 15,
      participants_inscrits: 12,
      client: 'Groupe Expertise Sud',
      notes: '',
      createdAt: new Date().toISOString(),
    },
  ]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(demos))
}
