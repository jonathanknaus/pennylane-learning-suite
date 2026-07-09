const STORAGE_KEY = 'pls_gestionnaires'
const DELEG_KEY = 'pls_delegations'

export const CIVILITES = ['M.', 'Mme', 'Dr', 'Pr']

const DEFAUT = [
  {
    id: 'g1',
    civilite: 'Mme',
    prenom: 'Sarah',
    nom: 'BRIDEN',
    email: 'sarah.briden@pennylane-partners.com',
    telephone: '',
    notes: 'Responsable administratif et réglementaire — dossiers, devis, conventions, facturation.',
    actif: true,
  },
]

export function getGestionnaires() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : DEFAUT
  } catch {
    return DEFAUT
  }
}

export function saveGestionnaires(liste) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(liste))
}

export function saveGestionnaire(gestionnaire) {
  const liste = getGestionnaires()
  const idx = liste.findIndex(g => g.id === gestionnaire.id)
  if (idx >= 0) {
    liste[idx] = gestionnaire
  } else {
    liste.push({ ...gestionnaire, id: `g_${Date.now()}`, actif: true, createdAt: new Date().toISOString() })
  }
  saveGestionnaires(liste)
  return liste
}

export function deleteGestionnaire(id) {
  const updated = getGestionnaires().filter(g => g.id !== id)
  saveGestionnaires(updated)
  return updated
}

export function getGestionnaireDefaut() {
  const liste = getGestionnaires()
  return liste.find(g => g.actif) || liste[0] || null
}

// ── Délégations d'attributions ───────────────────────────────────────────────
// Une délégation transfère les tâches/rappels d'un gestionnaire vers un autre,
// temporairement (congés, absence) ou de façon permanente (départ).

function loadDelegations() {
  try { return JSON.parse(localStorage.getItem(DELEG_KEY) || '[]') } catch { return [] }
}

function saveDelegations(liste) {
  localStorage.setItem(DELEG_KEY, JSON.stringify(liste))
}

export function getDelegations() {
  return loadDelegations()
}

export function addDelegation({ deId, versId, type, dateDebut, dateFin, motif }) {
  const liste = loadDelegations()
  const nouvelle = {
    id: `deleg_${Date.now()}`,
    deId,
    versId,
    type, // 'temporaire' | 'permanente'
    dateDebut: dateDebut || new Date().toISOString().slice(0, 10),
    dateFin: type === 'temporaire' ? (dateFin || null) : null,
    motif: motif || '',
    active: true,
    createdAt: new Date().toISOString(),
  }
  liste.push(nouvelle)
  saveDelegations(liste)
  return nouvelle
}

export function endDelegation(id) {
  const liste = loadDelegations().map(d => d.id === id ? { ...d, active: false } : d)
  saveDelegations(liste)
  return liste
}

// Renvoie la délégation active (en cours) d'un gestionnaire donné, s'il en a une.
export function getDelegationActive(gestionnaireId) {
  const today = new Date().toISOString().slice(0, 10)
  return loadDelegations().find(d => {
    if (d.deId !== gestionnaireId || !d.active) return false
    if (d.type === 'permanente') return true
    if (!d.dateFin) return d.dateDebut <= today
    return d.dateDebut <= today && today <= d.dateFin
  }) || null
}

// Suit la chaîne de délégations pour trouver le responsable effectif (destinataire final).
export function resolveResponsable(gestionnaireId, hop = 0) {
  if (!gestionnaireId || hop > 5) return gestionnaireId
  const deleg = getDelegationActive(gestionnaireId)
  if (!deleg) return gestionnaireId
  return resolveResponsable(deleg.versId, hop + 1)
}
