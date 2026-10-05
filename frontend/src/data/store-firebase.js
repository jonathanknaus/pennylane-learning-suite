// Couche de stockage partagé — Firebase comme source de vérité, localStorage
// comme cache d'affichage.
//
// Pourquoi : les données ne peuvent plus vivre dans un seul navigateur. Un
// cabinet saisit ses apprenants depuis son poste, l'équipe les consulte depuis
// le sien, et deux navigateurs ne partagent rien.
//
// Principe de fonctionnement, repris de ce qui marche déjà pour la veille :
//   - La lecture synchrone rend le cache local : l'affichage reste instantané
//     et l'application continue de fonctionner hors ligne.
//   - Un écouteur temps réel met le cache à jour dès qu'une autre personne
//     modifie la donnée.
//   - L'écriture va dans Firebase ET dans le cache, pour que l'interface se
//     rafraîchisse sans attendre l'aller-retour réseau.
//
// Garde-fou : au PREMIER instantané, une collection vide côté Firebase ne vide
// jamais le cache local. Sans cela, ouvrir l'application avant la migration
// effacerait les données existantes.

import { ref, get, set, onValue } from 'firebase/database'
import { baseDeDonnees, authPrete } from './firebase-auth.js'

const RACINE = 'donnees'

// Collections volontairement NON partagées : propres à un poste ou à une
// session de navigateur, elles n'ont aucun sens ailleurs.
// Déjà migrées vers un nœud dédié : les transférer dans donnees/ créerait un
// doublon inutile et trompeur.
export const CLES_DEJA_MIGREES = ['pls_traitements']

export const CLES_LOCALES = [
  'pls_session',
  'pls_portail_app_session',
  'pls_portail_fmt_session',
  'pls_portail_cabinet_session',
  'pls_cabinet_email_en_attente',
  'pls_seuil_masquage_veille',
  'pls_last_backup',
  'pls_workflows_migrated_v2',
]

export function estPartageable(cle) {
  return cle.startsWith('pls_')
    && !CLES_LOCALES.includes(cle)
    && !CLES_DEJA_MIGREES.includes(cle)
}

function chemin(cle) { return `${RACINE}/${cle}` }
function cheminMeta(cle) { return `${RACINE}/_meta/${cle}` }

// Une collection n'est tirée depuis Firebase que si elle a été explicitement
// DÉCLARÉE migrée. Sans cela, ouvrir l'application depuis un poste dont le
// cache local est la vraie référence ferait écraser ses données par celles,
// éventuellement partielles, déjà présentes en base.
//
// Le cas concret qui a imposé ce garde-fou : localhost et le site déployé ont
// des stockages locaux distincts. Transférer depuis l'un puis ouvrir l'autre
// écrasait les données du second.
const marqueurs = {}

export async function estMigree(cle) {
  if (cle in marqueurs) return marqueurs[cle]
  await authPrete()
  try {
    const snap = await get(ref(baseDeDonnees(), cheminMeta(cle)))
    marqueurs[cle] = !!snap.val()?.migreLe
  } catch {
    marqueurs[cle] = false
  }
  return marqueurs[cle]
}

async function marquerMigree(cle, emailAuteur) {
  await set(ref(baseDeDonnees(), cheminMeta(cle)), {
    migreLe: new Date().toISOString(),
    migrePar: String(emailAuteur || '').toLowerCase(),
  })
  marqueurs[cle] = true
}

// ── Cache local ──────────────────────────────────────────────────────────────

export function lireCache(cle, defaut = null) {
  try {
    const brut = localStorage.getItem(cle)
    return brut === null ? defaut : JSON.parse(brut)
  } catch {
    return defaut
  }
}

function ecrireCache(cle, valeur) {
  try { localStorage.setItem(cle, JSON.stringify(valeur)) } catch {}
}

// ── Lecture / écriture partagées ─────────────────────────────────────────────

export async function lirePartage(cle, defaut = null) {
  await authPrete()
  const snap = await get(ref(baseDeDonnees(), chemin(cle)))
  const v = snap.val()
  if (v === null || v === undefined) return lireCache(cle, defaut)
  ecrireCache(cle, v)
  return v
}

export async function ecrirePartage(cle, valeur) {
  ecrireCache(cle, valeur) // cache d'abord : l'interface ne doit pas attendre
  await authPrete()
  await set(ref(baseDeDonnees(), chemin(cle)), valeur)
  return valeur
}

// Écoute temps réel. Rend une fonction d'arrêt utilisable immédiatement, même si
// l'abonnement réel n'est pas encore en place (l'authentification est asynchrone).
export function ecouterPartage(cle, callback, onErreur) {
  let stop = null
  let annule = false
  let premier = true
  authPrete()
    .then(() => estMigree(cle))
    .then(migree => {
      if (annule) return
      // Collection pas encore déclarée migrée : on n'écoute pas. Le cache local
      // reste intact, c'est lui qui fait foi jusqu'au transfert.
      if (!migree) return
      stop = onValue(
        ref(baseDeDonnees(), chemin(cle)),
        snap => {
          const v = snap.val()
          const vide = v === null || v === undefined
            || (Array.isArray(v) && v.length === 0)
            || (typeof v === 'object' && Object.keys(v).length === 0)
          // Deuxième filet : une collection marquée migrée mais vide ne vide
          // jamais le cache au premier instantané.
          if (premier && vide) { premier = false; return }
          premier = false
          ecrireCache(cle, v)
          callback(v)
        },
        err => { if (onErreur) onErreur(err) },
      )
    })
  return () => { annule = true; if (stop) stop() }
}

// ── Pont pour les modules synchrones ─────────────────────────────────────────
//
// Les 21 écrans qui consomment getSessions(), getStagiaires()… le font de façon
// synchrone. Rendre ces API asynchrones imposerait de réécrire tous les appels
// et toute la logique de rendu : beaucoup de risque pour peu de gain.
//
// On garde donc l'API telle quelle — la lecture rend le cache, instantanément —
// et seule la persistance change : l'écriture part aussi vers Firebase, et une
// synchronisation descendante tient le cache à jour en arrière-plan.
//
// Limite assumée : l'écran ne se rafraîchit pas de lui-même quand une autre
// personne modifie la donnée ; le cache est à jour au rendu suivant ou en
// changeant d'écran. C'est le comportement qu'avait la veille avant son passage
// en temps réel, et il se durcira plus tard sans toucher aux écrans.

let dernieresErreurs = {}

export function derniereErreurSync(cle) {
  return cle ? dernieresErreurs[cle] || null : { ...dernieresErreurs }
}

// Écriture « au mieux » : l'appelant est synchrone et ne peut pas attendre.
// Un échec est enregistré et visible, jamais avalé en silence.
export function pousser(cle, valeur) {
  if (!estPartageable(cle)) return
  authPrete()
    .then(() => set(ref(baseDeDonnees(), chemin(cle)), valeur))
    .then(() => { delete dernieresErreurs[cle] })
    .catch(err => {
      dernieresErreurs[cle] = { message: err?.message || String(err), quand: new Date().toISOString() }
      console.warn(`[sync] écriture de ${cle} refusée :`, err?.message || err)
    })
}

// Branche la synchronisation descendante des collections indiquées.
// À appeler une fois au démarrage de l'application.
export function demarrerSync(cles) {
  const arrets = cles.filter(estPartageable).map(cle =>
    ecouterPartage(
      cle,
      () => {}, // le cache est déjà mis à jour par ecouterPartage
      err => {
        dernieresErreurs[cle] = { message: err?.message || String(err), quand: new Date().toISOString() }
        console.warn(`[sync] lecture de ${cle} refusée :`, err?.message || err)
      },
    ),
  )
  return () => arrets.forEach(a => { try { a() } catch {} })
}

// ── Transfert initial ────────────────────────────────────────────────────────

// Inventorie ce que contient le localStorage de ce poste, sans rien envoyer.
// Sert au mode simulation de l'outil de migration.
export function inventaireLocal() {
  const lignes = []
  for (let i = 0; i < localStorage.length; i++) {
    const cle = localStorage.key(i)
    if (!cle || !cle.startsWith('pls_')) continue
    const brut = localStorage.getItem(cle) || ''
    let elements = null
    try {
      const v = JSON.parse(brut)
      if (Array.isArray(v)) elements = v.length
      else if (v && typeof v === 'object') elements = Object.keys(v).length
    } catch {}
    lignes.push({
      cle,
      partageable: estPartageable(cle),
      octets: brut.length,
      elements,
    })
  }
  return lignes.sort((a, b) => a.cle.localeCompare(b.cle))
}

// Envoie une collection locale vers Firebase.
// `ecraser` à false : n'écrit que si la collection est absente ou vide côté
// Firebase, pour qu'un second passage ne détruise pas un travail déjà fait.
export async function transfererCle(cle, { ecraser = false, emailAuteur } = {}) {
  if (!estPartageable(cle)) return { cle, statut: 'ignoree' }
  const locale = lireCache(cle, null)
  if (locale === null) return { cle, statut: 'vide_en_local' }

  await authPrete()
  const r = ref(baseDeDonnees(), chemin(cle))
  if (!ecraser) {
    const snap = await get(r)
    const v = snap.val()
    const occupee = v !== null && v !== undefined
      && !(Array.isArray(v) && v.length === 0)
      && !(typeof v === 'object' && Object.keys(v).length === 0)
    if (occupee) return { cle, statut: 'deja_presente' }
  }
  await set(r, locale)
  await marquerMigree(cle, emailAuteur)
  return { cle, statut: 'transferee' }
}

// Compare, après transfert, ce qu'il y a de chaque côté. Permet de vérifier la
// migration au lieu de la supposer réussie.
export async function verifierTransfert(cle) {
  await authPrete()
  const snap = await get(ref(baseDeDonnees(), chemin(cle)))
  const distant = snap.val()
  const local = lireCache(cle, null)
  const compte = v => {
    if (Array.isArray(v)) return v.length
    if (v && typeof v === 'object') return Object.keys(v).length
    return v === null || v === undefined ? 0 : 1
  }
  return {
    cle,
    local: compte(local),
    distant: compte(distant),
    identique: JSON.stringify(local) === JSON.stringify(distant),
  }
}
