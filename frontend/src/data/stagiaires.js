import { uid } from './ids.js'
const STAGIAIRES_KEY = 'pls_stagiaires'
const INSCRIPTIONS_KEY = 'pls_inscriptions'

// --- Stagiaires ---

export function getStagiaires() {
  try { return JSON.parse(localStorage.getItem(STAGIAIRES_KEY) || '[]') }
  catch { return [] }
}

export function saveStagiaire(stagiaire) {
  const list = getStagiaires()
  const idx = list.findIndex(s => s.id === stagiaire.id)
  if (idx >= 0) {
    list[idx] = stagiaire
  } else {
    list.push({ ...stagiaire, id: uid('stag'), createdAt: new Date().toISOString() })
  }
  localStorage.setItem(STAGIAIRES_KEY, JSON.stringify(list))
  return list
}

export function deleteStagiaire(id) {
  const list = getStagiaires().filter(s => s.id !== id)
  localStorage.setItem(STAGIAIRES_KEY, JSON.stringify(list))
  // Supprimer aussi les inscriptions de ce stagiaire
  const inscriptions = getInscriptions().filter(i => i.stagiaireId !== id)
  localStorage.setItem(INSCRIPTIONS_KEY, JSON.stringify(inscriptions))
  return list
}

// --- Inscriptions ---

export function getInscriptions() {
  try { return JSON.parse(localStorage.getItem(INSCRIPTIONS_KEY) || '[]') }
  catch { return [] }
}

export function getInscriptionsBySession(sessionId) {
  return getInscriptions().filter(i => i.sessionId === sessionId)
}

export function getInscriptionsByStagiaire(stagiaireId) {
  return getInscriptions().filter(i => i.stagiaireId === stagiaireId)
}

export function inscrire(sessionId, stagiaireId) {
  const list = getInscriptions()
  if (list.find(i => i.sessionId === sessionId && i.stagiaireId === stagiaireId)) return list
  list.push({
    id: uid('ins'),
    sessionId,
    stagiaireId,
    statut: 'inscrit',
    presence: null,
    createdAt: new Date().toISOString(),
  })
  localStorage.setItem(INSCRIPTIONS_KEY, JSON.stringify(list))
  return list
}

export function desinscrire(sessionId, stagiaireId) {
  const list = getInscriptions().filter(
    i => !(i.sessionId === sessionId && i.stagiaireId === stagiaireId)
  )
  localStorage.setItem(INSCRIPTIONS_KEY, JSON.stringify(list))
  return list
}

export function updatePresence(sessionId, stagiaireId, presence) {
  const list = getInscriptions().map(i =>
    i.sessionId === sessionId && i.stagiaireId === stagiaireId
      ? { ...i, presence }
      : i
  )
  localStorage.setItem(INSCRIPTIONS_KEY, JSON.stringify(list))
  return list
}

export function updateStatutInscription(sessionId, stagiaireId, statut) {
  const list = getInscriptions().map(i =>
    i.sessionId === sessionId && i.stagiaireId === stagiaireId
      ? { ...i, statut }
      : i
  )
  localStorage.setItem(INSCRIPTIONS_KEY, JSON.stringify(list))
  return list
}

export const STATUTS_INSCRIPTION = [
  { id: 'inscrit', label: 'Inscrit', color: '#3B82F6' },
  { id: 'confirme', label: 'Confirmé', color: '#10B981' },
  { id: 'liste_attente', label: "Liste d'attente", color: '#F59E0B' },
  { id: 'annule', label: 'Annulé', color: '#EF4444' },
]

export const FONCTIONS = [
  'Expert-comptable', 'Collaborateur comptable', 'Chef de mission',
  'Gestionnaire de paie', 'Responsable administratif', 'Dirigeant',
  'Assistant comptable', 'Autre',
]

// --- Données de démonstration ---

export function seedDemoStagiaires() {
  if (getStagiaires().length > 0) return
  const demos = [
    { id: 'stag_demo_1', prenom: 'Sophie', nom: 'Martin', email: 'sophie.martin@cabinetmartin.fr', telephone: '06 12 34 56 78', fonction: 'Expert-comptable', cabinet: 'Cabinet Martin & Associés', createdAt: new Date().toISOString() },
    { id: 'stag_demo_2', prenom: 'Thomas', nom: 'Bernard', email: 'thomas.bernard@cabinetmartin.fr', telephone: '06 23 45 67 89', fonction: 'Collaborateur comptable', cabinet: 'Cabinet Martin & Associés', createdAt: new Date().toISOString() },
    { id: 'stag_demo_3', prenom: 'Julie', nom: 'Dupont', email: 'julie.dupont@fiduciaire-nord.fr', telephone: '06 34 56 78 90', fonction: 'Chef de mission', cabinet: 'Fiduciaire du Nord', createdAt: new Date().toISOString() },
    { id: 'stag_demo_4', prenom: 'Marc', nom: 'Leroy', email: 'marc.leroy@expertise-sud.fr', telephone: '06 45 67 89 01', fonction: 'Collaborateur comptable', cabinet: 'Groupe Expertise Sud', createdAt: new Date().toISOString() },
    { id: 'stag_demo_5', prenom: 'Camille', nom: 'Petit', email: 'camille.petit@expertise-sud.fr', telephone: '', fonction: 'Assistant comptable', cabinet: 'Groupe Expertise Sud', createdAt: new Date().toISOString() },
  ]
  localStorage.setItem(STAGIAIRES_KEY, JSON.stringify(demos))

  // Inscriptions de démo
  const inscriptions = [
    { id: 'ins_demo_1', sessionId: 's_demo_1', stagiaireId: 'stag_demo_1', statut: 'confirme', presence: null, createdAt: new Date().toISOString() },
    { id: 'ins_demo_2', sessionId: 's_demo_1', stagiaireId: 'stag_demo_2', statut: 'confirme', presence: null, createdAt: new Date().toISOString() },
    { id: 'ins_demo_3', sessionId: 's_demo_1', stagiaireId: 'stag_demo_3', statut: 'inscrit', presence: null, createdAt: new Date().toISOString() },
    { id: 'ins_demo_4', sessionId: 's_demo_1', stagiaireId: 'stag_demo_4', statut: 'liste_attente', presence: null, createdAt: new Date().toISOString() },
    { id: 'ins_demo_5', sessionId: 's_demo_3', stagiaireId: 'stag_demo_4', statut: 'confirme', presence: true, createdAt: new Date().toISOString() },
    { id: 'ins_demo_6', sessionId: 's_demo_3', stagiaireId: 'stag_demo_5', statut: 'confirme', presence: true, createdAt: new Date().toISOString() },
  ]
  localStorage.setItem(INSCRIPTIONS_KEY, JSON.stringify(inscriptions))
}
