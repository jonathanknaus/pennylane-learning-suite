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
  // La responsable est destinataire comme les autres, bien que ce soit elle qui
  // prépare les mails : elle garde ainsi une copie de ce qui est diffusé dans sa
  // propre boîte, et son absence de la liste serait une faille le jour où
  // quelqu'un d'autre diffuse.
  { id: 'f6', prenom: RESPONSABLE.prenom, nom: RESPONSABLE.nom, email: RESPONSABLE.email, actif: true },
]

// Ajout rattrapé une seule fois pour les listes déjà enregistrées.
//
// DEFAUT ne sert que si le stockage local est vide : sans ce rattrapage, ajouter
// la responsable au code n'aurait rien changé sur un poste qui a déjà sa liste.
// Un marqueur évite de la faire réapparaître si elle est retirée ensuite — le
// bouton de suppression doit rester vrai.
const CLE_AJOUT_RESPONSABLE = 'pls_formateurs_veille_responsable_ajoute'

function rattraperResponsable(liste) {
  if (localStorage.getItem(CLE_AJOUT_RESPONSABLE)) return liste
  localStorage.setItem(CLE_AJOUT_RESPONSABLE, new Date().toISOString())
  const cible = RESPONSABLE.email.toLowerCase()
  if (liste.some(f => String(f.email || '').toLowerCase() === cible)) return liste
  const complete = [
    ...liste,
    { id: `fv_${Date.now()}`, prenom: RESPONSABLE.prenom, nom: RESPONSABLE.nom, email: RESPONSABLE.email, actif: true },
  ]
  saveFormateursVeille(complete)
  return complete
}

export function getFormateursVeille() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return DEFAUT
    const liste = JSON.parse(stored)
    return Array.isArray(liste) ? rattraperResponsable(liste) : DEFAUT
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
