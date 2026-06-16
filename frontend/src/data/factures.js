const KEY = 'pls_factures'
const KEY_COUNTER = 'pls_facture_counter'

export const STATUTS_FACTURE = [
  { id: 'brouillon',  label: 'Brouillon',   color: '#9CA3AF', bg: '#F3F4F6' },
  { id: 'emise',      label: 'Émise',       color: '#2563EB', bg: '#EFF6FF' },
  { id: 'partielle',  label: 'Acompte reçu',color: '#D97706', bg: '#FEF3C7' },
  { id: 'payee',      label: 'Payée',       color: '#059669', bg: '#D1FAE5' },
  { id: 'annulee',    label: 'Annulée',     color: '#DC2626', bg: '#FEE2E2' },
]

export const TYPES_FACTURE = [
  { id: 'principale', label: 'Facture principale' },
  { id: 'acompte',    label: 'Facture d\'acompte' },
  { id: 'solde',      label: 'Facture de solde' },
  { id: 'avoir',      label: 'Avoir' },
]

function nextNumero() {
  const year = new Date().getFullYear()
  const key = `${KEY_COUNTER}_${year}`
  const counter = parseInt(localStorage.getItem(key) || '0', 10) + 1
  localStorage.setItem(key, counter.toString())
  return `AFS-${year}-${String(counter).padStart(4, '0')}`
}

export function getFactures() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function getFacturesBySession(sessionId) {
  return getFactures().filter(f => f.sessionId === sessionId)
}

export function saveFacture(facture) {
  const list = getFactures()
  const idx = list.findIndex(f => f.id === facture.id)
  if (idx >= 0) {
    list[idx] = { ...facture, updatedAt: new Date().toISOString() }
  } else {
    const numero = facture.numero || nextNumero()
    list.push({
      ...facture,
      id: `fac_${Date.now()}`,
      numero,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
  }
  localStorage.setItem(KEY, JSON.stringify(list))
  return list
}

export function deleteFacture(id) {
  const list = getFactures().filter(f => f.id !== id)
  localStorage.setItem(KEY, JSON.stringify(list))
  return list
}

export function createFactureFromSession(session, format, prix) {
  return {
    sessionId: session.id,
    type: 'principale',
    statut: 'brouillon',
    client_nom: session.client || '',
    client_adresse: '',
    client_siret: '',
    objet: session.titre,
    date_emission: new Date().toISOString().split('T')[0],
    date_echeance: '',
    montant_ht: prix || '',
    tva_taux: 20,
    acompte_pct: 0,
    financeur_nom: '',
    financeur_dossier: '',
    notes: '',
    formateur: session.formateur || '',
    format_duree: format?.duree || '',
    participants: 0,
  }
}

export function calculerFacture(facture) {
  const ht = parseFloat(facture.montant_ht) || 0
  const tva = ht * (parseFloat(facture.tva_taux) || 20) / 100
  const ttc = ht + tva
  const acompte_ht = facture.acompte_pct > 0 ? ht * facture.acompte_pct / 100 : 0
  const acompte_ttc = acompte_ht * (1 + (parseFloat(facture.tva_taux) || 20) / 100)
  return { ht, tva, ttc, acompte_ht, acompte_ttc }
}
