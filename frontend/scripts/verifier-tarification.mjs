// Vérifie la tarification hors navigateur : grilles datées, édition, droits, PDF.
//
//   node scripts/verifier-tarification.mjs
//
// Pourquoi ce script existe : la grille s'édite désormais dans l'application, et
// elle porte de l'argent. Trois régressions possibles ne se voient pas à l'œil :
//   · JSON.stringify(Infinity) vaut null — un aller-retour non converti change le
//     palier illimité du webinar en « 0 participant » ;
//   · le plafond « sur devis » dépend du FORMAT (15 à l'heure, 25 en forfait) ;
//   · un droit d'écriture mal résolu bloque un administrateur, ou laisse passer
//     un profil en lecture seule.
//
// Le projet n'a pas de lanceur de tests. Plutôt que d'en ajouter un, ce script
// bundle les modules avec l'esbuild déjà fourni par Vite, en remplaçant le réseau
// par scripts/stub-reseau.mjs, puis exécute les contrôles sous node.

import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'

const ici = dirname(fileURLToPath(import.meta.url))
const racine = join(ici, '..')

// ── Bundling : le stub prend la place de firebase et de l'API ────────────────

const entree = join(tmpdir(), 'pls-verif-entree.mjs')
const sortie = join(tmpdir(), 'pls-verif-bundle.mjs')

writeFileSync(entree, `
  export * as tarification from ${JSON.stringify(join(racine, 'src/data/tarification.js'))}
  export * as pdf from ${JSON.stringify(join(racine, 'src/data/grille-pdf.js'))}
`)

await build({
  entryPoints: [entree],
  bundle: true, format: 'esm', platform: 'node', outfile: sortie,
  define: { 'import.meta.env': '{}' },
  plugins: [{
    name: 'stub-reseau',
    setup(b) {
      b.onResolve({ filter: /^firebase(\/|$)|firebase-auth\.js$|\/api\.js$/ },
        () => ({ path: join(ici, 'stub-reseau.mjs') }))
    },
  }],
})

// ── localStorage simulé, et session connectée ───────────────────────────────

const store = new Map()
globalThis.localStorage = {
  getItem: c => (store.has(c) ? store.get(c) : null),
  setItem: (c, v) => store.set(c, String(v)),
  removeItem: c => store.delete(c),
}

const connecter = (profilId, perms = null) => store.set('pls_session', JSON.stringify({
  user: { email: 'demo@pennylane.com', profilId, ...(perms ? { perms } : {}) },
}))

connecter('administrateur')

const { tarification: T, pdf: P } = await import(sortie)

// ── Contrôles ───────────────────────────────────────────────────────────────

let echecs = 0
const section = t => console.log(`\n${t}`)
function ok(libelle, condition) {
  if (!condition) echecs++
  console.log(`  ${condition ? 'OK   ' : 'ÉCHEC'} ${libelle}`)
}

section('Socle : les deux grilles en dur')
ok('2 grilles connues', T.toutesLesGrilles().length === 2)
ok('en vigueur = 5 octobre 2026', T.grilleApplicable().dateEffet === '2026-10-05')
ok('demi-journée visio 10 pers = 750 €', T.estimer({ dureeHeures: 3.5, participants: 10 }).prixHT === 750)
ok('journée présentiel 15 pers = 2500 € et 2 formateurs', (() => {
  const e = T.estimer({ dureeHeures: 7, modalite: 'presentiel', participants: 15 })
  return e.prixHT === 2500 && e.formateurs === 2
})())
ok('webinar illimité', T.estimer({ dureeHeures: 1, webinar: true, participants: 500 }).prixHT === 200)
ok('1h en présentiel : sur devis MOTIVÉ, pas un prix', (() => {
  const e = T.estimer({ dureeHeures: 1, modalite: 'presentiel', participants: 8 })
  return e.valide && e.surDevis && /demi-journée/.test(e.motifDevis)
})())
ok('toute estimation rend soit un montant, soit un sur-devis motivé', (() => {
  for (const dureeHeures of [1, 2, 3.5, 7, 14]) {
    for (const modalite of ['visio', 'presentiel']) {
      for (const participants of [1, 10, 15, 25, 40]) {
        const e = T.estimer({ dureeHeures, modalite, participants })
        if (!e.valide) return false
        if (e.surDevis ? !e.motifDevis : typeof e.prixHT !== 'number') return false
      }
    }
  }
  return true
})())

section('Le plafond « sur devis » suit le format, pas la grille entière')
ok('plafond global = 25', T.plafondGrille() === 25)
ok('1h visio → 15', T.plafondPourDemande({ dureeHeures: 1, modalite: 'visio' }) === 15)
ok('2h visio → 15', T.plafondPourDemande({ dureeHeures: 2, modalite: 'visio' }) === 15)
ok('3h30 visio → 25', T.plafondPourDemande({ dureeHeures: 3.5, modalite: 'visio' }) === 25)
ok('7h présentiel → 25', T.plafondPourDemande({ dureeHeures: 7, modalite: 'presentiel' }) === 25)
ok('1h présentiel → 0 (jamais tarifé à l’heure)', T.plafondPourDemande({ dureeHeures: 1, modalite: 'presentiel' }) === 0)
ok('webinar → illimité, donc aucun plafond fini', T.plafondPourDemande({ dureeHeures: 1, webinar: true }) === 0)

section('Édition : aller-retour par le stockage')
const vue = T.grilleEditable('2026-10-05')
ok('4 formats éditables', vue.formats.length === 4)
ok('palier webinar marqué illimité', vue.formats.find(f => f.id === 'webinar').paliers[0].illimite === true)
ok('enregistrement accepté', T.enregistrerGrille(vue).ok === true)
ok('la grille saisie masque le socle', T.grilleApplicable().origine === 'personnalisee')
ok('prix inchangés après aller-retour', T.estimer({ dureeHeures: 3.5, participants: 10 }).prixHT === 750)
ok('palier illimité préservé (Infinity ↔ null)', T.estimer({ dureeHeures: 1, webinar: true, participants: 500 }).prixHT === 200)

section('Ajout d’un palier « jusqu’à 40 participants, 3 formateurs »')
const v40 = T.grilleEditable('2026-10-05')
v40.formats.find(f => f.id === 'journee').paliers.push({
  cle: 'neuf', illimite: false, participantsMax: 40,
  visio: 1800, presentiel: 3200, formateurs: 3, fraisDeplacementInclus: false,
})
ok('validation sans erreur', T.validerGrilleEditable(v40).length === 0)
ok('enregistré', T.enregistrerGrille(v40).ok === true)
ok('plafond du format suit à 40', T.plafondPourDemande({ dureeHeures: 7, modalite: 'presentiel' }) === 40)
ok('32 pers → 3200 € et 3 formateurs', (() => {
  const e = T.estimer({ dureeHeures: 7, modalite: 'presentiel', participants: 32 })
  return e.prixHT === 3200 && e.formateurs === 3
})())
ok('41 pers → sur devis au-delà de 40', /40/.test(T.estimer({ dureeHeures: 7, participants: 41 }).motifDevis))

section('Validation : les saisies fautives sont refusées')
const fautif = (modif) => { const v = T.grilleEditable('2026-10-05'); modif(v); return T.validerGrilleEditable(v) }
ok('date d’effet manquante', fautif(v => { v.dateEffet = '' }).some(e => /date d’effet/.test(e)))
ok('libellé vide', fautif(v => { v.libelle = '  ' }).some(e => /libellé/.test(e)))
ok('deux paliers au même effectif', fautif(v => {
  const f = v.formats.find(x => x.id === 'demi_journee'); f.paliers.push({ ...f.paliers[0], cle: 'bis' })
}).some(e => /même effectif/.test(e)))
ok('prix à 0', fautif(v => { v.formats.find(f => f.id === 'journee').paliers[0].visio = 0 }).some(e => /supérieur à 0/.test(e)))
ok('0 formateur', fautif(v => { v.formats.find(f => f.id === 'journee').paliers[0].formateurs = 0 }).some(e => /formateurs/.test(e)))
ok('palier sans aucun prix', fautif(v => {
  const p = v.formats.find(f => f.id === 'journee').paliers[0]; p.visio = null; p.presentiel = null
}).some(e => /aucun prix/.test(e)))

section('Mentions de modules')
const vm = T.grilleEditable('2026-10-05')
vm.mentions.session_2h = '3 ou 4 modules'
ok('enregistré', T.enregistrerGrille(vm).ok === true)
ok('reprise dans l’affichage', T.grillePourAffichage().lignes
  .find(l => l.id === 'session_2h').hint.startsWith('3 ou 4 modules'))
ok('seules les mentions modifiées sont stockées', Object.keys(
  JSON.parse(store.get('pls_grilles_tarifaires'))['2026-10-05'].grille.mentionsModules
).join() === 'session_2h')
vm.mentions.session_2h = ''
T.enregistrerGrille(vm)
ok('vider une mention rétablit le défaut', T.grillePourAffichage().lignes
  .find(l => l.id === 'session_2h').hint.startsWith('3 à 4 modules'))

section('Suppression : le socle revient')
const suppression = T.supprimerGrille('2026-10-05')
ok('supprimée et socle rétabli', suppression.ok === true && suppression.baseRetablie === true)
ok('tarif d’origine revenu', T.estimer({ dureeHeures: 7, modalite: 'presentiel', participants: 15 }).prixHT === 2500)
ok('plafond revenu à 25', T.plafondGrille() === 25)

section('Grille future : le tarif est figé à la date de la demande')
const future = T.grilleEditable(null)
future.dateEffet = '2027-01-01'
future.libelle = 'Grille du 1er janvier 2027'
future.formats.find(f => f.id === 'demi_journee').paliers[0].visio = 900
ok('enregistrée', T.enregistrerGrille(future).ok === true)
ok('aujourd’hui : toujours 750 €', T.estimer({ dureeHeures: 3.5, participants: 10 }).prixHT === 750)
ok('en 2027 : 900 €', T.estimer({ dureeHeures: 3.5, participants: 10, date: '2027-03-01' }).prixHT === 900)
ok('hausse à venir signalée en alerte', T.estimer({ dureeHeures: 3.5, participants: 10 })
  .alertes.some(a => a.includes('2027-01-01')))
T.supprimerGrille('2027-01-01')

section('Droits : la permission de profil « tarifs » gouverne')
connecter('administrateur', null)
ok('admin sans perms enregistrées → autorisé (repli)', T.peutModifierGrille() === true)
connecter('formateur_interne', null)
ok('formateur sans perms → refusé', T.peutModifierGrille() === false)
ok('écriture refusée', T.enregistrerGrille(T.grilleEditable('2026-10-05')).ok === false)
ok('suppression refusée', T.supprimerGrille('2026-10-05').ok === false)
connecter('formateur_interne', { tarifs: { acces: true, lecture: true, ecriture: true } })
ok('formateur avec écriture déléguée → autorisé', T.peutModifierGrille() === true)
connecter('administrateur', { tarifs: { acces: true, lecture: true, ecriture: false } })
ok('admin dont l’écriture est retirée → refusé', T.peutModifierGrille() === false)
connecter('consultatif', { tarifs: { acces: true, lecture: true, ecriture: false } })
ok('consultatif → refusé', T.peutModifierGrille() === false)

section('PDF de la grille')
connecter('administrateur')
const html = P.genererGrilleHTML()
ok('titre', html.includes('Grille tarifaire — Formations AFS'))
ok('montants hors taxes annoncés', html.includes('hors taxes'))
ok('750 € présent', html.includes(`${(750).toLocaleString('fr-FR')} €`))
ok('2500 € présent', html.includes(`${(2500).toLocaleString('fr-FR')} €`))
ok('paliers de participants', html.includes('jusqu’à 25 participants'))
ok('mentions de modules', html.includes('jusqu’à 5 modules'))
ok('frais de déplacement sans mention de formateur',
  html.includes('frais de déplacement inclus') && !html.includes('inclus pour 1 formateur'))
ok('rappel du tarif figé à la demande', html.includes('grille en vigueur à la date de cette demande'))

// L'éditeur propose un PDF par grille : il doit sortir CELLE de la ligne, à sa
// date d'effet, et non la grille du jour.
const grilleDatee = T.grilleEditable(null)
grilleDatee.dateEffet = '2027-06-01'
grilleDatee.libelle = 'Grille du 1er juin 2027'
grilleDatee.formats.find(f => f.id === 'demi_journee').paliers[0].visio = 1234
T.enregistrerGrille(grilleDatee)
const htmlDate = P.genererGrilleHTML('2027-06-01')
ok('PDF d’une grille datée : son libellé', htmlDate.includes('Grille du 1er juin 2027'))
ok('PDF d’une grille datée : son tarif à elle', htmlDate.includes(`${(1234).toLocaleString('fr-FR')} €`))
ok('PDF du jour : inchangé', !P.genererGrilleHTML().includes('1 234'))
T.supprimerGrille('2027-06-01')

// ── Sortie ──────────────────────────────────────────────────────────────────

rmSync(entree, { force: true })
rmSync(sortie, { force: true })

console.log(`\n${echecs === 0 ? '✅ Tout passe.' : `❌ ${echecs} échec(s).`}`)
process.exit(echecs === 0 ? 0 : 1)
