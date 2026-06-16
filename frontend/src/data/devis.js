const KEY = 'pls_devis'
const KEY_COUNTER = 'pls_devis_counter'

export const STATUTS_DEVIS = [
  { id: 'brouillon', label: 'Brouillon', color: '#9CA3AF', bg: '#F3F4F6' },
  { id: 'envoye',    label: 'Envoyé',    color: '#2563EB', bg: '#EFF6FF' },
  { id: 'accepte',   label: 'Accepté',   color: '#059669', bg: '#D1FAE5' },
  { id: 'refuse',    label: 'Refusé',    color: '#DC2626', bg: '#FEE2E2' },
  { id: 'expire',    label: 'Expiré',    color: '#D97706', bg: '#FEF3C7' },
  { id: 'converti',  label: 'Converti',  color: '#7C3AED', bg: '#F5F3FF' },
]

export function nextNumeroDevis() {
  const year = new Date().getFullYear()
  const key = `${KEY_COUNTER}_${year}`
  const counter = parseInt(localStorage.getItem(key) || '0', 10) + 1
  localStorage.setItem(key, counter.toString())
  return `DEV-${year}-${String(counter).padStart(4, '0')}`
}

export function getDevis() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function getDevisById(id) {
  return getDevis().find(d => d.id === id) || null
}

export function saveDevis(devis) {
  const list = getDevis()
  const idx = list.findIndex(d => d.id === devis.id)
  if (idx >= 0) {
    list[idx] = { ...devis, updatedAt: new Date().toISOString() }
  } else {
    list.unshift({
      ...devis,
      id: `dev_${Date.now()}`,
      numero: devis.numero || nextNumeroDevis(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }
  localStorage.setItem(KEY, JSON.stringify(list))
  return list
}

export function deleteDevis(id) {
  const list = getDevis().filter(d => d.id !== id)
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function calculerDevis(devis) {
  const ht = parseFloat(devis.montant_ht) || 0
  const tvaRate = parseFloat(devis.tva_taux) || 20
  const tva = ht * tvaRate / 100
  const ttc = ht + tva
  const acompte_ht = devis.acompte_pct > 0 ? ht * devis.acompte_pct / 100 : 0
  const acompte_ttc = acompte_ht * (1 + tvaRate / 100)
  return { ht, tva, ttc, acompte_ht, acompte_ttc }
}

export function convertirEnFacture(devis) {
  return {
    sessionId: devis.session_id || '',
    devisId: devis.id,
    devisNumero: devis.numero,
    type: 'principale',
    statut: 'brouillon',
    client_nom: devis.client_nom,
    client_adresse: devis.client_adresse,
    client_siret: devis.client_siret,
    objet: devis.objet,
    date_emission: new Date().toISOString().split('T')[0],
    date_echeance: '',
    montant_ht: devis.montant_ht,
    tva_taux: devis.tva_taux,
    acompte_pct: devis.acompte_pct || 0,
    financeur_nom: devis.financeur_nom || '',
    financeur_dossier: devis.financeur_dossier || '',
    notes: devis.notes ? `Issu du devis ${devis.numero}\n${devis.notes}` : `Issu du devis ${devis.numero}`,
    formateur: devis.formateur || '',
    format_duree: devis.format_duree || '',
    participants: devis.participants || 0,
  }
}

export const EMPTY_DEVIS = {
  statut: 'brouillon',
  date_emission: '',
  date_validite: '',
  client_nom: '',
  client_adresse: '',
  client_siret: '',
  contact_nom: '',
  contact_email: '',
  contact_tel: '',
  objet: '',
  description: '',
  format_duree: '',
  modalite: 'visio',
  formateur: '',
  participants: '',
  montant_ht: '',
  tva_taux: 20,
  acompte_pct: 0,
  financeur_nom: '',
  financeur_dossier: '',
  session_id: '',
  notes: '',
}
