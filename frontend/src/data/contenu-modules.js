// Contenu pédagogique détaillé d'un module : le déroulé, pas seulement les
// objectifs.
//
// ÉTAT DE DÉPART (mesuré le 2026-10-06)
//   · Les 43 modules importés de SmartOF portent DÉJÀ tout : contenu (40/43),
//     prérequis (40), public visé, modalités d'accès, modalités pédagogiques,
//     modalités d'évaluation, moyens et supports, profil des formateurs (41
//     chacun). Ces champs dormaient dans `programme` sans être affichés nulle
//     part. Rien à importer pour eux.
//   · Les 23 modules historiques de PLS n'ont QUE titre, description et
//     5 objectifs. Aucun déroulé.
//
// POURQUOI DES BLOCS, ET PAS DES FICHES ENTIÈRES
// Les fiches produit du Drive sont des OFFRES composites (« Paramétrage,
// Comptabilité, TVA et communication client »), tandis qu'un module PLS est une
// brique unitaire (« TVA », « Révision »). Une fiche ne correspond donc presque
// jamais à un module : c'est une PARTIE de fiche qui lui correspond.
//
// Les blocs sont extraits des programmes déjà présents dans PLS — 129 blocs,
// 87 intitulés distincts — et recalculés à chaque appel. Conséquence utile : un
// module SmartOF ajouté demain enrichit aussitôt la bibliothèque, sans import.
//
// ⚠️ RIEN N'EST RATTACHÉ AUTOMATIQUEMENT. Les blocs sont PROPOSÉS, l'utilisateur
// choisit. Le rapprochement automatique par libellé a déjà échoué sur les durées
// des modules (« Saisie comptable » tombait sur « RFE, optimisation de la
// saisie ») : un intitulé proche ne garantit pas un contenu proche.

import { pousser, lireCache } from './store-firebase'
import { getAllModules } from './catalogue-afs'

const CLE = 'pls_modules_contenu'

/** Sujets de chaque module historique, pour proposer les bons blocs. */
const SUJETS = {
  saisie_comptable: ['tenue', 'saisie', 'production comptable', 'transaction'],
  revision: ['révision', 'revision', 'dossier de travail', 'inventaire', 'clôture'],
  tva: ['tva', 'ca3', 'ca12', 'cadrage', 'déclaration'],
  parametrage: ['paramétr', 'parametr', 'plan comptable', 'journaux', 'connexion'],
  module_achat: ['achat', 'fournisseur'],
  notes_de_frais: ['note de frais', 'notes de frais', 'frais'],
  demandes_achats: ["demande d'achat", 'demandes d’achat', 'demande de paiement'],
  circuit_validation: ['validation', 'approbation', 'circuit'],
  reforme_rfe: ['rfe', 'réforme', 'facturation électronique'],
  methode_facturation: ['facturer', 'facturation', 'édition des ventes', 'vente'],
  relancer_clients: ['relance', 'encaissement', 'impayé'],
  integration_gestion_commerciale: ['connectivité', 'intégration', 'outils complémentaires'],
  famille_analytique: ['analytique', 'famille'],
  plans_tresorerie: ['trésorerie', 'tresorerie'],
  outils_analyse: ['autres outils', 'pilotage', 'rapport', 'analyse'],
  posture: ['posture', 'accompagn', 'embarquement'],
  presentation_partenaire: ['partenaire', 'swan', 'compte pro'],
  gestion_compte_pro: ['compte pro', 'dépôt de capital'],
  solutions_paiement: ['paiement', 'financement', 'sepa', 'prélèvement'],
  mettre_en_avant_compte_pro: ['compte pro'],
  webinaire_embarquement: ['embarquement', 'collabor', 'client'],
  construction_strategie: ['stratégie', 'plan d', 'pilotage'],
  mise_en_situation: ['cas pratique', 'mise en situation', 'mise en pratique'],
}

function programmeTexte(module) {
  const c = typeof module?.programme === 'object' ? module.programme?.contenu : module?.programme
  return String(c || '')
}

// Une ligne ouvre un bloc si elle annonce une partie, un module ou une journée,
// ou si c'est un intitulé de section (texte suivi de « : », sans minuscule
// initiale) — les deux formes coexistent dans les programmes SmartOF.
function estEnTete(ligne) {
  if (/^(#+\s*)?(PARTIE|MODULE|Jour)\b/i.test(ligne)) return true
  return /^(#+\s*)?[A-ZÉÈÀ][^a-z]{0,4}.*:\s*$/.test(ligne)
}

/**
 * Bibliothèque des blocs de contenu, extraits des programmes des modules
 * existants. Recalculée à chaque appel : la bibliothèque suit le catalogue.
 */
export function blocsDisponibles(modules) {
  const liste = modules || getAllModules()
  const blocs = []
  for (const m of liste) {
    const lignes = programmeTexte(m).split('\n').map(l => l.trim()).filter(Boolean)
    let courant = null
    for (const l of lignes) {
      if (estEnTete(l)) {
        if (courant?.points.length) blocs.push(courant)
        courant = { titre: l.replace(/^#+\s*/, ''), origine: m.titre, origineId: m.id, points: [] }
      } else if (courant) {
        courant.points.push(l)
      }
    }
    if (courant?.points.length) blocs.push(courant)
  }
  // Dédoublonnage sur l'intitulé nettoyé de sa durée : « PARTIE 1 : la TVA
  // (45 min) » et « (1 heure) » décrivent le même bloc.
  const vus = new Map()
  for (const b of blocs) {
    const cle = b.titre.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-zà-ÿ ]/gi, ' ').replace(/\s+/g, ' ').trim()
    if (!cle) continue
    if (!vus.has(cle)) vus.set(cle, { ...b, id: `bloc_${vus.size}`, cle })
  }
  return [...vus.values()]
}

/** Blocs dont l'intitulé ou les points recoupent les sujets du module. */
export function blocsCandidats(module, bibliotheque) {
  const sujets = SUJETS[module?.id] || []
  if (sujets.length === 0) return []
  const biblio = bibliotheque || blocsDisponibles()
  return biblio.filter(b => {
    const texte = `${b.titre} ${b.points.join(' ')}`.toLowerCase()
    return sujets.some(s => texte.includes(s))
  })
}

function lireTable() {
  const v = lireCache(CLE, {})
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
}

/** Contenu saisi pour un module : { blocs: [cle], texte } ou null. */
export function contenuSaisi(moduleId) {
  const v = lireTable()[moduleId]
  if (!v || typeof v !== 'object') return null
  const blocs = Array.isArray(v.blocs) ? v.blocs : []
  const texte = String(v.texte || '')
  return blocs.length === 0 && !texte.trim() ? null : { blocs, texte }
}

export function enregistrerContenu(moduleId, { blocs = [], texte = '' } = {}) {
  const table = lireTable()
  const propre = { blocs: blocs.filter(Boolean), texte: String(texte || '') }
  if (propre.blocs.length === 0 && !propre.texte.trim()) delete table[moduleId]
  else table[moduleId] = propre
  localStorage.setItem(CLE, JSON.stringify(table))
  pousser(CLE, table)
  return table
}

/**
 * Contenu effectif d'un module, par ordre de priorité :
 *   1. 'saisi'     — blocs rattachés et/ou texte libre, fait foi ;
 *   2. 'catalogue' — le programme venu de SmartOF ;
 *   3. 'absent'    — rien, et on le dit.
 */
export function contenuModule(module, bibliotheque) {
  if (!module) return { origine: 'absent', blocs: [], texte: '', programme: '' }
  const saisi = contenuSaisi(module.id)
  if (saisi) {
    const biblio = bibliotheque || blocsDisponibles()
    return {
      origine: 'saisi',
      blocs: saisi.blocs.map(c => biblio.find(b => b.cle === c)).filter(Boolean),
      texte: saisi.texte,
      programme: '',
    }
  }
  const prog = programmeTexte(module)
  if (prog.trim()) return { origine: 'catalogue', blocs: [], texte: '', programme: prog }
  return { origine: 'absent', blocs: [], texte: '', programme: '' }
}

/**
 * Champs Qualiopi d'un module. Pour les modules SmartOF ils existent déjà et
 * n'étaient simplement pas affichés ; pour les autres, ils manquent — et un
 * champ manquant doit se voir plutôt que d'être comblé par une valeur
 * plausible.
 */
export const CHAMPS_QUALIOPI = [
  { cle: 'preRequis', label: 'Prérequis' },
  { cle: 'publicVise', label: 'Public visé' },
  { cle: 'modalitesAcces', label: 'Modalités et délais d’accès' },
  { cle: 'modalitesPedagogiques', label: 'Modalités pédagogiques' },
  { cle: 'modalitesEvaluation', label: 'Modalités d’évaluation' },
  { cle: 'moyensEtSupports', label: 'Moyens et supports' },
  { cle: 'profilFormateurs', label: 'Profil des formateurs' },
]

// Textes de remplissage rencontrés dans les données SmartOF : à traiter comme
// une absence, sinon un audit lirait une réponse là où il n'y en a pas.
// ⚠️ Pas de `\b` final : en JavaScript `\b` s'appuie sur [A-Za-z0-9_], donc après
// « spécifié » il n'y a AUCUNE frontière de mot — le motif ne matchait jamais.
const REMPLISSAGE = /^(non spécifié|non specifie|n\/a|à compléter|néant)/i

export function champsQualiopi(module) {
  const p = module?.programme && typeof module.programme === 'object' ? module.programme : {}
  return CHAMPS_QUALIOPI.map(c => {
    const v = String(p[c.cle] || '').trim()
    return { ...c, valeur: REMPLISSAGE.test(v) ? '' : v }
  })
}

/** Compteurs pour l'écran d'administration. */
export function etatContenu(modules) {
  let saisi = 0, catalogue = 0, absent = 0
  const biblio = blocsDisponibles(modules)
  for (const m of modules || []) {
    const o = contenuModule(m, biblio).origine
    if (o === 'saisi') saisi++
    else if (o === 'catalogue') catalogue++
    else absent++
  }
  return { total: (modules || []).length, saisi, catalogue, absent }
}
