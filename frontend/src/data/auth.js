import { auth as authApi } from './api.js'
import {
  connexionGoogle, deconnexionGoogle, lireAcces, lireProfils, resoudreProfil, PROFILS,
} from './firebase-auth.js'

export const ROLES = {
  admin:     'admin',
  formateur: 'formateur',
}

const SESSION_KEY = 'pls_session'

// Les comptes démo ont été supprimés le 2026-10-05 : affichés en clair sur
// l'écran de connexion, ils rendaient contournable tout le dispositif d'accès.
// Le chemin mot de passe reste branché sur le backend (api.js) pour le jour où
// il sera déployé, mais aucun compte local n'est valide.
export async function login(email, password) {
  const data = await authApi.login(email, password)
  localStorage.setItem(SESSION_KEY, JSON.stringify(data))
  return data.user.role
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
  // Coupe aussi la session Firebase, sinon le popup reconnecte silencieusement.
  deconnexionGoogle().catch(() => {})
}

// Connexion via un compte Google Pennylane.
//
// Le profil provient de la liste /acces lue dans Firebase, arbitrée par les
// règles côté serveur : il n'est pas modifiable depuis le navigateur.
export async function loginWithGoogle() {
  const utilisateur = await connexionGoogle()
  const email = (utilisateur.email || '').toLowerCase()

  let liste = []
  let profils = null
  try {
    // Les deux lectures sont arbitrées par les règles : un domaine non autorisé
    // échoue ici, côté serveur, et pas dans l'interface.
    ;[liste, profils] = await Promise.all([lireAcces(), lireProfils()])
  } catch {
    await deconnexionGoogle().catch(() => {})
    throw new Error(`Le compte ${email} n'est pas autorisé à accéder à cet outil.`)
  }

  const resolu = resoudreProfil(email, liste, profils)
  if (!resolu) {
    await deconnexionGoogle().catch(() => {})
    throw new Error(`Le compte ${email} n'a pas d'accès attribué. Contacte un administrateur.`)
  }

  const data = {
    token: 'firebase',
    via: 'google',
    user: {
      id: utilisateur.uid,
      email,
      nom: resolu.entree?.nom || utilisateur.displayName?.split(' ').slice(1).join(' ') || '',
      prenom: resolu.entree?.prenom || utilisateur.displayName?.split(' ')[0] || '',
      photo: utilisateur.photoURL || '',
      role: resolu.role,
      profilId: resolu.profil,
      profilLabel: profils?.[resolu.profil]?.label || PROFILS[resolu.profil]?.label || resolu.profil,
      perms: resolu.perms,
      permsPersonnalisees: !!resolu.entree?.permsPersonnalisees,
    },
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(data))
  return resolu.role
}

// ── Droits de l'utilisateur connecté ─────────────────────────────────────────
// Pilote l'affichage. Voir l'avertissement en tête de firebase-auth.js : ce
// n'est pas une frontière de sécurité tant qu'il n'y a pas de backend.

export function permsCourantes() {
  return getCurrentUser()?.perms || null
}

export function aAcces(moduleId) {
  const p = permsCourantes()
  if (!p) return true // session antérieure aux permissions : ne rien casser
  return !!p[moduleId]?.acces
}

export function peutEcrire(moduleId) {
  const p = permsCourantes()
  if (!p) return true
  return !!p[moduleId]?.ecriture
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null')
  } catch {
    return null
  }
}

export function getCurrentUser() {
  return getSession()?.user || null
}

export function isAdmin() {
  return getCurrentUser()?.role === ROLES.admin
}

export function isFormateur() {
  const role = getCurrentUser()?.role
  return role === ROLES.formateur || role === ROLES.admin
}
