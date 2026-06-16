const KEY = 'pls_financeurs'

export const TYPES_FINANCEUR = [
  { id: 'opco',   label: 'OPCO',            color: '#2563EB', bg: '#EFF6FF' },
  { id: 'faf',    label: 'FAF',             color: '#7C3AED', bg: '#F5F3FF' },
  { id: 'cpf',    label: 'CPF',             color: '#059669', bg: '#D1FAE5' },
  { id: 'region', label: 'Région / DREETS', color: '#D97706', bg: '#FEF3C7' },
  { id: 'autre',  label: 'Autre',           color: '#6B7280', bg: '#F3F4F6' },
]

export function getFinanceurs() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function saveFinanceur(financeur) {
  const list = getFinanceurs()
  const idx = list.findIndex(f => f.id === financeur.id)
  if (idx >= 0) {
    list[idx] = financeur
  } else {
    list.push({ ...financeur, id: `fin_${Date.now()}`, createdAt: new Date().toISOString() })
  }
  localStorage.setItem(KEY, JSON.stringify(list))
  return list
}

export function deleteFinanceur(id) {
  const list = getFinanceurs().filter(f => f.id !== id)
  localStorage.setItem(KEY, JSON.stringify(list))
  return list
}

export function seedDemoFinanceurs() {
  if (getFinanceurs().length > 0) return
  const demos = [
    {
      id: 'fin_demo_1',
      nom: 'AGEFOS-PME (OPCO EP)',
      type: 'opco',
      siret: '77563223100043',
      contact_prenom: 'Marie',
      contact_nom: 'Leblanc',
      contact_email: 'marie.leblanc@opcorp.fr',
      contact_tel: '01 55 00 00 01',
      adresse: '10 Rue de la Paix, 75002 Paris',
      notes: 'OPCO principal pour les cabinets comptables',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'fin_demo_2',
      nom: 'FIFPL',
      type: 'faf',
      siret: '30274068600033',
      contact_prenom: 'Pierre',
      contact_nom: 'Dupont',
      contact_email: 'pierre.dupont@fifpl.fr',
      contact_tel: '01 40 00 00 02',
      adresse: '2 Rue de Courcelles, 75008 Paris',
      notes: 'FAF pour les professions libérales',
      createdAt: new Date().toISOString(),
    },
  ]
  localStorage.setItem(KEY, JSON.stringify(demos))
}
