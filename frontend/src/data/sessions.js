// Persistance partagée : chaque écriture locale est doublée d'une poussée vers
// Firebase, et une synchronisation descendante (demarrerSync dans App.jsx) tient
// le cache à jour. L'API reste synchrone et inchangée pour les écrans.
import { pousser } from './store-firebase'

import { getAllModules } from './catalogue-afs'
import { estimer } from './tarification'

// Les formats de session ne portent PLUS de prix. Ils en portaient (les TARIFS de
// catalogue-afs.js), avec un montant unique par format qui ignorait le nombre de
// participants : un groupe de 20 était facturé comme un groupe de 8, et la
// mention « +300 € par formateur supplémentaire » n'était appliquée nulle part.
// Le prix vient désormais de tarification.js, seule source qui connaisse les
// paliers et les grilles datées. `dureeHeures` est ce qui relie les deux.
export const FORMATS = [
  { id: 'session_1h', label: 'Session 1h', duree: '1h', dureeHeures: 1, modules: '1 ou 2 modules' },
  { id: 'session_2h', label: 'Session 2h', duree: '2h', dureeHeures: 2, modules: '3 à 4 modules' },
  { id: 'demi_journee', label: '½ Journée', duree: '3h30', dureeHeures: 3.5, modules: 'jusqu’à 5 modules' },
  { id: 'journee', label: 'Journée complète', duree: '7h', dureeHeures: 7, modules: 'programme sur mesure' },
]

// Effectif maximum par défaut d'une session. Volontairement 10 et non 15 :
// depuis que la grille a des paliers, 15 fait basculer tout forfait au palier
// supérieur (2 formateurs, +100 à +500 €) alors que la plupart des sessions
// réunissent moins de 10 personnes. C'est le travers relevé sur les fiches
// produit SmartOF, dont 29 sont restées à 15 par simple valeur par défaut.
export const EFFECTIF_MAX_DEFAUT = 10

// Le tarif se calcule sur l'effectif MAXIMUM de la session, pas sur le nombre
// d'inscrits : c'est le chiffre qui figure dans la convention et sur lequel on
// s'engage, et il ne doit pas changer à chaque inscription.
function effectifTarifaire(session) {
  return session.participants_max || session.participants_inscrits || EFFECTIF_MAX_DEFAUT
}

/**
 * Estimation complète du tarif d'une session, telle que la rend estimer() :
 * prix, nombre de formateurs, alertes, passage sur devis.
 *
 * La grille retenue est celle en vigueur à la CRÉATION de la session, pas celle
 * d'aujourd'hui : une session ouverte sous l'ancienne grille garde son tarif.
 * À défaut de `createdAt`, la grille du jour s'applique.
 */
export function estimationSession(session) {
  const format = FORMATS.find(f => f.id === session?.format)
  if (!format) return null
  return estimer({
    dureeHeures: format.dureeHeures,
    // 'mixte' comporte une part de présentiel, donc des frais de déplacement :
    // il est tarifé comme du présentiel, comme c'était déjà le cas avant.
    modalite: session.modalite === 'visio' ? 'visio' : 'presentiel',
    participants: effectifTarifaire(session),
    date: session.createdAt || null,
  })
}

/** Prix HT d'une session, ou null si le format est inconnu ou le cas sur devis. */
export function prixSession(session) {
  const e = estimationSession(session)
  return e && e.valide && !e.surDevis ? e.prixHT : null
}

export const FORMATEURS = [
  { id: 'f1', nom: 'Équipe AFS', email: 'afs-training@pennylane.com' },
]

// Recalculé à chaque appel (pas un const figé), pour inclure les modules
// personnalisés créés depuis le Catalogue AFS après le chargement de la page.
export function getModulesDisponibles() {
  return getAllModules()
}

const STORAGE_KEY = 'pls_sessions'

export function formatDateLong(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

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
    sessions.push({ ...session, id: `s_${Date.now()}`, createdAt: new Date().toISOString() })
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  pousser('pls_sessions', sessions)
  return sessions
}

export function deleteSession(id) {
  const sessions = getSessions().filter(s => s.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  pousser('pls_sessions', sessions)
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
  { id: 'mixte', label: 'Mixte' },
]

export const QUALIOPI_OPTIONS = [
  { id: 'non', label: 'Non', color: '#9CA3AF', bg: '#F3F4F6' },
  { id: 'oui', label: 'Qualiopi', color: '#059669', bg: '#D1FAE5' },
  { id: 'subrogation', label: 'Subrogation', color: '#7C3AED', bg: '#EDE9FE' },
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
      participants_max: EFFECTIF_MAX_DEFAUT,
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
      participants_max: EFFECTIF_MAX_DEFAUT,
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
  pousser('pls_sessions', demos)
}
