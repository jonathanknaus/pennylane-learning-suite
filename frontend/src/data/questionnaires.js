// Banque : exactement 5 questions par module (pré et post posent les mêmes 5, ordre aléatoire différent)
// Une question : { id, enonce, options: [A,B,C,D], reponse: 'A'|'B'|'C'|'D' }

const BANQUE_STANDARD = {
  saisie_comptable: [
    { id: 'sc1', enonce: "Quelle fonctionnalité Pennylane permet de catégoriser automatiquement les transactions bancaires ?", options: ["Les règles de catégorisation automatique", "L'export comptable vers le logiciel de paie", "Le lettrage des comptes de tiers", "Le rapprochement bancaire ligne par ligne"], reponse: "A" },
    { id: 'sc2', enonce: "Comment importer des relevés bancaires dans Pennylane ?", options: ["En transmettant les relevés PDF par email", "Via le connecteur bancaire ou un import OFX/CSV", "Uniquement via l'API, sur demande au support technique", "En saisissant les lignes une par une"], reponse: "B" },
    { id: 'sc3', enonce: "Qu'est-ce que le lettrage dans Pennylane ?", options: ["L'envoi des relances aux clients en retard", "La mise en forme des factures avant envoi", "L'association d'une écriture à sa contrepartie", "La génération automatique des bulletins de paie"], reponse: "C" },
    { id: 'sc4', enonce: "Quelle est la durée de conservation légale des pièces comptables en France ?", options: ["30 ans", "3 ans", "5 ans", "10 ans"], reponse: "D" },
    { id: 'sc5', enonce: "Dans Pennylane, le flux documentaire permet de :", options: ["Centraliser les pièces justificatives reçues", "Gérer les congés et absences des collaborateurs", "Imprimer les bilans et comptes de résultat", "Envoyer les devis et les factures aux clients"], reponse: "A" },
  ],
  revision: [
    { id: 'rv1', enonce: "Quel outil Pennylane facilite le suivi des points de révision en cours de clôture ?", options: ["Le plan de trésorerie et ses projections", "La checklist de révision / dossier de travail", "Le module de déclaration de TVA", "Les alertes email paramétrées sur le dossier client"], reponse: "B" },
    { id: 'rv2', enonce: "Lors d'une révision, que permet le mode 'comparatif' dans Pennylane ?", options: ["Exporter la balance en double exemplaire", "Fusionner deux dossiers clients d'un même groupe", "Comparer les soldes de deux exercices", "Comparer les droits de deux utilisateurs"], reponse: "C" },
    { id: 'rv3', enonce: "Qu'est-ce qu'un FEC dans le cadre de la révision comptable ?", options: ["Un format d'import des factures fournisseurs", "Un rapport de trésorerie mensuel", "Un formulaire déclaratif d'embauche", "Le Fichier des Écritures Comptables"], reponse: "D" },
    { id: 'rv4', enonce: "Pennylane permet d'exporter le FEC :", options: ["En XML ou CSV conformes aux spécifications DGFiP", "Au format XLSX, après retraitement manuel", "Il ne génère pas de FEC, cela passe par un outil tiers", "Uniquement au format PDF non structuré"], reponse: "A" },
    { id: 'rv5', enonce: "À quelle étape réalise-t-on généralement les écritures d'inventaire ?", options: ["Au début de chaque mois civil", "Lors de la clôture d'exercice", "Lors de l'embarquement du client", "À chaque import de relevé bancaire"], reponse: "B" },
  ],
  tva: [
    { id: 'tv1', enonce: "Quel régime de TVA implique une déclaration mensuelle ou trimestrielle du CA réel ?", options: ["Franchise en base", "Régime réel simplifié (RSI)", "Régime réel normal (RN)", "Micro-entreprise"], reponse: "C" },
    { id: 'tv2', enonce: "Dans Pennylane, comment paramétrer le taux de TVA d'un produit/service ?", options: ["Dans l'onglet Banque du dossier concerné", "Par un import Excel, à renouveler à chaque changement", "Dans les paramètres de facturation", "Dans Paramètres > Plan comptable > Comptes de TVA"], reponse: "D" },
    { id: 'tv3', enonce: "La TVA déductible correspond à :", options: ["La TVA payée sur les achats, récupérable", "La TVA assise sur les salaires versés", "La TVA intracommunautaire encaissée sur les ventes", "La TVA collectée sur les ventes de la période"], reponse: "A" },
    { id: 'tv4', enonce: "Pennylane permet de télédéclarer la TVA via :", options: ["L'envoi postal du formulaire au SIE", "La connexion aux impôts.gouv.fr via EDI", "Un module de paie tiers connecté au dossier", "Une API réservée aux grandes entreprises"], reponse: "B" },
    { id: 'tv5', enonce: "Qu'est-ce que la TVA sur encaissement ?", options: ["TVA appliquée aux associations uniquement", "TVA exigible dès l'émission de la facture", "TVA exigible lors du paiement effectif", "TVA applicable aux seules importations"], reponse: "C" },
  ],
  parametrage: [
    { id: 'pa1', enonce: "Où configure-t-on les droits d'accès des collaborateurs dans Pennylane ?", options: ["Dans les paramètres de production comptable du dossier", "En passant par l'assistance Pennylane", "Dans chaque dossier client, un par un", "Dans Paramètres Cabinet > Utilisateurs & Rôles"], reponse: "D" },
    { id: 'pa2', enonce: "Quel est l'intérêt de connecter un outil tiers (ex. : Silae) à Pennylane ?", options: ["Éviter les doubles saisies entre les deux outils", "Déléguer les déclarations fiscales à l'outil tiers", "Archiver automatiquement les emails du dossier", "Remplacer le module comptable de Pennylane"], reponse: "A" },
    { id: 'pa3', enonce: "Dans Pennylane, un 'dossier client' correspond à :", options: ["Un contact enregistré dans le CRM", "Une entité juridique et sa comptabilité", "Un document PDF archivé dans la GED", "Un collaborateur du cabinet et ses accès"], reponse: "B" },
    { id: 'pa4', enonce: "Comment personnaliser le plan comptable d'un dossier dans Pennylane ?", options: ["En adressant une demande au support Pennylane", "Il n'est pas modifiable après création", "Via Paramètres du dossier > Plan comptable", "Depuis l'onglet Facturation du dossier"], reponse: "C" },
    { id: 'pa5', enonce: "Les alertes d'échéances fiscales dans Pennylane permettent de :", options: ["Calculer automatiquement les impôts dus", "Générer les factures d'honoraires", "Envoyer automatiquement les déclarations", "Notifier les dates limites de dépôt"], reponse: "D" },
  ],
  module_achat: [
    { id: 'ma1', enonce: "Dans Pennylane, le cycle d'achat commence par :", options: ["La réception d'une facture fournisseur", "Le paiement par carte bancaire", "L'export comptable des écritures", "L'émission d'une facture de vente au client"], reponse: "A" },
    { id: 'ma2', enonce: "Comment valider une facture fournisseur dans Pennylane ?", options: ["En l'imprimant et la signant manuellement", "Via le circuit de validation paramétré", "En envoyant un email de confirmation", "Depuis le module de paie du cabinet"], reponse: "B" },
    { id: 'ma3', enonce: "Le rapprochement commande/facture dans Pennylane permet de :", options: ["Archiver les fiches fournisseurs inactives", "Comparer les prix pratiqués par les fournisseurs", "Vérifier la facture face à la commande validée", "Générer les relevés bancaires du mois"], reponse: "C" },
    { id: 'ma4', enonce: "Quel format est recommandé pour l'import de factures fournisseurs dans Pennylane ?", options: ["Un tableur XLS détaillant les lignes", "Une photo JPEG de la facture papier", "Un document Word converti en PDF", "Un PDF ou une facture Factur-X"], reponse: "D" },
    { id: 'ma5', enonce: "Dans Pennylane, comment programmer un paiement fournisseur ?", options: ["Depuis le module Paiements, avec une échéance", "Par un export CSV transmis à la banque", "Depuis le module de paie du cabinet", "Via virement manuel hors Pennylane uniquement"], reponse: "A" },
  ],
  notes_de_frais: [
    { id: 'nf1', enonce: "Dans Pennylane, qui peut soumettre une note de frais ?", options: ["Uniquement le directeur financier", "Tout utilisateur ayant le rôle Employé", "Uniquement les managers habilités du service", "Uniquement via l'application mobile"], reponse: "B" },
    { id: 'nf2', enonce: "Le barème kilométrique dans Pennylane est :", options: ["Non disponible dans Pennylane à ce jour", "Fixé librement par chaque entreprise", "Basé sur le barème fiscal officiel", "Calculé automatiquement par GPS"], reponse: "C" },
    { id: 'nf3', enonce: "Comment justifier une dépense dans une note de frais Pennylane ?", options: ["En adressant un email au comptable", "Aucun justificatif n'est requis", "Par une simple déclaration sur l'honneur signée", "En joignant une photo ou un PDF du ticket"], reponse: "D" },
    { id: 'nf4', enonce: "Quel est l'avantage de la capture OCR dans le module notes de frais ?", options: ["Pré-remplir le montant, la date et le fournisseur", "Transmettre les frais directement à la banque du salarié", "Archiver les justificatifs au format ZIP", "Générer des rapports PDF mensuels"], reponse: "A" },
    { id: 'nf5', enonce: "Une note de frais validée dans Pennylane génère automatiquement :", options: ["Une facture adressée au client", "Une écriture dans le journal des achats", "Un bulletin de paie du mois", "Un virement bancaire immédiat au salarié"], reponse: "B" },
  ],
  demandes_achats: [
    { id: 'da1', enonce: "Une demande d'achat dans Pennylane permet de :", options: ["Archiver un contrat fournisseur et ses annexes", "Créer une facture de vente client", "Initier une dépense soumise à validation", "Générer un bulletin de paie"], reponse: "C" },
    { id: 'da2', enonce: "Comment tracer le lien entre une demande d'achat et sa facture dans Pennylane ?", options: ["Via un tableau Excel tenu à part", "Ce lien n'est pas possible dans l'outil", "Par une annotation manuelle dans le PDF", "En rattachant la facture à la demande"], reponse: "D" },
    { id: 'da3', enonce: "Le statut 'approuvé' d'une demande d'achat signifie :", options: ["La demande a été validée par l'approbateur", "La commande a été livrée au cabinet", "Le budget de la période est épuisé", "La facture correspondante a déjà été payée"], reponse: "A" },
    { id: 'da4', enonce: "Peut-on attacher un budget prévisionnel à une demande d'achat dans Pennylane ?", options: ["Non, ce n'est pas possible dans l'outil", "Oui, via les catégories analytiques", "Uniquement avec un module externe payant", "Uniquement sur un tableur à côté"], reponse: "B" },
    { id: 'da5', enonce: "Qui reçoit la notification lors d'une nouvelle demande d'achat ?", options: ["Personne, la relance est manuelle", "Le fournisseur concerné", "L'approbateur défini dans le circuit", "L'ensemble des utilisateurs du dossier"], reponse: "C" },
  ],
  circuit_validation: [
    { id: 'cv1', enonce: "Un circuit de validation dans Pennylane est :", options: ["Un formulaire de signature électronique des pièces", "Un export comptable vers la banque", "Un processus d'embarquement du client", "Une séquence d'approbations paramétrables"], reponse: "D" },
    { id: 'cv2', enonce: "On peut déclencher un circuit de validation en fonction de :", options: ["Le montant, le type ou la catégorie", "L'heure de saisie de la demande", "La taille du justificatif joint et son format", "Le jour de la semaine retenu"], reponse: "A" },
    { id: 'cv3', enonce: "Le circuit de validation protège contre la fraude en :", options: ["Chiffrant toutes les factures reçues", "Imposant une validation avant paiement", "Bloquant tout nouveau fournisseur créé", "Envoyant une alerte à la banque du cabinet"], reponse: "B" },
    { id: 'cv4', enonce: "Combien de niveaux d'approbation peut-on paramétrer dans Pennylane ?", options: ["Un seul niveau, non modifiable", "Deux niveaux au maximum", "Plusieurs niveaux séquentiels", "Un nombre illimité, mais non ordonnés"], reponse: "C" },
    { id: 'cv5', enonce: "Si un approbateur est absent, que se passe-t-il dans Pennylane ?", options: ["La demande est automatiquement rejetée", "La demande passe au niveau suivant sans validation", "Le paiement reste bloqué définitivement", "Un approbateur de substitution peut être défini"], reponse: "D" },
  ],
  reforme_rfe: [
    { id: 'rfe1', enonce: "Qu'est-ce que l'e-invoicing dans le cadre de la RFE ?", options: ["L'échange de factures via une plateforme immatriculée", "La simple dématérialisation des factures au format PDF", "La signature électronique des factures papier", "L'envoi des factures par email au client"], reponse: "A" },
    { id: 'rfe2', enonce: "L'e-reporting concerne :", options: ["Uniquement les grandes entreprises", "La transmission des données de transaction", "Le reporting social et RH du cabinet", "Les seules déclarations de TVA périodiques"], reponse: "B" },
    { id: 'rfe3', enonce: "Le PPF (Portail Public de Facturation) est :", options: ["Un format de fichier normalisé", "Une plateforme privée payante réservée aux PDP", "La plateforme publique d'échange de factures", "Un logiciel de comptabilité agréé"], reponse: "C" },
    { id: 'rfe4', enonce: "Quel format de facture électronique est nativement supporté par Pennylane pour la RFE ?", options: ["Un tableur XLS normalisé", "Un fichier CSV listant les lignes de facture", "Un document DOCX converti", "Factur-X (PDF/A-3 avec XML embarqué)"], reponse: "D" },
    { id: 'rfe5', enonce: "La RFE s'applique progressivement à partir de :", options: ["2026 pour les grandes entreprises, puis par paliers", "2030, pour toutes les entreprises", "Elle est déjà obligatoire depuis 2020 partout", "2024 pour toutes les entreprises simultanément, sans palier"], reponse: "A" },
  ],
  methode_facturation: [
    { id: 'mf1', enonce: "Dans Pennylane, une facture d'acompte est :", options: ["Une facture finale qui solde la commande", "Une facture émise avant la prestation", "Une facture d'avoir sur une vente", "Un devis transformé en facture"], reponse: "B" },
    { id: 'mf2', enonce: "Les abonnements récurrents dans Pennylane permettent de :", options: ["Archiver les anciens devis du dossier", "Envoyer des relances automatiques aux clients", "Générer des factures à intervalles réguliers", "Calculer la TVA sur l'année entière"], reponse: "C" },
    { id: 'mf3', enonce: "Une facture de situation est utilisée :", options: ["Pour les opérations d'importation", "Pour les associations non assujetties", "Pour les ventes réalisées en magasin physique", "Pour les marchés facturés par avancement"], reponse: "D" },
    { id: 'mf4', enonce: "Comment transformer un devis en facture dans Pennylane ?", options: ["Via le bouton Convertir en facture", "En créant manuellement une nouvelle facture", "Ce n'est pas possible dans Pennylane", "En le réimprimant avec un nouveau numéro"], reponse: "A" },
    { id: 'mf5', enonce: "La numérotation des factures dans Pennylane est :", options: ["Libre et non séquentielle", "Séquentielle et automatique", "Alphabétique, selon le client", "Gérée directement par le client"], reponse: "B" },
  ],
  relancer_clients: [
    { id: 'rc1', enonce: "Dans Pennylane, les relances automatiques se déclenchent selon :", options: ["La taille de l'entreprise cliente et son secteur", "Le délai choisi par le comptable", "Des règles basées sur l'ancienneté de la créance", "L'envoi manuel, au cas par cas"], reponse: "C" },
    { id: 'rc2', enonce: "Combien de niveaux de relance peut-on paramétrer dans Pennylane ?", options: ["Un nombre illimité, sans ordre défini", "Un seul niveau de relance", "Deux niveaux au maximum", "Plusieurs niveaux progressifs"], reponse: "D" },
    { id: 'rc3', enonce: "Le suivi du taux de recouvrement dans Pennylane permet :", options: ["De mesurer l'efficacité des relances", "De générer les fiches de paie du mois", "D'envoyer des SMS aux clients en retard", "De calculer les impôts dus sur la période"], reponse: "A" },
    { id: 'rc4', enonce: "Peut-on personnaliser le texte d'un email de relance dans Pennylane ?", options: ["Non, les modèles fournis sont figés", "Oui, via les modèles d'email des paramètres", "Uniquement en passant par le support Pennylane", "Uniquement pour les clients étrangers"], reponse: "B" },
    { id: 'rc5', enonce: "Le DSO (Days Sales Outstanding) mesure :", options: ["Le taux de TVA moyen constaté", "Le nombre de factures émises par mois", "Le délai moyen de paiement", "Le chiffre d'affaires mensuel moyen"], reponse: "C" },
  ],
  integration_gestion_commerciale: [
    { id: 'igc1', enonce: "Quelle intégration Pennylane permet de synchroniser automatiquement les contacts CRM ?", options: ["L'export manuel au format CSV", "L'API interne, sur demande au support", "Il n'existe pas d'intégration CRM", "L'intégration Salesforce ou HubSpot"], reponse: "D" },
    { id: 'igc2', enonce: "L'intégration Pennylane x Stripe permet de :", options: ["Synchroniser les paiements en ligne reçus", "Importer des factures PDF en masse", "Calculer la TVA intracommunautaire due", "Gérer la paie des salariés du cabinet"], reponse: "A" },
    { id: 'igc3', enonce: "L'API Pennylane est utile pour :", options: ["Remplacer le travail du comptable", "Connecter des outils métier sur-mesure", "Générer les bulletins de paie du mois", "Imprimer les documents du dossier"], reponse: "B" },
    { id: 'igc4', enonce: "Un webhook Pennylane déclenche :", options: ["Un export FEC vers l'administration", "Une impression automatique des pièces", "Une notification vers un système tiers", "Un email de relance au client final"], reponse: "C" },
    { id: 'igc5', enonce: "Quel avantage client met-on en avant avec les intégrations Pennylane ?", options: ["La suppression du bilan annuel obligatoire", "La gestion des congés des collaborateurs", "La réduction des frais bancaires du cabinet", "Le gain de temps sur les doubles saisies"], reponse: "D" },
  ],
  famille_analytique: [
    { id: 'fa1', enonce: "Les axes analytiques dans Pennylane permettent de :", options: ["Ventiler les opérations par dimension de gestion", "Générer les déclarations fiscales de l'exercice", "Gérer les absences des collaborateurs", "Remplacer le plan comptable du dossier"], reponse: "A" },
    { id: 'fa2', enonce: "Peut-on affecter plusieurs axes analytiques à une même écriture dans Pennylane ?", options: ["Non, un seul axe par écriture", "Oui, plusieurs axes se combinent", "Uniquement pour les achats", "Uniquement dans la version premium"], reponse: "B" },
    { id: 'fa3', enonce: "Un budget analytique dans Pennylane est comparé :", options: ["Au bilan de l'exercice précédent", "Uniquement aux factures clients émises", "Aux écritures réelles ventilées sur l'axe", "Au seul Fichier des Écritures Comptables"], reponse: "C" },
    { id: 'fa4', enonce: "Les rapports analytiques dans Pennylane sont accessibles :", options: ["Via un export Excel, et lui seul", "Après validation par le comptable", "Uniquement en fin d'exercice comptable", "En temps réel depuis le tableau de bord"], reponse: "D" },
    { id: 'fa5', enonce: "À quoi sert un centre de profit dans l'analytique Pennylane ?", options: ["À isoler la performance d'une activité", "À calculer la TVA de la période", "À gérer les remboursements de frais", "À regrouper les charges sociales du mois"], reponse: "A" },
  ],
  plans_tresorerie: [
    { id: 'pt1', enonce: "Un plan de trésorerie dans Pennylane projette :", options: ["Le bilan annuel du dossier client", "Les encaissements et décaissements futurs", "Le résultat fiscal de l'exercice", "Les amortissements des immobilisations"], reponse: "B" },
    { id: 'pt2', enonce: "Pennylane alimente le plan de trésorerie à partir de :", options: ["Des données transmises par la DGFiP", "Des seules données saisies à la main par le comptable", "Factures en attente, abonnements et banque", "Des données Excel importées à part"], reponse: "C" },
    { id: 'pt3', enonce: "Un solde de trésorerie négatif projeté dans Pennylane doit alerter sur :", options: ["Une erreur de saisie à corriger", "Un problème de déclaration de TVA", "Un excès de chiffre d'affaires facturé", "Un risque de rupture de trésorerie"], reponse: "D" },
    { id: 'pt4', enonce: "Peut-on simuler des scénarios dans le plan de trésorerie Pennylane ?", options: ["Non, il est uniquement descriptif", "Oui, en ajoutant des flux prévisionnels", "Uniquement avec le module analytique activé", "Uniquement en version entreprise"], reponse: "A" },
    { id: 'pt5', enonce: "Le plan de trésorerie est un outil de pilotage utile pour :", options: ["Calculer les charges sociales dues", "Anticiper les besoins de financement", "Remplacer le grand livre du dossier", "Calculer les amortissements de l'année"], reponse: "B" },
  ],
  outils_analyse: [
    { id: 'oa1', enonce: "Le tableau de bord Pennylane affiche par défaut :", options: ["La liste complète des fournisseurs", "Le détail des bulletins de paie émis", "Les indicateurs clés de l'activité", "Le journal des achats du mois"], reponse: "C" },
    { id: 'oa2', enonce: "Le compte de résultat dans Pennylane est accessible :", options: ["Via un export PDF, et lui seul", "Depuis le module de paie du cabinet", "Uniquement à la clôture de l'exercice", "En temps réel depuis l'onglet Reporting"], reponse: "D" },
    { id: 'oa3', enonce: "La balance âgée clients dans Pennylane montre :", options: ["Les créances clients classées par retard", "Le solde de TVA restant à payer", "Le détail des immobilisations du dossier", "L'historique des achats fournisseurs"], reponse: "A" },
    { id: 'oa4', enonce: "Dans Pennylane, comparer N vs N-1 est possible :", options: ["Uniquement après deux exercices complets", "Via le mode comparatif des états financiers", "Via un export Excel retravaillé à la main", "Ce n'est pas possible dans l'outil"], reponse: "B" },
    { id: 'oa5', enonce: "Quel outil Pennylane présente la ventilation des charges par catégorie ?", options: ["Le plan de trésorerie prévisionnel du dossier", "Le journal des ventes de la période", "L'analyse des charges du tableau de bord", "La balance fournisseurs détaillée"], reponse: "C" },
  ],
  posture: [
    { id: 'po1', enonce: "Quelle posture adopter face à un client réticent à Pennylane ?", options: ["Lui imposer la migration sans délai", "Ignorer ses objections pour avancer", "Insister lourdement sur les fonctionnalités techniques", "Écouter ses freins et proposer une démonstration"], reponse: "D" },
    { id: 'po2', enonce: "Le bon timing pour présenter une fonctionnalité Pennylane à un client est :", options: ["Quand le client exprime un problème qu'elle résout", "Uniquement pendant l'embarquement initial du client", "Jamais, le client doit la découvrir seul", "À tout moment, sans préparation"], reponse: "A" },
    { id: 'po3', enonce: "Pour maximiser l'adoption de Pennylane chez un client, il faut :", options: ["Lui envoyer le manuel complet de l'outil", "L'accompagner sur ses cas d'usage réels", "Lui facturer une formation complète", "Attendre qu'il pose ses questions"], reponse: "B" },
    { id: 'po4', enonce: "Face à l'objection 'Pennylane est trop cher', la meilleure réponse est :", options: ["Admettre que le tarif est élevé", "Proposer immédiatement une remise commerciale ferme", "Chiffrer le gain de temps et la fiabilité obtenue", "Changer de sujet pour éviter le blocage"], reponse: "C" },
    { id: 'po5', enonce: "Lors d'un rendez-vous client, quelle est la première étape avant de parler de Pennylane ?", options: ["Envoyer d'abord une proposition commerciale", "Présenter la grille tarifaire", "Démontrer toutes les fonctionnalités de l'outil", "Comprendre ses enjeux et ses problématiques"], reponse: "D" },
  ],
  presentation_partenaire: [
    { id: 'pp1', enonce: "Le partenariat Pennylane x Swan porte sur :", options: ["Un compte bancaire professionnel intégré", "Un outil de facturation complémentaire au dossier", "Une place de marché de fournisseurs", "Un service de paie intégré au dossier"], reponse: "A" },
    { id: 'pp2', enonce: "Dans son partenariat avec Pennylane, Swan est :", options: ["Une banque de réseau traditionnelle", "Un établissement de paiement agréé", "Un assureur spécialisé", "Un prestataire de paie en ligne"], reponse: "B" },
    { id: 'pp3', enonce: "L'intégration Swan dans Pennylane élimine :", options: ["Le besoin de recourir à un comptable", "La déclaration de TVA du dossier", "La double saisie banque / comptabilité", "Les déclarations fiscales annuelles"], reponse: "C" },
    { id: 'pp4', enonce: "Quel avantage principal le Compte Pro Swan offre au client ?", options: ["Une assurance décès incluse", "Une carte de crédit renouvelable", "Des taux d'épargne nettement plus élevés qu'ailleurs", "Un compte pro avec réconciliation automatique"], reponse: "D" },
    { id: 'pp5', enonce: "Comment ouvrir un Compte Pro Swan pour un client depuis Pennylane ?", options: ["Depuis l'interface Pennylane du dossier client", "En passant par une agence bancaire", "Via une API externe à développer", "Via un formulaire papier adressé par La Poste"], reponse: "A" },
  ],
  gestion_compte_pro: [
    { id: 'gcp1', enonce: "Dans Pennylane, comment effectuer un virement depuis le Compte Pro ?", options: ["Via l'application Swan séparée uniquement", "Depuis l'onglet Banque du dossier", "Par téléphone auprès du conseiller", "Par un export SEPA manuel"], reponse: "B" },
    { id: 'gcp2', enonce: "Les cartes bancaires du Compte Pro Swan sont :", options: ["Non disponibles en France à ce jour", "Uniquement physiques, et en métal", "Virtuelles ou physiques, à plafonds réglables", "Uniquement pour les dirigeants de l'entreprise"], reponse: "C" },
    { id: 'gcp3', enonce: "La réconciliation automatique des paiements Swan dans Pennylane signifie :", options: ["Les paiements sont exportés vers Excel", "Rien, c'est un terme commercial", "Un comptable valide chaque transaction reçue", "Chaque opération est rapprochée de sa facture"], reponse: "D" },
    { id: 'gcp4', enonce: "Le suivi des encaissements clients via le Compte Pro permet :", options: ["De voir les paiements reçus et les rattacher", "De calculer les congés payés dus", "De générer les bulletins de paie des salariés", "De supprimer toute relance client"], reponse: "A" },
    { id: 'gcp5', enonce: "La conformité KYC (Know Your Customer) pour le Compte Pro est gérée :", options: ["Par le cabinet comptable manuellement", "Par Swan, à l'ouverture du compte", "Par Pennylane via un formulaire papier", "Elle n'est pas requise en France"], reponse: "B" },
  ],
  solutions_paiement: [
    { id: 'sp1', enonce: "Le prélèvement SEPA dans Pennylane permet :", options: ["D'envoyer des relances automatiques", "De payer ses fournisseurs automatiquement chaque mois", "De prélever les clients ayant signé un mandat", "De demander le remboursement de TVA"], reponse: "C" },
    { id: 'sp2', enonce: "Un TPE (Terminal de Paiement Électronique) intégré à Pennylane :", options: ["Ne fonctionne que pour la vente en ligne", "N'est pas disponible en France à ce jour", "Remplace la comptabilité du dossier", "Permet d'encaisser les paiements carte"], reponse: "D" },
    { id: 'sp3', enonce: "L'affacturage (financement de factures) dans Pennylane permet :", options: ["D'obtenir une avance sur créances clients", "De générer des factures automatiquement", "De calculer les amortissements de l'actif", "De supprimer les factures clients impayées"], reponse: "A" },
    { id: 'sp4', enonce: "Le pay-by-link dans Pennylane permet :", options: ["De payer ses impôts directement en ligne", "D'envoyer un lien de paiement au client", "De générer des QR codes d'accès au dossier", "De connecter un terminal de paiement bancaire"], reponse: "B" },
    { id: 'sp5', enonce: "La méthode d'encaissement la plus adaptée pour un commerce en boutique est :", options: ["Le virement bancaire international", "Le prélèvement SEPA mensuel", "Le TPE avec intégration Pennylane", "Le chèque remis en banque"], reponse: "C" },
  ],
  mettre_en_avant_compte_pro: [
    { id: 'mecp1', enonce: "Le principal argument pour proposer le Compte Pro Swan à un client est :", options: ["Les frais moins élevés que toutes les banques", "La carte bancaire en métal fournie", "Son taux d'intérêt particulièrement élevé", "La suppression de la double saisie"], reponse: "D" },
    { id: 'mecp2', enonce: "Le bon moment pour parler du Compte Pro à un client est :", options: ["Lors d'un point sur ses difficultés de trésorerie", "Uniquement lors de la signature du contrat de mission", "Uniquement par email, sans échange", "Jamais, la démarche est intrusive"], reponse: "A" },
    { id: 'mecp3', enonce: "Face à un client qui dit 'j'ai déjà une banque', la réponse est :", options: ["Insister lourdement malgré son refus", "Montrer la complémentarité des deux", "Abandonner le sujet définitivement", "Lui envoyer une brochure commerciale"], reponse: "B" },
    { id: 'mecp4', enonce: "La valeur du Compte Pro pour le cabinet comptable est :", options: ["Un accès gratuit à l'outil Pennylane", "Une commission sur les frais bancaires", "Une meilleure fluidité des données", "Une réduction des honoraires facturés"], reponse: "C" },
    { id: 'mecp5', enonce: "L'argument 'sans frais supplémentaires' pour le Compte Pro signifie :", options: ["Le cabinet ne facture plus aucune mission au client", "Toutes les transactions sont sans frais", "Swan est totalement gratuit à vie", "L'ouverture et l'usage courant sont inclus"], reponse: "D" },
  ],
  webinaire_embarquement: [
    { id: 'we1', enonce: "L'objectif principal d'un webinaire d'embarquement client est :", options: ["Rendre le client autonome sur l'essentiel", "Vendre des modules complémentaires payants", "Présenter le bilan annuel du client", "Former le comptable du cabinet à l'outil"], reponse: "A" },
    { id: 'we2', enonce: "La durée recommandée d'un webinaire d'embarquement collectif est :", options: ["15 minutes, en format court", "45 à 90 minutes selon le plan", "3 heures, en une seule séance", "Une journée entière de formation"], reponse: "B" },
    { id: 'we3', enonce: "Lors d'un webinaire d'embarquement, quelle fonctionnalité présenter en priorité ?", options: ["Les paramètres avancés du plan comptable", "Les fonctionnalités avancées d'analytique", "Les fonctionnalités du quotidien", "Le module de paie du cabinet"], reponse: "C" },
    { id: 'we4', enonce: "Pour maximiser la participation au webinaire, il faut :", options: ["Ne pas envoyer d'invitation, ils viendront d'eux-mêmes", "Imposer la présence par le contrat", "Envoyer l'invitation 5 minutes avant", "Planifier 1 à 2 semaines à l'avance"], reponse: "D" },
    { id: 'we5', enonce: "Après le webinaire d'embarquement, quelle action est recommandée ?", options: ["Envoyer un récapitulatif et un suivi", "Facturer immédiatement la prestation", "Clôturer le dossier sans suite", "Ne rien faire, le client est formé"], reponse: "A" },
  ],
  construction_strategie: [
    { id: 'cs1', enonce: "Un workshop 'Construction de stratégie' avec Pennylane vise :", options: ["Former les équipes à la saisie comptable", "Co-construire un plan d'adoption", "Vendre des licences supplémentaires payantes", "Former les clients finaux du cabinet"], reponse: "B" },
    { id: 'cs2', enonce: "L'identification des 'freins' lors d'un workshop stratégique permet :", options: ["De reporter la migration à plus tard", "De prolonger utilement la réunion", "D'adapter le plan d'adoption", "De justifier une hausse des tarifs"], reponse: "C" },
    { id: 'cs3', enonce: "Une 'feuille de route' produite lors du workshop contient :", options: ["La liste des fonctionnalités de Pennylane", "Le bilan comptable du cabinet", "Uniquement la grille tarifaire", "Les étapes, responsables et délais"], reponse: "D" },
    { id: 'cs4', enonce: "La segmentation des clients dans la stratégie Pennylane permet :", options: ["De prioriser les clients à fort potentiel", "De réduire les services proposés au client", "D'écarter les plus petits clients", "De facturer davantage le client"], reponse: "A" },
    { id: 'cs5', enonce: "Le KPI principal pour mesurer le succès d'une stratégie Pennylane est :", options: ["Le nombre de modules achetés par le client", "Le taux d'adoption actif par les clients", "Le nombre de formations suivies par an", "Le chiffre d'affaires global du cabinet"], reponse: "B" },
  ],
  mise_en_situation: [
    { id: 'ms1', enonce: "La mise en situation dans la formation AFS permet de :", options: ["Lire la documentation officielle Pennylane", "Tester le logiciel en lecture seule uniquement", "Pratiquer des scénarios sur un dossier de démo", "Regarder des vidéos de formation en ligne"], reponse: "C" },
    { id: 'ms2', enonce: "Face à une objection client du type 'C'est trop compliqué', la bonne réponse est :", options: ["Dire que son objection est infondée", "Envoyer le manuel d'utilisation de l'outil", "Abandonner la discussion", "Proposer une démonstration sur son cas réel"], reponse: "D" },
    { id: 'ms3', enonce: "Pour se préparer aux objections clients sur Pennylane, il faut :", options: ["Pratiquer les jeux de rôle et les arguments", "Ignorer les objections exprimées", "Lire les avis négatifs publiés en ligne", "Mémoriser toutes les objections possibles"], reponse: "A" },
    { id: 'ms4', enonce: "Lors d'une mise en situation, l'accent est mis sur :", options: ["La vitesse d'exécution des tâches", "La posture et les arguments adaptés", "La mémorisation de toutes les fonctionnalités", "La lecture du catalogue de formation"], reponse: "B" },
    { id: 'ms5', enonce: "Le retour d'expérience après une mise en situation permet :", options: ["De générer un certificat automatiquement", "De noter et classer les participants", "D'identifier les axes de progrès", "De justifier le prix de la formation"], reponse: "C" },
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

// Mélange uniforme (Fisher-Yates). `sort(() => Math.random() - 0.5)` ne produit
// PAS une permutation équiprobable : sur 4 options, certaines positions
// resteraient nettement plus probables que d'autres, et on remplacerait un biais
// par un autre.
function melangeUniforme(tableau) {
  const t = [...tableau]
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[t[i], t[j]] = [t[j], t[i]]
  }
  return t
}

/**
 * Permute les options d'une question en suivant la bonne réponse.
 *
 * Pourquoi c'est nécessaire : la bonne réponse était « B » dans 92 % des 115
 * questions de la banque, et les options sont affichées dans un ordre FIXE
 * (A, B, C, D). Cocher systématiquement « B » donnait donc 92 % sans rien
 * connaître. Comme les scores pré/post servent de preuve Qualiopi, un test
 * devinable ne prouve rien.
 *
 * La question permutée est stockée AVEC la passation (`sauvegarderReponses`), et
 * `calculerScore` compare à la réponse de cette copie : le score reste juste et
 * les passations déjà enregistrées ne sont pas affectées.
 *
 * ⚠️ Cela ne corrige PAS l'autre biais : la bonne réponse est la plus longue
 * dans 97 % des cas existants. Celui-là demande de réécrire les distracteurs.
 */
export function melangerOptions(q) {
  const i = 'ABCD'.indexOf(q?.reponse)
  if (i < 0 || !Array.isArray(q.options) || q.options.length < 2) return q
  const bonne = q.options[i]
  const options = melangeUniforme(q.options)
  const position = options.indexOf(bonne)
  if (position < 0) return q
  return { ...q, options, reponse: 'ABCD'[position] }
}

// Génère un questionnaire (pré ou post) pour une session multi-modules — les
// questions de chaque module sélectionné sont combinées. Au post-test, les
// questions déjà posées au pré-test (excludeIds) sont écartées si la banque du
// module en contient suffisamment d'autres, pour ne pas reposer les mêmes items.
export function genererQuestionnaire(moduleIds, type, excludeIds = []) {
  const questions = []
  for (const moduleId of moduleIds) {
    const banque = getBanqueModule(moduleId)
    if (!banque.length) continue
    const pool = type === 'post'
      ? banque.filter(q => !excludeIds.includes(q.id))
      : banque
    const source = pool.length > 0 ? pool : banque
    shuffle5(source).forEach(q => questions.push({ ...melangerOptions(q), moduleId }))
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
    id: `${sessionId}_${stagiaireId}_${type}_${Date.now()}`,
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
