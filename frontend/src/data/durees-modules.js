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
export function totaliserDurees(modules) {
  const retenus = []
  const aConfirmer = []
  let total = 0
  for (const m of modules || []) {
    total += dureeModule(m)
    retenus.push(m)
    if (!dureeConfirmee(m)) aConfirmer.push(m)
  }
  return {
    totalHeures: Math.round(total * 100) / 100,
    // Une estimation est toujours calculable ; « confirme » dit si elle repose
    // uniquement sur des durées établies ou en partie sur la convention de 1 h.
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
