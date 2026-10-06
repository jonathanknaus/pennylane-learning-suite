// Grilles tarifaires AFS et estimation du coût d'une formation.
//
// Tous les montants sont en euros HT.
//
// Les grilles sont VERSIONNÉES par date d'effet : une augmentation tarifaire
// n'écrase pas la précédente. C'est nécessaire parce qu'un devis émis, une
// convention signée ou une fiche produit SmartOF restent rattachés au tarif en
// vigueur à leur date — on doit pouvoir les recalculer des mois plus tard.
//
// Pour ajouter une augmentation : ajouter une entrée dans GRILLES avec sa
// dateEffet. Rien d'autre à modifier.

export const SEUIL_SUR_DEVIS = 25

// Le tarif horaire se cumule jusqu'à 2 heures. Au-delà, c'est le forfait
// demi-journée qui s'applique — il n'existe pas de formation de 3h au tarif horaire.
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
  prixHoraire: 200,
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
  prixHoraire: 200,
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

// --- Registre des grilles, de la plus récente à la plus ancienne -------------
//
// Pour enregistrer une prochaine hausse, ajouter une entrée en TÊTE de ce
// tableau, sur le modèle de GRILLE_2026_10. L'ordre décroissant est ce qui
// permet à grilleApplicable() de retenir la première dont la date est atteinte.

export const GRILLES = [
  { dateEffet: '2026-10-05', libelle: 'Grille du 5 octobre 2026', grille: GRILLE_2026_10 },
  { dateEffet: '2026-01-01', libelle: 'Grille précédente', grille: GRILLE_PRECEDENTE },
]

/** Grille applicable à une date donnée (par défaut : aujourd'hui). */
export function grilleApplicable(date = null) {
  const jour = (date ? new Date(date) : new Date()).toISOString().slice(0, 10)
  const trouvee = GRILLES.find(g => g.dateEffet <= jour)
  return trouvee || GRILLES[GRILLES.length - 1]
}

/** Grille à venir, si une augmentation est déjà enregistrée mais pas en vigueur. */
export function grilleAVenir(date = null) {
  const jour = (date ? new Date(date) : new Date()).toISOString().slice(0, 10)
  const futures = GRILLES.filter(g => g.dateEffet > jour)
  return futures.length ? futures[futures.length - 1] : null
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
  return paliers.find(p => participants <= p.participantsMax) || null
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
    return {
      ...commun, valide: true, surDevis: false,
      format: formatId, formatLabel: format.label, modalite: 'visio',
      dureeFacturee: 1, participants, participantsMax: null,
      formateurs: 1, prixHT: G.prixHoraire,
      detail: `Webinar 1h × ${G.prixHoraire} € — participants illimités`,
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
      motifDevis: `Au-delà de ${SEUIL_SUR_DEVIS} apprenants, le tarif est établi sur devis.`,
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
  return participantsMax === Infinity ? 'illimité' : `jusqu’à ${participantsMax}`
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
  const horaire = G.horaire.paliers.visio[0]
  const webinar = G.webinar.paliers.visio[0]

  const palierHoraire = (heures) => ({
    participantsMax: horaire.participantsMax,
    label: seuilLabel(horaire.participantsMax),
    visio: horaire.prix * heures,
    presentiel: null,
    formateurs: horaire.formateurs,
  })

  const lignes = [
    { id: 'session_1h', label: 'Session 1h', hint: '1 ou 2 modules', paliers: [palierHoraire(1)] },
    {
      id: 'session_2h',
      label: 'Session 2h',
      hint: `3 à 4 modules · cumul horaire plafonné à ${CUMUL_HORAIRE_MAX}h`,
      paliers: [palierHoraire(CUMUL_HORAIRE_MAX)],
    },
    {
      id: 'webinar',
      label: 'Webinar 1h',
      hint: 'pour les clients du cabinet · non cumulable',
      paliers: [{
        participantsMax: webinar.participantsMax,
        label: seuilLabel(webinar.participantsMax),
        visio: webinar.prix,
        presentiel: null,
        formateurs: webinar.formateurs,
      }],
    },
    { id: 'demi_journee', label: '½ Journée (3h30)', hint: 'jusqu’à 5 modules', paliers: paliersApparies(G.demi_journee) },
    { id: 'journee', label: 'Journée complète (7h)', hint: 'programme sur mesure', paliers: paliersApparies(G.journee) },
  ]

  // Le plafond annoncé est celui des forfaits de la grille AFFICHÉE, pas
  // SEUIL_SUR_DEVIS : l'ancienne grille s'arrêtait à 15 participants, et une
  // carte lue pour un devis ancien doit dire 15, pas 25.
  const plafond = Math.max(
    ...lignes.flatMap(l => l.paliers.map(p => p.participantsMax)).filter(n => n !== Infinity)
  )

  const notes = [
    `Au-delà de ${plafond} participants : sur devis.`,
    'Présentiel : frais de déplacement inclus pour 1 formateur, et minimum une demi-journée (pas de tarif horaire).',
    HYPOTHESES.au_dela_journee,
  ]
  if (G.supplementFormateur) {
    notes.push(`+${G.supplementFormateur} € HT par formateur supplémentaire (présentiel).`)
  }

  return { libelle: version.libelle, dateEffet: version.dateEffet, lignes, notes }
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
