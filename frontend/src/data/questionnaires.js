// Banque : exactement 5 questions par module (pré et post posent les mêmes 5, ordre aléatoire différent)
// Une question : { id, enonce, options: [A,B,C,D], reponse: 'A'|'B'|'C'|'D' }

import { uid } from './ids.js'
const BANQUE_STANDARD = {
  saisie_comptable: [
    { id: 'sc1', enonce: "Quelle fonctionnalité Pennylane permet de catégoriser automatiquement les transactions bancaires ?", options: ["Le rapprochement manuel", "Les règles de catégorisation automatique", "L'export comptable", "Le lettrage"], reponse: "B" },
    { id: 'sc2', enonce: "Comment importer des relevés bancaires dans Pennylane ?", options: ["Par email uniquement", "Via le connecteur bancaire ou import OFX/CSV", "Uniquement via API", "Par courrier postal"], reponse: "B" },
    { id: 'sc3', enonce: "Qu'est-ce que le lettrage dans Pennylane ?", options: ["La mise en forme des factures", "L'association d'une écriture à sa contrepartie pour solder un compte", "La génération automatique des bulletins de paie", "L'envoi de relances clients"], reponse: "B" },
    { id: 'sc4', enonce: "Quelle est la durée de conservation légale des pièces comptables en France ?", options: ["3 ans", "5 ans", "10 ans", "30 ans"], reponse: "C" },
    { id: 'sc5', enonce: "Dans Pennylane, le flux documentaire permet de :", options: ["Envoyer des devis", "Centraliser et traiter les pièces justificatives en amont de la saisie", "Gérer les congés des collaborateurs", "Imprimer les bilans"], reponse: "B" },
  ],
  revision: [
    { id: 'rv1', enonce: "Quel outil Pennylane facilite le suivi des points de révision en cours de clôture ?", options: ["Le plan de trésorerie", "La checklist de révision / dossier de travail", "Le module TVA", "Les alertes email"], reponse: "B" },
    { id: 'rv2', enonce: "Lors d'une révision, que permet le mode 'comparatif' dans Pennylane ?", options: ["Comparer les soldes de deux exercices côte à côte", "Comparer deux utilisateurs", "Exporter en double exemplaire", "Fusionner deux dossiers"], reponse: "A" },
    { id: 'rv3', enonce: "Qu'est-ce qu'un FEC dans le cadre de la révision comptable ?", options: ["Un formulaire d'embauche", "Le Fichier des Écritures Comptables, export normalisé pour contrôle fiscal", "Un format d'import de factures", "Un rapport de trésorerie"], reponse: "B" },
    { id: 'rv4', enonce: "Pennylane permet d'exporter le FEC :", options: ["Uniquement en PDF", "En XML ou CSV conformes aux spécifications DGFiP", "En XLSX uniquement", "Il ne génère pas de FEC"], reponse: "B" },
    { id: 'rv5', enonce: "À quelle étape réalise-t-on généralement les écritures d'inventaire ?", options: ["En début de mois", "Lors de la clôture d'exercice", "Lors de l'onboarding client", "À chaque import de relevé bancaire"], reponse: "B" },
  ],
  tva: [
    { id: 'tv1', enonce: "Quel régime de TVA implique une déclaration mensuelle ou trimestrielle du CA réel ?", options: ["Franchise en base", "Régime réel simplifié (RSI)", "Régime réel normal (RN)", "Micro-entreprise"], reponse: "C" },
    { id: 'tv2', enonce: "Dans Pennylane, comment paramétrer le taux de TVA d'un produit/service ?", options: ["Dans Paramètres > Plan comptable > Comptes de TVA", "Dans l'onglet Banque", "Via un import Excel uniquement", "Dans le module Paie"], reponse: "A" },
    { id: 'tv3', enonce: "La TVA déductible correspond à :", options: ["La TVA collectée sur les ventes", "La TVA payée sur les achats, récupérable auprès de l'État", "La TVA sur les salaires", "La TVA intracommunautaire encaissée"], reponse: "B" },
    { id: 'tv4', enonce: "Pennylane permet de télédéclarer la TVA via :", options: ["L'envoi postal d'une liasse", "La connexion directe aux impôts.gouv.fr via EDI", "Un module de paie tiers", "Une API non disponible en France"], reponse: "B" },
    { id: 'tv5', enonce: "Qu'est-ce que la TVA sur encaissement ?", options: ["TVA calculée à la facturation", "TVA exigible uniquement lors du paiement effectif", "TVA sur les importations", "TVA appliquée aux associations"], reponse: "B" },
  ],
  parametrage: [
    { id: 'pa1', enonce: "Où configure-t-on les droits d'accès des collaborateurs dans Pennylane ?", options: ["Dans chaque dossier client séparément", "Dans Paramètres Cabinet > Utilisateurs & Rôles", "Dans le module Paie", "Via l'assistance Pennylane uniquement"], reponse: "B" },
    { id: 'pa2', enonce: "Quel est l'intérêt de connecter un outil tiers (ex. : Silae) à Pennylane ?", options: ["Supprimer le module comptable", "Synchroniser automatiquement les données pour éviter les doubles saisies", "Remplacer les déclarations fiscales", "Archiver les emails"], reponse: "B" },
    { id: 'pa3', enonce: "Dans Pennylane, un 'dossier client' correspond à :", options: ["Un contact dans le CRM", "Une entité juridique avec sa propre comptabilité", "Un document PDF archivé", "Un utilisateur collaborateur"], reponse: "B" },
    { id: 'pa4', enonce: "Comment personnaliser le plan comptable d'un dossier dans Pennylane ?", options: ["Via Paramètres du dossier > Plan comptable", "Via l'onglet Facturation uniquement", "En contactant le support", "Il n'est pas modifiable"], reponse: "A" },
    { id: 'pa5', enonce: "Les alertes d'échéances fiscales dans Pennylane permettent de :", options: ["Envoyer automatiquement les déclarations", "Notifier les collaborateurs des dates limites de dépôt", "Calculer les impôts automatiquement", "Générer les factures clients"], reponse: "B" },
  ],
  module_achat: [
    { id: 'ma1', enonce: "Dans Pennylane, le cycle d'achat commence par :", options: ["L'émission d'une facture", "La réception et l'enregistrement d'une facture fournisseur", "Le paiement par carte", "L'export comptable"], reponse: "B" },
    { id: 'ma2', enonce: "Comment valider une facture fournisseur dans Pennylane ?", options: ["En l'imprimant et la signant manuellement", "Via le workflow de validation paramétré dans le circuit d'approbation", "En envoyant un email au fournisseur", "Via le module paie"], reponse: "B" },
    { id: 'ma3', enonce: "Le rapprochement commande/facture dans Pennylane permet de :", options: ["Comparer les prix du marché", "Vérifier que la facture correspond bien à une commande préalablement validée", "Générer des relevés bancaires", "Archiver les fournisseurs"], reponse: "B" },
    { id: 'ma4', enonce: "Quel format est recommandé pour l'import de factures fournisseurs dans Pennylane ?", options: ["DOC", "PDF ou facture électronique (Factur-X, UBL)", "XLS uniquement", "Image JPEG"], reponse: "B" },
    { id: 'ma5', enonce: "Dans Pennylane, comment programmer un paiement fournisseur ?", options: ["Via virement manuel hors Pennylane uniquement", "Via le module Paiements avec date d'échéance et compte bancaire", "Via un export CSV vers la banque", "Via le module Paie"], reponse: "B" },
  ],
  notes_de_frais: [
    { id: 'nf1', enonce: "Dans Pennylane, qui peut soumettre une note de frais ?", options: ["Uniquement le DAF", "Tout utilisateur ayant le rôle 'Employé' ou équivalent", "Uniquement les managers", "Uniquement via l'application mobile"], reponse: "B" },
    { id: 'nf2', enonce: "Le barème kilométrique dans Pennylane est :", options: ["Fixé librement par l'entreprise", "Basé sur le barème fiscal officiel de l'administration", "Calculé par GPS uniquement", "Non disponible dans Pennylane"], reponse: "B" },
    { id: 'nf3', enonce: "Comment justifier une dépense dans une note de frais Pennylane ?", options: ["Par une déclaration sur l'honneur", "En joignant un justificatif (photo ou PDF du ticket/facture)", "Par email au comptable", "Aucun justificatif requis"], reponse: "B" },
    { id: 'nf4', enonce: "Quel est l'avantage de la capture OCR dans le module notes de frais ?", options: ["Générer des rapports PDF", "Pré-remplir automatiquement les champs montant, date et fournisseur depuis la photo du ticket", "Envoyer les frais à la banque", "Archiver en format ZIP"], reponse: "B" },
    { id: 'nf5', enonce: "Une note de frais validée dans Pennylane génère automatiquement :", options: ["Une facture client", "Une écriture comptable dans le journal des achats/frais", "Un bulletin de paie", "Un virement bancaire immédiat"], reponse: "B" },
  ],
  demandes_achats: [
    { id: 'da1', enonce: "Une demande d'achat dans Pennylane permet de :", options: ["Créer une facture vente", "Initier une demande de dépense soumise à validation avant commande", "Générer une paie", "Archiver un contrat"], reponse: "B" },
    { id: 'da2', enonce: "Comment tracer le lien entre une demande d'achat et sa facture dans Pennylane ?", options: ["Par annotation manuelle dans un PDF", "En rattachant la facture à la demande via le workflow intégré", "Via un tableau Excel externe", "Ce lien n'est pas possible"], reponse: "B" },
    { id: 'da3', enonce: "Le statut 'approuvé' d'une demande d'achat signifie :", options: ["La facture est payée", "La demande a été validée par l'approbateur désigné", "La commande est livrée", "Le budget est épuisé"], reponse: "B" },
    { id: 'da4', enonce: "Peut-on attacher un budget prévisionnel à une demande d'achat dans Pennylane ?", options: ["Non, ce n'est pas possible", "Oui, via les catégories analytiques et le suivi budgétaire", "Uniquement avec un module externe", "Uniquement en présentiel"], reponse: "B" },
    { id: 'da5', enonce: "Qui reçoit la notification lors d'une nouvelle demande d'achat ?", options: ["Le fournisseur", "L'approbateur défini dans le circuit de validation", "L'ensemble des utilisateurs", "Personne, c'est manuel"], reponse: "B" },
  ],
  circuit_validation: [
    { id: 'cv1', enonce: "Un circuit de validation dans Pennylane est :", options: ["Un processus d'onboarding client", "Une séquence d'approbations paramétrables avant paiement ou achat", "Un formulaire de signature électronique", "Un export comptable"], reponse: "B" },
    { id: 'cv2', enonce: "On peut déclencher un circuit de validation en fonction de :", options: ["La météo", "Le montant de la dépense, le type ou la catégorie", "L'heure de la journée", "La taille de la pièce jointe"], reponse: "B" },
    { id: 'cv3', enonce: "Le circuit de validation protège contre la fraude en :", options: ["Cryptant toutes les factures", "Imposant une validation humaine avant tout paiement", "Bloquant les nouveaux fournisseurs", "Envoyant une alerte à la banque"], reponse: "B" },
    { id: 'cv4', enonce: "Combien de niveaux d'approbation peut-on paramétrer dans Pennylane ?", options: ["1 seul niveau", "2 niveaux maximum", "Plusieurs niveaux séquentiels selon la configuration", "Illimité mais non ordonnés"], reponse: "C" },
    { id: 'cv5', enonce: "Si un approbateur est absent, que se passe-t-il dans Pennylane ?", options: ["Le paiement est bloqué définitivement", "Un délégué ou un approbateur de substitution peut être défini", "La demande est automatiquement rejetée", "Elle passe au niveau suivant sans validation"], reponse: "B" },
  ],
  reforme_rfe: [
    { id: 'rfe1', enonce: "Qu'est-ce que l'e-invoicing dans le cadre de la RFE ?", options: ["L'envoi de factures par email", "La facturation électronique structurée échangée via une plateforme immatriculée (PDP/PPF)", "La dématérialisation PDF simple", "La signature électronique de factures papier"], reponse: "B" },
    { id: 'rfe2', enonce: "L'e-reporting concerne :", options: ["Uniquement les grandes entreprises", "La transmission de données de transaction à l'administration pour les opérations hors e-invoicing", "Le reporting RH", "Les déclarations de TVA uniquement"], reponse: "B" },
    { id: 'rfe3', enonce: "Le PPF (Portail Public de Facturation) est :", options: ["Une plateforme privée payante", "La plateforme de l'État permettant l'échange de factures électroniques", "Un logiciel de comptabilité", "Un format de fichier"], reponse: "B" },
    { id: 'rfe4', enonce: "Quel format de facture électronique est nativement supporté par Pennylane pour la RFE ?", options: ["DOCX", "Factur-X (PDF/A-3 avec XML embarqué)", "XLS", "CSV"], reponse: "B" },
    { id: 'rfe5', enonce: "La RFE s'applique progressivement à partir de :", options: ["2024 pour toutes les entreprises simultanément", "2026 pour les grandes entreprises, puis par paliers selon la taille", "2030 uniquement", "Elle est déjà obligatoire depuis 2020"], reponse: "B" },
  ],
  methode_facturation: [
    { id: 'mf1', enonce: "Dans Pennylane, une facture d'acompte est :", options: ["Une facture finale soldant la commande", "Une facture partielle demandant un paiement avant la prestation complète", "Une facture d'avoir", "Un devis transformé"], reponse: "B" },
    { id: 'mf2', enonce: "Les abonnements récurrents dans Pennylane permettent de :", options: ["Envoyer des relances automatiques", "Générer automatiquement des factures à intervalles réguliers", "Calculer la TVA annuelle", "Archiver les anciens devis"], reponse: "B" },
    { id: 'mf3', enonce: "Une facture de situation est utilisée :", options: ["Pour les ventes en magasin", "Dans le cadre de marchés ou projets longs facturés par avancement", "Pour les importations", "Pour les associations"], reponse: "B" },
    { id: 'mf4', enonce: "Comment transformer un devis en facture dans Pennylane ?", options: ["En le réimprimant avec un nouveau numéro", "Via le bouton 'Convertir en facture' depuis le devis validé", "En créant manuellement une nouvelle facture", "Ce n'est pas possible dans Pennylane"], reponse: "B" },
    { id: 'mf5', enonce: "La numérotation des factures dans Pennylane est :", options: ["Libre et non séquentielle", "Séquentielle et automatique, modifiable dans les paramètres", "Alphabétique uniquement", "Gérée par le client"], reponse: "B" },
  ],
  relancer_clients: [
    { id: 'rc1', enonce: "Dans Pennylane, les relances automatiques se déclenchent selon :", options: ["L'humeur du comptable", "Des règles configurables basées sur l'ancienneté de la créance", "L'envoi manuel uniquement", "La taille de l'entreprise cliente"], reponse: "B" },
    { id: 'rc2', enonce: "Combien de niveaux de relance peut-on paramétrer dans Pennylane ?", options: ["1 seul", "2 maximum", "Plusieurs niveaux progressifs (amiable, ferme, mise en demeure…)", "Illimité sans ordre"], reponse: "C" },
    { id: 'rc3', enonce: "Le suivi du taux de recouvrement dans Pennylane permet :", options: ["De calculer les impôts", "De mesurer l'efficacité des relances et l'évolution des créances", "De générer les fiches de paie", "D'envoyer des SMS"], reponse: "B" },
    { id: 'rc4', enonce: "Peut-on personnaliser le texte d'un email de relance dans Pennylane ?", options: ["Non, les modèles sont fixes", "Oui, via les modèles d'email personnalisables dans les paramètres", "Uniquement via le support", "Uniquement en anglais"], reponse: "B" },
    { id: 'rc5', enonce: "Le DSO (Days Sales Outstanding) mesure :", options: ["Le délai moyen de paiement des clients", "Le chiffre d'affaires mensuel", "Le taux de TVA moyen", "Le nombre de factures émises"], reponse: "A" },
  ],
  integration_gestion_commerciale: [
    { id: 'igc1', enonce: "Quelle intégration Pennylane permet de synchroniser automatiquement les contacts CRM ?", options: ["L'intégration avec Salesforce ou HubSpot via connecteur", "L'export manuel CSV", "L'API interne uniquement", "Il n'y a pas d'intégration CRM"], reponse: "A" },
    { id: 'igc2', enonce: "L'intégration Pennylane x Stripe permet de :", options: ["Gérer la paie", "Synchroniser automatiquement les paiements en ligne reçus via Stripe", "Importer des factures PDF", "Calculer la TVA intracommunautaire"], reponse: "B" },
    { id: 'igc3', enonce: "L'API Pennylane est utile pour :", options: ["Remplacer le comptable", "Connecter des outils métier sur-mesure pour automatiser les flux de données", "Générer des bulletins de paie", "Imprimer des documents"], reponse: "B" },
    { id: 'igc4', enonce: "Un webhook Pennylane déclenche :", options: ["Une impression automatique", "Une notification vers un système tiers lors d'un événement (facture créée, paiement reçu…)", "Un email de relance", "Un export FEC"], reponse: "B" },
    { id: 'igc5', enonce: "Quel avantage client met-on en avant avec les intégrations Pennylane ?", options: ["La réduction des frais bancaires", "Le gain de temps par élimination des doubles saisies et la fiabilité des données", "La suppression du bilan annuel", "La gestion des congés"], reponse: "B" },
  ],
  famille_analytique: [
    { id: 'fa1', enonce: "Les axes analytiques dans Pennylane permettent de :", options: ["Remplacer le plan comptable", "Ventiler les opérations selon des dimensions de gestion (projet, département, produit…)", "Générer des déclarations fiscales", "Gérer les absences"], reponse: "B" },
    { id: 'fa2', enonce: "Peut-on affecter plusieurs axes analytiques à une même écriture dans Pennylane ?", options: ["Non, un seul axe par écriture", "Oui, plusieurs axes peuvent être combinés", "Uniquement pour les achats", "Uniquement en version premium"], reponse: "B" },
    { id: 'fa3', enonce: "Un budget analytique dans Pennylane est comparé :", options: ["Uniquement aux factures clients", "Aux écritures réelles ventilées sur l'axe correspondant", "Au FEC uniquement", "Au bilan"], reponse: "B" },
    { id: 'fa4', enonce: "Les rapports analytiques dans Pennylane sont accessibles :", options: ["Uniquement en fin d'année", "En temps réel depuis le tableau de bord analytique", "Via export Excel uniquement", "Après validation du comptable"], reponse: "B" },
    { id: 'fa5', enonce: "À quoi sert un centre de profit dans l'analytique Pennylane ?", options: ["À regrouper les charges sociales", "À isoler la performance financière d'une activité ou d'une unité", "À calculer la TVA", "À gérer les remboursements de frais"], reponse: "B" },
  ],
  plans_tresorerie: [
    { id: 'pt1', enonce: "Un plan de trésorerie dans Pennylane projette :", options: ["Le bilan annuel", "Les flux d'encaissements et décaissements futurs sur une période donnée", "Le résultat fiscal", "Les amortissements"], reponse: "B" },
    { id: 'pt2', enonce: "Pennylane alimente le plan de trésorerie à partir de :", options: ["Données saisies manuellement uniquement", "Factures en attente de paiement, abonnements et données bancaires", "Données Excel importées", "Données DGFiP"], reponse: "B" },
    { id: 'pt3', enonce: "Un solde de trésorerie négatif projeté dans Pennylane doit alerter sur :", options: ["Un excès de chiffre d'affaires", "Un risque de rupture de trésorerie à anticiper", "Une erreur de saisie", "Un problème de TVA"], reponse: "B" },
    { id: 'pt4', enonce: "Peut-on simuler des scénarios dans le plan de trésorerie Pennylane ?", options: ["Non, il est uniquement descriptif", "Oui, en ajoutant des flux prévisionnels manuels", "Uniquement avec le module analytique", "Uniquement en version entreprise"], reponse: "B" },
    { id: 'pt5', enonce: "Le plan de trésorerie est un outil de pilotage utile pour :", options: ["Calculer les charges sociales", "Anticiper les besoins de financement et rassurer les partenaires bancaires", "Remplacer le grand livre", "Calculer les amortissements"], reponse: "B" },
  ],
  outils_analyse: [
    { id: 'oa1', enonce: "Le tableau de bord Pennylane affiche par défaut :", options: ["Le détail des bulletins de paie", "Les indicateurs clés : CA, résultat, trésorerie, encours clients", "Le journal des achats", "La liste des fournisseurs"], reponse: "B" },
    { id: 'oa2', enonce: "Le compte de résultat dans Pennylane est accessible :", options: ["Uniquement à la clôture", "En temps réel depuis l'onglet Reporting", "Via export PDF uniquement", "Via le module Paie"], reponse: "B" },
    { id: 'oa3', enonce: "La balance âgée clients dans Pennylane montre :", options: ["L'historique des achats fournisseurs", "Les créances clients classées par ancienneté de retard", "Le solde de TVA à payer", "Le détail des immobilisations"], reponse: "B" },
    { id: 'oa4', enonce: "Dans Pennylane, comparer N vs N-1 est possible :", options: ["Uniquement après 2 exercices complets", "Via le mode comparatif dans les états financiers", "Via un export Excel manuel", "Ce n'est pas possible"], reponse: "B" },
    { id: 'oa5', enonce: "Quel outil Pennylane présente la ventilation des charges par catégorie ?", options: ["Le journal des ventes", "L'analyse des charges dans le tableau de bord ou le compte de résultat", "La balance fournisseurs", "Le plan de trésorerie"], reponse: "B" },
  ],
  posture: [
    { id: 'po1', enonce: "Quelle posture adopter face à un client réticent à Pennylane ?", options: ["Insister lourdement sur les fonctionnalités techniques", "Écouter ses freins, reformuler ses bénéfices attendus et proposer une démonstration ciblée", "Lui imposer la migration", "Ignorer ses objections"], reponse: "B" },
    { id: 'po2', enonce: "Le bon timing pour présenter une fonctionnalité Pennylane à un client est :", options: ["À tout moment sans préparation", "Lors d'un point où le client exprime un problème que la fonctionnalité résout", "Uniquement lors de l'onboarding", "Jamais, le client doit découvrir seul"], reponse: "B" },
    { id: 'po3', enonce: "Pour maximiser l'adoption de Pennylane chez un client, il faut :", options: ["Lui envoyer le manuel complet", "L'accompagner pas à pas sur ses cas d'usage réels avec un plan d'adoption", "Lui facturer une formation", "Attendre qu'il pose des questions"], reponse: "B" },
    { id: 'po4', enonce: "Face à l'objection 'Pennylane est trop cher', la meilleure réponse est :", options: ["Proposer une remise immédiate", "Calculer le ROI : gain de temps, réduction des erreurs, valeur ajoutée", "Changer de sujet", "Admettre que c'est cher"], reponse: "B" },
    { id: 'po5', enonce: "Lors d'un rendez-vous client, quelle est la première étape avant de parler de Pennylane ?", options: ["Démontrer toutes les fonctionnalités", "Comprendre les enjeux et problématiques actuels du client", "Envoyer une proposition commerciale", "Parler des tarifs"], reponse: "B" },
  ],
  presentation_partenaire: [
    { id: 'pp1', enonce: "Le partenariat Pennylane x Swan porte sur :", options: ["Un service de paie intégré", "Un compte bancaire professionnel intégré directement dans Pennylane", "Un outil de facturation", "Une marketplace de fournisseurs"], reponse: "B" },
    { id: 'pp2', enonce: "Swan est :", options: ["Une banque traditionnelle", "Un établissement de paiement agréé par la Banque de France", "Un assureur", "Un prestataire de paie"], reponse: "B" },
    { id: 'pp3', enonce: "L'intégration Swan dans Pennylane élimine :", options: ["La TVA", "La double saisie entre banque et comptabilité grâce à la synchronisation temps réel", "Les déclarations fiscales", "Le besoin d'un comptable"], reponse: "B" },
    { id: 'pp4', enonce: "Quel avantage principal le Compte Pro Swan offre au client ?", options: ["Des taux d'épargne élevés", "Un compte bancaire professionnel sans frais supplémentaires avec réconciliation automatique", "Une assurance décès", "Une carte de crédit revolving"], reponse: "B" },
    { id: 'pp5', enonce: "Comment ouvrir un Compte Pro Swan pour un client depuis Pennylane ?", options: ["Via un formulaire papier envoyé par La Poste", "Directement depuis l'interface Pennylane du dossier client en quelques clics", "Via l'agence bancaire", "Via une API externe complexe"], reponse: "B" },
  ],
  gestion_compte_pro: [
    { id: 'gcp1', enonce: "Dans Pennylane, comment effectuer un virement depuis le Compte Pro ?", options: ["Via l'application Swan séparée uniquement", "Directement depuis l'onglet Banque du dossier Pennylane", "Par téléphone au conseiller", "Via export SEPA manuel"], reponse: "B" },
    { id: 'gcp2', enonce: "Les cartes bancaires du Compte Pro Swan sont :", options: ["Uniquement physiques et en métal", "Virtuelles et/ou physiques, paramétrables avec plafonds et restrictions", "Uniquement pour les dirigeants", "Non disponibles en France"], reponse: "B" },
    { id: 'gcp3', enonce: "La réconciliation automatique des paiements Swan dans Pennylane signifie :", options: ["Un comptable valide chaque transaction", "Chaque opération bancaire est automatiquement rapprochée avec sa facture", "Les paiements sont exportés vers Excel", "Rien, c'est un terme marketing"], reponse: "B" },
    { id: 'gcp4', enonce: "Le suivi des encaissements clients via le Compte Pro permet :", options: ["De supprimer les relances", "De voir en temps réel les paiements reçus et les associer aux factures ouvertes", "De calculer les congés payés", "De générer les bulletins de paie"], reponse: "B" },
    { id: 'gcp5', enonce: "La conformité KYC (Know Your Customer) pour le Compte Pro est gérée :", options: ["Par le cabinet comptable manuellement", "Par Swan directement lors de l'ouverture du compte", "Par Pennylane via un formulaire papier", "Elle n'est pas requise"], reponse: "B" },
  ],
  solutions_paiement: [
    { id: 'sp1', enonce: "Le prélèvement SEPA dans Pennylane permet :", options: ["De payer ses fournisseurs automatiquement", "De prélever directement les clients domiciliés ayant signé un mandat", "De rembourser la TVA", "D'envoyer des relances"], reponse: "B" },
    { id: 'sp2', enonce: "Un TPE (Terminal de Paiement Électronique) intégré à Pennylane :", options: ["Remplace la comptabilité", "Permet d'encaisser les paiements carte en boutique avec réconciliation automatique", "Ne fonctionne qu'en ligne", "N'est pas disponible en France"], reponse: "B" },
    { id: 'sp3', enonce: "L'affacturage (financement de factures) dans Pennylane permet :", options: ["De supprimer les factures clients", "D'obtenir une avance sur créances pour financer le BFR", "De générer des factures automatiquement", "De calculer les amortissements"], reponse: "B" },
    { id: 'sp4', enonce: "Le pay-by-link dans Pennylane permet :", options: ["De payer ses impôts en ligne", "D'envoyer un lien de paiement sécurisé par email à son client", "De générer des QR codes d'accès", "De connecter un terminal bancaire"], reponse: "B" },
    { id: 'sp5', enonce: "La méthode d'encaissement la plus adaptée pour un commerce en boutique est :", options: ["Le prélèvement SEPA", "Le TPE avec intégration Pennylane", "Le chèque", "Le virement international"], reponse: "B" },
  ],
  mettre_en_avant_compte_pro: [
    { id: 'mecp1', enonce: "Le principal argument pour proposer le Compte Pro Swan à un client est :", options: ["Son taux d'intérêt élevé", "La simplification comptable et la suppression de la double saisie banque/compta", "Les frais moins élevés que toutes les banques", "La carte bancaire en métal"], reponse: "B" },
    { id: 'mecp2', enonce: "Le bon moment pour parler du Compte Pro à un client est :", options: ["Jamais, c'est intrusif", "Lors d'un point sur ses difficultés de trésorerie ou d'organisation", "Uniquement lors de la signature du contrat de mission", "Uniquement par email"], reponse: "B" },
    { id: 'mecp3', enonce: "Face à un client qui dit 'j'ai déjà une banque', la réponse est :", options: ["Insister lourdement", "Montrer la complémentarité : Swan simplifie la vie comptable sans remplacer sa banque principale", "Abandonner la conversation", "Lui envoyer une brochure"], reponse: "B" },
    { id: 'mecp4', enonce: "La valeur du Compte Pro pour le cabinet comptable est :", options: ["Une commission sur les frais bancaires", "Une meilleure fluidité des données et un service client renforcé", "Une réduction des honoraires", "Un accès gratuit à Pennylane"], reponse: "B" },
    { id: 'mecp5', enonce: "L'argument 'sans frais supplémentaires' pour le Compte Pro signifie :", options: ["Swan est totalement gratuit", "L'ouverture et l'utilisation basique sont incluses dans l'offre Pennylane existante", "Le cabinet ne facture plus de missions", "Toutes les transactions sont gratuites"], reponse: "B" },
  ],
  webinaire_embarquement: [
    { id: 'we1', enonce: "L'objectif principal d'un webinaire d'embarquement client est :", options: ["Former le comptable à Pennylane", "Rendre le client autonome sur les fonctionnalités essentielles de Pennylane", "Vendre des modules supplémentaires", "Présenter le bilan annuel"], reponse: "B" },
    { id: 'we2', enonce: "La durée recommandée d'un webinaire d'embarquement collectif est :", options: ["15 minutes", "45 à 90 minutes selon le plan souscrit", "3 heures", "Toute une journée"], reponse: "B" },
    { id: 'we3', enonce: "Lors d'un webinaire d'embarquement, quelle fonctionnalité présenter en priorité ?", options: ["Les fonctionnalités avancées d'analytique", "Les fonctionnalités du quotidien : import de factures, validation, réconciliation", "Le module de paie", "Les paramètres avancés du plan comptable"], reponse: "B" },
    { id: 'we4', enonce: "Pour maximiser la participation au webinaire, il faut :", options: ["Envoyer l'invitation 5 minutes avant", "Planifier 1 à 2 semaines à l'avance avec rappels automatiques", "Ne pas envoyer d'invitation, ils viendront d'eux-mêmes", "Imposer la présence par contrat"], reponse: "B" },
    { id: 'we5', enonce: "Après le webinaire d'embarquement, quelle action est recommandée ?", options: ["Ne rien faire, le client est formé", "Envoyer un récapitulatif et planifier un suivi à 30 jours", "Facturer immédiatement", "Clôturer le dossier"], reponse: "B" },
  ],
  construction_strategie: [
    { id: 'cs1', enonce: "Un workshop 'Construction de stratégie' avec Pennylane vise :", options: ["Former les équipes à la saisie comptable", "Co-construire avec le cabinet un plan d'adoption et de déploiement de Pennylane", "Vendre des licences supplémentaires", "Former les clients finaux"], reponse: "B" },
    { id: 'cs2', enonce: "L'identification des 'freins' lors d'un workshop stratégique permet :", options: ["De prolonger la réunion", "D'adapter le plan d'adoption pour lever les obstacles à l'utilisation de Pennylane", "De justifier une hausse de tarif", "De reporter la migration"], reponse: "B" },
    { id: 'cs3', enonce: "Une 'feuille de route' produite lors du workshop contient :", options: ["Uniquement les tarifs", "Les étapes, responsables, délais et indicateurs de succès du déploiement", "La liste des fonctionnalités de Pennylane", "Le bilan du cabinet"], reponse: "B" },
    { id: 'cs4', enonce: "La segmentation des clients dans la stratégie Pennylane permet :", options: ["De facturer plus", "De prioriser les clients à fort potentiel d'adoption pour maximiser l'impact", "De réduire les services proposés", "D'éliminer les petits clients"], reponse: "B" },
    { id: 'cs5', enonce: "Le KPI principal pour mesurer le succès d'une stratégie Pennylane est :", options: ["Le nombre de modules achetés", "Le taux d'adoption actif par les clients (connexions régulières, fonctionnalités utilisées)", "Le nombre de formations suivies", "Le chiffre d'affaires du cabinet"], reponse: "B" },
  ],
  mise_en_situation: [
    { id: 'ms1', enonce: "La mise en situation dans la formation AFS permet de :", options: ["Tester le logiciel en mode lecture seule", "Pratiquer des scénarios réels sur un dossier de démonstration avec le formateur", "Regarder des vidéos de formation", "Lire la documentation Pennylane"], reponse: "B" },
    { id: 'ms2', enonce: "Face à une objection client du type 'C'est trop compliqué', la bonne réponse est :", options: ["Abandonner", "Proposer une démonstration sur son cas d'usage réel pour montrer la simplicité", "Dire que l'objection est fausse", "Envoyer le manuel d'utilisation"], reponse: "B" },
    { id: 'ms3', enonce: "Pour se préparer aux objections clients sur Pennylane, il faut :", options: ["Mémoriser toutes les objections possibles", "Pratiquer des jeux de rôle et maîtriser les arguments de valeur clés", "Ignorer les objections", "Lire les avis négatifs en ligne"], reponse: "B" },
    { id: 'ms4', enonce: "Lors d'une mise en situation, l'accent est mis sur :", options: ["La vitesse d'exécution", "La posture, les arguments adaptés et la maîtrise des fonctionnalités clés", "La mémorisation de toutes les fonctionnalités", "La lecture du catalogue"], reponse: "B" },
    { id: 'ms5', enonce: "Le retour d'expérience après une mise en situation permet :", options: ["De noter les participants", "D'identifier les points forts et axes d'amélioration pour progresser", "De justifier le prix de la formation", "De générer un certificat automatiquement"], reponse: "B" },
  ],
}

const KEY_BANQUE = 'pls_banque_questions'
const KEY_REPONSES = 'pls_reponses_questionnaires'

// Retourne la banque pour un module (custom si définie, sinon standard)
export function getBanqueModule(moduleId) {
  const stored = JSON.parse(localStorage.getItem(KEY_BANQUE) || '{}')
  if (stored[moduleId]?.custom?.length >= 5) return stored[moduleId].custom
  return BANQUE_STANDARD[moduleId] || []
}

export function saveBanqueCustom(moduleId, questions) {
  const stored = JSON.parse(localStorage.getItem(KEY_BANQUE) || '{}')
  stored[moduleId] = { ...(stored[moduleId] || {}), custom: questions }
  localStorage.setItem(KEY_BANQUE, JSON.stringify(stored))
}

export function deleteBanqueCustom(moduleId) {
  const stored = JSON.parse(localStorage.getItem(KEY_BANQUE) || '{}')
  if (stored[moduleId]) delete stored[moduleId].custom
  localStorage.setItem(KEY_BANQUE, JSON.stringify(stored))
}

// Mélange aléatoire des 5 questions d'un module
function shuffle5(pool) {
  return [...pool].sort(() => Math.random() - 0.5)
}

// Génère un questionnaire (pré ou post) pour une session multi-modules
// Les 5 questions de chaque module sont posées, dans un ordre aléatoire différent à chaque passation
export function genererQuestionnaire(moduleIds) {
  const questions = []
  for (const moduleId of moduleIds) {
    const banque = getBanqueModule(moduleId)
    if (!banque.length) continue
    shuffle5(banque).forEach(q => questions.push({ ...q, moduleId }))
  }
  return questions
}

// ---- Réponses & résultats ----

export function getReponses() {
  return JSON.parse(localStorage.getItem(KEY_REPONSES) || '[]')
}

export function sauvegarderReponses({ sessionId, stagiaireId, type, questions, reponses }) {
  const all = getReponses()
  const score = calculerScore(questions, reponses)
  const entry = {
    id: `${sessionId}_${stagiaireId}_${type}_${uid()}`,
    sessionId, stagiaireId, type,
    date: new Date().toISOString(),
    questions, reponses, score,
  }
  const idx = all.findIndex(r => r.sessionId === sessionId && r.stagiaireId === stagiaireId && r.type === type)
  if (idx >= 0) all[idx] = entry; else all.push(entry)
  localStorage.setItem(KEY_REPONSES, JSON.stringify(all))
  return entry
}

export function getResultat(sessionId, stagiaireId, type) {
  return getReponses().find(r => r.sessionId === sessionId && r.stagiaireId === stagiaireId && r.type === type) || null
}

export function getResultatsSession(sessionId) {
  return getReponses().filter(r => r.sessionId === sessionId)
}

function calculerScore(questions, reponses) {
  let correct = 0
  for (const q of questions) {
    if (reponses[q.id] === q.reponse) correct++
  }
  return Math.round((correct / questions.length) * 100)
}

// Score de progression Qualiopi : acquis nets
export function calculerProgression(scorePre, scorePost) {
  if (scorePre === 100) return 100
  return Math.round(((scorePost - scorePre) / (100 - scorePre)) * 100)
}

export { BANQUE_STANDARD }
