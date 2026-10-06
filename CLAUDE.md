# PLS — Pennylane Learning Suite

Outil de gestion de formations conforme Qualiopi, pour l'équipe **AFS** (Accounting Firm Services)
de Pennylane. Alternative customisée à SmartOF/Argalis — **pas** un pilote de SmartOF.

---

## ⚠️ À savoir avant d'écrire une ligne

**Le dépôt GitHub est PUBLIC** (`jonathanknaus/pennylane-learning-suite`). Décision assumée : le
projet est au stade de démonstration. Conséquence stricte : **aucune donnée réelle d'apprenant ou
de cabinet, aucun secret, aucune clé** ne doit être committée. Les données de démo portent des
noms manifestement fictifs (Dupont, Martin). Si le projet accueille de vraies données ou passe en
production, la visibilité doit être rediscutée.

**SmartOF est en LECTURE SEULE**, son API comprise. Ne jamais y écrire, ne jamais créer
d'automatisme qui y écrit. C'est l'outil de production qui porte les données clients et les pièces
opposables en audit. Si un besoin suppose d'agir dans SmartOF, proposer un **rappel dans PLS** à la
place — `scanFermetureExtranet()` dans `rappels.js` suit ce modèle : il notifie, le geste reste manuel.

**Les droits côté navigateur ne sont pas une frontière de sécurité.** `auth.js` et
`tarifs-negocies.js` pilotent l'affichage ; la vraie protection est dans `database.rules.json`,
évaluée par Firebase. Toute règle métier qui compte doit y être reprise.

---

## Stack réelle

| Couche | Technologie | État |
|---|---|---|
| Front | React 19 + Vite 6 | en service |
| Données partagées | **Firebase Realtime Database** | en cours de migration |
| Authentification | Firebase Auth (Google) | en service |
| Backend | Python 3.13 + Litestar + PostgreSQL | **écrit mais non déployé** |
| Hébergement | GitHub Pages | en service |

**Le backend Python n'est pas déployé.** Tout ce qui passe par `api.js` échoue en ligne. Les
fonctionnalités réelles reposent sur Firebase.

---

## Déploiement

Automatique à chaque **push sur `main`**, via `.github/workflows/deploy.yml` :
build Vite puis publication Pages en mode « GitHub Actions » (pas de branche `gh-pages`).

→ **https://jonathanknaus.github.io/pennylane-learning-suite/**

`vite.config.js` fixe `base: '/pennylane-learning-suite/'` — ne pas y toucher, les assets
casseraient.

Pièges rencontrés :
- passer le dépôt en privé **efface la configuration Pages** ; la repasser en public ne la
  restaure pas. Réactiver avec
  `gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow` ;
- le workflow a `concurrency: cancel-in-progress` : relancer un ancien run **annule** le plus
  récent et déploie un commit périmé ;
- le workflow n'a pas de `workflow_dispatch` : il ne se déclenche que sur un push ;
- Firebase Auth refuse tout domaine non déclaré. `jonathanknaus.github.io` doit figurer dans
  Authentication → Settings → Authorized domains, sinon la connexion échoue en
  `auth/unauthorized-domain`.

---

## Stockage : le pattern à respecter

`store-firebase.js` est la couche de référence. **Firebase est la source de vérité, le
localStorage un cache d'affichage.**

```js
import { lireCache, pousser } from './store-firebase.js'

function load()      { return lireCache(KEY, {}) || {} }   // synchrone, instantané
function save(data)  {
  localStorage.setItem(KEY, JSON.stringify(data))          // cache d'abord
  pousser(KEY, data)                                       // puis Firebase
}
```

Garde-fou important : une collection n'est tirée depuis Firebase que si elle porte le **marqueur de
migration** `donnees/_meta/<cle>/migreLe`, posé par `transfererCle()` et vérifié par `estMigree()`.
Sans ce marqueur, `ecouterPartage()` ne s'abonne même pas : le cache local fait foi et rien ne peut
l'écraser. Motif : `localhost` et le site déployé ont des stockages locaux **distincts**, donc
transférer depuis l'un puis ouvrir l'autre écraserait les données du second.

⚠️ **Ne pas confondre avec `CLES_DEJA_MIGREES`**, qui est une liste d'**exclusion** : les clés qui
vivent déjà dans un nœud dédié et qu'il ne faut donc pas verser dans `donnees/`. `pls_traitements`
y figure parce qu'elle habite `veille/traitements` — elle n'est pas « déclarée migrée », elle est
écartée du transfert générique.

**Dette connue** : la plupart des modules de `src/data/` écrivent encore en localStorage brut. La
migration se fait clé par clé (`transfererCle`, `verifierTransfert`). **Aucune collection n'est
déclarée migrée à ce jour** — le transfert initial n'a pas été lancé, volontairement : PLS ne
contient que des données de démonstration, et les pousser n'aurait aucun intérêt.

Déjà instrumentées en écriture (poussée vers Firebase à chaque sauvegarde), en attente du
transfert : `pls_sessions`, `pls_stagiaires`, `pls_inscriptions`, `pls_entreprises`.

---

## Droits et profils

Quatre profils, définis dans `firebase-config.js` et **contrôlés par `database.rules.json`** :

| Profil | Rôle | Portée |
|---|---|---|
| `administrateur` | admin | tout |
| `formateur_interne` | formateur | anime ses sessions, consulte le reste |
| `formateur_externe` | formateur | ses sessions et apprenants, sans accès aux cabinets |
| `consultatif` | formateur | lecture seule, hors données personnelles |

Le profil courant est dans `getCurrentUser().profilId`. **Ne pas se fier à `isFormateur()` pour une
décision sensible** : il renvoie `true` pour les trois profils non-admin, y compris `consultatif`.

Les permissions par module sont une matrice dans `firebase-config.js` (`MATRICE`), lue via
`aAcces(moduleId)` et `peutEcrire(moduleId)`.

---

## Catalogue des formations

`catalogue-afs.js` fusionne **trois sources** sans jamais rien écraser, via `getThematiques()` :

| Source | Origine | `createdAt` |
|---|---|---|
| `pls` | 23 modules historiques, en dur | `2026-07-10` par défaut |
| `smartof` | 43 produits importés | date réelle de SmartOF |
| `custom` | ajouts manuels (localStorage) | date de l'ajout |

Chaque module porte `source` et `createdAt`, d'où `getAllModulesParDate()` et
`getAllModulesParSource()` pour le tri et l'archivage.

**`catalogue-smartof.js` est GÉNÉRÉ — ne jamais l'éditer à la main.** Pour le régénérer :

```
cd scripts/smartof
./exporter.sh produit
node generer-catalogue.mjs
```

---

## Tarification

Deux modules complémentaires :

**`tarification.js`** — grilles **versionnées par date d'effet**
(`toutesLesGrilles()`, `grilleApplicable(date)`). Le tarif est **figé à la date de la demande**, pas
à celle de la session : un devis validé sous l'ancienne grille reste recalculable à l'identique.

Deux sources de grilles, fusionnées :

| Source | Contenu | Modifiable |
|---|---|---|
| `GRILLES_BASE` | la grille précédente et celle du **2026-10-05**, en dur | non — socle de référence |
| `pls_grilles_tarifaires` | grilles saisies dans l'app | oui, administrateurs seulement |

Une grille saisie à la **même date d'effet** qu'une grille de base la **masque** ;
`supprimerGrille(dateEffet)` rétablit l'originale. C'est ce qui permet de corriger une erreur de
saisie sans perdre la référence historique.

**Aucun montant n'est codé en dur ailleurs.** Les prix, les paliers de participants, le nombre de
formateurs par palier et les mentions de modules (« 3 à 4 modules ») s'éditent dans
**Paramètres → Grille tarifaire** (`pages/GrilleTarifaire.jsx`). Les conversions entre la vue
appariée de l'éditeur et le modèle interne rangé par modalité sont dans `tarification.js`, et nulle
part ailleurs.

Le droit d'éditer est la permission **`tarifs`** de la matrice de profils (`firebase-config.js`),
colonne Écriture dans **Accès utilisateurs** : `rw` pour `administrateur`, `r` pour les autres. C'est
le seul module de `MODULES_ACCES` **sans page de navigation** — une permission d'action, pas un
écran. `peutModifierGrille()` retombe sur `profilId === 'administrateur'` quand le profil stocké ne
porte pas encore la permission (profils créés avant son ajout).

⚠️ **Deux contrôles à tenir alignés.** Les règles RTDB ne peuvent pas résoudre un profil depuis un
email : le nœud `acces` est indexé par identifiant, pas par adresse. L'écriture de
`donnees/pls_grilles_tarifaires` est donc restreinte à une **liste d'emails en dur**, qui doit rester
en phase avec `ADMINS_RACINE`. Conséquence : cocher Écriture pour un profil ne suffit pas si la
personne n'est pas dans cette liste — Firebase refusera l'écriture côté serveur.

⚠️ `participantsMax: Infinity` (webinar) se stocke en `null` : `JSON.stringify(Infinity)` vaut
`null`, un aller-retour non converti transformerait le palier illimité en « 0 participant ». La
conversion est faite à la frontière du stockage.

⚠️ **Il n'y a plus de constante `SEUIL_SUR_DEVIS`.** Le seuil est dérivé de la grille : un
administrateur qui ajoute un palier « jusqu'à 40 » doit le voir suivre.

| Fonction | À utiliser quand |
|---|---|
| `plafondPourDemande({dureeHeures, modalite})` | **par défaut**, dès qu'une durée est connue |
| `plafondGrille(date)` | seulement pour une mention générale, sans demande précise |

Le plafond dépend du **format retenu** : les forfaits montent à 25, le tarif horaire s'arrête à 15.
Annoncer « au-delà de 25 » à un cabinet qui demande 2h lui laisse croire que 20 personnes sont
tarifées, avant de lui répondre « sur devis ». `plafondPourDemande()` rend `0` quand aucun effectif
n'est tarifé, par exemple du présentiel sous la demi-journée.

**Deux vérifications, sans dépendance ajoutée** (l'esbuild de Vite bundle les modules,
`scripts/stub-reseau.mjs` remplace Firebase) :

| Commande | Ce qu'elle couvre |
|---|---|
| `npm run verifier:tarifs` | 60 contrôles : `Infinity` du palier illimité perdu en JSON, plafond par format, droit d'écriture et son repli, PDF par grille datée |
| `npm run verifier:regles` | 19 contrôles **code ↔ `database.rules.json`** : chemins couverts, listes de champs identiques, valeurs énumérées acceptées |

Lancer la première après toute modification de `tarification.js`, la seconde après toute écriture
d'un nouveau champ dans Firebase. ⚠️ Les règles RTDB refusent **silencieusement** une écriture non
conforme — `pousser()` se contente d'un `console.warn`, et la donnée manque le jour de l'audit.

Règles de bascule, elles **non éditables** (ce ne sont pas des tarifs) : jusqu'à 2h → tarif horaire
cumulable ; au-delà de 2h → forfait demi-journée ; 7h et plus → forfait journée, par journées
entamées.

**`tarifs-negocies.js`** — délégation encadrée. Un `administrateur` fixe librement un tarif ; un
`formateur_interne` négocie dans **±20 %**. La marge s'ancre **toujours sur le tarif de la grille**,
jamais sur le dernier prix négocié — sinon deux remises de 20 % donneraient −36 %. Motif
obligatoire, traçabilité complète.

Utiliser `tarifApplicable(demande, cle)` dans l'interface : elle dit toujours d'où vient le prix.

**`durees-modules.js`** fournit la durée pédagogique par module. Durée × grille = l'estimation
présentée au cabinet dans le simulateur.

---

## SmartOF : ce que l'API donne, et ce qu'elle ne donne pas

Cartographie complète dans [docs/smartof-api.md](docs/smartof-api.md). En résumé :

**Disponible** — 16 routes de lecture sur 10 ressources : apprenants, contacts clients, formateurs,
entreprises, opportunités commerciales, produits, factures, sessions, demandes d'inscription,
sessions ouvertes.

**Absent** — le **lien apprenant ↔ session** (qui a participé à quoi), les **enquêtes de
satisfaction**, les **émargements**, les **documents générés**, les **questionnaires pédagogiques**,
le **BPF**, les **modules** (seul `Produit` existe).

Particularités : API de style **RPC** — toutes les routes sont en `POST`, y compris les lectures,
donc « n'autoriser que les GET » ne protège de rien. Les routes `list` **n'acceptent aucun
paramètre** : pas de filtre, pas de pagination, chaque appel ramène toute la collection. Le jeton
d'authentification expire au bout d'une heure.

Les scripts de `scripts/smartof/` appliquent une **liste blanche** des 16 routes de lecture et
refusent toute route `create`/`update`/`delete`. Les identifiants sont lus dans le trousseau macOS,
jamais écrits sur disque.

---

## Conventions

- **Français** partout : code, commentaires, libellés d'interface, messages de commit.
- Les commentaires expliquent **le pourquoi**, pas le quoi — et gardent la trace des pièges
  rencontrés, comme le fait déjà `store-firebase.js`.
- Les modules de données vivent dans `frontend/src/data/`, un fichier par domaine.
- Ne pas committer sur `main` sans intention de déployer : tout push sur `main` publie le site.
