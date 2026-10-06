// Accès cabinet — données partagées entre le portail du cabinet et PLS.
//
// Pourquoi dans Firebase : un cabinet saisit ses apprenants depuis SON
// navigateur, et l'équipe AFS doit les voir depuis le sien. Deux navigateurs ne
// partagent rien ; il faut donc un stockage commun. Le localStorage ne pouvait
// pas convenir — c'est d'ailleurs pour cette raison que l'ancien code d'accès à
// 6 caractères ne fonctionnait que sur la machine où il avait été généré.
//
// Cloisonnement : chaque cabinet n'accède qu'à son propre nœud, la comparaison
// entre son email authentifié et le champ `email` du nœud étant faite par les
// règles, côté serveur (voir database.rules.json). Un cabinet ne peut ni lister
// les autres, ni lire le nœud d'un autre, ni modifier sa propre autorisation.
//
// ⚠️ Donnée de santé exclue : la question « prérequis et situations de handicap »
// relève de l'article 9 du RGPD. Elle n'est volontairement PAS écrite ici.

import { ref, get, set, push, remove, onValue, update } from 'firebase/database'
import { baseDeDonnees, authPrete } from './firebase-auth.js'

const CHEMIN = 'cabinets'

// Questions dont la réponse ne doit jamais partir dans la base.
//
// VIDE depuis le 2026-10-06. `prerequis_handicap` y figurait : la réponse était
// écartée pour éviter de conserver une donnée de santé. Jonathan a tranché, et il
// a raison — c'est une obligation Qualiopi. Le prestataire doit pouvoir prouver
// qu'il a posé la question sur les situations de handicap ET qu'il en a tiré les
// conséquences ; une réponse qu'on n'enregistre pas ne prouve rien.
//
// Ce qui est exigé du cabinet, c'est une réponse — « non » en est une. On ne
// contraint donc personne à déclarer un handicap. La finalité est annoncée dans
// le questionnaire, et l'accès à `cabinets/<clé>` est limité par les règles au
// cabinet concerné et aux comptes Pennylane vérifiés.
//
// Le mécanisme est conservé : si une question franchement sensible apparaît un
// jour, c'est ici qu'on l'écarte, et `enregistrerBesoin()` comme la synthèse PDF
// le respectent déjà.
export const QUESTIONS_EXCLUES = []

// Clé de nœud dérivée de l'email. Deux raisons :
//  1. Un email contient des points, interdits dans une clé Firebase.
//  2. Le cabinet peut recalculer sa propre clé et lire /cabinets/<clé>
//     directement, sans avoir besoin de lister la collection — ce que les
//     règles lui interdisent justement.
// Ce n'est pas un secret : la protection vient des règles, pas de la clé.
export async function cleCabinet(email) {
  const normalise = String(email || '').trim().toLowerCase()
  const octets = new TextEncoder().encode(normalise)
  const empreinte = await crypto.subtle.digest('SHA-256', octets)
  return [...new Uint8Array(empreinte)].map(o => o.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

function db() { return baseDeDonnees() }

function listeDepuis(valeur) {
  if (!valeur) return []
  return Object.entries(valeur).map(([id, v]) => ({ id, ...v }))
}

// ── Côté équipe AFS ──────────────────────────────────────────────────────────

export async function lireCabinets() {
  await authPrete()
  const snap = await get(ref(db(), CHEMIN))
  return listeDepuis(snap.val()).map(c => ({
    ...c,
    apprenants: listeDepuis(c.apprenants),
    besoins: c.besoins || {},
  }))
}

export function ecouterCabinets(callback, onErreur) {
  let stop = null
  let annule = false
  authPrete().then(() => {
    if (annule) return
    stop = onValue(
      ref(db(), CHEMIN),
      snap => callback(listeDepuis(snap.val()).map(c => ({
        ...c,
        apprenants: listeDepuis(c.apprenants),
        besoins: c.besoins || {},
      }))),
      err => { if (onErreur) onErreur(err) },
    )
  })
  return () => { annule = true; if (stop) stop() }
}

// Accorde ou met à jour un accès cabinet. Réservé aux administrateurs racine
// par les règles : un cabinet ne peut pas s'autoriser lui-même.
export async function accorderAcces({ email, nom, actif = true }, emailAuteur) {
  await authPrete()
  const adresse = String(email || '').trim().toLowerCase()
  if (!adresse.includes('@')) throw new Error('Adresse email invalide.')
  const id = await cleCabinet(adresse)
  await update(ref(db(), `${CHEMIN}/${id}`), {
    email: adresse,
    nom: nom || '',
    actif: actif !== false,
    creeLe: new Date().toISOString(),
    creePar: String(emailAuteur || '').toLowerCase(),
  })
  return id
}

export async function revoquerAcces(id) {
  await authPrete()
  await remove(ref(db(), `${CHEMIN}/${id}`))
}

export async function basculerActif(id, actif) {
  await authPrete()
  await update(ref(db(), `${CHEMIN}/${id}`), { actif: !!actif })
}

// ── Côté cabinet ─────────────────────────────────────────────────────────────

// Lit sa propre fiche. Rend null si l'accès n'existe pas ou a été révoqué.
export async function lireMonCabinet(email) {
  await authPrete()
  const id = await cleCabinet(email)
  const snap = await get(ref(db(), `${CHEMIN}/${id}`))
  const v = snap.val()
  if (!v) return null
  if (v.actif === false) return null
  return { id, ...v, apprenants: listeDepuis(v.apprenants), besoins: v.besoins || {} }
}

// Lecture côté équipe : contrairement à lireMonCabinet, ne masque pas un accès
// désactivé — l'administrateur doit justement pouvoir le voir pour le réactiver.
export async function lireCabinetParEmail(email) {
  await authPrete()
  const id = await cleCabinet(email)
  const snap = await get(ref(db(), `${CHEMIN}/${id}`))
  const v = snap.val()
  return v ? { id, ...v, apprenants: listeDepuis(v.apprenants), besoins: v.besoins || {} } : { id, absent: true }
}

export function ecouterCabinetParCle(id, callback, onErreur) {
  let stop = null
  let annule = false
  authPrete().then(() => {
    if (annule) return
    stop = onValue(
      ref(db(), `${CHEMIN}/${id}`),
      snap => {
        const v = snap.val()
        callback(v ? { id, ...v, apprenants: listeDepuis(v.apprenants), besoins: v.besoins || {} } : { id, absent: true })
      },
      err => { if (onErreur) onErreur(err) },
    )
  })
  return () => { annule = true; if (stop) stop() }
}

export function ecouterApprenants(cabinetId, callback, onErreur) {
  let stop = null
  let annule = false
  authPrete().then(() => {
    if (annule) return
    stop = onValue(
      ref(db(), `${CHEMIN}/${cabinetId}/apprenants`),
      snap => callback(listeDepuis(snap.val())),
      err => { if (onErreur) onErreur(err) },
    )
  })
  return () => { annule = true; if (stop) stop() }
}

export async function enregistrerApprenant(cabinetId, apprenant) {
  await authPrete()
  const charge = {
    nom: String(apprenant.nom || '').trim(),
    prenom: String(apprenant.prenom || '').trim(),
    email: String(apprenant.email || '').trim().toLowerCase(),
    fonction: String(apprenant.fonction || '').trim(),
    sessionId: String(apprenant.sessionId || ''),
    creeLe: apprenant.creeLe || new Date().toISOString(),
  }
  if (!charge.nom || !charge.prenom) throw new Error('Nom et prénom sont requis.')
  if (apprenant.id) {
    await set(ref(db(), `${CHEMIN}/${cabinetId}/apprenants/${apprenant.id}`), charge)
    return apprenant.id
  }
  const nouveau = push(ref(db(), `${CHEMIN}/${cabinetId}/apprenants`))
  await set(nouveau, charge)
  return nouveau.key
}

export async function supprimerApprenant(cabinetId, apprenantId) {
  await authPrete()
  await remove(ref(db(), `${CHEMIN}/${cabinetId}/apprenants/${apprenantId}`))
}

// Enregistre les réponses au questionnaire de besoin, en écartant les questions
// porteuses de données sensibles.
export async function enregistrerBesoin(cabinetId, sessionId, reponses) {
  await authPrete()
  const filtrees = {}
  for (const [question, valeur] of Object.entries(reponses || {})) {
    if (QUESTIONS_EXCLUES.includes(question)) continue
    if (typeof valeur === 'string' && valeur.trim()) filtrees[question] = valeur.trim()
  }
  await set(ref(db(), `${CHEMIN}/${cabinetId}/besoins/${sessionId}`), {
    reponses: filtrees,
    soumisLe: new Date().toISOString(),
  })
}

export async function lireBesoin(cabinetId, sessionId) {
  await authPrete()
  const snap = await get(ref(db(), `${CHEMIN}/${cabinetId}/besoins/${sessionId}`))
  return snap.val()
}
