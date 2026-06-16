export const RESPONSABLE = {
  prenom: 'Sarah',
  nom: 'BRIDEN',
  email: 'sarah.briden@pennylane-partners.com',
  role: 'Responsable du traitement',
}

export const CIVILITES = ['M.', 'Mme', 'Dr', 'Pr']

export const STATUTS_BPF_FORMATEUR = [
  { id: 'oui',      label: 'Transmis',     color: '#059669', bg: '#D1FAE5' },
  { id: 'en_cours', label: 'En cours',     color: '#D97706', bg: '#FEF3C7' },
  { id: 'non',      label: 'Non transmis', color: '#DC2626', bg: '#FEE2E2' },
]

const STORAGE_KEY = 'pls_formateurs'

const DEFAUT = [
  { id: 'f1', civilite: 'M.',  prenom: 'Timothy',  nom: 'RATSIMA',     email: 'timothy.ratsima@pennylane.com',   actif: true, competences: [], statut_bpf: 'non', adresse: '', cout_journalier: '', telephone: '', notes: '' },
  { id: 'f2', civilite: 'M.',  prenom: 'Thomas',   nom: 'NOUET',        email: 'thomas.nouet@pennylane.com',      actif: true, competences: [], statut_bpf: 'non', adresse: '', cout_journalier: '', telephone: '', notes: '' },
  { id: 'f3', civilite: 'Mme', prenom: 'Laure',    nom: 'CASAGRAN',     email: 'laure.casagran@pennylane.com',    actif: true, competences: [], statut_bpf: 'non', adresse: '', cout_journalier: '', telephone: '', notes: '' },
  { id: 'f4', civilite: 'M.',  prenom: 'Etienne',  nom: 'BARTHELEMY',   email: 'etienne.barthelemy@pennylane.com',actif: true, competences: [], statut_bpf: 'non', adresse: '', cout_journalier: '', telephone: '', notes: '' },
  { id: 'f5', civilite: 'M.',  prenom: 'Jonathan', nom: 'KNAUS',        email: 'jonathan.knaus@pennylane.com',    actif: true, competences: [], statut_bpf: 'oui', adresse: '4 Rue Jules Lefebvre, 75009 Paris', cout_journalier: 800, telephone: '', notes: 'Responsable AFS' },
]

export function getFormateurs() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : DEFAUT
  } catch {
    return DEFAUT
  }
}

export function saveFormateurs(liste) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(liste))
}

export function saveFormateur(formateur) {
  const liste = getFormateurs()
  const idx = liste.findIndex(f => f.id === formateur.id)
  if (idx >= 0) {
    liste[idx] = formateur
  } else {
    liste.push({ ...formateur, id: `fmt_${Date.now()}`, createdAt: new Date().toISOString() })
  }
  saveFormateurs(liste)
  return liste
}

export function addFormateur(prenom, nom, email) {
  const liste = getFormateurs()
  const nouveau = { id: `f_${Date.now()}`, civilite: '', prenom, nom, email, actif: true, competences: [], statut_bpf: 'non', adresse: '', cout_journalier: '', telephone: '', notes: '' }
  const updated = [...liste, nouveau]
  saveFormateurs(updated)
  return updated
}

export function updateFormateur(id, changes) {
  const updated = getFormateurs().map(f => f.id === id ? { ...f, ...changes } : f)
  saveFormateurs(updated)
  return updated
}

export function removeFormateur(id) {
  const updated = getFormateurs().filter(f => f.id !== id)
  saveFormateurs(updated)
  return updated
}

export function deleteFormateur(id) {
  return removeFormateur(id)
}
