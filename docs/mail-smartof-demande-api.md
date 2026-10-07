# Mail à l'éditeur SmartOF — prêt à envoyer

> ⚠️ **Rien n'est envoyé.** À relire, puis envoyer depuis ta messagerie.

**À** : `contact@smartof.tech` (support CogniMap / SmartOF)
**Copie** : `marie.tardivel@smartof.tech` — c'est elle qui a transmis les identifiants le 11 juin 2026,
donc la rotation la concerne directement.
**De** : ta boîte nominative plutôt que `afs-training@` — le sujet est contractuel et sécuritaire, et
la réponse doit te revenir à toi.
**Objet** : `Compte API api-afs-pennylane@smartof.tech — deux demandes de sécurité et questions d'intégration`

Un mail au support ouvre un ticket. Le téléphone s'obtient par ce même canal, avec 48 h de délai
minimum : si tu veux un échange de vive voix, la dernière ligne le demande déjà.

**Pourquoi ce mail compte** : ses deux premières demandes débloquent deux des trois exigences du
SPD-1148 (voir `smartof-api.md` §9). Tant qu'elles ne sont pas satisfaites, rien ne peut aller en
production.

---

Bonjour,

Nous utilisons SmartOF pour notre activité de formation (instance `afs-pennylane`, abonnement Pro) et
étudions l'exploitation de l'API REST incluse dans notre offre, afin de limiter les ressaisies entre
SmartOF et nos outils internes.

Nous avons cartographié l'API cette semaine à partir de votre Swagger
(`/docs/swagger/`) : l'authentification fonctionne, et nous avons identifié les ressources exposées.
Nous ne vous demandons donc pas la liste des routes, mais nous revenons vers vous sur deux points de
sécurité et sur quelques limites rencontrées.

**Deux demandes prioritaires, qui conditionnent la suite chez nous.** Notre revue de sécurité interne
les a relevées comme des écarts à corriger avant toute mise en service.

---

## 1. Un jeton limité à la lecture

Le compte `api-afs-pennylane@smartof.tech` dispose aujourd'hui de droits `create`, `update` et
**`delete`** sur les apprenants, les contacts clients, les formateurs, les entreprises, les
opportunités commerciales et les produits — ainsi que la création d'inscriptions et la mise à jour de
sessions ouvertes.

Notre usage est **strictement en lecture** : reprendre des données de référence pour éviter une double
saisie. Le droit de suppression sur des fiches apprenants et formateurs va très au-delà de ce besoin.

→ **Pouvez-vous nous délivrer un jeton restreint à la lecture, sur les seules ressources
nécessaires ?** Un second compte dédié nous convient parfaitement si c'est la voie la plus simple de
votre côté.

## 2. Renouvellement du mot de passe, et transmission par canal sécurisé

Les identifiants actuels nous sont parvenus **par courrier électronique en clair**, le 11 juin 2026.

Nous n'avons aucune raison de penser qu'ils ont été exposés, et nous ne signalons aucun incident :
notre politique de sécurité n'admet simplement pas qu'un identifiant circule en clair, car personne ne
peut l'attester après coup.

→ **Pouvez-vous renouveler le mot de passe du compte de service et nous transmettre les nouveaux
identifiants par un canal sécurisé ?** Nous utilisons **1Password** et pouvons vous ouvrir un partage
chiffré ; tout autre moyen évitant l'envoi en clair nous convient.

Nous supprimerons les deux messages d'origine dès la bascule effectuée.

---

## 3. Ce que nous ne trouvons pas dans l'API

Plusieurs informations nous sont nécessaires et ne semblent pas exposées. Existe-t-il un moyen d'y
accéder — route non documentée, export programmable, autre mécanisme ?

- **Le rattachement d'un apprenant à une session** : quelle personne a suivi quelle session. L'objet
  existe pourtant dans vos réponses — le champ `meta.suiviApprenant` apparaît sur
  `demande-inscription` — mais aucune route ne semble l'exposer. C'est pour nous le manque le plus
  structurant.
- Les **enquêtes de satisfaction** et leurs résultats.
- Les **émargements**.
- Les **documents générés** (conventions, attestations, convocations) : nous voyons leurs
  *métadonnées* sur l'apprenant et la facture, mais pas de moyen de récupérer les pièces.
- Les **questionnaires pédagogiques** et le **BPF**.

Ces éléments constituent nos preuves d'audit Qualiopi. Pouvoir les extraire autrement que
manuellement nous importe beaucoup, d'autant que l'article 16.5 de vos conditions prévoit une
restitution en fichier « plat » en fin de contrat.

## 4. Exploitation des routes de liste

- Les routes `list` **n'acceptent aucun paramètre** : ni filtre, ni pagination. Chaque appel ramène
  l'intégralité de la collection — un appel sur les apprenants nous renvoie 264 fiches. Des **filtres**
  (par date de modification, par exemple) ou une **pagination** sont-ils prévus ?
- Nous n'avons pas trouvé de **récupération unitaire** sur les sessions et les factures, seulement la
  liste complète. Est-ce voulu ?
- Vos conditions mentionnent une **limitation du nombre de requêtes** et qualifient l'usage anormal
  d'abus. Quelles sont les limites applicables à notre offre, et quel **rythme d'appels**
  recommandez-vous ? Des **webhooks** existent-ils, qui nous éviteraient d'interroger régulièrement ?
- Le jeton est valable 3 600 secondes : faut-il le renouveler via le `refreshToken`, ou
  réauthentifier le compte ? Existe-t-il un mode **serveur-à-serveur** plus adapté, que nous
  privilégierions ?

## 5. Deux champs que nous ne pouvons pas interpréter

- **`custom_field_1` à `custom_field_20`** existent sur les sessions, les apprenants et les factures,
  mais leurs **libellés métier ne figurent pas dans la réponse**. Sans la correspondance, ces champs
  nous sont inutilisables. Peut-on l'obtenir, ou est-elle lisible quelque part dans l'application ?
- Le **`customId` d'une session** correspond-il bien au numéro que nous reportons aujourd'hui à la
  main dans Salesforce ? Si oui, c'est la clé de rapprochement qui supprimerait cette ressaisie, et
  nous aimerions le confirmer avant de nous appuyer dessus.

## 6. Stabilité et connecteurs

- L'API est-elle **versionnée**, et quel **préavis** appliquez-vous en cas d'évolution non
  rétrocompatible ?
- Votre documentation commerciale mentionne des connecteurs natifs **Pennylane** et **Salesforce**.
  Pourriez-vous préciser leur périmètre, le sens de synchronisation et les conditions d'activation ?
  Le champ `pennylane` ressort à `null` sur l'ensemble de nos factures, ce qui nous laisse penser que
  le connecteur n'est pas activé chez nous. S'ils couvrent nos besoins, nous privilégierons cette voie
  à un développement spécifique.

## 7. Conformité — deux confirmations écrites

Pour notre dossier interne :

- la **région d'hébergement effective** des données et des traitements. Votre offre mentionne un
  hébergement en France, tandis que l'API répond depuis la région `europe-west3`, soit Francfort. Nous
  avons besoin de savoir ce qui est exact pour documenter notre registre ;
- la **liste à jour de vos sous-traitants ultérieurs**, l'annexe de nos conditions datant de la
  signature.

---

Les points 1 et 2 bloquent notre revue interne : une réponse sur ceux-là, même partielle, nous aiderait
en premier lieu. Le reste peut suivre à votre rythme.

Si un échange téléphonique facilite le traitement, nous sommes disponibles — n'hésitez pas à nous
proposer un créneau.

Bien cordialement,

Jonathan Knaus
Team Lead Accounting Firm Services (AFS)
Pennylane
