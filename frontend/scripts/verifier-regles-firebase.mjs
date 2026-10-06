// Confronte database.rules.json au code qui écrit dans Firebase.
//
//   node scripts/verifier-regles-firebase.mjs
//
// Pourquoi ce script existe : les règles Realtime Database refusent silencieusement
// une écriture non conforme — `pousser()` se contente d'un console.warn. Une
// divergence entre un champ ajouté dans le code et la liste autorisée par les
// règles ne se voit donc pas à l'usage, elle se voit en audit quand la preuve
// manque. Plusieurs sessions modifient ce fichier en parallèle, d'où ce contrôle.
//
// Ce qu'il vérifie :
//   1. chaque chemin Firebase utilisé par le code est couvert par une règle ;
//   2. les listes de champs déclarées dans le code (CHAMPS, CHAMPS_MANUEL)
//      correspondent exactement aux champs autorisés par les règles ;
//   3. les valeurs énumérées écrites par le code (decision, indicateur, niveau)
//      sont acceptées par les .validate correspondants ;
//   4. `donnees` n'a pas de `.write` global — sinon la restriction d'écriture de
//      la grille tarifaire serait inopérante, RTDB ne permettant pas de
//      restreindre plus bas ce qu'un parent accorde.
//
// Il ne remplace pas un test contre l'émulateur : il compare des déclarations.

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ici = dirname(fileURLToPath(import.meta.url))
const racine = join(ici, '../..')
const src = join(racine, 'frontend/src')

const regles = JSON.parse(readFileSync(join(racine, 'database.rules.json'), 'utf8')).rules
const lire = (f) => readFileSync(join(src, f), 'utf8')

let echecs = 0
const section = (t) => console.log(`\n${t}`)
function ok(libelle, condition, detail = '') {
  if (!condition) echecs++
  console.log(`  ${condition ? 'OK   ' : 'ÉCHEC'} ${libelle}${detail ? ` — ${detail}` : ''}`)
}

/** Champs explicitement listés sous un nœud de règles (hors directives .read/.write/...). */
function champsAutorises(noeud) {
  return Object.keys(noeud || {}).filter(k => !k.startsWith('.') && !k.startsWith('$')).sort()
}

/** Valeurs acceptées par un .validate du type "newData.val() === 'a' || ... === 'b'". */
function enumDuValidate(validate) {
  return [...String(validate || '').matchAll(/===\s*'([^']+)'/g)].map(m => m[1]).sort()
}

/**
 * Liste de chaînes d'une constante JS `const NOM = ['a', 'b']`.
 *
 * Les commentaires sont retirés d'abord : une apostrophe française dans un
 * commentaire interne au tableau (« l'action menée ») était sinon prise pour un
 * littéral, et le contrôle signalait des champs qui n'existent pas.
 */
function listeConstante(source, nom) {
  const m = source.match(new RegExp(`const\\s+${nom}\\s*=\\s*\\[([\\s\\S]*?)\\]`))
  if (!m) return null
  const sansCommentaires = m[1].replace(/\/\/[^\n]*/g, '')
  return [...sansCommentaires.matchAll(/'([^']+)'/g)].map(x => x[1]).sort()
}

const memeEnsemble = (a, b) => a && b && a.join() === b.join()
const manquants = (attendus, presents) => attendus.filter(x => !presents.includes(x))

// ── 1. Les chemins utilisés par le code sont couverts ───────────────────────

section('Chemins Firebase utilisés par le code')

const chemins = {
  'acces': lire('data/firebase-auth.js').includes("CHEMIN_ACCES = 'acces'"),
  'profils': lire('data/firebase-auth.js').includes("CHEMIN_PROFILS = 'profils'"),
  'cabinets': lire('data/cabinets-firebase.js').includes("CHEMIN = 'cabinets'"),
  'donnees': lire('data/store-firebase.js').includes("RACINE = 'donnees'"),
}
for (const [noeud, utilise] of Object.entries(chemins)) {
  if (utilise) ok(`${noeud} — règle présente`, !!regles[noeud])
}

const veille = lire('data/veille-storage.js')
for (const [constante, sousNoeud] of [
  ['CHEMIN', 'traitements'], ['CHEMIN_ARCHIVES', 'archives'], ['CHEMIN_MANUELS', 'articles-manuels'],
]) {
  const m = veille.match(new RegExp(`const\\s+${constante}\\s*=\\s*'veille/([^']+)'`))
  if (m) ok(`veille/${m[1]} — règle présente`, !!regles.veille?.[m[1]], `attendu : veille/${sousNoeud}`)
}

// ── 2. Les listes de champs du code = celles des règles ────────────────────

section('Listes de champs : code ↔ règles (tout champ inconnu est refusé)')

const casChamps = [
  {
    libelle: 'veille/traitements',
    duCode: listeConstante(veille, 'CHAMPS'),
    desRegles: champsAutorises(regles.veille?.traitements?.$trace),
  },
  {
    libelle: 'veille/articles-manuels',
    duCode: listeConstante(veille, 'CHAMPS_MANUEL'),
    desRegles: champsAutorises(regles.veille?.['articles-manuels']?.$article),
  },
]

for (const { libelle, duCode, desRegles } of casChamps) {
  if (!duCode) { ok(`${libelle} — liste de champs trouvée dans le code`, false); continue }
  const absentsDesRegles = manquants(duCode, desRegles)
  const absentsDuCode = manquants(desRegles, duCode)
  ok(`${libelle} — ${duCode.length} champs identiques de part et d’autre`,
    memeEnsemble(duCode, desRegles),
    absentsDesRegles.length ? `REFUSÉS par les règles : ${absentsDesRegles.join(', ')}`
      : absentsDuCode.length ? `autorisés mais plus écrits : ${absentsDuCode.join(', ')}` : '')
}

// ── 3. Les valeurs énumérées écrites sont acceptées ────────────────────────

section('Valeurs énumérées')

function litteraux(fichiers, champ) {
  const trouves = new Set()
  for (const f of fichiers) {
    for (const m of lire(f).matchAll(new RegExp(`${champ}\\s*[:=]+\\s*'([a-z0-9_]+)'`, 'g'))) {
      trouves.add(m[1])
    }
  }
  return [...trouves].sort()
}

// Les décisions possibles sont les CLÉS de la table DECISIONS : les chercher en
// littéraux ne trouvait rien et le contrôle concluait OK sans rien vérifier.
function clesObjet(source, nom) {
  const m = source.match(new RegExp(`const\\s+${nom}\\s*=\\s*\\{([\\s\\S]*?)\\n\\}`))
  if (!m) return null
  const sansCommentaires = m[1].replace(/\/\/[^\n]*/g, '')
  return [...sansCommentaires.matchAll(/^\s*([a-z_]+)\s*:/gm)].map(x => x[1]).sort()
}

const decisionsCode = clesObjet(lire('data/traitement.js'), 'DECISIONS')
const decisionsAutorisees = enumDuValidate(regles.veille?.traitements?.$trace?.decision?.['.validate'])
ok('decision — la table du code et les règles proposent les mêmes valeurs',
  memeEnsemble(decisionsCode, decisionsAutorisees),
  `code : ${(decisionsCode || []).join(', ') || 'TABLE INTROUVABLE'} · règles : ${decisionsAutorisees.join(', ')}`)

const indicateursCode = listeConstante(lire('data/traitement.js'), 'INDICATEURS_IDS')
const indicateursRegles = enumDuValidate(regles.veille?.traitements?.$trace?.indicateur?.['.validate'])
ok('indicateur — mêmes identifiants',
  memeEnsemble(indicateursCode, indicateursRegles),
  `code : ${(indicateursCode || []).join(', ')} · règles : ${indicateursRegles.join(', ')}`)
ok('indicateur — écrit comme une CHAÎNE (les règles comparent à \'23\', pas 23)',
  /trace\.indicateur\s*=\s*String\(/.test(lire('data/traitement.js')))

const niveauxRegles = enumDuValidate(regles.veille?.['articles-manuels']?.$article?.niveau?.['.validate'])
// Seul le module d'écriture est scanné : dans les pages, `niveau` porte aussi la
// valeur de filtre 'tous', qui n'est jamais envoyée en base.
const niveauxCode = litteraux(['data/veille-storage.js'], 'niveau')
ok('niveau — aucune valeur écrite hors des règles',
  manquants(niveauxCode, niveauxRegles).length === 0,
  `code : ${niveauxCode.join(', ') || 'aucun littéral, valeur issue du formulaire'} · règles : ${niveauxRegles.join(', ')}`)

const profilsRegles = enumDuValidate(regles.acces?.$entree?.profil?.['.validate'])
const profilsCode = listeConstante(lire('data/firebase-config.js'), 'ORDRE_PROFILS')
ok('profils — mêmes identifiants dans acces et dans le code',
  memeEnsemble(profilsCode, profilsRegles),
  `code : ${(profilsCode || []).join(', ')}`)

// ── 4. Collections de donnees/ et la restriction de la grille ──────────────

section('Nœud donnees/ : écriture par collection')

ok('pas de .write global sur donnees', !('.write' in (regles.donnees || {})),
  'un .write ici rendrait inopérante toute restriction plus bas')
ok('$collection porte le .write du domaine', !!regles.donnees?.$collection?.['.write'])
ok('pls_grilles_tarifaires a sa propre règle d’écriture', !!regles.donnees?.pls_grilles_tarifaires?.['.write'])

const admins = listeConstante(lire('data/firebase-config.js'), 'ADMINS_RACINE')
const ecritureGrille = regles.donnees?.pls_grilles_tarifaires?.['.write'] || ''
const emailsRegle = [...ecritureGrille.matchAll(/'([^']+@[^']+)'/g)].map(m => m[1]).sort()
ok('les administrateurs autorisés à écrire la grille = ADMINS_RACINE',
  memeEnsemble(admins, emailsRegle),
  `règles : ${emailsRegle.join(', ')} · ADMINS_RACINE : ${(admins || []).join(', ')}`)

const store = lire('data/store-firebase.js')
const clesLocales = listeConstante(store, 'CLES_LOCALES') || []
const clesPoussees = [...new Set([
  ...[...store.matchAll(/'(pls_[a-z_]+)'/g)].map(m => m[1]),
])].filter(c => !clesLocales.includes(c))
ok('toutes les collections partagées sont préfixées pls_ (condition de estPartageable)',
  clesPoussees.every(c => c.startsWith('pls_')))
ok('pls_session reste une clé LOCALE (jeton de session, jamais partagé)',
  clesLocales.includes('pls_session'))

console.log(`\n${echecs === 0 ? '✅ Règles et code cohérents.' : `❌ ${echecs} divergence(s).`}`)
process.exit(echecs === 0 ? 0 : 1)
