const KEY = 'pls_catalogue_config'

export const BPF_SPECIALITES = [
  { id: 'compta', label: 'Comptabilité' },
  { id: 'fiscalite', label: 'Fiscalité' },
  { id: 'gestion', label: 'Gestion / Management' },
  { id: 'juridique', label: 'Droit' },
  { id: 'informatique', label: 'Informatique / Logiciels' },
  { id: 'commercial', label: 'Commercial / Marketing' },
  { id: 'rh', label: 'RH / Paie' },
  { id: 'autre', label: 'Autre' },
]

export const BPF_ITEMS = [
  { id: 'f3a', label: 'F.3.a — Programme de formation', description: 'Programme détaillé avec objectifs, contenu, méthodes et durée' },
  { id: 'f3b', label: 'F.3.b — Positionnement initial', description: 'Questionnaire ou entretien préalable d\'évaluation des acquis' },
  { id: 'f3c', label: 'F.3.c — Évaluation des acquis', description: 'Évaluation en cours/fin de formation (quiz, mise en situation…)' },
  { id: 'f3d', label: 'F.3.d — Ressources pédagogiques', description: 'Supports remis aux apprenants (slides, fiches, accès en ligne…)' },
  { id: 'f3e', label: 'F.3.e — Émargement', description: 'Feuilles de présence signées par demi-journée' },
  { id: 'f3f', label: 'F.3.f — Attestation / Certificat', description: 'Attestation individuelle ou certificat de réalisation remis en fin de formation' },
]

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function getModuleConfig(moduleId) {
  const all = load()
  return all[moduleId] || { specialite: '', bpf: {}, mise_en_ligne: false }
}

export function saveModuleConfig(moduleId, config) {
  const all = load()
  all[moduleId] = { ...config }
  save(all)
}
