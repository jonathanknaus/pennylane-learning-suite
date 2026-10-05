# Demande de documentation API — à relire avant envoi

**Destinataire** : `contact@smartof.tech` (support CogniMap / SmartOF)
**Objet suggéré** : Documentation API REST — compte api-afs-pennylane@smartof.tech

> ⚠️ Rien n'est envoyé. À relire, ajuster, puis envoyer depuis ta messagerie.

---

Bonjour,

Nous utilisons SmartOF pour notre activité de formation (instance `afs-pennylane`, abonnement
Pro) et souhaitons exploiter l'API REST JSON incluse dans notre offre, afin de limiter les
ressaisies entre SmartOF et nos outils internes.

Un compte de service nous a été fourni : `api-afs-pennylane@smartof.tech`.

**1. Notre point de départ : l'authentification fonctionne**

Nous obtenons bien un jeton auprès de Google Identity Platform
(`accounts:signInWithPassword`) avec les identifiants du compte, et
`https://europe-west3-afs-pennylane-mobileo.cloudfunctions.net/external` l'accepte en
`Authorization: Bearer`.

Il ne nous manque donc **que la liste des ressources** : l'appel sur la racine `/` renvoie
`404 Cannot GET /`, ce qui confirme que nous sommes authentifiés mais qu'aucune route n'est
exposée à cet endroit.

Deux précisions nous seraient utiles sur ce point :

- le jeton est valable 3600 secondes : faut-il le renouveler via le `refreshToken`, ou
  réauthentifier le compte à chaque fois ?
- existe-t-il un mode d'authentification plus adapté à un usage serveur-à-serveur (compte de
  service, jeton longue durée) ? Nous le privilégierions.

**2. Notre demande principale : la liste des endpoints**

Merci de nous transmettre la documentation de l'API : **chemins exposés**, méthodes, paramètres
de filtrage et de pagination, schémas de réponse et codes d'erreur.

Nous sommes particulièrement intéressés par les sessions de formation, les apprenants et
inscriptions, les enquêtes de satisfaction et leurs résultats, les documents administratifs et
les produits de formation.

Nous préférons obtenir cette liste de votre part plutôt que de la chercher par tâtonnement sur
votre plateforme.

**3. Périmètre du compte**

- Quels droits porte aujourd'hui le compte `api-afs-pennylane@smartof.tech` ?
- Nous souhaitons le restreindre à la **lecture seule** pour notre phase d'étude, conformément à
  notre politique interne de moindre privilège. Est-ce possible, ou faut-il créer un second
  compte dédié ?
- Ce compte consomme-t-il l'un de nos sièges administrateurs ?

**4. Quotas et bonnes pratiques**

Vos conditions générales mentionnent une limitation du nombre de requêtes. Quelles sont les
limites applicables à notre offre, et quel rythme d'appels recommandez-vous ? Des **webhooks**
ou notifications d'événements existent-ils, afin de nous éviter des interrogations répétées ?

**5. Stabilité**

L'API est-elle versionnée, et quel préavis appliquez-vous en cas d'évolution non rétrocompatible ?

**6. Connecteurs existants**

Votre documentation commerciale mentionne des connecteurs natifs **Pennylane** (création de
factures) et **Salesforce**. Pourriez-vous nous préciser leur périmètre, le sens de
synchronisation et les conditions d'activation ? S'ils couvrent nos besoins, nous privilégierons
cette voie à un développement spécifique.

**7. Conformité**

Pour notre dossier interne, deux confirmations écrites nous seraient utiles :

- la **région d'hébergement** effective des données et des traitements (votre offre mentionne un
  hébergement en France, tandis que l'API répond depuis la région `europe-west3`) ;
- la **liste à jour des sous-traitants ultérieurs**, l'appendice 3 de l'annexe 1 de nos CGS
  datant de la signature.

Nous restons à votre disposition pour un échange si cela facilite le traitement.

Bien cordialement,

Jonathan Knaus
Team Lead Accounting Firm Services (AFS)
Pennylane
