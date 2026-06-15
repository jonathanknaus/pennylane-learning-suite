const KEY = 'pls_entreprises'

export function getEntreprises() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

export function saveEntreprise(entreprise) {
  const list = getEntreprises()
  const idx = list.findIndex(e => e.id === entreprise.id)
  if (idx >= 0) {
    list[idx] = entreprise
  } else {
    list.push({ ...entreprise, id: `ent_${Date.now()}`, createdAt: new Date().toISOString() })
  }
  localStorage.setItem(KEY, JSON.stringify(list))
  return list
}

export function deleteEntreprise(id) {
  const list = getEntreprises().filter(e => e.id !== id)
  localStorage.setItem(KEY, JSON.stringify(list))
  return list
}

export async function fetchInfosSiret(siret) {
  const clean = siret.replace(/[\s.]/g, '')
  const res = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encodeURIComponent(clean)}&page=1&per_page=3`)
  if (!res.ok) throw new Error('Erreur API INSEE')
  const data = await res.json()
  if (!data.results?.length) throw new Error('Entreprise introuvable')
  const match = data.results.find(r => r.siege?.siret === clean) || data.results[0]
  const adresse = [match.siege?.adresse, match.siege?.code_postal, match.siege?.libelle_commune]
    .filter(Boolean).join(' ')
  return {
    nom: match.nom_raison_sociale || '',
    adresse,
  }
}

export const STATUTS_BPF = [
  { id: 'oui',      label: 'Transmis',      color: '#059669', bg: '#D1FAE5' },
  { id: 'en_cours', label: 'En cours',      color: '#D97706', bg: '#FEF3C7' },
  { id: 'non',      label: 'Non transmis',  color: '#DC2626', bg: '#FEE2E2' },
]

export function seedDemoEntreprises() {
  if (getEntreprises().length > 0) return
  const demos = [
    {
      id: 'ent_demo_1', nom: 'Cabinet Martin & Associés', siret: '31200038100016',
      adresse: '12 RUE DE LA PAIX 75002 PARIS',
      contact_prenom: 'Sophie', contact_nom: 'Martin',
      contact_email: 'sophie.martin@cabinetmartin.fr', contact_tel: '01 42 60 00 00',
      contact_fonction: 'Expert-comptable', statut_bpf: 'oui', notes: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ent_demo_2', nom: 'Fiduciaire du Nord', siret: '40199925200015',
      adresse: '5 PLACE DE LA REPUBLIQUE 59000 LILLE',
      contact_prenom: 'Julie', contact_nom: 'Dupont',
      contact_email: 'julie.dupont@fiduciaire-nord.fr', contact_tel: '03 20 00 00 00',
      contact_fonction: 'Chef de mission', statut_bpf: 'en_cours', notes: '',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'ent_demo_3', nom: 'Groupe Expertise Sud', siret: '41816609801294',
      adresse: '8 AVENUE DU PRADO 13008 MARSEILLE',
      contact_prenom: 'Marc', contact_nom: 'Leroy',
      contact_email: 'marc.leroy@expertise-sud.fr', contact_tel: '04 91 00 00 00',
      contact_fonction: 'Dirigeant', statut_bpf: 'non', notes: '',
      createdAt: new Date().toISOString(),
    },
  ]
  localStorage.setItem(KEY, JSON.stringify(demos))
}
