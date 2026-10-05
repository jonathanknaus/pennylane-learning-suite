# Message à la data team — accès aux données SmartOF

**À qui** : l'équipe **Data Engineering**. Yacine Mallouki (`yacine.mallouki@pennylane.com`,
Data Engineer) est l'auteur des deux PR, mais **son statut Slack indique qu'il est malade** —
mieux vaut poster sur un canal data plutôt qu'en DM, pour que quelqu'un d'autre puisse répondre.
Les équipes citées en review sur ses PR : `data-analysts`, `Data Platform`,
`Self Service Analytics`.

> ⚠️ Rien n'est envoyé. À relire, ajuster, puis poster toi-même.

---

Hello 👋

J'ai vu passer deux PR de Yacine sur les modèles SmartOF dans `dbt-models` — #6446 (bronze) et
#6493 (silver). Je travaille sur l'exploitation des données SmartOF côté AFS et j'aurais quelques
questions. Yacine étant indisponible, je poste ici au cas où quelqu'un d'autre a le contexte.

**Le contexte en deux lignes** : j'ai cartographié l'API SmartOF (16 routes de lecture, testées).
Elle me donne les sessions, les apprenants, les produits, les entreprises et les factures. Mais
elle **n'expose pas** trois choses dont j'ai besoin :

- le **lien apprenant ↔ session** — qui a participé à quelle session (l'objet `suiviApprenant`
  existe chez l'éditeur, mais n'est pas exposé par l'API) ;
- les **enquêtes de satisfaction** et leurs résultats ;
- les **émargements**.

Comme vos modèles lisent la base en amont, ces données y sont peut-être déjà.

**Mes questions :**

1. Les modèles couvrent-ils la table de **liaison apprenant ↔ session** (côté SmartOF, ça
   ressemble à `suivi_apprenants`) ?
2. Et les **enquêtes de satisfaction** / **émargements** ?
3. Quelle est la **fréquence de rafraîchissement** des données ?
4. Les deux instances SmartOF sont-elles distinguées ? Il y a **`afs-pennylane`** (mon périmètre)
   et **`pennylane`** (Training) — je ne dois voir que la première.
5. Comment y **accéder en lecture** : quel dataset, et quels droits dois-je demander ?

Une réponse écrite me va très bien, même en plusieurs fois — pas besoin de bloquer un créneau.

Merci beaucoup 🙏

---
---

# ⬇️ Aide-mémoire — POUR TOI, à ne pas envoyer

Si on te répond avec du jargon, voilà la traduction.

## Les mots qui vont revenir

| Terme | Ce que ça veut dire |
|---|---|
| **DWH / data warehouse** | la grande base où Pennylane recopie les données de tous ses outils pour les analyser |
| **dbt** | l'outil qui fabrique les tables du DWH à partir des données brutes |
| **bronze / silver / gold** | les étages de raffinage : *bronze* = copie brute, *silver* = nettoyé et structuré, *gold* = prêt pour les tableaux de bord |
| **modèle** | une table fabriquée par dbt |
| **dataset** | un dossier de tables |
| **BigQuery** | l'endroit où ces tables sont stockées et interrogées |
| **pipeline / ingestion** | le tuyau qui va chercher les données dans SmartOF |

## Ce que tu cherches à savoir, en clair

1. **Question 1** — « Est-ce que vous avez recopié la table qui dit *qui a assisté à quelle
   formation* ? » C'est **la** question. Tout le reste est secondaire.
2. **Question 2** — « Et les notes de satisfaction, et les feuilles de présence signées ? »
3. **Question 3** — « Vos données datent de quand ? » Une réponse du type « rafraîchi chaque nuit »
   est bonne ; « une fois par semaine » serait limitant pour du suivi opérationnel.
4. **Question 4** — « Est-ce que je verrais aussi les données de l'équipe Training ? » Tu ne dois
   voir que ton périmètre. Si la réponse est « tout est mélangé », c'est un sujet à remonter.
5. **Question 5** — « Concrètement, je fais comment pour lire ces données ? »

## Comment lire leur réponse

- **« oui, c'est dans le silver »** → excellent, la donnée existe et est déjà propre. Demande le
  nom exact de la table.
- **« c'est dans le bronze seulement »** → la donnée est là mais brute. Utilisable, avec un peu
  plus de travail.
- **« ce n'est pas ingéré »** → la donnée n'a pas été recopiée. Tu peux demander qu'elle le soit :
  c'est une demande d'évolution, qui passera par leur file de priorités.
- **« il faut un accès BigQuery »** → ce sera une demande de droits séparée, probablement via IT.
- **Si on te parle de « l'API SmartOF »** → tu peux répondre que tu l'as déjà cartographiée et
  qu'elle n'expose pas ces trois éléments. Tu es en avance sur eux là-dessus.

## Si on te pose une question à laquelle tu ne sais pas répondre

Tu n'es pas obligé de répondre sur le moment. « Je regarde et je reviens vers toi » est une
réponse parfaitement normale entre collègues. Reviens me voir avec la question, on la traite.

Détail complet du travail déjà fait : [smartof-api.md](smartof-api.md).
