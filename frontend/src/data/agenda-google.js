// Lecture des plages occupées dans les agendas Google des formateurs.
//
// COMMENT C'EST POSSIBLE SANS DEMANDER À CHAQUE FORMATEUR
// Jonathan voit déjà les agendas de ses formateurs depuis le sien (partage
// Workspace). Un seul consentement suffit donc : le sien. L'API `freeBusy`
// accepte plusieurs agendas dans une même requête et répond pour ceux qu'on a le
// droit de consulter.
//
// ⚠️ SCOPE LE PLUS ÉTROIT POSSIBLE : `calendar.freebusy`, et non
// `calendar.readonly`. La différence n'est pas cosmétique — `freeBusy` ne rend
// QUE des intervalles occupés : pas de titre, pas de participant, pas de lieu,
// pas de description. La minimisation est garantie par l'API, pas par notre
// discipline à ignorer des champs qu'on aurait reçus.
//
// ⚠️ LE JETON NE VA NI DANS localStorage NI DANS FIREBASE. Il vit en
// sessionStorage, le temps de l'onglet, et n'est jamais écrit dans un log. Un
// jeton d'accès Google ouvre bien plus que PLS : le laisser traîner dans un
// stockage persistant ou dans la base partagée serait l'équivalent d'un mot de
// passe recopié.
//
// ⚠️ IL N'EST PAS RAFRAÎCHI. Firebase Auth ne rend le jeton Google qu'au moment
// du `signInWithPopup`, et il expire en une heure environ. D'où un bouton
// « connecter mon agenda » explicite : on redemande un jeton quand on en a
// besoin, plutôt que de prétendre maintenir une connexion permanente.
//
// PRÉREQUIS côté Google Cloud Console (à faire une fois) : ajouter le scope
// `https://www.googleapis.com/auth/calendar.freebusy` à l'écran de consentement
// OAuth du projet. Sans cela, le popup refuse le scope et `connecterAgenda()`
// échoue avec un message explicite.

import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { authentification } from './firebase-auth.js'
import { remplacerPlages, jour } from './indisponibilites.js'

export const SCOPE_FREEBUSY = 'https://www.googleapis.com/auth/calendar.freebusy'
const CLE_JETON = 'pls_jeton_agenda'
const URL_FREEBUSY = 'https://www.googleapis.com/calendar/v3/freeBusy'

// Google plafonne le nombre d'agendas par requête ; on découpe par sécurité.
const AGENDAS_PAR_REQUETE = 25

function memoriser(jeton, expireLe) {
  try {
    sessionStorage.setItem(CLE_JETON, JSON.stringify({ jeton, expireLe }))
  } catch { /* navigation privée : on reste en mémoire pour l'appel en cours */ }
}

/** Jeton courant, ou null s'il est absent ou périmé. */
export function jetonAgenda() {
  try {
    const brut = sessionStorage.getItem(CLE_JETON)
    if (!brut) return null
    const { jeton, expireLe } = JSON.parse(brut)
    if (!jeton || !expireLe || Date.now() > expireLe) return null
    return jeton
  } catch { return null }
}

export function agendaConnecte() {
  return jetonAgenda() !== null
}

export function deconnecterAgenda() {
  try { sessionStorage.removeItem(CLE_JETON) } catch { /* rien à faire */ }
}

/**
 * Demande le consentement et récupère un jeton d'accès Google.
 * Rend l'adresse du compte connecté, pour que l'écran puisse dire de quel
 * agenda on parle.
 */
export async function connecterAgenda() {
  const provider = new GoogleAuthProvider()
  provider.addScope(SCOPE_FREEBUSY)
  // `consent` plutôt que `select_account` : il faut que Google REDEMANDE le
  // scope, sinon une session déjà ouverte renvoie un jeton sans le droit agenda.
  provider.setCustomParameters({ prompt: 'consent' })

  const res = await signInWithPopup(authentification(), provider)
  const cred = GoogleAuthProvider.credentialFromResult(res)
  const jeton = cred?.accessToken
  if (!jeton) {
    throw new Error(
      'Google n’a pas renvoyé d’autorisation pour l’agenda. Vérifie que le scope ' +
      'calendar.freebusy est déclaré sur l’écran de consentement OAuth du projet.'
    )
  }
  // Une heure, moins une marge : mieux vaut redemander que subir un 401 au
  // milieu d'une synchronisation.
  memoriser(jeton, Date.now() + 55 * 60 * 1000)
  return res.user?.email || null
}

function decouper(liste, taille) {
  const lots = []
  for (let i = 0; i < liste.length; i += taille) lots.push(liste.slice(i, i + taille))
  return lots
}

/**
 * Interroge les plages occupées de plusieurs agendas.
 *
 * Rend `{ parEmail, refuses }` : `refuses` liste les agendas que Google n'a pas
 * voulu rendre — typiquement un formateur dont l'agenda n'est pas partagé. Les
 * taire ferait croire à une disponibilité totale, ce qui est exactement l'erreur
 * qu'on cherche à corriger.
 */
export async function interrogerPlagesOccupees(emails, debut, fin) {
  const jeton = jetonAgenda()
  if (!jeton) throw new Error('Agenda non connecté.')
  const propres = [...new Set((emails || []).filter(e => e && e.includes('@')))]
  if (propres.length === 0) return { parEmail: {}, refuses: [] }

  const parEmail = {}
  const refuses = []

  for (const lot of decouper(propres, AGENDAS_PAR_REQUETE)) {
    const res = await fetch(URL_FREEBUSY, {
      method: 'POST',
      headers: { Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timeMin: new Date(debut).toISOString(),
        timeMax: new Date(fin).toISOString(),
        items: lot.map(id => ({ id })),
      }),
    })
    if (!res.ok) {
      // 401/403 : jeton périmé ou scope absent. On le dit au lieu de rendre un
      // résultat vide, qui passerait pour « tout le monde est libre ».
      if (res.status === 401 || res.status === 403) {
        deconnecterAgenda()
        throw new Error('L’autorisation Google a expiré ou a été refusée. Reconnecte l’agenda.')
      }
      throw new Error(`Google a répondu ${res.status} à l’interrogation des agendas.`)
    }
    const data = await res.json()
    for (const [email, bloc] of Object.entries(data?.calendars || {})) {
      if (bloc?.errors?.length) {
        refuses.push({ email, motif: bloc.errors.map(e => e.reason).join(', ') })
        continue
      }
      parEmail[email] = (bloc?.busy || [])
        .filter(p => p?.start && p?.end)
        .map(p => ({ debut: p.start, fin: p.end }))
    }
  }
  return { parEmail, refuses }
}

/**
 * Synchronise les indisponibilités des formateurs sur une fenêtre de dates.
 *
 * Seules les plages d'origine `agenda` sont remplacées : les absences saisies à
 * la main dans PLS survivent à une resynchronisation.
 */
export async function synchroniserAgendas(formateurs, debut, fin) {
  const avecEmail = (formateurs || []).filter(f => f?.email && f.email.includes('@'))
  if (avecEmail.length === 0) {
    return { synchronises: 0, plages: 0, refuses: [], sansEmail: (formateurs || []).length }
  }

  const { parEmail, refuses } = await interrogerPlagesOccupees(
    avecEmail.map(f => f.email), debut, fin,
  )

  const fenetre = { debut: new Date(debut).toISOString(), fin: new Date(fin).toISOString() }
  let synchronises = 0
  let plages = 0
  for (const f of avecEmail) {
    const trouvees = parEmail[f.email]
    // `undefined` = agenda refusé : on ne touche à rien, plutôt que d'effacer
    // des plages précédemment importées sur la foi d'une réponse incomplète.
    if (trouvees === undefined) continue
    plages += await remplacerPlages(f.id, 'agenda', trouvees, fenetre)
    synchronises++
  }

  return {
    synchronises,
    plages,
    refuses,
    sansEmail: (formateurs || []).length - avecEmail.length,
    fenetre: { debut: jour(debut), fin: jour(fin) },
  }
}
