#!/usr/bin/env node
// Compare les tarifs enregistrés dans SmartOF à la grille tarifaire AFS.
//
//   entrée : export/produit.json  (./exporter.sh produit)
//   grille : ../../frontend/src/data/tarification.js
//
// Ne modifie rien. Sert à repérer les fiches produit dont le prix ne correspond
// pas à la grille — avant de bâtir une estimation dessus.
//
//   usage : node comparer-tarifs.mjs

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { estimer } from '../../frontend/src/data/tarification.js'

const ICI = dirname(fileURLToPath(import.meta.url))
const ENTREE = join(ICI, 'export', 'produit.json')

if (!existsSync(ENTREE)) {
  console.error('✗ export/produit.json absent. Lance : ./exporter.sh produit')
  process.exit(1)
}

const produits = JSON.parse(readFileSync(ENTREE, 'utf8')).produits || []

// La modalité est saisie librement dans SmartOF : on normalise.
function modaliteDe(desc) {
  const brut = `${desc.modeDOrganisation || ''} ${desc.lieuDeLaFormation || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
  if (brut.includes('mixte')) return 'mixte'
  if (brut.includes('presentiel')) return 'presentiel'
  if (brut.includes('distanc') || brut.includes('visio') || brut.includes('a distance')) return 'visio'
  return null
}

const lignes = []
let ignores = 0

for (const p of produits) {
  if (p.archived) continue
  const d = p.description || {}
  const tarifs = (p.presetTarification || {}).tarifs || []
  const budget = tarifs[0]?.budget?.[0]
  const prixReel = budget?.prixUnitaireHT ?? null
  const duree = d.dureeDeLaFormation ?? null
  const effectif = d.effectifMax ?? null
  const modalite = modaliteDe(d)
  const titre = (d.intituleDeLaFormation || p.meta?.nom || '(sans intitulé)').trim()

  if (!duree || !prixReel || !modalite || modalite === 'mixte' || !effectif) {
    ignores++
    lignes.push({ titre, duree, prixReel, effectif, modalite, incomplet: true })
    continue
  }

  const e = estimer({ dureeHeures: duree, modalite, participants: effectif })
  const prixGrille = e.surDevis ? null : e.prixHT
  lignes.push({
    titre, duree, prixReel, effectif, modalite,
    prixGrille, surDevis: e.surDevis,
    ecart: prixGrille === null ? null : prixReel - prixGrille,
    formateurs: e.formateurs,
  })
}

// `typeof === 'number'` et non `!== null` : les fiches incomplètes n'ont pas de
// champ ecart du tout, et undefined passait le filtre, faussant le total.
const conformes = lignes.filter(l => l.ecart === 0)
const ecarts = lignes.filter(l => typeof l.ecart === 'number' && l.ecart !== 0)
const incomplets = lignes.filter(l => l.incomplet)
const devis = lignes.filter(l => l.surDevis)

console.log(`Produits actifs analysés : ${lignes.length}`)
console.log(`  conformes à la grille  : ${conformes.length}`)
console.log(`  en écart               : ${ecarts.length}`)
console.log(`  passeraient sur devis  : ${devis.length}`)
console.log(`  données incomplètes    : ${incomplets.length}`)

if (ecarts.length) {
  console.log('\n=== Écarts avec la grille ===')
  console.log(`${'INTITULÉ'.padEnd(50)} ${'DURÉE'.padStart(6)} ${'EFF'.padStart(4)} ${'MODAL'.padStart(11)} ${'RÉEL'.padStart(6)} ${'GRILLE'.padStart(7)} ${'ÉCART'.padStart(7)}`)
  console.log('-'.repeat(100))
  ecarts
    .sort((a, b) => Math.abs(b.ecart) - Math.abs(a.ecart))
    .forEach(l => {
      const signe = l.ecart > 0 ? '+' : ''
      console.log(
        `${l.titre.slice(0, 49).padEnd(50)} ${String(l.duree).padStart(6)} ${String(l.effectif).padStart(4)} ${l.modalite.padStart(11)} ${String(l.prixReel).padStart(6)} ${String(l.prixGrille).padStart(7)} ${(signe + l.ecart).padStart(7)}`
      )
    })
}

if (devis.length) {
  console.log('\n=== Passeraient « sur devis » selon la grille ===')
  devis.forEach(l => console.log(`  · ${l.titre.slice(0, 55)} — ${l.duree}h, ${l.effectif} apprenants, ${l.modalite}`))
}

if (incomplets.length) {
  console.log('\n=== Fiches incomplètes (non comparables) ===')
  incomplets.forEach(l => {
    const manque = []
    if (!l.duree) manque.push('durée')
    if (!l.prixReel) manque.push('tarif')
    if (!l.effectif) manque.push('effectif')
    if (!l.modalite) manque.push('modalité')
    if (l.modalite === 'mixte') manque.push('modalité ambiguë (mixte)')
    console.log(`  · ${l.titre.slice(0, 55)} — manque : ${manque.join(', ')}`)
  })
}

if (ecarts.length) {
  const total = ecarts.reduce((s, l) => s + l.ecart, 0)
  console.log(`\nÉcart cumulé : ${total > 0 ? '+' : ''}${total} € sur ${ecarts.length} fiche(s).`)
  console.log('Un écart positif signifie que SmartOF facture plus que la grille.')
}

// --- Analyse de sensibilité à l'effectif ------------------------------------
// 29 produits déclarent effectifMax = 15, ce qui les fait basculer au second
// palier de la grille (celui à 2 formateurs). Si cette valeur était un simple
// défaut de saisie et que l'effectif réel tenait dans le premier palier,
// combien de fiches redeviendraient conformes ?

let conformesSi10 = 0
const comparables = lignes.filter(l => !l.incomplet && typeof l.ecart === 'number')
for (const l of comparables) {
  const e = estimer({ dureeHeures: l.duree, modalite: l.modalite, participants: 10 })
  if (!e.surDevis && e.prixHT === l.prixReel) conformesSi10++
}

console.log('\n=== Hypothèse : et si l’effectif réel était de 10 ? ===')
console.log(`  conformes avec l'effectif déclaré : ${conformes.length} / ${comparables.length}`)
console.log(`  conformes avec un effectif de 10  : ${conformesSi10} / ${comparables.length}`)
if (conformesSi10 > conformes.length) {
  console.log('  → L\'essentiel de l\'écart vient donc de effectifMax, pas des prix.')
  console.log('    Les effectifs à 15 sont probablement une valeur par défaut à corriger.')
}
