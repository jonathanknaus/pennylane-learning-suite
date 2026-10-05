# SmartOF — ce que l'API permet

> Établi le 2026-10-05. Sources de première main : **la documentation Swagger officielle de
> l'éditeur** (`/docs/swagger/`, API SmartOF 1.0, OAS 3.0), la proposition commerciale et le
> contrat signés (CGS du 01.10.24), et deux tests d'authentification réels.

## 1. L'essentiel

**L'API existe, elle est incluse dans l'abonnement Pro, et l'authentification fonctionne.**
Mais son périmètre est beaucoup plus étroit que ce que laisse croire la plaquette commerciale :
c'est une API de **gestion des référentiels et des inscriptions**, pas une API de reporting.

**Trois de nos quatre usages cibles ne sont pas servis par cette API** (détail au §4). C'est la
conclusion importante de cette étude.

| Point | État |
|---|---|
| Serveur | `https://europe-west3-afs-pennylane-mobileo.cloudfunctions.net/external` |
| Documentation | `https://europe-west3-afs-pennylane-mobileo.cloudfunctions.net/docs/swagger/` |
| Authentification | ✅ résolue et testée |
| Style | **RPC, pas REST** — toutes les routes sont en `POST`, y compris les lectures |
| Coût | inclus dans l'abonnement Pro (2 532 € HT/an), pas d'option à payer |

## 2. Authentification (testée de bout en bout)

Deux temps :

1. `POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<CLÉ_WEB>`
   avec `{email, password, returnSecureToken: true}` → renvoie un `idToken`.
2. Présenter ce jeton à l'API en `Authorization: Bearer <idToken>`.

Éléments nécessaires : l'identifiant `api-afs-pennylane@smartof.tech`, son **mot de passe**, et la
**clé API web du projet** (en `AIza…`).

**Le jeton n'est valable que 3600 secondes.** Toute intégration devra le renouveler
automatiquement — via `refreshToken` ou réauthentification. C'est le premier point à cadrer si on
industrialise.

Résultats obtenus : `signInWithPassword` → **200** ; `GET /` sur l'API → **404 `Cannot GET /`**
(page Express), ce qui confirmait l'acceptation du jeton avant même d'avoir la liste des routes.

Script opérationnel : [`scripts/smartof/obtenir-jeton.sh`](../scripts/smartof/obtenir-jeton.sh) —
saisie clavier masquée, aucun secret écrit sur disque.

## 3. Cartographie complète de l'API

Dix ressources. Toutes les routes sont en **POST**.

### Lecture — ce qu'on peut consulter

| Ressource | `get` | `list` |
|---|:---:|:---:|
| Apprenant | `/api/apprenant/get` | `/api/apprenant/list` |
| ContactClient | `/api/contact-client/get` | `/api/contact-client/list` |
| Formateur | `/api/formateur/get` | `/api/formateur/list` |
| Entreprise | `/api/entreprise/get` | `/api/entreprise/list` |
| OpportuniteCommerciale | `/api/opportunite-commerciale/get` | `/api/opportunite-commerciale/list` |
| Produit | `/api/produit/get` | `/api/produit/list` |
| Facture | — | `/api/factures/list` |
| Session | — | `/api/session/list` |
| DemandeInscription | — | `/api/demande-inscription/list` |
| SessionsOuvertes | — | `/api/sessions-ouvertes/list` |

**Soit 16 routes de lecture.** Noter les asymétries : **Session, Facture, DemandeInscription et
SessionsOuvertes n'ont pas de `get` unitaire** — on ne peut que lister. Et l'URL de Facture est au
pluriel (`/api/factures/`), contrairement à toutes les autres.

### Écriture — existe, mais hors de notre périmètre

`create`, `update` et `delete` sont disponibles sur Apprenant, ContactClient, Formateur,
Entreprise, OpportuniteCommerciale et Produit. S'y ajoutent
`/api/demande-inscription/entreprise/create`, `/api/demande-inscription/particulier/create` et
`/api/sessions-ouvertes/update`.

⛔ **On n'y touche pas.** Règle en vigueur : SmartOF est en lecture seule, API comprise. Ces
routes écrivent dans l'outil de production qui porte les données clients et les pièces opposables
en audit. Voir [[feedback_smartof_lecture_seule]].

### Schémas de données documentés

Apprenant, ContactClient, Formateur, Facture, Entreprise, OpportuniteCommerciale, Produit,
Session, DemandeInscription, SessionsOuvertes. Les champs de chacun sont dépliables dans le
Swagger, section « Schemas ».

## 3bis. Structure observée — `POST /api/session/list`

Premier appel réussi le 2026-10-05 avec un corps vide `{}` → **200**, 42 663 octets,
**37 sessions** renvoyées.

```
sessions[]                              (37 éléments)
  ├─ sessionUid                str      identifiant technique
  ├─ customId                  str      numéro de session (= « SmartOF Session Number » de SF)
  ├─ archive                   bool     session archivée ou non
  ├─ createdAt / updatedAt     str      horodatages
  ├─ produitFormationViseeUid  str      → lien vers Produit
  ├─ workflowUid               str      → workflow appliqué
  ├─ meta
  │    ├─ nom                  str
  │    ├─ dateDebut            str
  │    ├─ dateFin              str
  │    └─ status               str
  ├─ formulaireInscription
  │    ├─ ouvert               bool
  │    └─ url                  str
  └─ custom_fields
       └─ custom_field_1 … custom_field_20   str
```

### Ce que ça apprend

- **`customId` est la clé de rapprochement avec Salesforce** : c'est le numéro aujourd'hui
  recopié à la main dans le champ `SmartOF Session Number`. De quoi supprimer cette ressaisie.
- **`produitFormationViseeUid` relie la session au catalogue** — jointure utilisable pour PLS.
- **20 champs personnalisés** aux noms génériques (`custom_field_1` … `custom_field_20`). Ils
  portent des informations propres à notre instance, mais leur libellé métier n'est pas dans la
  réponse : **il faut établir la correspondance**, soit dans les paramètres de l'application, soit
  en la demandant à l'éditeur.
- **Aucune liste d'apprenants dans la session.** Le lien session ↔ participants doit passer par
  une autre ressource — `demande-inscription/list` est le candidat à vérifier.
- Pas de budget ni de détail produit dans cette réponse.

### Deux points à vérifier

1. **37 sessions, est-ce le total ?** Le chiffre est trop irrégulier pour une taille de page par
   défaut (on attendrait 20, 25, 50…), donc c'est probablement le nombre réel — peut-être limité
   aux sessions non archivées. À confirmer : les routes `list` acceptent-elles une pagination et
   des filtres (`archive`, plage de dates) ? Sinon, tout filtrage se fera côté client.
2. **Correspondance des `custom_fields`** — prérequis avant toute synchronisation vers PLS.

## 3ter. Structure observée — `POST /api/demande-inscription/list`

Appel réussi avec `{}` → **200**, 1 073 octets, **2 enregistrements seulement**.

```
demandeInscriptions[]                      (2 éléments)
  ├─ demandeInscriptionUid   str
  ├─ customId                str
  ├─ sessionUid              str      ← lien vers la session
  ├─ type                    str      entreprise / particulier
  ├─ isTraitee               bool
  ├─ createdAt / updatedAt   str
  └─ meta
       ├─ apprenant      { email, meta.nom, meta.prenom }
       ├─ entreprise     { meta.nom }
       ├─ contactClient  { email, meta.nom, meta.prenom }
       ├─ commanditaire  dict
       └─ suiviApprenant dict
```

### Attention à l'interprétation

**Ce n'est pas la liste des participants.** Deux enregistrements pour 37 sessions : cette
ressource ne porte que les **demandes entrantes passées par le formulaire d'inscription en
ligne**. Les apprenants inscrits manuellement par les gestionnaires — c'est-à-dire l'essentiel de
notre activité, les demandes venant toujours de l'interne — n'y figurent pas.

**Le lien complet session ↔ participants reste donc à trouver.** La réponse mentionne un objet
`suiviApprenant`, qui est bien ce qui rattache un apprenant à une session dans SmartOF. Mais
**aucune route `suivi-apprenant` n'existe dans l'API**. Si ce lien n'est pas exposé ailleurs,
l'alimentation de PLS s'en trouverait sérieusement limitée : on aurait les sessions et les
apprenants, sans savoir qui a participé à quoi.

**À vérifier en priorité** : `apprenant/list` porte-t-il un `sessionUid` ou un `suiviApprenantUid` ?
C'est la question qui décide de la faisabilité réelle de la synchronisation.

Bon point en revanche : cette ressource contient directement les données nominatives imbriquées
(apprenant, contact client, entreprise), ce qui évite des appels en cascade — et impose d'autant
plus la minimisation des champs repris côté PLS.

## 3quater. Structure observée — `POST /api/apprenant/list`

Appel réussi avec `{}` → **200**, 267 070 octets, **264 apprenants**.

```
apprenants[]                       (264 éléments)
  ├─ apprenantUid            str
  ├─ id                      str
  ├─ customId                str
  ├─ archived                bool
  ├─ createdAt               str
  ├─ email                   str
  ├─ entrepriseUids[]        list     ← lien vers Entreprise
  ├─ documents[]                      ← métadonnées des documents de l'apprenant
  │    ├─ documentUid        str
  │    ├─ documentName       str
  │    ├─ category           str
  │    └─ createdAt          str
  ├─ custom_fields           custom_field_1 … custom_field_20
  └─ meta
       ├─ civilite, nom, nomUsage, prenom
       ├─ dateNaissance
       ├─ adresse { rue, complementAdresse, codePostal, ville }
       ├─ tel
       ├─ fonction, lieuActivite
       ├─ numeroCompteComptable
       └─ statutBPF                   ← statut pour le Bilan Pédagogique et Financier
```

**Schéma confirmé par le Swagger officiel** (et non plus seulement observé) : la liste ci-dessus
est complète. Un apprenant ne porte **aucun champ de rattachement à une session**.

Deux précisions utiles du schéma documenté :
- `meta.civilite` est une énumération (exemple : « Monsieur ») ;
- `meta.statutBPF` suit la **nomenclature officielle du BPF** (exemple :
  « F.1.a - Salariés d'employeurs privés hors apprentis ») — directement exploitable pour le
  Bilan Pédagogique et Financier.

### Aucun paramètre d'entrée sur les routes `list`

Vérifié dans le Swagger pour `/api/apprenant/list` et `/api/session/list` : la seule entrée
documentée est l'en-tête `Authorization`. **Il n'y a pas de corps de requête.**

Conséquences :
- **aucun filtrage côté serveur** (ni par session, ni par date, ni sur `archive`) ;
- **aucune pagination** : chaque appel renvoie l'intégralité de la collection. Les 37 sessions et
  264 apprenants sont donc bien les totaux complets, archivés inclus ;
- tout filtrage devra se faire **côté client**, après avoir tout téléchargé — ce qui pèse sur la
  limitation de requêtes prévue aux CGS. À surveiller quand les volumes croîtront.

### Correction à apporter au §4

Le constat « aucun document n'est exposé » doit être **nuancé** : les **métadonnées** des
documents d'un apprenant sont bien présentes ici (identifiant, nom, catégorie, date). Il n'existe
pas de route dédiée aux documents, et le téléchargement du contenu reste à vérifier — mais savoir
**quels documents existent pour quel apprenant** est accessible. C'est exploitable pour un
contrôle de complétude des pièces Qualiopi, à défaut de récupérer les pièces elles-mêmes.

### Vigilance RGPD — forte

Cette ressource expose des données personnelles étendues : **date de naissance, adresse postale
complète, téléphone, fonction, numéro de compte comptable**. Un seul appel ramène 264 personnes et
267 Ko.

La minimisation n'est pas optionnelle : toute synchronisation vers PLS doit ne reprendre **que les
champs strictement nécessaires** (vraisemblablement nom, prénom, email, et le rattachement
entreprise). Date de naissance, adresse et téléphone n'ont pas de raison d'être recopiés dans PLS
sans justification explicite. À documenter pour le SPD.

## 3quinquies. Structure observée — `POST /api/factures/list`

**17 factures**, 49 193 octets. La ressource la plus riche de l'API.

```
factures[]                       (17 éléments)
  ├─ factureUid / id / factureId / factureNumber / facturePrefix
  ├─ archived, createdAt, dateEcheance, pdfDocCreated, lastExportedAt
  ├─ association
  │    ├─ sessionUid           ← LIEN VERS LA SESSION
  │    └─ commanditaireUid     ← lien vers le commanditaire
  ├─ client
  │    ├─ entrepriseUid        ← lien vers le cabinet
  │    └─ type
  ├─ priceDetails[]                    lignes de prestation
  │    ├─ libelle, description, unite
  │    ├─ quantite, prixUnitaireHT, tva
  │    ├─ numeroCompteComptable
  │    ├─ bpf                  bool   ← ligne comptant pour le BPF
  │    └─ priceDetailItemUid, sourcePriceDetailItemUid,
  │       devisTemplateUid, factureTemplateUid
  ├─ avoirsSummary
  │    ├─ avoirs[], count, completelyAvoired
  │    └─ totalHTCts, totalTVACts, totalTTCCts      (montants en centimes)
  ├─ iopole                            facturation électronique
  │    ├─ champsAvances { bic, iban, bonDeCommande, emailPointContact,
  │    │                  moyenPaiement, natureOperation, numeroDossier,
  │    │                  referenceContrat }
  │    ├─ generation { attemptedAt, result, diagnostics[] { code, message } }
  │    ├─ outbound, selectedAddress
  ├─ pennylane                 NoneType   ← connecteur présent mais NON alimenté
  ├─ meta
  │    ├─ envoi { autoRelanceEnabled, currentStageKey, toEmails }
  │    ├─ internalStatus
  │    ├─ nomDuDestinataire, informationsDuDestinataire
  │    └─ mentionLibreAvant, mentionLibreApres
  ├─ annexDocuments[], internalComments[]
  └─ custom_fields             custom_field_1 … custom_field_20
```

### Trois découvertes importantes

**1. Le lien session ↔ cabinet existe, par la facturation.**
`association.sessionUid` + `client.entrepriseUid` permettent de savoir **quelle session a été
facturée à quel cabinet**. Ce n'est pas le lien vers les participants, mais c'est le rattachement
commercial complet — exploitable pour le suivi d'activité et le rapprochement Salesforce.

**2. `iopole` : le connecteur de facturation électronique est en place et actif.**
La structure contient un bloc `generation` avec un `result` et des **diagnostics** (3 entrées
observées, chacune avec un `code` et un `message`). Autrement dit, SmartOF tente de générer des
factures électroniques et **produit des diagnostics exploitables**. À regarder de près au titre de
la **RFE** : ces codes diront si nos factures de formation sont conformes, et sur quoi elles
achoppent. C'est un sujet que l'API permet de surveiller, et qui n'était pas dans le périmètre
initial de cette étude.

**3. `pennylane` est à `null`.**
Le champ existe dans le modèle — le connecteur Pennylane annoncé dans la plaquette est donc bien
prévu — mais il **n'est alimenté sur aucune des 17 factures**. Il n'est vraisemblablement pas
activé sur notre instance. À confirmer auprès de l'éditeur (§7, question 7).

### Nuance à apporter au §4

Le BPF n'est pas « absent » : ses **briques** sont là — `meta.statutBPF` sur l'apprenant et
`priceDetails[].bpf` sur les lignes de facture. Ce qui manque, c'est le document BPF généré et le
volume d'heures. On peut donc reconstituer une partie de l'assiette, pas produire le BPF.

De même, `annexDocuments[]` et `pdfDocCreated` montrent que des documents sont rattachés aux
factures : là encore, les métadonnées sont visibles, pas les pièces.

## 3sexies. Verdict sur le lien apprenant ↔ session

**Épuisé, et négatif.** Quatre vérifications :

| Vérification | Résultat |
|---|---|
| `apprenant/list` — tous les champs | aucun rattachement à une session (confirmé par le Swagger) |
| `apprenant/get` — route unitaire | **structure identique au `list`**, rien de plus |
| `session/list` — tous les champs | aucune liste de participants |
| Paramètres d'entrée des routes `list` | **aucun** : pas de filtre, pas de `include` |
| `sessions-ouvertes/list` | **0 élément** — ressource vide chez nous |
| `factures/list` | lien vers la session et le cabinet, **mais pas vers les apprenants** |

**L'API ne permet pas de savoir qui a participé à quelle session** — sauf pour les inscriptions
arrivées par le formulaire en ligne, via `demande-inscription/list` (2 enregistrements).

### Trois voies pour contourner

1. **Demander à l'éditeur l'ouverture d'une route sur le suivi apprenant.** L'objet existe : il
   apparaît sous `meta.suiviApprenant` dans la réponse de `demande-inscription`. La demande est
   donc précise et recevable.
2. **Faire passer les inscriptions par le formulaire en ligne** (`session.formulaireInscription.url`).
   Décision de process, pas technique : elle alimenterait `demande-inscription` et donnerait le
   lien proprement. À rapprocher du délai de 15 jours demandé aux équipes pour les listes
   définitives.
3. **Le data warehouse**, qui lit la base directement et n'a pas cette limite.

## 4. Ce que l'API ne fait PAS — à lire avant de planifier

Aucune route n'existe pour :

- ❌ **les enquêtes de satisfaction et leurs résultats** (CSAT) ;
- ❌ **les émargements** ;
- ❌ **les documents** générés (conventions, convocations, attestations, certificats de
  réalisation) ;
- ❌ **les questionnaires pédagogiques** et leurs réponses ;
- ❌ **les indicateurs Qualiopi et le BPF** ;
- ❌ **les créneaux de formation** ;
- ❌ **les modules** — seul `Produit` existe, pas le découpage en modules.

Ces fonctionnalités existent bien **dans l'application**, elles sont même au cœur de l'offre
Qualiopi de SmartOF. Elles ne sont simplement **pas exposées par l'API**.

### Conséquence sur nos quatre usages cibles

| Usage visé | Verdict | Voie réaliste |
|---|---|---|
| **Alimenter PLS** | ✅ **faisable** | `session/list`, `apprenant/list` + `get`, `produit/*`, `formateur/*`, `entreprise/*`, `demande-inscription/list` |
| **CSAT / enquêtes** | ❌ **impossible par l'API** | → modèles dbt du DWH (§6), ou export Excel automatique |
| **Preuves Qualiopi** (émargements, attestations) | ❌ **impossible par l'API** | → exports de l'application, ou DWH |
| **Fiches produit multi-modules** | ⚠️ **partiel** | `produit/*` donne les produits, mais pas leur découpage en modules |

**L'angle mort documenté dans [content.py](../../workflow-afs-schema/content.py) est confirmé par
la structure même de l'API** : il n'existe aucun objet « module », donc rien à assembler côté
SmartOF. La recombinaison des supports restera à produire dans PLS.

## 5. Vigilances techniques

**Les lectures sont des POST.** Conséquence pratique : on ne peut pas se protéger en
« n'autorisant que les GET ». La seule garantie sérieuse est une **liste blanche de routes**
limitée à `/list` et `/get` — c'est ce qu'implémente
[`scripts/smartof/lecture-seule.sh`](../scripts/smartof/lecture-seule.sh), qui refuse par
construction toute route contenant `create`, `update` ou `delete`.

**Limitation du nombre de requêtes.** Les CGS la mentionnent deux fois parmi les mesures de
sécurité, et qualifient l'usage anormal d'abus. Pas de polling serré, pas de boucle de
pagination agressive. À faire préciser (§7).

**Jeton d'une heure.** Prévoir le renouvellement dès la première version de l'intégration.

**Pas de `get` unitaire sur Session ni Facture** : pour accéder à un élément précis, il faudra
lister puis filtrer côté client — ce qui augmente le volume transféré et donc la pression sur les
quotas. À confirmer : les routes `list` acceptent-elles des filtres ?

## 6. Piste alternative pour ce que l'API ne couvre pas

La data team ingère **déjà** SmartOF dans le data warehouse — PR `pennylane-hq/dbt-models` #6446
(`feature(smartof): bronze models`) et #6493 (`feat(smartof): smartof silver layer`), par Yacine
Mallouki.

**C'est désormais la voie principale pour le CSAT, les indicateurs Qualiopi et le reporting**,
puisque l'API ne les expose pas. Avantages : déjà gouverné, pas de nouveau flux de données
personnelles à faire valider, et accessible aux outils de BI. À cadrer avec la data team avant
tout développement.

## 7. Questions restantes pour l'éditeur

La documentation étant disponible, la demande se réduit à :

1. **Les enquêtes de satisfaction, émargements et documents Qualiopi sont-ils accessibles par un
   autre moyen** (API non documentée, export programmable, webhook) ? C'est notre besoin le plus
   important et le seul que l'API ne couvre pas.
2. **Quotas et rate limits** applicables à notre offre, et rythme d'appels recommandé.
3. **Filtres et pagination** : les routes `list` acceptent-elles des critères ? Comment pagine-t-on ?
4. **Restriction du compte en lecture seule** — nous ne voulons pas disposer des routes `create`,
   `update` et `delete` sur un compte d'intégration (principe du moindre privilège).
5. **Renouvellement du jeton** : `refreshToken` ou réauthentification ? Existe-t-il un mode
   serveur-à-serveur mieux adapté qu'un jeton d'une heure ?
6. **Versionnement** de l'API et préavis en cas de changement cassant.
7. **Connecteurs Pennylane et Salesforce** annoncés dans la plaquette : périmètre, sens de
   synchronisation, conditions d'activation.
8. **Conformité** : région d'hébergement effective (l'API répond depuis `europe-west3`, soit
   Francfort, alors que l'offre annonce un hébergement « en France ») et liste à jour des
   sous-traitants ultérieurs.

Mail rédigé : [mail-smartof-demande-api.md](mail-smartof-demande-api.md) — **non envoyé**.

## 8. Cadre contractuel et conformité

**Éditeur** : CogniMap SAS (nom commercial SmartOF), 25 rue des roses, 35510 Cesson-Sévigné,
RCS Rennes 838 619 153 — `contact@smartof.tech`, +33 2 20 06 01 37.
**Support** : mail (tickets) ou téléphone, 9h-17h du lundi au vendredi ; le téléphone s'obtient
via un ticket mail, avec 48 h de délai minimum.

**Notre offre — Abonnement Pro** : 2 532 € HT/an (remise groupe -15 %), engagement 12 mois à
tacite reconduction, résiliation par recommandé avec 30 jours de préavis.

| Limite | Valeur |
|---|---|
| Apprenants / an | 1 500 (un participant compte **par session**) |
| Utilisateurs admin | 5 (4 inclus + 1 offert), puis 19 € HT / utilisateur |
| Formateurs, émargements | illimités |
| Stockage | 250 Go, puis 5 € HT / mois par 50 Go |

**Pas d'ingénierie inversée (art. 11 des CGS)** : l'intégration repose sur le Swagger officiel —
ce qui est désormais le cas, la documentation étant publiée par l'éditeur.

**Réversibilité (art. 16.5)** : en fin d'abonnement, la restitution doit être demandée **par
recommandé avec AR dans les 30 jours**, sinon les données sont détruites. Restitution en fichier
« plat » ; format plus riche facturable ; assistance à la migration non incluse. **Nos preuves
Qualiopi ne doivent donc pas vivre uniquement dans SmartOF** — d'autant que l'API ne permet pas
de les extraire. Voir
[checklist-preuves-sous-traitants.md](../../qualiopi-afs/checklist-preuves-sous-traitants.md).

**SMARTOF est sous-traitant au sens de l'art. 28 RGPD** (art. 14 des CGS + Annexe 1 valant DPA).
Nous restons responsable de traitement et point de contact des personnes concernées.

**Sous-traitants ultérieurs** (Appendice 3 de l'Annexe 1, à la date de signature) :

| Finalité | Sous-traitant | Adresse |
|---|---|---|
| Hébergement de la Plateforme | Google Cloud France SARL | 8 rue de Londres, 75009 Paris |
| Hébergement des données | Google Cloud France SARL | 8 rue de Londres, 75009 Paris |
| Signature électronique | EUROSIGN | 32 rue Fessart, 92100 Boulogne-Billancourt |

Annoncé par ailleurs dans l'offre : données chiffrées hébergées en France, sauvegardes complètes
quotidiennes, mots de passe hashés, pare-feu par zone réseau, détection d'intrusion.

**Règle SPD** : relier SmartOF à PLS, c'est relier deux outils → validation IT + Legal avant toute
mise en production.

## 9. État du SPD — en attente

Canal `#portal-request-connect-smartof-pennylane-1148`, page Notion
[CONNECT SMARTOF <> PENNYLANE](https://app.notion.com/p/scribetech/CONNECT-SMARTOF-PENNYLANE-3812276c03bf800e80eccc15e6f1a25c).

Le **2026-10-05 à 11h59**, Sylvain Sarméjeanne a posé trois exigences et **attend une réponse** :

1. la remise des credentials doit passer par un **ticket IT** ;
2. les scopes de la clé doivent suivre le **moindre privilège** ;
3. la clé doit être **stockée de façon sécurisée**.

L'exigence n° 2 prend un sens très concret maintenant qu'on sait que le compte dispose de routes
`delete` sur les apprenants, les formateurs et les entreprises.

## 10. Deux instances distinctes

| Instance | Périmètre |
|---|---|
| `afs-pennylane.smartof.app` | **AFS** — notre périmètre, celui du compte `api-afs-pennylane@` |
| `pennylane.smartof.app` | **Training** |

Mails automatiques envoyés depuis `pennylane@mail.smartof.app`. Côté Salesforce, les champs
`SmartOF Session Number` et `SmartOF Link` sont aujourd'hui renseignés **manuellement** ;
l'intégration SF × SmartOF est au stade discovery de la squad CRM (Nicolas Chayenko).
