// Indisponibilités des formateurs : les plages où ils ne peuvent pas animer.
//
// POURQUOI CE MODULE EXISTE
// Jusqu'ici, la disponibilité d'un formateur était déduite des SEULES sessions
// PLS (`estOccupe()` dans affectation-formateurs.js). Un formateur en congé, en
// réunion ou chez un client apparaissait donc disponible, et la suggestion de
// formateur le proposait en premier.
//
// ⚠️ CE QU'ON STOCKE, ET CE QU'ON NE STOCKE PAS
// Uniquement des PLAGES OCCUPÉES : un début, une fin, une origine. Jamais de
// titre d'événement, de participant ni de lieu. C'est le choix de Jonathan
// (2026-10-08) et c'est ce que l'API `freeBusy` de Google renvoie — la
// minimisation est garantie par l'API, pas par une promesse de notre part. Un
// rendez-vous médical dans l'agenda d'un formateur ne devient pas une donnée
// de PLS.
//
// Ces données restent personnelles : le nœud est protégé par
// `database.rules.json` (lecture réservée aux comptes Pennylane vérifiés,
// écriture aux administrateurs racine), et rien n'en sort vers le dépôt public.

import { ref, get, set, remove, onValue, update } from 'firebase/database'
import { baseDeDonnees, authPrete } from './firebase-auth.js'

const CHEMIN = 'indisponibilites'

/** D'où vient une plage. Affiché tel quel : on ne masque pas l'origine. */
export const ORIGINES = {
  agenda: { label: 'Agenda Google', aide: 'Importée depuis l’agenda du formateur' },
  saisie: { label: 'Saisie', aide: 'Déclarée à la main dans PLS' },
}

function db() {
  return baseDeDonnees()
}

/** `2026-10-08` depuis une Date ou une chaîne ISO. */
export function jour(d) {
  const date = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(date.getTime())) return null
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const j = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${j}`
}

/**
 * Découpe une plage en jours couverts.
 *
 * ⚠️ La borne de fin est EXCLUSIVE quand elle tombe à minuit : Google rend une
 * journée entière du 14 comme « 14 00:00 → 15 00:00 ». Compter le 15 marquerait
 * indisponible un jour entièrement libre, et un formateur disparaîtrait des
 * suggestions sans raison.
 */
export function joursCouverts(debut, fin) {
  const d = new Date(debut)
  const f = new Date(fin)
  if (Number.isNaN(d.getTime()) || Number.isNaN(f.getTime())) return []
  const jours = []
  const curseur = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const minuitPile = f.getHours() === 0 && f.getMinutes() === 0 && f.getSeconds() === 0
  const borne = new Date(f.getFullYear(), f.getMonth(), f.getDate())
  while (curseur <= borne) {
    // Une fin à minuit pile n'occupe pas le jour sur lequel elle tombe.
    if (!(minuitPile && curseur.getTime() === borne.getTime() && jours.length > 0)) {
      jours.push(jour(curseur))
    }
    curseur.setDate(curseur.getDate() + 1)
  }
  return jours
}

/** Toutes les indisponibilités, indexées par identifiant de formateur. */
export async function lireIndisponibilites() {
  await authPrete()
  const snap = await get(ref(db(), CHEMIN))
  return snap.val() || {}
}

export function ecouterIndisponibilites(callback, onErreur) {
  let stop = null
  let annule = false
  authPrete().then(() => {
    if (annule) return
    stop = onValue(
      ref(db(), CHEMIN),
      snap => callback(snap.val() || {}),
      err => { if (onErreur) onErreur(err) },
    )
  })
  return () => { annule = true; if (stop) stop() }
}

/**
 * Remplace les plages d'une origine donnée pour un formateur, sur une fenêtre.
 *
 * Remplacer plutôt qu'ajouter, et seulement pour l'origine concernée : une
 * resynchronisation de l'agenda ne doit ni accumuler les doublons, ni effacer
 * les absences saisies à la main. Les deux origines coexistent.
 */
export async function remplacerPlages(formateurId, origine, plages, fenetre) {
  await authPrete()
  if (!formateurId || !ORIGINES[origine]) throw new Error('Formateur ou origine inconnus.')
  const chemin = `${CHEMIN}/${formateurId}`
  const snap = await get(ref(db(), chemin))
  const existant = snap.val() || {}

  const conserve = {}
  for (const [id, p] of Object.entries(existant)) {
    if (p?.origine !== origine) { conserve[id] = p; continue }
    // Hors de la fenêtre resynchronisée : on garde, sinon une synchro d'octobre
    // effacerait l'historique de septembre.
    if (fenetre && (p.debut < fenetre.debut || p.debut > fenetre.fin)) conserve[id] = p
  }

  let n = 0
  for (const p of plages || []) {
    if (!p?.debut || !p?.fin) continue
    conserve[`${origine}_${p.debut.replace(/[^0-9]/g, '')}_${n++}`] = {
      debut: p.debut, fin: p.fin, origine,
      majLe: new Date().toISOString(),
    }
  }
  await set(ref(db(), chemin), conserve)
  return n
}

/** Ajoute une absence déclarée à la main. */
export async function ajouterSaisie(formateurId, debut, fin, motif = '') {
  await authPrete()
  if (!formateurId || !debut || !fin) throw new Error('Dates incomplètes.')
  const id = `saisie_${Date.now()}`
  await update(ref(db(), `${CHEMIN}/${formateurId}/${id}`), {
    debut, fin, origine: 'saisie',
    motif: String(motif || '').slice(0, 120),
    majLe: new Date().toISOString(),
  })
  return id
}

export async function supprimerPlage(formateurId, plageId) {
  await authPrete()
  await remove(ref(db(), `${CHEMIN}/${formateurId}/${plageId}`))
}

/**
 * Index { formateurId: Set<jour> } à partir du nœud brut.
 * Calculé une fois puis interrogé : `estIndisponible()` est appelée pour chaque
 * formateur de chaque jour affiché.
 */
export function indexerParJour(brut) {
  const index = {}
  for (const [formateurId, plages] of Object.entries(brut || {})) {
    const jours = new Set()
    for (const p of Object.values(plages || {})) {
      if (!p?.debut || !p?.fin) continue
      for (const j of joursCouverts(p.debut, p.fin)) jours.add(j)
    }
    index[formateurId] = jours
  }
  return index
}

export function estIndisponible(index, formateurId, dateStr) {
  return Boolean(index?.[formateurId]?.has(dateStr))
}

/** Plages d'un formateur sur un jour, pour l'afficher au survol. */
export function plagesDuJour(brut, formateurId, dateStr) {
  const plages = Object.entries(brut?.[formateurId] || {})
  return plages
    .map(([id, p]) => ({ id, ...p }))
    .filter(p => p.debut && p.fin && joursCouverts(p.debut, p.fin).includes(dateStr))
    .sort((a, b) => String(a.debut).localeCompare(String(b.debut)))
}

/** Compteurs pour l'écran : combien de formateurs couverts, et depuis quand. */
export function etatCouverture(brut, formateurs) {
  const parOrigine = { agenda: 0, saisie: 0 }
  let derniereMaj = null
  for (const plages of Object.values(brut || {})) {
    for (const p of Object.values(plages || {})) {
      if (parOrigine[p?.origine] !== undefined) parOrigine[p.origine]++
      if (p?.majLe && (!derniereMaj || p.majLe > derniereMaj)) derniereMaj = p.majLe
    }
  }
  const couverts = Object.keys(brut || {}).filter(id => Object.keys(brut[id] || {}).length > 0)
  return {
    total: (formateurs || []).length,
    couverts: couverts.length,
    plages: parOrigine.agenda + parOrigine.saisie,
    parOrigine,
    derniereMaj,
  }
}
