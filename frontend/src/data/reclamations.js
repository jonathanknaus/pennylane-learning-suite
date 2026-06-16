const KEY = 'pls_reclamations'

export const TYPES_REMONTEE = [
  { id: 'reclamation', label: 'Réclamation', color: '#DC2626', bg: '#FEE2E2', desc: 'Insatisfaction formelle exprimée par le client' },
  { id: 'difficulte',  label: 'Difficulté',  color: '#D97706', bg: '#FEF3C7', desc: 'Problème rencontré pendant ou autour de la formation' },
  { id: 'alea',        label: 'Aléa',        color: '#7C3AED', bg: '#F5F3FF', desc: 'Événement imprévu perturbant le déroulement' },
]

export const CANAUX_REMONTEE = [
  { id: 'email',  label: 'Email' },
  { id: 'slack',  label: 'Slack' },
  { id: 'appel',  label: 'Appel téléphonique' },
  { id: 'direct', label: 'En direct (session)' },
  { id: 'autre',  label: 'Autre' },
]

export const STATUTS_RECLAMATION = [
  { id: 'ouvert',    label: 'Ouvert',    color: '#DC2626', bg: '#FEE2E2' },
  { id: 'en_cours',  label: 'En cours',  color: '#D97706', bg: '#FEF3C7' },
  { id: 'resolu',    label: 'Résolu',    color: '#059669', bg: '#D1FAE5' },
  { id: 'clos',      label: 'Clos',      color: '#6B7280', bg: '#F3F4F6' },
]

export function getReclamations() {
  try { return JSON.parse(localStorage.getItem(KEY)) || [] } catch { return [] }
}

export function saveReclamation(rec) {
  const all = getReclamations()
  if (!rec.id) rec.id = `rec_${Date.now()}`
  if (!rec.created_at) rec.created_at = new Date().toISOString()
  const idx = all.findIndex(r => r.id === rec.id)
  if (idx >= 0) all[idx] = rec
  else all.unshift(rec)
  localStorage.setItem(KEY, JSON.stringify(all))
  return rec
}

export function deleteReclamation(id) {
  const all = getReclamations().filter(r => r.id !== id)
  localStorage.setItem(KEY, JSON.stringify(all))
}
