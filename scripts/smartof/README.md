# Test de lecture de l'API SmartOF

Harnais minimal pour cartographier l'API **sans rien modifier** et sans faire sortir de données
nominatives. Contexte complet : [docs/smartof-api.md](../../docs/smartof-api.md).

## Avant de lancer quoi que ce soit

Le SPD **CONNECT SMARTOF <> PENNYLANE** impose trois choses (Sylvain Sarméjeanne, 2026-10-05) :

1. la remise des credentials passe par un **ticket IT** ;
2. les scopes de la clé suivent le **moindre privilège** (demander explicitement lecture seule) ;
3. la clé est **stockée de façon sécurisée** (coffre interne).

Le secret ne doit donc jamais circuler dans un chat, un ticket en clair ni le dépôt.

## Le secret ne s'écrit nulle part

Règle posée : **les identifiants SmartOF ne doivent jamais être écrits dans un fichier, un log ou
un dépôt.** Les scripts ici respectent ça : la clé est **demandée au clavier**, en saisie masquée,
et disparaît à la fin de l'exécution. Elle ne passe ni par le disque, ni par l'historique du shell.

Ne crée pas de `.env` contenant la clé. L'URL de base est déjà codée par défaut dans les scripts :

```
https://europe-west3-afs-pennylane-mobileo.cloudfunctions.net/external
```

## État : opérationnel

Authentification résolue et testée le 2026-10-05. Il te faut trois éléments, saisis au clavier à
chaque exécution : la **clé API web** (`AIza…`), l'**identifiant** du compte et son **mot de
passe**. Le jeton obtenu n'est valable qu'une heure.

Documentation officielle de l'éditeur :
[Swagger API SmartOF](https://europe-west3-afs-pennylane-mobileo.cloudfunctions.net/docs/swagger/).
Analyse complète du périmètre : [docs/smartof-api.md](../../docs/smartof-api.md).

## Les scripts

| Script | Rôle |
|---|---|
| `identifiants.sh` | range la clé, l'identifiant et le mot de passe dans le trousseau macOS (`enregistrer` / `verifier` / `supprimer`) |
| `_secrets.sh` | relit ces secrets depuis le trousseau à l'exécution — jamais sur disque |
| `obtenir-jeton.sh` | vérifie l'authentification de bout en bout, puis fait une lecture de contrôle |
| `lecture-seule.sh` | appelle une route de consultation. **Lance-le sans argument pour voir la liste des routes autorisées.** |
| `trouver-auth.sh` | détermine le schéma d'authentification attendu par l'API (utilisé lors de la cartographie) |
| `exporter.sh` | export brut d'une ressource vers `export/` (gitignoré) |
| `generer-catalogue.mjs` | transforme l'export des produits en `frontend/src/data/catalogue-smartof.js` |
| `comparer-tarifs.mjs` | compare les tarifs des fiches SmartOF à la grille AFS |

## Pourquoi une liste blanche

L'API SmartOF est de style **RPC** : toutes ses routes sont en `POST`, **y compris les lectures**.
Interdire les méthodes d'écriture ne sert donc à rien — un `POST` peut aussi bien lister
qu'effacer.

`lecture-seule.sh` applique pour cette raison une **liste blanche des 16 routes de consultation**
(`/list` et `/get`). Toute route contenant `create`, `update` ou `delete` est refusée avant même
l'authentification. Les routes d'écriture existent bien dans l'API — elles sont volontairement
absentes du script.

## Ce que les scripts n'affichent jamais

Ni la clé, ni le mot de passe, ni le jeton, ni **les valeurs des champs**. Uniquement les noms
des champs, leurs types et le nombre d'enregistrements — de quoi cartographier sans faire sortir
de données d'apprenants.

## Utilisation

```
chmod +x lecture-seule.sh
./lecture-seule.sh /un-chemin
```

⚠️ Les routes `list` **n'acceptent aucun paramètre** — ni filtre, ni pagination, ni `limit`
(vérifié dans le Swagger). Chaque appel ramène donc **toute** la collection : 264 apprenants et
267 Ko pour `apprenant/list`. D'où la consigne ci-dessous.

Le script :

- n'appelle que des routes de la **liste blanche** — toute route contenant `create`, `update` ou
  `delete` est refusée avant même l'authentification. ⚠️ Les appels eux-mêmes sont des **POST**,
  puisque l'API est de style RPC : c'est la liste blanche qui protège, pas la méthode HTTP ;
- n'affiche **jamais** le secret ;
- n'affiche **jamais les valeurs** des champs, seulement leurs noms et types, pour cartographier
  l'API sans exposer de données personnelles ;
- affiche le corps de la réponse uniquement en cas de 401/403, car le message d'erreur indique
  généralement le schéma d'authentification attendu.

Un appel à la fois. Les CGS prévoient une limitation du nombre de
requêtes et qualifient l'usage anormal d'abus : pas de boucle, pas de synchro agressive.

## Si l'authentification échoue

Un 401 ou 403 sur la racine est attendu tant que le schéma n'est pas confirmé. Le corps de la
réponse est la meilleure source pour savoir quel en-tête l'API réclame — c'est pour ça que le
script l'affiche dans ce cas précis.
