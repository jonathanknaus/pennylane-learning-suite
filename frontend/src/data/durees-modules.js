// Durée pédagogique par module, en heures.
//
// Pourquoi un stockage à part plutôt qu'un champ ajouté au catalogue :
//   · Les 23 modules historiques de catalogue-afs.js n'ont pas de durée, et
//     l'éditeur existant ne sait qu'AJOUTER des modules personnalisés — il ne
//     modifie pas les modules statiques.
//   · catalogue-afs.js est activement modifié par le chantier SmartOF. Y toucher
//     créerait des conflits inutiles.
//   · Les modules importés de SmartOF portent DÉJÀ leur propre `duree` : il ne
//     faut surtout pas l'écraser, seulement compléter ce qui manque.
//
// Ces durées alimentent le simulateur de tarif : la somme des modules choisis
// donne la durée, dont la grille déduit le format et le prix. Une durée fausse
// produirait donc un prix faux — d'où le principe suivant.
//
// ⚠️ PRINCIPE : aucune durée n'est présentée comme établie si elle ne l'est pas.
// Une durée manquante reçoit une valeur PROPOSÉE, explicitement marquée comme
// telle, et toute estimation qui en dépend le signale. Rien n'est caché derrière
// un chiffre d'apparence définitive.

import { pousser, lireCache } from './store-firebase'

const CLE = 'pls_modules_duree'

// Valeurs proposées à la saisie. Bornées à la réalité des formats AFS : une
// session va de l'heure à la journée, au-delà on compte en journées.
// ── Formats : l'ampleur voulue sur un sujet ──────────────────────────────────
//
// Un même sujet ne dure pas une durée fixe. Jonathan l'a posé ainsi
// (2026-10-06) : « un sujet comme la TVA peut être abordé durant 1 h, 2 h ou même
// une demi-journée. Tout dépend du niveau de l'apprenant avant formation et de
// l'ampleur de la formation à dispenser. »
//
// C'est pourquoi la question « quelle est la durée de ce module ? » était mal
// posée — et pourquoi 26 modules traînaient en « durée à confirmer » : il n'y a
// pas une durée à confirmer, il y a une ampleur à choisir au moment de la demande.
//
// ⚠️ L'ampleur varie À L'INVERSE du niveau : on part de zéro en 3 h 30, on révise
// en 1 h. Le niveau déclaré par le cabinet suggère donc le format, sans jamais
// l'imposer — c'est lui qui connaît ses équipes.
export const FORMATS = [
  {
    id: 'rappel',
    heures: 1,
    label: 'Rappel',
    accroche: 'Vos équipes pratiquent déjà',
    pour: 'expert',
    explication: "Une remise en main sur un sujet déjà pratiqué. On reprend les points qui coincent, " +
      "on redresse les habitudes prises de travers et on repart avec les bons réflexes. " +
      "Pas de découverte : du recadrage.",
  },
  {
    id: 'approfondissement',
    heures: 2,
    label: 'Approfondissement',
    accroche: 'Les bases sont acquises',
    pour: 'intermediaire',
    explication: "Le quotidien est maîtrisé, mais une partie de l’outil reste inexploitée. On va " +
      "chercher les cas particuliers, les automatisations et les contrôles auxquels on ne pense " +
      "pas — ceux qui font gagner du temps et évitent les erreurs en fin d’exercice.",
  },
  {
    id: 'fondamentaux',
    heures: 3.5,
    label: 'Fondamentaux',
    accroche: 'Le sujet est nouveau',
    pour: 'debutant',
    explication: "Une demi-journée pour partir de zéro. Chaque étape est montrée puis refaite par " +
      "les participants, jusqu’à ce qu’ils sachent faire seuls. À retenir dès qu’une partie du " +
      "groupe découvre le sujet : en moins de temps, la pratique manque.",
  },
]

export const FORMAT_DEFAUT = 'approfondissement'

export function format(id) {
  return FORMATS.find(f => f.id === id) || null
}

export function heuresFormat(id) {
  return format(id)?.heures ?? null
}

/** Format correspondant à un niveau déclaré. Une suggestion, pas une contrainte. */
export function formatSuggere(niveau) {
  return FORMATS.find(f => f.pour === niveau)?.id || FORMAT_DEFAUT
}

/**
 * Le niveau déclaré et le format retenu se contredisent-ils ?
 * Débutant en 1 h ou expert en 3 h 30 : ce n'est pas interdit — le cabinet peut
 * avoir ses raisons — mais cela mérite d'être dit avant de valider un devis.
 */
export function formatIncoherent(niveau, idFormat) {
  if (!niveau || !idFormat) return null
  if (niveau === 'debutant' && idFormat === 'rappel') {
    return 'Vous avez indiqué un niveau débutant : une heure suffit rarement à partir de zéro.'
  }
  if (niveau === 'expert' && idFormat === 'fondamentaux') {
    return 'Vous avez indiqué un niveau expert : une demi-journée de fondamentaux sera sans doute redondante.'
  }
  return null
}

export const DUREES_PROPOSEES = [0.5, 1, 1.5, 2, 3.5, 7, 14]

export function libelleDuree(h) {
  if (h === null || h === undefined || h === '') return 'Non renseignée'
  const n = Number(h)
  if (!Number.isFinite(n) || n <= 0) return 'Non renseignée'
  if (n === 3.5) return '3h30 (demi-journée)'
  if (n === 7) return '7h (journée)'
  if (n === 14) return '14h (2 journées)'
  if (Number.isInteger(n)) return `${n}h`
  return `${Math.floor(n)}h${String(Math.round((n % 1) * 60)).padStart(2, '0')}`
}

// Durée proposée à défaut de toute autre information.
//
// Fondement : la grille tarifaire énonce « Session 1h = 1 ou 2 modules ». Un
// module vaut donc de l'ordre d'une heure. C'est une CONVENTION assumée, pas une
// mesure — d'où le statut « proposee », qui reste visible jusqu'à confirmation.
//
// Une dérivation depuis les libellés SmartOF a été tentée puis écartée : sur
// 23 modules, 0 correspondance exacte, 19 sans rien, et les 4 rapprochements
// partiels étaient faux (« Saisie comptable » tombait sur « RFE, optimisation
// de la saisie »). Les suggestions sont donc proposées à l'écran, à l'arbitrage
// de l'utilisateur, jamais appliquées d'office.
export const DUREE_PROPOSEE_DEFAUT = 1

function normaliserTitre(t) {
  return String(t || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Modules du catalogue dont le libellé ressemble à celui-ci ET qui portent une
// durée. Rendu à l'écran comme suggestion, avec le libellé source visible pour
// que l'utilisateur puisse juger de la pertinence.
export function suggestions(module, tousModules) {
  const n = normaliserTitre(module?.titre)
  if (!n) return []
  return (tousModules || [])
    .filter(m => m.id !== module.id)
    .filter(m => Number(m.duree) > 0)
    .filter(m => {
      const c = normaliserTitre(m.titre)
      return c === n || c.includes(n) || n.includes(c)
    })
    .map(m => ({ id: m.id, titre: m.titre, duree: Number(m.duree) }))
    .slice(0, 3)
}

function lireTable() {
  const v = lireCache(CLE, {})
  return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
}

/** Durée saisie manuellement pour un module, ou null. */
export function dureeSaisie(moduleId) {
  const v = lireTable()[moduleId]
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : null
}

/**
 * Durée effective d'un module, par ordre de priorité :
 *   1. celle qu'il porte déjà (import SmartOF) — fait foi, jamais écrasée
 *   2. celle saisie à la main
 *   3. à défaut, la convention de DUREE_PROPOSEE_DEFAUT
 * Ne rend donc jamais null : c'est origineDuree() qui dit si la valeur est
 * établie ou seulement proposée.
 */
export function dureeModule(module) {
  if (!module) return null
  const propre = Number(module.duree)
  if (Number.isFinite(propre) && propre > 0) return propre
  const saisie = dureeSaisie(module.id)
  if (saisie !== null) return saisie
  // Jamais null : on propose, et l'origine « proposee » dit que c'est à confirmer.
  return DUREE_PROPOSEE_DEFAUT
}

// 'catalogue' : importée de SmartOF, fait foi.
// 'saisie'    : renseignée à la main, fait foi.
// 'proposee'  : convention de 1 h, à confirmer — signalée dans les estimations.
export function origineDuree(module) {
  if (!module) return 'proposee'
  const propre = Number(module.duree)
  if (Number.isFinite(propre) && propre > 0) return 'catalogue'
  return dureeSaisie(module.id) !== null ? 'saisie' : 'proposee'
}

export function dureeConfirmee(module) {
  return origineDuree(module) !== 'proposee'
}

export function enregistrerDuree(moduleId, heures) {
  const table = lireTable()
  const n = Number(heures)
  if (Number.isFinite(n) && n > 0) table[moduleId] = n
  else delete table[moduleId]
  localStorage.setItem(CLE, JSON.stringify(table))
  pousser(CLE, table)
  return table
}

/**
 * Agrège une sélection de modules.
 *   `complet`  : au moins un module sélectionné, donc une estimation calculable.
 *   `confirme` : toutes les durées sont établies (catalogue ou saisie). Faux dès
 *                qu'une repose sur la convention — le simulateur doit alors
 *                afficher l'estimation EN LA SIGNALANT comme à confirmer, plutôt
 *                que de la présenter comme un prix arrêté.
 *   `aConfirmer` : les modules concernés, pour pouvoir les nommer à l'écran.
 */
export function totaliserDurees(modules, formatsChoisis) {
  const fmts = formatsChoisis || {}
  const retenus = []
  const aConfirmer = []
  let total = 0
  for (const m of modules || []) {
    retenus.push(m)
    // 1. L'ampleur choisie par le cabinet fait foi : c'est lui qui sait s'il
    //    part de zéro ou s'il révise.
    const heures = heuresFormat(fmts[m.id])
    if (heures !== null) { total += heures; continue }
    // 2. À défaut, la durée portée par le module (produit SmartOF fini).
    const propre = Number(m.duree)
    if (Number.isFinite(propre) && propre > 0) { total += propre; continue }
    // 3. À défaut encore, la durée saisie à la main.
    const saisie = dureeSaisie(m.id)
    if (saisie !== null) { total += saisie; continue }
    // 4. Sinon le format par défaut, et on le signale : l'estimation reste
    //    calculable, mais elle repose sur une hypothèse.
    total += heuresFormat(FORMAT_DEFAUT)
    aConfirmer.push(m)
  }
  return {
    totalHeures: Math.round(total * 100) / 100,
    // Une estimation est toujours calculable ; « confirme » dit si elle repose
    // uniquement sur des ampleurs choisies et des durées établies.
    complet: retenus.length > 0,
    confirme: retenus.length > 0 && aConfirmer.length === 0,
    retenus,
    aConfirmer,
  }
}

/** Compteurs pour l'écran d'administration du catalogue. */
export function etatCouverture(modules) {
  let catalogue = 0, saisie = 0, proposee = 0
  for (const m of modules || []) {
    const o = origineDuree(m)
    if (o === 'catalogue') catalogue++
    else if (o === 'saisie') saisie++
    else proposee++
  }
  return { total: (modules || []).length, catalogue, saisie, proposee }
}
