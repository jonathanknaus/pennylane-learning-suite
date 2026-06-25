export const RESPONSABLE = {
  prenom: 'Sarah',
  nom: 'BRIDEN',
  email: 'sarah.briden@pennylane-partners.com',
  role: 'Responsable du traitement',
}

const STORAGE_KEY = 'pls_formateurs_veille'

const DEFAUT = [
  { id: 'f1', prenom: 'Timothy',  nom: 'RATSIMA',     email: 'timothy.ratsima@pennylane.com',   actif: true },
  { id: 'f2', prenom: 'Thomas',   nom: 'NOUET',        email: 'thomas.nouet@pennylane.com',       actif: true },
  { id: 'f3', prenom: 'Laure',    nom: 'CASAGRAN',     email: 'laure.casagran@pennylane.com',     actif: true },
  { id: 'f4', prenom: 'Etienne',  nom: 'BARTHELEMY',   email: 'etienne.barthelemy@pennylane.com', actif: true },
  { id: 'f5', prenom: 'Jonathan', nom: 'KNAUS',        email: 'jonathan.knaus@pennylane.com',     actif: true },
]

export function getFormateursVeille() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : DEFAUT
  } catch {
    return DEFAUT
  }
}

export function saveFormateursVeille(liste) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(liste))
}

export function addFormateurVeille(prenom, nom, email) {
  const liste = getFormateursVeille()
  const nouveau = { id: `fv_${Date.now()}`, prenom, nom, email, actif: true }
  const updated = [...liste, nouveau]
  saveFormateursVeille(updated)
  return updated
}

export function updateFormateurVeille(id, changes) {
  const updated = getFormateursVeille().map(f => f.id === id ? { ...f, ...changes } : f)
  saveFormateursVeille(updated)
  return updated
}

export function removeFormateurVeille(id) {
  const updated = getFormateursVeille().filter(f => f.id !== id)
  saveFormateursVeille(updated)
  return updated
}
