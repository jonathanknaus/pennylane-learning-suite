#!/usr/bin/env node
// Transforme l'export brut des produits SmartOF en catalogue consommable par PLS.
//
//   entrée : export/produit.json          (produit par ./exporter.sh produit)
//   sortie : ../../frontend/src/data/catalogue-smartof.js
//
// Les modules générés S'AJOUTENT au catalogue existant : getThematiques() dans
// catalogue-afs.js fusionne les deux. Rien n'est écrasé.
//
// Chaque module porte le createdAt RÉEL de SmartOF (pas la date d'import) et
// source: 'smartof', pour permettre le tri et l'archivage.
//
// Le script affiche un rapport : il sert à vérifier les valeurs avant de se fier
// au catalogue — en particulier l'unité des montants.

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ICI = dirname(fileURLToPath(import.meta.url))
const ENTREE = join(ICI, 'export', 'produit.json')
const SORTIE = join(ICI, '..', '..', 'frontend', 'src', 'data', 'catalogue-smartof.js')

if (!existsSync(ENTREE)) {
  console.error(`✗ ${ENTREE} est absent.`)
  console.error('  Lance d\'abord :  ./exporter.sh produit')
  process.exit(1)
}

const brut = JSON.parse(readFileSync(ENTREE, 'utf8'))
const produits = brut.produits || []

if (produits.length === 0) {
  console.error('✗ Aucun produit dans l\'export.')
  process.exit(1)
}

// --- Normalisation ----------------------------------------------------------

const txt = (v) => (typeof v === 'string' ? v.trim() : '')
const nombre = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

// Découpe un champ texte multiligne en liste d'objectifs exploitable.
function enListe(valeur) {
  if (Array.isArray(valeur)) return valeur.map(txt).filter(Boolean)
  const s = txt(valeur)
  if (!s) return []
  return s
    .split(/\r?\n|·|•|;/)
    .map((l) => l.replace(/^[-–*\s]+/, '').trim())
    .filter(Boolean)
}

// Identifiant de thématique dérivé de la spécialité BPF, qui est la seule
// clé de regroupement fournie par SmartOF.
function slug(s) {
  return txt(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function premierTarif(produit) {
  const tarifs = produit?.presetTarification?.tarifs
  if (!Array.isArray(tarifs) || tarifs.length === 0) return null
  const tarif = tarifs[0]
  const ligne = Array.isArray(tarif?.budget) && tarif.budget.length ? tarif.budget[0] : null
  if (!ligne) return { intitule: txt(tarif?.intitule) || null }
  return {
    intitule: txt(tarif?.intitule) || null,
    libelle: txt(ligne.libelle) || null,
    prixUnitaireHT: nombre(ligne.prixUnitaireHT),
    quantite: nombre(ligne.quantite),
    unite: txt(ligne.unite) || null,
    tva: nombre(ligne.tva),
    bpf: typeof ligne.bpf === 'boolean' ? ligne.bpf : null,
    numeroCompteComptable: txt(ligne.numeroCompteComptable) || null,
  }
}

function transformer(produit) {
  const d = produit.description || {}
  const preset = produit.presetSession || {}
  const bpf = preset.metaBPF || {}

  const titre = txt(d.intituleDeLaFormation) || txt(produit?.meta?.nom) || '(sans intitulé)'

  // Objectifs : la liste structurée du preset si elle existe, sinon le champ
  // texte du programme découpé en lignes.
  const objectifs = enListe(preset?.objectifs?.objectifs)
  const objectifsFinaux = objectifs.length ? objectifs : enListe(d.objectifsPedagogiques)

  return {
    id: `smartof_${produit.produitFormationUid}`,
    titre,
    description: txt(d.objectifsDeLaFormation) || txt(d.contenuDeLaFormation) || '',
    objectifs: objectifsFinaux,

    // Tri et archivage
    source: 'smartof',
    createdAt: txt(produit.createdAt) || null,
    updatedAt: txt(produit.updatedAt) || null,
    archived: produit.archived === true,

    // Références SmartOF
    smartof: {
      produitFormationUid: produit.produitFormationUid,
      customId: txt(produit.customId) || null,
      status: txt(produit?.meta?.status) || null,
      questionnairesPedagogiques: (preset.questionnairePedagogiqueUids || []).length,
      questionnairesSatisfaction: (preset.questionnaireSatisfactionUids || []).length,
    },

    // Ce qui sert à estimer un coût
    duree: nombre(d.dureeDeLaFormation),
    dureeAffichee: txt(d.dureeDeLaFormationAffichee) || null,
    effectifMin: nombre(d.effectifMin),
    effectifMax: nombre(d.effectifMax),
    modeOrganisation: txt(d.modeDOrganisation) || null,
    lieu: txt(d.lieuDeLaFormation) || null,
    tarif: premierTarif(produit),

    // Programme conforme — mentions obligatoires
    programme: {
      contenu: txt(d.contenuDeLaFormation) || null,
      preRequis: txt(d.preRequis) || null,
      publicVise: txt(d.publicVise) || null,
      modalitesAcces: txt(d.modalitesDAccesALaFormation) || null,
      modalitesPedagogiques: txt(d.modalitesPedagogiques) || null,
      modalitesEvaluation: txt(d.modalitesDEvaluationEtDeSuivi) || null,
      moyensEtSupports: txt(d.moyensEtSupportsPedagogiques) || null,
      profilFormateurs: txt(d.profilDuOuDesFormateurs) || null,
      annexe: txt(d?.annexe?.documentName) || null,
    },

    // BPF
    bpf: {
      horsBPF: bpf.horsBPF === true,
      specialite: txt(bpf.specialite) || null,
      categorie: txt(bpf?.viseeFormation?.categorie) || null,
    },
  }
}

const modules = produits.map(transformer)

// --- Regroupement par format de durée ---------------------------------------
//
// La spécialité BPF ne fait pas une bonne clé de regroupement : c'est un code
// NSF (314, 100), illisible, et 15 produits sur 43 n'en portent pas.
// Le format de durée, lui, est renseigné partout, parle au métier et correspond
// à la grille TARIFS — donc utile pour estimer un coût.

const FORMATS = [
  { id: 'court', emoji: '⏱️', titre: 'Format court (≤ 2h30)', max: 2.5 },
  { id: 'demi_journee', emoji: '🌓', titre: 'Demi-journée (≈ 3h30)', max: 4 },
  { id: 'journee', emoji: '📅', titre: 'Journée (≈ 7h)', max: 8 },
  { id: 'plusieurs_jours', emoji: '🗓️', titre: 'Plusieurs jours (> 8h)', max: Infinity },
]

function formatDe(duree) {
  if (duree === null || duree === 0) return { id: 'sans_duree', emoji: '❓', titre: 'Durée non renseignée' }
  return FORMATS.find((f) => duree <= f.max) ?? FORMATS[FORMATS.length - 1]
}

const groupes = new Map()
for (const m of modules) {
  const f = formatDe(m.duree)
  const id = `smartof_${f.id}`
  if (!groupes.has(id)) groupes.set(id, { id, emoji: f.emoji, titre: f.titre, modules: [] })
  groupes.get(id).modules.push(m)
}

const ORDRE = ['court', 'demi_journee', 'journee', 'plusieurs_jours', 'sans_duree']
const thematiques = [...groupes.values()].sort(
  (a, b) => ORDRE.indexOf(a.id.replace('smartof_', '')) - ORDRE.indexOf(b.id.replace('smartof_', ''))
)

// --- Écriture ---------------------------------------------------------------

const genereLe = new Date().toISOString().slice(0, 10)
const contenu = `// ⚠️ FICHIER GÉNÉRÉ — ne pas éditer à la main.
//
// Produit par : scripts/smartof/generer-catalogue.mjs
// Source      : export de l'API SmartOF — ${produits.length} produits
// Généré le   : ${genereLe}
//
// Pour régénérer :
//   cd scripts/smartof && ./exporter.sh produit && node generer-catalogue.mjs
//
// Les modules portent le createdAt RÉEL de SmartOF et source: 'smartof'.
// Ils s'AJOUTENT au catalogue existant via getThematiques() (catalogue-afs.js).

export const GENERE_LE = ${JSON.stringify(genereLe)}

export const THEMATIQUES_SMARTOF = ${JSON.stringify(thematiques, null, 2)}
`

writeFileSync(SORTIE, contenu, 'utf8')

// --- Rapport de contrôle ----------------------------------------------------

const prix = modules.map((m) => m.tarif?.prixUnitaireHT).filter((p) => p !== null && p !== undefined)
const durees = modules.map((m) => m.duree).filter((d) => d !== null)
const archives = modules.filter((m) => m.archived).length
const sansTarif = modules.filter((m) => !m.tarif?.prixUnitaireHT).length
const sansObjectifs = modules.filter((m) => m.objectifs.length === 0).length
const dates = modules.map((m) => m.createdAt).filter(Boolean).sort()

const fmt = (n) => (n === undefined ? '—' : String(n))

console.log(`✅ Écrit : ${SORTIE}`)
console.log()
console.log(`  produits traités        : ${modules.length}`)
console.log(`  dont archivés           : ${archives}`)
console.log(`  groupes (par format)    : ${thematiques.length}`)
thematiques.forEach((t) => console.log(`     · ${t.titre} — ${t.modules.length}`))
console.log()
console.log(`  dates de création       : ${dates[0] ?? '—'} → ${dates[dates.length - 1] ?? '—'}`)
console.log(`  durées (heures)         : min ${fmt(Math.min(...durees))} / max ${fmt(Math.max(...durees))}`)
console.log()
console.log('  ⚠️ À VÉRIFIER — unité des montants :')
console.log(`  prixUnitaireHT          : min ${fmt(Math.min(...prix))} / max ${fmt(Math.max(...prix))}`)
console.log('     Si les valeurs ressemblent à 60000 pour 600 €, elles sont en CENTIMES.')
console.log('     Compare avec ta grille TARIFS (200 / 400 / 600 / 1000 / 1200 / 2000 €).')
console.log()
console.log(`  produits sans tarif     : ${sansTarif}`)
console.log(`  produits sans objectifs : ${sansObjectifs}`)

// --- Contrôles qualité du catalogue -----------------------------------------
// Ces alertes portent sur SmartOF, pas sur l'import : elles signalent ce qu'il
// y aurait à nettoyer côté catalogue.

console.log()
console.log('  — contrôles qualité du catalogue SmartOF —')

const tests = modules.filter((m) => /^\[?TEST/i.test(m.titre) || /^Module \d+$/i.test(m.titre))
if (tests.length) {
  console.log(`  ⚠ ${tests.length} produit(s) de test :`)
  tests.forEach((m) => console.log(`     · ${m.titre}${m.archived ? ' (archivé)' : ' — NON ARCHIVÉ'}`))
}

const sansNSF = modules.filter((m) => !m.archived && !m.bpf.specialite)
if (sansNSF.length) {
  console.log(`  ⚠ ${sansNSF.length} produit(s) actifs sans spécialité BPF (code NSF)`)
  console.log('     → à classer, sinon ils échapperont au Bilan Pédagogique et Financier')
}

// Même intitulé, tarifs ou durées différents : à arbitrer avant d'estimer un prix.
const parTitre = new Map()
modules
  .filter((m) => !m.archived)
  .forEach((m) => {
    const cle = m.titre.toLowerCase().replace(/\s+/g, ' ').trim()
    if (!parTitre.has(cle)) parTitre.set(cle, [])
    parTitre.get(cle).push(m)
  })
const doublons = [...parTitre.values()].filter((g) => g.length > 1)
if (doublons.length) {
  console.log(`  ⚠ ${doublons.length} intitulé(s) en plusieurs versions :`)
  doublons.forEach((g) => {
    const variantes = g.map((m) => `${m.duree ?? '?'}h/${m.tarif?.prixUnitaireHT ?? '?'}€`).join('  ')
    console.log(`     · ${g[0].titre.slice(0, 50)} → ${variantes}`)
  })
  console.log('     → pour estimer un prix, il faudra savoir laquelle fait référence')
}
