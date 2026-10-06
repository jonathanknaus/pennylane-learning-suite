// Grilles tarifaires AFS et estimation du coût d'une formation.
//
// Tous les montants sont en euros HT.
//
// Les grilles sont VERSIONNÉES par date d'effet : une augmentation tarifaire
// n'écrase pas la précédente. C'est nécessaire parce qu'un devis émis, une
// convention signée ou une fiche produit SmartOF restent rattachés au tarif en
// vigueur à leur date — on doit pouvoir les recalculer des mois plus tard.
//
// DEUX SOURCES de grilles, fusionnées par toutesLesGrilles() :
//   · GRILLES_BASE — les deux grilles historiques, en dur dans ce fichier. Socle
//     de référence : ni modifiables ni supprimables, pour qu'un devis ancien
//     reste recalculable même si quelqu'un se trompe dans l'éditeur.
//   · les grilles saisies dans l'app (onglet Paramètres → Grille tarifaire),
//     réservées aux administrateurs. Une grille saisie à la même date d'effet
//     qu'une grille de base la MASQUE — la supprimer rétablit l'originale.
//
// La date d'effet fait l'identité d'une grille : deux grilles applicables le
// même jour seraient ambiguës, le stockage les indexe donc par cette date.

import { getCurrentUser, peutEcrire, permsCourantes } from './auth.js'
import { lireCache, pousser, declarerPartagee } from './store-firebase.js'

// Le tarif horaire se cumule jusqu'à 2 heures. Au-delà, c'est le forfait
// demi-journée qui s'applique — il n'existe pas de formation de 3h au tarif horaire.
//
// Ce n'est pas un tarif mais une règle de bascule : elle n'est pas éditable dans
// l'app, contrairement aux prix, aux paliers et au nombre de formateurs.
export const CUMUL_HORAIRE_MAX = 2

// --- Grille précédente -------------------------------------------------------
// Reprise des TARIFS qui étaient codés en dur dans catalogue-afs.js. Elle ne
// connaissait pas les paliers de participants : un seul prix par format, plafond
// unique à 15 apprenants, et 300 € par formateur supplémentaire.
//
// Conservée pour recalculer à l'identique un devis émis AVANT la hausse.
//
// ⚠️ dateEffet approximative : sa vraie date d'entrée en vigueur n'est pas
// documentée. 2026-01-01 est choisi pour couvrir tout l'historique connu.

const SUPPLEMENT_FORMATEUR_PRECEDENT = 300

const GRILLE_PRECEDENTE = {
  supplementFormateur: SUPPLEMENT_FORMATEUR_PRECEDENT,
  horaire: {
    label: 'À l’heure (visio)',
    duree: null,
    paliers: {
      visio: [{ participantsMax: 15, prix: 200, formateurs: 1, parHeure: true }],
      presentiel: [],
    },
  },
  webinar: {
    label: 'Webinar (visio)',
    duree: 1,
    paliers: {
      visio: [{ participantsMax: Infinity, prix: 200, formateurs: 1, parHeure: true }],
      presentiel: [],
    },
  },
  demi_journee: {
    label: 'Demi-journée (3h30)',
    duree: 3.5,
    paliers: {
      visio: [{ participantsMax: 15, prix: 600, formateurs: 1 }],
      presentiel: [{ participantsMax: 15, prix: 1000, formateurs: 1, fraisDeplacementInclus: true }],
    },
  },
  journee: {
    label: 'Journée (7h)',
    duree: 7,
    paliers: {
      visio: [{ participantsMax: 15, prix: 1200, formateurs: 1 }],
      presentiel: [{ participantsMax: 15, prix: 2000, formateurs: 1, fraisDeplacementInclus: true }],
    },
  },
}

// --- Grille en vigueur depuis le 2026-10-05 ----------------------------------
// Hausse décidée le 2026-10-05, applicable aux nouvelles demandes.
// Nouveautés par rapport à la précédente : des paliers par nombre de
// participants (10 puis 25), la mobilisation d'un second formateur au-delà de 10,
// le passage sur devis au-delà de 25, et la demi-journée visio qui passe de
// 600 à 750 €.

const GRILLE_2026_10 = {
  horaire: {
    label: 'À l’heure (visio)',
    duree: null,
    paliers: {
      visio: [{ participantsMax: 15, prix: 200, formateurs: 1, parHeure: true }],
      presentiel: [],
    },
  },
  webinar: {
    label: 'Webinar (visio)',
    duree: 1,
    paliers: {
      visio: [{ participantsMax: Infinity, prix: 200, formateurs: 1, parHeure: true }],
      presentiel: [],
    },
  },
  demi_journee: {
    label: 'Demi-journée (3h30)',
    duree: 3.5,
    paliers: {
      visio: [
        { participantsMax: 10, prix: 750, formateurs: 1 },
        { participantsMax: 25, prix: 850, formateurs: 2 },
      ],
      presentiel: [
        { participantsMax: 10, prix: 1000, formateurs: 1, fraisDeplacementInclus: true },
        { participantsMax: 25, prix: 1400, formateurs: 2 },
      ],
    },
  },
  journee: {
    label: 'Journée (7h)',
    duree: 7,
    paliers: {
      visio: [
        { participantsMax: 10, prix: 1200, formateurs: 1 },
        { participantsMax: 25, prix: 1400, formateurs: 2 },
      ],
      presentiel: [
        { participantsMax: 10, prix: 2000, formateurs: 1, fraisDeplacementInclus: true },
        { participantsMax: 25, prix: 2500, formateurs: 2 },
      ],
    },
  },
}

// --- Socle : les grilles en dur ----------------------------------------------
//
// Elles ne sont pas modifiables depuis l'app. Une grille saisie à la même date
// d'effet les masque, ce qui laisse corriger une erreur sans perdre l'original.

export const GRILLES_BASE = [
  { dateEffet: '2026-10-05', libelle: 'Grille du 5 octobre 2026', grille: GRILLE_2026_10 },
  { dateEffet: '2026-01-01', libelle: 'Grille précédente', grille: GRILLE_PRECEDENTE },
]

// --- Stockage des grilles saisies dans l'app ---------------------------------
//
// Même pattern que tarifs-negocies.js : Firebase est la source de vérité, le
// localStorage sert de cache d'affichage. Une grille modifiée depuis un poste
// doit s'appliquer aux autres — c'est un paramètre partagé, pas une préférence
// locale.
//
// ⚠️ Comme les autres collections, la lecture descendante ne s'activera qu'après
// le transfert initial (marqueur donnees/_meta/<cle>/migreLe). En attendant,
// l'écriture est bien poussée mais le cache local fait foi.

const KEY = 'pls_grilles_tarifaires'

// Illimité se note Infinity en mémoire, mais JSON.stringify(Infinity) donne
// null : la frontière du stockage convertit dans les deux sens, sans quoi le
// palier illimité du webinar se transformerait en « 0 participant » au premier
// aller-retour.
const ILLIMITE_STOCKE = null

function paliersDepuisStockage(paliers) {
  return (paliers || []).map(p => ({
    ...p,
    participantsMax: p.participantsMax === ILLIMITE_STOCKE ? Infinity : p.participantsMax,
  }))
}

function paliersVersStockage(paliers) {
  return (paliers || []).map(p => ({
    ...p,
    participantsMax: p.participantsMax === Infinity ? ILLIMITE_STOCKE : p.participantsMax,
  }))
}

function grilleDepuisStockage(grille) {
  const sortie = {}
  for (const [formatId, format] of Object.entries(grille)) {
    // Tout ce qui n'a pas de paliers est une métadonnée de grille
    // (supplementFormateur, mentionsModules) : recopiée telle quelle.
    if (!format?.paliers) { sortie[formatId] = format; continue }
    sortie[formatId] = {
      ...format,
      paliers: {
        // Le tri croissant n'est pas cosmétique : choisirPalier() retient le
        // PREMIER palier qui couvre l'effectif.
        visio: trierPaliers(paliersDepuisStockage(format.paliers?.visio)),
        presentiel: trierPaliers(paliersDepuisStockage(format.paliers?.presentiel)),
      },
    }
  }
  return sortie
}

function grilleVersStockage(grille) {
  const sortie = {}
  for (const [formatId, format] of Object.entries(grille)) {
    if (!format?.paliers) { sortie[formatId] = format; continue }
    sortie[formatId] = {
      ...format,
      paliers: {
        visio: paliersVersStockage(trierPaliers(format.paliers?.visio)),
        presentiel: paliersVersStockage(trierPaliers(format.paliers?.presentiel)),
      },
    }
  }
  return sortie
}

function trierPaliers(paliers) {
  return [...(paliers || [])].sort((a, b) => a.participantsMax - b.participantsMax)
}

function load() {
  return lireCache(KEY, {}) || {}
}

function save(data) {
  // Cache d'abord, pour que l'interface se rafraîchisse sans attendre le réseau…
  localStorage.setItem(KEY, JSON.stringify(data))
  // …puis Firebase, source de vérité partagée entre les postes.
  pousser(KEY, data)
  // La grille naît dans Firebase : aucune donnée héritée du localStorage à
  // protéger, donc on déclare la collection partagée dès la première écriture.
  // Sans ce marqueur, ecouterPartage() ne s'abonnerait jamais et un tarif
  // modifié ici resterait invisible depuis les autres postes.
  declarerPartagee(KEY, getCurrentUser()?.email).catch(err => {
    console.warn('[tarifs] marqueur de partage non posé :', err?.message || err)
  })
}

/** Grilles saisies dans l'app, de la plus récente à la plus ancienne. */
export function grillesPersonnalisees() {
  return Object.values(load())
    .map(e => ({ ...e, grille: grilleDepuisStockage(e.grille), origine: 'personnalisee' }))
    .sort((a, b) => b.dateEffet.localeCompare(a.dateEffet))
}

/**
 * Toutes les grilles connues, de la plus récente à la plus ancienne. Une grille
 * saisie masque la grille de base qui porte la même date d'effet.
 */
export function toutesLesGrilles() {
  const saisies = grillesPersonnalisees()
  const datesSaisies = new Set(saisies.map(g => g.dateEffet))
  const base = GRILLES_BASE
    .filter(g => !datesSaisies.has(g.dateEffet))
    .map(g => ({ ...g, origine: 'base' }))
  return [...saisies, ...base].sort((a, b) => b.dateEffet.localeCompare(a.dateEffet))
}

/** Grille applicable à une date donnée (par défaut : aujourd'hui). */
export function grilleApplicable(date = null) {
  const jour = (date ? new Date(date) : new Date()).toISOString().slice(0, 10)
  const grilles = toutesLesGrilles()
  const trouvee = grilles.find(g => g.dateEffet <= jour)
  return trouvee || grilles[grilles.length - 1]
}

/** Grille à venir, si une augmentation est déjà enregistrée mais pas en vigueur. */
export function grilleAVenir(date = null) {
  const jour = (date ? new Date(date) : new Date()).toISOString().slice(0, 10)
  const futures = toutesLesGrilles().filter(g => g.dateEffet > jour)
  return futures.length ? futures[futures.length - 1] : null
}

/**
 * Plus grand effectif tarifé par une grille. Au-delà, c'est un devis.
 *
 * Remplace la constante SEUIL_SUR_DEVIS, qui valait 25 en dur : dès qu'un
 * administrateur ajoute un palier « jusqu'à 40 », le seuil doit suivre, sinon
 * estimer() renverrait « sur devis » pour un effectif que la grille tarife.
 */
export function plafondGrille(date = null) {
  const G = grilleApplicable(date).grille
  const plafonds = Object.values(G)
    .filter(f => f && f.paliers)
    .flatMap(f => [...(f.paliers.visio || []), ...(f.paliers.presentiel || [])])
    .map(p => p.participantsMax)
    .filter(n => Number.isFinite(n))
  return plafonds.length ? Math.max(...plafonds) : 0
}

export const MODALITES = [
  { id: 'visio', label: 'Visioconférence' },
  { id: 'presentiel', label: 'Présentiel' },
]

export const HYPOTHESES = {
  au_dela_journee: 'Au-delà de 7h, le coût est calculé par journées entamées.',
}

// Règles de bascule :
//   · jusqu'à 2h       → tarif horaire, cumulable (1h = 200 €, 2h = 400 €)
//   · plus de 2h à 7h  → forfait demi-journée
//   · 7h et au-delà    → forfait journée, par journées entamées
function choisirFormat({ dureeHeures, webinar }) {
  if (webinar) return 'webinar'
  if (dureeHeures <= CUMUL_HORAIRE_MAX) return 'horaire'
  if (dureeHeures < 7) return 'demi_journee'
  return 'journee'
}

function choisirPalier(paliers, participants) {
  return trierPaliers(paliers).find(p => participants <= p.participantsMax) || null
}

/** Plus grand effectif couvert par une liste de paliers (0 si aucun). */
function plafondPaliers(paliers) {
  const finis = (paliers || []).map(p => p.participantsMax).filter(n => Number.isFinite(n))
  return finis.length ? Math.max(...finis) : 0
}

// Le motif est dérivé des paliers réellement présents, et non d'un seuil en dur :
// un administrateur qui ajoute un palier « jusqu'à 40 » ou qui supprime tous les
// paliers d'une modalité doit lire un message juste.
function motifSansPalier(paliers, formatLabel) {
  const plafond = plafondPaliers(paliers)
  return plafond > 0
    ? `Au-delà de ${plafond} apprenants, le tarif est établi sur devis.`
    : `Aucun tarif n’est défini pour ce format (${formatLabel}) dans cette modalité.`
}

/**
 * Estime le coût d'une formation selon la grille applicable.
 *
 * @param {object} demande
 * @param {number} demande.dureeHeures   durée souhaitée, en heures
 * @param {'visio'|'presentiel'} [demande.modalite]
 * @param {number} [demande.participants] nombre d'apprenants attendus
 * @param {boolean} [demande.webinar]    true pour un webinar (1h, illimité)
 * @param {string} [demande.date]        date de la DEMANDE (ou du devis), pas de
 *                                       la session. Par défaut aujourd'hui.
 *                                       Le tarif est figé à la demande : un devis
 *                                       validé sous l'ancienne grille y reste,
 *                                       même si la session a lieu après la hausse.
 *                                       Pour recalculer un devis existant à
 *                                       l'identique, passer sa date de création.
 */
export function estimer({ dureeHeures, modalite = 'visio', participants = 1, webinar = false, date = null }) {
  const alertes = []
  const hypotheses = []

  const version = grilleApplicable(date)
  const G = version.grille

  if (!dureeHeures || dureeHeures <= 0) {
    return { valide: false, erreur: 'Durée non renseignée.', alertes, hypotheses }
  }
  if (participants < 1) {
    return { valide: false, erreur: 'Nombre de participants non renseigné.', alertes, hypotheses }
  }

  // Si une augmentation est déjà enregistrée mais pas encore en vigueur, le
  // signaler : une demande formulée juste avant la bascule reste à l'ancien tarif.
  const future = grilleAVenir(date)
  if (future) {
    alertes.push(`Nouvelle grille au ${future.dateEffet} (${future.libelle}) — cette demande reste à l’ancien tarif.`)
  }

  const formatId = choisirFormat({ dureeHeures, webinar })
  const format = G[formatId]
  const commun = { grille: version.libelle, grilleDateEffet: version.dateEffet }

  if (webinar) {
    if (modalite === 'presentiel') alertes.push('Un webinar se tient en visio : modalité présentiel ignorée.')
    if (dureeHeures > 1) alertes.push(`Un webinar ne se cumule pas : durée ramenée à 1h (${dureeHeures}h demandées).`)
    // Le webinar passe par son palier comme les autres formats : son effectif est
    // illimité dans les grilles d'origine, mais l'éditeur permet de le borner.
    const palierWebinar = choisirPalier(format.paliers.visio || [], participants)
    if (!palierWebinar) {
      return {
        ...commun, valide: true, surDevis: true,
        format: formatId, formatLabel: format.label, modalite: 'visio',
        dureeFacturee: 1, participants,
        motifDevis: motifSansPalier(format.paliers.visio, format.label),
        alertes, hypotheses,
      }
    }
    const illimite = !Number.isFinite(palierWebinar.participantsMax)
    return {
      ...commun, valide: true, surDevis: false,
      format: formatId, formatLabel: format.label, modalite: 'visio',
      dureeFacturee: 1, participants,
      participantsMax: illimite ? null : palierWebinar.participantsMax,
      formateurs: palierWebinar.formateurs, prixHT: palierWebinar.prix,
      detail: `Webinar 1h × ${palierWebinar.prix} €${illimite ? ' — participants illimités' : ''}`,
      fraisDeplacementInclus: false, alertes, hypotheses,
    }
  }

  if (formatId === 'horaire' && modalite === 'presentiel') {
    return {
      ...commun, valide: true, surDevis: true,
      format: formatId, formatLabel: format.label, modalite,
      dureeFacturee: dureeHeures, participants,
      motifDevis: 'Le présentiel n’est pas tarifé à l’heure : prévoir au minimum une demi-journée.',
      alertes, hypotheses,
    }
  }

  const palier = choisirPalier(format.paliers[modalite] || [], participants)

  if (!palier) {
    return {
      ...commun, valide: true, surDevis: true,
      format: formatId, formatLabel: format.label, modalite,
      dureeFacturee: dureeHeures, participants,
      motifDevis: motifSansPalier(format.paliers[modalite], format.label),
      alertes, hypotheses,
    }
  }

  let prixHT
  let dureeFacturee = dureeHeures
  let detail

  if (palier.parHeure) {
    dureeFacturee = Math.ceil(dureeHeures)
    prixHT = dureeFacturee * palier.prix
    detail = `${dureeFacturee} h × ${palier.prix} €`
    if (dureeFacturee !== dureeHeures) {
      alertes.push(`Durée arrondie à l’heure entamée : ${dureeHeures}h facturées ${dureeFacturee}h.`)
    }
  } else if (formatId === 'journee' && dureeHeures > format.duree) {
    const journees = Math.ceil(dureeHeures / format.duree)
    prixHT = journees * palier.prix
    dureeFacturee = journees * format.duree
    detail = `${journees} journée(s) × ${palier.prix} €`
    hypotheses.push(HYPOTHESES.au_dela_journee)
    alertes.push(`${dureeHeures}h demandées, facturées ${journees} journée(s).`)
  } else {
    prixHT = palier.prix
    dureeFacturee = format.duree
    detail = `Forfait ${format.label} — ${palier.prix} €`
    if (dureeHeures !== format.duree) {
      alertes.push(`Forfait ${format.label} appliqué (${dureeHeures}h demandées).`)
    }
  }

  if (palier.formateurs > 1) {
    alertes.push(`${palier.formateurs} formateurs mobilisés pour ${participants} apprenants.`)
  }

  return {
    ...commun, valide: true, surDevis: false,
    format: formatId, formatLabel: format.label, modalite,
    dureeFacturee, participants, participantsMax: palier.participantsMax,
    formateurs: palier.formateurs, prixHT, detail,
    fraisDeplacementInclus: palier.fraisDeplacementInclus === true,
    alertes, hypotheses,
  }
}

/** Formate une estimation en une phrase présentable au cabinet. */
export function resumerEstimation(e) {
  if (!e.valide) return e.erreur
  if (e.surDevis) return `Sur devis — ${e.motifDevis}`
  const parts = [`${e.prixHT} € HT`, e.formatLabel, `${e.participants} apprenant(s)`]
  if (e.formateurs > 1) parts.push(`${e.formateurs} formateurs`)
  if (e.fraisDeplacementInclus) parts.push('frais de déplacement inclus')
  return parts.join(' · ')
}

// --- Grille présentable (carte « Grille tarifaire » du catalogue) -------------
//
// La carte affichait l'ancienne grille, recopiée en dur dans les TARIFS de
// catalogue-afs.js : un prix unique par format, « max 15 participants » et une
// mention « +300 € par formateur supplémentaire » qui n'entrait dans aucun
// calcul. Elle dérive désormais de la grille réellement appliquée par estimer(),
// paliers compris : les deux ne peuvent plus diverger.
//
// Les intitulés de modules (« 1 ou 2 modules »…) sont de l'argumentaire
// commercial et non du calcul, mais ils vivent ici pour rester collés au prix
// qu'ils accompagnent.

function seuilLabel(participantsMax) {
  return participantsMax === Infinity
    ? 'participants illimités'
    : `jusqu’à ${participantsMax} participants`
}

// Ce qu'une ligne de la grille annonce sous son titre : le nombre de modules
// qu'un format peut accueillir. C'est de l'offre commerciale, modifiable depuis
// l'éditeur (une session 2h peut passer de « 3 à 4 » à « 3 ou 4 modules »), d'où
// le stockage dans la grille sous `mentionsModules`. Ces valeurs servent de
// repli pour les grilles qui n'en portent pas.
export const MENTIONS_MODULES_DEFAUT = {
  session_1h: '1 ou 2 modules',
  session_2h: '3 à 4 modules',
  webinar: 'pour les clients du cabinet · non cumulable',
  demi_journee: 'jusqu’à 5 modules',
  journee: 'programme sur mesure',
}

/** Lignes d'affichage de la grille, dans leur ordre de présentation. */
export const LIGNES_AFFICHAGE = [
  { id: 'session_1h', label: 'Session 1h', format: 'horaire' },
  { id: 'session_2h', label: 'Session 2h', format: 'horaire' },
  { id: 'webinar', label: 'Webinar 1h', format: 'webinar' },
  { id: 'demi_journee', label: '½ Journée (3h30)', format: 'demi_journee' },
  { id: 'journee', label: 'Journée complète (7h)', format: 'journee' },
]

function mentionsDe(grille) {
  return { ...MENTIONS_MODULES_DEFAUT, ...(grille.mentionsModules || {}) }
}

/**
 * Apparie les paliers visio et présentiel d'un format sur leur plafond de
 * participants, pour en faire une ligne d'affichage par palier.
 */
function paliersApparies(format) {
  const visio = format.paliers.visio || []
  const presentiel = format.paliers.presentiel || []
  const seuils = [...new Set([...visio, ...presentiel].map(p => p.participantsMax))]
    .sort((a, b) => a - b)

  return seuils.map(seuil => {
    const v = visio.find(p => p.participantsMax === seuil)
    const p = presentiel.find(x => x.participantsMax === seuil)
    return {
      participantsMax: seuil,
      label: seuilLabel(seuil),
      visio: v ? v.prix : null,
      presentiel: p ? p.prix : null,
      formateurs: Math.max(v?.formateurs || 1, p?.formateurs || 1),
    }
  })
}

/**
 * Grille en vigueur à une date donnée, mise en forme pour l'affichage :
 * une ligne par format, une sous-ligne par palier de participants.
 */
export function grillePourAffichage(date = null) {
  const version = grilleApplicable(date)
  const G = version.grille
  // Les paliers peuvent avoir été retirés depuis l'éditeur : chaque ligne est
  // construite seulement si son format a encore un tarif.
  const horaire = (G.horaire?.paliers?.visio || [])[0]
  const webinar = (G.webinar?.paliers?.visio || [])[0]

  const palierHoraire = (heures) => ({
    participantsMax: horaire.participantsMax,
    label: seuilLabel(horaire.participantsMax),
    visio: horaire.prix * heures,
    presentiel: null,
    formateurs: horaire.formateurs,
  })

  const mentions = mentionsDe(G)
  const libelleLigne = (id) => LIGNES_AFFICHAGE.find(l => l.id === id).label

  const lignes = [
    horaire && { id: 'session_1h', label: libelleLigne('session_1h'), hint: mentions.session_1h, paliers: [palierHoraire(1)] },
    horaire && {
      id: 'session_2h',
      label: libelleLigne('session_2h'),
      hint: `${mentions.session_2h} · cumul horaire plafonné à ${CUMUL_HORAIRE_MAX}h`,
      paliers: [palierHoraire(CUMUL_HORAIRE_MAX)],
    },
    webinar && {
      id: 'webinar',
      label: libelleLigne('webinar'),
      hint: mentions.webinar,
      paliers: [{
        participantsMax: webinar.participantsMax,
        label: seuilLabel(webinar.participantsMax),
        visio: webinar.prix,
        presentiel: null,
        formateurs: webinar.formateurs,
      }],
    },
    { id: 'demi_journee', label: libelleLigne('demi_journee'), hint: mentions.demi_journee, paliers: paliersApparies(G.demi_journee) },
    { id: 'journee', label: libelleLigne('journee'), hint: mentions.journee, paliers: paliersApparies(G.journee) },
  ].filter(l => l && l.paliers.length > 0)

  // Le plafond annoncé est celui de la grille AFFICHÉE, pas un seuil en dur :
  // l'ancienne grille s'arrêtait à 15 participants, et une grille éditée peut
  // monter à 40. Une carte lue pour un devis ancien doit dire 15.
  const plafond = plafondPaliers(lignes.flatMap(l => l.paliers))

  const notes = [
    `Au-delà de ${plafond} participants : sur devis.`,
    // Sans mention du nombre de formateurs : les frais de déplacement sont
    // inclus, point. Le palier dit déjà combien de formateurs sont mobilisés.
    'Présentiel : frais de déplacement inclus, et minimum une demi-journée (pas de tarif horaire).',
    HYPOTHESES.au_dela_journee,
  ]
  if (G.supplementFormateur) {
    notes.push(`+${G.supplementFormateur} € HT par formateur supplémentaire (présentiel).`)
  }

  return { libelle: version.libelle, dateEffet: version.dateEffet, lignes, notes }
}

// --- Édition d'une grille (Paramètres → Grille tarifaire) --------------------
//
// Réservée aux administrateurs. ⚠️ Ce contrôle pilote l'affichage, il n'est pas
// une frontière de sécurité : il devra être repris dans database.rules.json pour
// empêcher réellement l'écriture, comme l'avertit firebase-auth.js.
//
// L'éditeur travaille sur une VUE APPARIÉE : un palier y porte son plafond de
// participants, son prix visio, son prix présentiel et son nombre de formateurs.
// Le modèle interne, lui, range les paliers par modalité — c'est ce que lit
// estimer(). Les deux conversions sont ici, et nulle part ailleurs.

// Le droit de modifier la grille est une PERMISSION DE PROFIL, pas une liste de
// profils en dur : il se coche dans Paramètres → Accès utilisateurs, colonne
// Écriture du module « Grille tarifaire ». Un administrateur l'a par défaut, et
// peut le déléguer sans déploiement.
export const MODULE_TARIFS = 'tarifs'

export function peutModifierGrille() {
  const u = getCurrentUser()
  if (!u) return false
  // Repli pour les profils enregistrés AVANT l'ajout du module « tarifs » : ils
  // ne portent pas encore cette permission, et peutEcrire() renverrait false.
  // Sans ce repli, un administrateur se verrait refuser l'accès à l'éditeur
  // jusqu'à la resynchronisation des profils dans Firebase.
  if (!permsCourantes()?.[MODULE_TARIFS]) return u.profilId === 'administrateur'
  return peutEcrire(MODULE_TARIFS)
}

// Métadonnées des formats : ce que l'éditeur affiche et ce qu'il autorise.
// `duree` est la durée facturée du forfait, elle n'est pas éditable (changer
// « demi-journée = 3h30 » ne relève pas d'un tarif mais de l'offre).
export const FORMATS_EDITABLES = [
  {
    id: 'horaire', label: 'À l’heure (visio)', duree: null, parHeure: true, modalites: ['visio'],
    lignes: ['session_1h', 'session_2h'],
    aide: `Prix d’une heure, cumulable jusqu’à ${CUMUL_HORAIRE_MAX}h. Au-delà, c’est la demi-journée qui s’applique.`,
  },
  {
    id: 'webinar', label: 'Webinar (visio)', duree: 1, parHeure: true, modalites: ['visio'],
    lignes: ['webinar'],
    aide: 'Séance d’1h non cumulable, destinée aux clients du cabinet. Laisser le palier illimité pour ne pas plafonner l’audience.',
  },
  {
    id: 'demi_journee', label: 'Demi-journée (3h30)', duree: 3.5, parHeure: false, modalites: ['visio', 'presentiel'],
    lignes: ['demi_journee'],
    aide: 'Forfait appliqué de plus de 2h à moins de 7h.',
  },
  {
    id: 'journee', label: 'Journée (7h)', duree: 7, parHeure: false, modalites: ['visio', 'presentiel'],
    lignes: ['journee'],
    aide: 'Forfait appliqué à partir de 7h, puis par journées entamées.',
  },
]

let compteurCle = 0
const nouvelleCle = () => `p${++compteurCle}`

/** Palier vierge, prêt à être complété dans l'éditeur. */
export function palierVierge(format) {
  return {
    cle: nouvelleCle(),
    illimite: false,
    participantsMax: 10,
    visio: null,
    presentiel: format?.modalites?.includes('presentiel') ? null : undefined,
    formateurs: 1,
    fraisDeplacementInclus: false,
  }
}

/**
 * Ouvre une grille en vue éditable.
 *
 * @param {string|null} dateEffet grille à ouvrir ; null pour partir de celle en
 *                                vigueur et en créer une nouvelle.
 */
export function grilleEditable(dateEffet = null) {
  const version = dateEffet
    ? toutesLesGrilles().find(g => g.dateEffet === dateEffet) || grilleApplicable()
    : grilleApplicable()
  const G = version.grille

  const formats = FORMATS_EDITABLES.map(meta => {
    const format = G[meta.id]
    const visio = trierPaliers(format?.paliers?.visio)
    const presentiel = trierPaliers(format?.paliers?.presentiel)
    const seuils = [...new Set([...visio, ...presentiel].map(p => p.participantsMax))]
      .sort((a, b) => a - b)

    return {
      ...meta,
      paliers: seuils.map(seuil => {
        const v = visio.find(p => p.participantsMax === seuil)
        const p = presentiel.find(x => x.participantsMax === seuil)
        return {
          cle: nouvelleCle(),
          illimite: !Number.isFinite(seuil),
          participantsMax: Number.isFinite(seuil) ? seuil : null,
          visio: v ? v.prix : null,
          presentiel: meta.modalites.includes('presentiel') ? (p ? p.prix : null) : undefined,
          formateurs: Math.max(v?.formateurs || 1, p?.formateurs || 1),
          fraisDeplacementInclus: p?.fraisDeplacementInclus === true,
        }
      }),
    }
  })

  return {
    dateEffet: dateEffet || '',
    libelle: dateEffet ? version.libelle : '',
    origine: dateEffet ? version.origine : 'nouvelle',
    reprisDe: dateEffet ? null : version.dateEffet,
    modifieLe: version.modifieLe || null,
    modifiePar: version.modifiePar || null,
    supplementFormateur: G.supplementFormateur ?? null,
    mentions: mentionsDe(G),
    formats,
  }
}

const nombreOuNull = (v) => (v === null || v === undefined || v === '' ? null : Number(v))

function grilleDepuisVue(vue) {
  const grille = {}

  for (const f of vue.formats) {
    const visio = []
    const presentiel = []

    for (const p of f.paliers) {
      const participantsMax = p.illimite ? Infinity : Number(p.participantsMax)
      const commun = { participantsMax, formateurs: Number(p.formateurs) || 1 }
      const prixVisio = nombreOuNull(p.visio)
      const prixPresentiel = f.modalites.includes('presentiel') ? nombreOuNull(p.presentiel) : null

      if (prixVisio !== null) {
        visio.push(f.parHeure ? { ...commun, prix: prixVisio, parHeure: true } : { ...commun, prix: prixVisio })
      }
      if (prixPresentiel !== null) {
        presentiel.push({
          ...commun, prix: prixPresentiel,
          ...(p.fraisDeplacementInclus ? { fraisDeplacementInclus: true } : {}),
        })
      }
    }

    grille[f.id] = {
      label: f.label,
      duree: f.duree,
      paliers: { visio: trierPaliers(visio), presentiel: trierPaliers(presentiel) },
    }
  }

  const supplement = nombreOuNull(vue.supplementFormateur)
  if (supplement) grille.supplementFormateur = supplement

  // Seules les mentions qui s'écartent du libellé par défaut sont stockées :
  // inutile de figer « 1 ou 2 modules » dans chaque grille enregistrée.
  const mentions = {}
  for (const ligne of LIGNES_AFFICHAGE) {
    const texte = String(vue.mentions?.[ligne.id] ?? '').trim()
    if (texte && texte !== MENTIONS_MODULES_DEFAUT[ligne.id]) mentions[ligne.id] = texte
  }
  if (Object.keys(mentions).length) grille.mentionsModules = mentions

  return grille
}

/** Erreurs bloquantes d'une grille en cours d'édition (liste vide = valide). */
export function validerGrilleEditable(vue) {
  const erreurs = []

  if (!/^\d{4}-\d{2}-\d{2}$/.test(vue.dateEffet || '')) {
    erreurs.push('La date d’effet est obligatoire (format AAAA-MM-JJ).')
  }
  if (!String(vue.libelle || '').trim()) {
    erreurs.push('Le libellé de la grille est obligatoire — c’est lui qui apparaît sur les devis.')
  }

  for (const f of vue.formats) {
    const plafondsVus = new Set()

    for (const p of f.paliers) {
      const nom = p.illimite ? 'palier illimité' : `palier « jusqu’à ${p.participantsMax || '?'} »`
      const participantsMax = p.illimite ? Infinity : Number(p.participantsMax)

      if (!p.illimite && (!Number.isInteger(participantsMax) || participantsMax < 1)) {
        erreurs.push(`${f.label} — ${nom} : le nombre de participants doit être un entier d’au moins 1.`)
      }
      if (plafondsVus.has(participantsMax)) {
        erreurs.push(`${f.label} — ${nom} : deux paliers couvrent le même effectif, le second ne servirait jamais.`)
      }
      plafondsVus.add(participantsMax)

      const prixVisio = nombreOuNull(p.visio)
      const prixPresentiel = f.modalites.includes('presentiel') ? nombreOuNull(p.presentiel) : null

      for (const [libelle, prix] of [['visio', prixVisio], ['présentiel', prixPresentiel]]) {
        if (prix !== null && !(prix > 0)) {
          erreurs.push(`${f.label} — ${nom} : le prix ${libelle} doit être supérieur à 0, ou laissé vide.`)
        }
      }
      if (prixVisio === null && prixPresentiel === null) {
        erreurs.push(`${f.label} — ${nom} : aucun prix renseigné, ce palier n’aurait aucun effet.`)
      }

      const formateurs = Number(p.formateurs)
      if (!Number.isInteger(formateurs) || formateurs < 1 || formateurs > 10) {
        erreurs.push(`${f.label} — ${nom} : le nombre de formateurs doit être un entier entre 1 et 10.`)
      }
    }
  }

  if (!vue.formats.some(f => f.paliers.length > 0)) {
    erreurs.push('Une grille doit tarifer au moins un format.')
  }

  return erreurs
}

function tracer(existant, action) {
  const u = getCurrentUser()
  const entree = {
    le: new Date().toISOString(),
    par: u?.email || '(inconnu)',
    profil: u?.profilId || null,
    action,
  }
  // 20 entrées suffisent à retracer qui a touché un tarif, sans faire grossir
  // indéfiniment un objet qui part sur le réseau à chaque enregistrement.
  return [...(existant?.historique || []), entree].slice(-20)
}

/**
 * Enregistre une grille éditée. Une grille saisie à la date d'effet d'une grille
 * de base la masque ; supprimerGrille() rétablit l'originale.
 *
 * @returns {{ok: boolean, erreurs?: string[]}}
 */
export function enregistrerGrille(vue) {
  if (!peutModifierGrille()) {
    return { ok: false, erreurs: ['Ton profil n’a pas le droit d’écriture sur la grille tarifaire.'] }
  }
  const erreurs = validerGrilleEditable(vue)
  if (erreurs.length) return { ok: false, erreurs }

  const data = load()
  const existant = data[vue.dateEffet]
  const u = getCurrentUser()

  data[vue.dateEffet] = {
    dateEffet: vue.dateEffet,
    libelle: String(vue.libelle).trim(),
    grille: grilleVersStockage(grilleDepuisVue(vue)),
    creeLe: existant?.creeLe || new Date().toISOString(),
    modifieLe: new Date().toISOString(),
    modifiePar: u?.email || '(inconnu)',
    modifieParProfil: u?.profilId || null,
    historique: tracer(existant, existant ? 'modification' : 'création'),
  }

  save(data)
  return { ok: true }
}

/**
 * Supprime une grille saisie. Si une grille de base portait la même date
 * d'effet, elle redevient applicable.
 */
export function supprimerGrille(dateEffet) {
  if (!peutModifierGrille()) {
    return { ok: false, erreurs: ['Ton profil n’a pas le droit d’écriture sur la grille tarifaire.'] }
  }
  const data = load()
  if (!data[dateEffet]) {
    return { ok: false, erreurs: ['Cette grille fait partie du socle : elle ne peut pas être supprimée.'] }
  }
  delete data[dateEffet]
  save(data)
  return { ok: true, baseRetablie: GRILLES_BASE.some(g => g.dateEffet === dateEffet) }
}

/**
 * Compare une même demande entre deux grilles — utile pour mesurer l'effet
 * d'une augmentation avant de l'annoncer.
 */
export function comparerGrilles(demande, dateA, dateB) {
  const a = estimer({ ...demande, date: dateA })
  const b = estimer({ ...demande, date: dateB })
  const ecart = a.prixHT != null && b.prixHT != null ? b.prixHT - a.prixHT : null
  return {
    avant: a,
    apres: b,
    ecart,
    ecartPourcent: ecart != null && a.prixHT ? Math.round((ecart / a.prixHT) * 1000) / 10 : null,
  }
}
