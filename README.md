# Pennylane Learning Suite

Outil de gestion de formations en ligne, conforme Qualiopi.

## Modules

- **Catalogue** : formations, sessions, dates, lieux, formateurs
- **Stagiaires** : inscriptions, convocations, suivi des présences
- **Documents** : émargements, attestations, programmes personnalisés — génération PDF **et envoi par email** aux participants
- **Qualiopi** : évaluations, indicateurs, traçabilité

## Stack

- Frontend : React 19 + Vite
- Backend : Python 3.13 + Litestar
- Base de données : PostgreSQL
- Hébergement : Railway

## Envoi d'emails

Les convocations et attestations peuvent être envoyées par email depuis l'onglet
**Documents Qualiopi**. Le corps de l'email reprend exactement le document affiché
à l'écran (même mise en page que le PDF).

- Backend : `POST /emails/send` (router `app/routers/emails.py`) → envoi via
  [Resend](https://resend.com), journalisé dans la table `emails_log`.
- Configuration (`backend/.env`) : `RESEND_API_KEY` et `FROM_EMAIL`.
- Sans clé Resend configurée, l'endpoint répond `503`. En mode démo (frontend seul,
  backend injoignable), l'envoi est **simulé** côté interface — aucun email réel n'est émis.
