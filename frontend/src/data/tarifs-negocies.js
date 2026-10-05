// Tarifs négociés — délégation encadrée.
//
// La grille (tarification.js) donne le tarif de référence, affiché à titre
// INDICATIF sur une fiche produit. Il peut être remplacé :
//
//   · administrateur    → aucune limite
//   · formateur interne → dans une marge de ±20 % du tarif de la grille
//   · formateur externe → non
//   · consultatif       → non
//
// ⚠️ La marge s'ancre TOUJOURS sur le tarif de la grille, jamais sur le dernier
// tarif négocié. Sinon deux remises successives de 20 % feraient −36 %, puis
// −49 %, et la limite ne limiterait plus rien.
//
// Toute modification est tracée : auteur, profil, date, motif, tarif grille de
// référence et valeur précédente. Un prix commercial qui change sans trace est
// indéfendable, en litige comme en contrôle.
//
// STOCKAGE — passe par store-firebase.js : Firebase est la source de vérité,
// le localStorage sert de cache d'affichage. Un tarif négocié depuis un poste
// doit être visible depuis un autre, ce que le seul localStorage ne permettait pas.
//
// ⚠️ Les droits évalués ci-dessous ne sont pas une frontière de sécurité — voir
// l'avertissement en tête de firebase-auth.js. La marge de 20 % devra être
// reprise dans database.rules.json pour devenir une contrainte serveur.

import { estimer } from './tarification.js'
import { getCurrentUser } from './auth.js'
import { lireCache, pousser } from './store-firebase.js'

const KEY = 'pls_tarifs_negocies'

/** Marge de négociation accordée aux formateurs internes. */
export const MARGE_NEGOCIATION = 0.2

/** Profils autorisés à fixer librement un tarif. */
export const PROFILS_SANS_LIMITE = ['administrateur']

/** Profils autorisés à négocier dans la marge. */
export const PROFILS_AVEC_MARGE = ['formateur_interne']

// --- Clés de rattachement ----------------------------------------------------

export const cleProduit = (produitId) => `produit:${produitId}`
export const cleSession = (sessionId) => `session:${sessionId}`

// --- Stockage ----------------------------------------------------------------

function load() {
  return lireCache(KEY, {}) || {}
}

function save(data) {
  // Cache d'abord, pour que l'interface se rafraîchisse sans attendre le réseau…
  localStorage.setItem(KEY, JSON.stringify(data))
  // …puis Firebase, qui reste la source de vérité partagée entre les postes.
  pousser(KEY, data)
}

// --- Droits ------------------------------------------------------------------

export function profilCourant() {
  return getCurrentUser()?.profilId || null
}

function auteurCourant() {
  const u = getCurrentUser()
  return { email: u?.email || '(inconnu)', profil: u?.profilId || null }
}

export function peutModifierTarif(profil = profilCourant()) {
  return PROFILS_SANS_LIMITE.includes(profil) || PROFILS_AVEC_MARGE.includes(profil)
}

export function peutModifierSansLimite(profil = profilCourant()) {
  return PROFILS_SANS_LIMITE.includes(profil)
}

/** Seul un administrateur peut rétablir le tarif de la grille. */
export function peutSupprimerTarif(profil = profilCourant()) {
  return PROFILS_SANS_LIMITE.includes(profil)
}

// --- Logique de marge (pure, testable sans stockage ni session) --------------

/**
 * Bornes dans lesquelles ce profil peut fixer un tarif.
 * @returns {{min:number, max:number}|null} null = aucune limite
 */
export function bornesNegociation(prixGrille, profil = profilCourant()) {
  if (peutModifierSansLimite(profil)) return null
  if (!PROFILS_AVEC_MARGE.includes(profil)) return { min: 0, max: 0 }
  if (!Number.isFinite(prixGrille) || prixGrille <= 0) return { min: 0, max: 0 }
  return {
    min: Math.round(prixGrille * (1 - MARGE_NEGOCIATION)),
    max: Math.round(prixGrille * (1 + MARGE_NEGOCIATION)),
  }
}

/**
 * Valide un tarif proposé. `prixGrille` est le tarif de référence issu de la
 * grille — c'est lui qui sert d'ancrage, pas un éventuel tarif négocié antérieur.
 */
export function validerTarif(prixPropose, prixGrille, profil = profilCourant()) {
  const montant = Number(prixPropose)

  if (!Number.isFinite(montant) || montant < 0) {
    return { ok: false, erreur: 'Montant invalide.' }
  }
  if (!peutModifierTarif(profil)) {
    return { ok: false, erreur: 'Votre profil ne permet pas de modifier un tarif.' }
  }

  const bornes = bornesNegociation(prixGrille, profil)
  if (bornes === null) return { ok: true, bornes: null }

  if (!Number.isFinite(prixGrille) || prixGrille <= 0) {
    return {
      ok: false,
      erreur: 'Tarif de référence indisponible (durée ou modalité manquante) : seul un administrateur peut fixer un prix ici.',
    }
  }

  if (montant < bornes.min || montant > bornes.max) {
    const pct = Math.round(MARGE_NEGOCIATION * 100)
    return {
      ok: false,
      erreur: `Hors de votre marge de ${pct} % : le tarif doit être entre ${bornes.min} € et ${bornes.max} € (grille : ${prixGrille} €). Au-delà, l’accord d’un administrateur est nécessaire.`,
      bornes,
    }
  }

  return { ok: true, bornes }
}

// --- Lecture -----------------------------------------------------------------

export function getTarifNegocie(cle) {
  const entree = load()[cle]
  return entree?.actif ? entree : null
}

export function historiqueTarif(cle) {
  return (load()[cle]?.historique || []).slice().reverse()
}

/** Toutes les surcharges actives — pour un écran de supervision. */
export function listerTarifsNegocies() {
  return Object.entries(load())
    .filter(([, v]) => v.actif)
    .map(([cle, v]) => ({ cle, ...v }))
    .sort((a, b) => (b.modifieLe || '').localeCompare(a.modifieLe || ''))
}

// --- Écriture ----------------------------------------------------------------

/**
 * Fixe un tarif négocié.
 *
 * @param {string} cle        cleProduit(id) ou cleSession(id)
 * @param {number} prixHT     montant HT proposé
 * @param {string} motif      obligatoire : justifie l'écart à la grille
 * @param {number} prixGrille tarif de référence — ancrage de la marge
 */
export function definirTarifNegocie(cle, prixHT, motif, prixGrille) {
  if (!motif || !motif.trim()) {
    return { ok: false, erreur: 'Un motif est obligatoire : il justifie l’écart à la grille.' }
  }

  const profil = profilCourant()
  const validation = validerTarif(prixHT, prixGrille, profil)
  if (!validation.ok) return validation

  const montant = Number(prixHT)
  const data = load()
  const precedent = data[cle] || null
  const auteur = auteurCourant()
  const maintenant = new Date().toISOString()

  data[cle] = {
    cle,
    prixHT: montant,
    motif: motif.trim(),
    prixGrilleReference: prixGrille,
    actif: true,
    modifieLe: maintenant,
    modifiePar: auteur.email,
    modifieParProfil: auteur.profil,
    historique: [
      ...(precedent?.historique || []),
      {
        action: precedent?.actif ? 'modification' : 'création',
        prixHT: montant,
        prixPrecedent: precedent?.actif ? precedent.prixHT : null,
        prixGrille,
        ecartGrille: Number.isFinite(prixGrille) ? montant - prixGrille : null,
        motif: motif.trim(),
        auteur: auteur.email,
        profil: auteur.profil,
        date: maintenant,
      },
    ],
  }

  save(data)
  return { ok: true, entree: data[cle] }
}

/** Retire la surcharge : le tarif redevient celui de la grille. */
export function supprimerTarifNegocie(cle, motif) {
  if (!peutSupprimerTarif()) {
    return { ok: false, erreur: 'Seul un administrateur peut rétablir le tarif de la grille.' }
  }
  const data = load()
  const entree = data[cle]
  if (!entree?.actif) return { ok: false, erreur: 'Aucun tarif négocié sur cet élément.' }

  const auteur = auteurCourant()
  entree.actif = false
  entree.historique.push({
    action: 'suppression',
    prixHT: null,
    prixPrecedent: entree.prixHT,
    motif: (motif || 'Retour au tarif de la grille').trim(),
    auteur: auteur.email,
    profil: auteur.profil,
    date: new Date().toISOString(),
  })
  save(data)
  return { ok: true }
}

// --- Tarif applicable --------------------------------------------------------

/**
 * Tarif à afficher : la surcharge si elle existe, sinon la grille.
 * Indique toujours d'où vient le prix et ce que l'utilisateur peut en faire.
 */
export function tarifApplicable(demande, cle = null) {
  const grille = estimer(demande)
  const prixGrille = grille.prixHT ?? null
  const profil = profilCourant()
  const negocie = cle ? getTarifNegocie(cle) : null

  const commun = {
    ...grille,
    prixGrille,
    modifiable: peutModifierTarif(profil),
    sansLimite: peutModifierSansLimite(profil),
    bornes: bornesNegociation(prixGrille, profil),
    supprimable: peutSupprimerTarif(profil),
  }

  if (!negocie) {
    return { ...commun, origine: 'grille', indicatif: true }
  }

  return {
    ...commun,
    origine: 'negocie',
    indicatif: false,
    prixHT: negocie.prixHT,
    ecartGrille: prixGrille != null ? negocie.prixHT - prixGrille : null,
    surDevis: false,
    motifDevis: undefined,
    detail: `Tarif négocié — ${negocie.prixHT} € HT`,
    negocie: {
      motif: negocie.motif,
      modifieLe: negocie.modifieLe,
      modifiePar: negocie.modifiePar,
      modifieParProfil: negocie.modifieParProfil,
    },
  }
}

/** Phrase courte indiquant l'origine du prix, à afficher sous le montant. */
export function origineDuTarif(resultat) {
  if (resultat.origine === 'negocie') {
    const e = resultat.ecartGrille
    const ecart = !e ? '' : ` (${e > 0 ? '+' : ''}${e} € vs grille)`
    return `Tarif négocié par ${resultat.negocie.modifiePar}${ecart} — ${resultat.negocie.motif}`
  }
  if (resultat.surDevis) return 'Sur devis'
  return `Tarif indicatif — ${resultat.grille}`
}
