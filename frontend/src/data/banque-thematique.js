// Banque de questions par THÈME, destinée aux 43 modules importés de SmartOF,
// qui n'en avaient aucune (les 23 modules PLS ont les leurs dans questionnaires.js).
//
// Pourquoi par thème et non par module
// ────────────────────────────────────
// Les 43 modules SmartOF sont des produits commerciaux, pas des contenus
// distincts : « LA TVA de PENNYLANE » existe en trois versions de durées
// différentes, « L'Analytique chez PENNYLANE » en trois aussi. Écrire 5 questions
// par module donnerait des jeux différents pour des contenus identiques, une
// correction à reporter n fois, et rien du tout pour un module ajouté demain.
//
// Les questions sont donc écrites une fois par domaine fonctionnel, puis chaque
// module reçoit les siennes selon les thèmes que SON programme couvre.
//
// Règles de rédaction (validées avec Jonathan le 2026-10-06)
// ─────────────────────────────────────────────────────────
//  1. Chaque réponse se déduit du contenu RÉELLEMENT couvert en séance. Les
//     énoncés sont tirés des programmes SmartOF, écrits par l'équipe AFS — on ne
//     suppose aucune fonctionnalité Pennylane qui n'y figure pas.
//  2. Pas de piège : les distracteurs sont plausibles, jamais retors. Le post-test
//     doit être réussi par un participant attentif ; le pré-test mesure l'acquis
//     de départ.
//  3. ⚠️ OPTIONS DE LONGUEUR COMPARABLE. Dans la banque historique, la bonne
//     réponse est la plus longue dans 97 % des cas : il suffisait de choisir
//     l'option la plus bavarde. Un écart de longueur est une fuite de réponse.
//  4. Les distracteurs restent dans le même registre que la bonne réponse. Une
//     option manifestement hors sujet ne fait pas réfléchir, elle s'élimine.
//  5. La bonne réponse est RÉPARTIE sur A, B, C, D dans la source. Les options
//     sont déjà permutées à chaque passation (`melangerOptions`), donc la position
//     écrite ici n'a aucun effet à l'écran — mais si ce mélange venait à sauter,
//     une source entièrement alignée sur « A » ramènerait un biais à 100 %. C'est
//     exactement ce qui est arrivé à la banque historique, concentrée sur « B ».
//
// Format identique à la banque historique, pour que tout le reste fonctionne sans
// changement : { id, enonce, options: [A, B, C, D], reponse: 'A'|'B'|'C'|'D' }.

export const THEMES = [
  {
    id: 'tva',
    label: 'TVA et déclarations fiscales',
    // Mots-clés cherchés dans le titre, les objectifs et le programme d'un module
    // pour savoir si ce thème le concerne.
    motsCles: ['tva', 'ca3', 'ca12', 'télédéclar', 'teledeclar', 'cadrage', 'guichet unique', 'encaissement', 'crédit de tva', 'das2'],
    questions: [
      {
        id: 'tva_cadrage',
        enonce: "Dans Pennylane, à quoi sert l'outil de cadrage de la TVA ?",
        options: [
          "À rapprocher le grand livre et la déclaration de TVA",
          "À régler la déclaration de TVA auprès du guichet unique",
          "À saisir les factures d'achat non encore enregistrées",
          "À modifier les taux de TVA appliqués au plan comptable",
        ],
        reponse: 'A',
      },
      {
        id: 'tva_prerequis',
        enonce: "Que faut-il vérifier avant d'établir la première déclaration de TVA d'un dossier ?",
        options: [
          "La date d'envoi de la précédente liasse fiscale",
          "Le paramétrage TVA du dossier et son plan comptable",
          "Le montant du dernier crédit de TVA obtenu",
          "Le nombre de collaborateurs ayant accès au dossier client",
        ],
        reponse: 'B',
      },
      {
        id: 'tva_encaissement',
        enonce: "La TVA sur encaissements se distingue de la TVA sur débits en ce qu'elle :",
        options: [
          "dispense le dossier de toute déclaration mensuelle",
          "se déclare une fois par an sur un formulaire CA12",
          "devient exigible au paiement effectif de la facture",
          "s'applique uniquement aux livraisons de biens neufs",
        ],
        reponse: 'C',
      },
      {
        id: 'tva_formulaire',
        enonce: "Quel formulaire correspond à une déclaration de TVA au régime réel normal ?",
        options: [
          "La CA12, déposée une fois par exercice comptable",
          "La DAS2, déposée au titre des honoraires versés",
          "La liasse fiscale, déposée à la clôture de l'exercice",
          "La CA3, déposée mensuellement ou trimestriellement",
        ],
        reponse: 'D',
      },
      {
        id: 'tva_credit',
        enonce: "Un crédit de TVA apparaît lorsque, sur la période déclarée :",
        options: [
          "la TVA déductible dépasse la TVA collectée",
          "la TVA collectée dépasse la TVA déductible",
          "le dossier n'a enregistré aucune opération",
          "la déclaration a été déposée après l'échéance",
        ],
        reponse: 'A',
      },
      {
        id: 'tva_tags',
        enonce: "À quoi servent les tags de TVA dans Pennylane ?",
        options: [
          "À suivre les relances des factures clients impayées",
          "À qualifier les opérations en vue des déclarations",
          "À classer les pièces justificatives dans la GED",
          "À repérer les clients concernés par la réforme RFE",
        ],
        reponse: 'B',
      },
      {
        id: 'tva_od',
        enonce: "L'OD de TVA générée dans Pennylane a pour objet :",
        options: [
          "de transmettre la déclaration à l'administration fiscale",
          "de rapprocher les transactions bancaires du mois",
          "de solder les comptes de TVA vers le compte à payer",
          "de corriger le plan comptable du dossier client",
        ],
        reponse: 'C',
      },
      {
        id: 'tva_apres_ca3',
        enonce: "Après la génération de la CA3 dans Pennylane, l'étape suivante consiste à :",
        options: [
          "clôturer définitivement l'exercice comptable en cours",
          "éditer la liasse fiscale et le dossier de travail",
          "relancer les clients dont les factures sont impayées",
          "télédéclarer puis suivre le paiement de la TVA due",
        ],
        reponse: 'D',
      },
      {
        id: 'tva_reprise',
        enonce: "Lors de la migration d'un dossier, le module de reprise de TVA permet de :",
        options: [
          "reprendre les montants de TVA antérieurs à la bascule",
          "recalculer les taux applicables aux produits vendus",
          "importer les immobilisations et les emprunts en cours",
          "générer les lettres de mission des nouveaux clients",
        ],
        reponse: 'A',
      },
      {
        id: 'tva_controle_envoi',
        enonce: "Avant d'envoyer la CA3, le point de contrôle essentiel consiste à :",
        options: [
          "valider les notes de frais du mois pour les intégrer",
          "vérifier la cohérence entre grand livre et déclaration",
          "confirmer le mandat SEPA du client auprès de sa banque",
          "archiver les justificatifs dans le dossier de révision",
        ],
        reponse: 'B',
      },
    ],
  },
  {
    id: 'analytique',
    label: 'Analytique et pilotage',
    motsCles: ['analytique', 'centre de profit', 'famille analytique', 'plan analytique', 'rentabilit', 'pilotage'],
    questions: [
      {
        id: 'an_famille',
        enonce: "À quoi sert une famille analytique dans Pennylane ?",
        options: [
          "À regrouper des axes d'analyse de même nature",
          "À remplacer le plan comptable du dossier",
          "À classer les pièces justificatives reçues",
          "À calculer la TVA par secteur d'activité",
        ],
        reponse: 'A',
      },
      {
        id: 'an_plan',
        enonce: "Le plan analytique d'un dossier sert à :",
        options: [
          "définir les comptes du plan comptable général",
          "structurer les axes de ventilation des flux",
          "paramétrer les journaux comptables du dossier",
          "fixer les taux de TVA applicables aux ventes",
        ],
        reponse: 'B',
      },
      {
        id: 'an_multi_axes',
        enonce: "Peut-on ventiler une même écriture sur plusieurs axes analytiques ?",
        options: [
          "Non, un seul axe par écriture comptable",
          "Uniquement sur les écritures de vente",
          "Oui, les axes se combinent sur une écriture",
          "Uniquement après la clôture de l'exercice",
        ],
        reponse: 'C',
      },
      {
        id: 'an_centre_profit',
        enonce: "Un centre de profit permet d'analyser :",
        options: [
          "le solde de TVA dû au titre du mois",
          "les amortissements des immobilisations du dossier",
          "les congés pris par les collaborateurs",
          "la performance d'une activité ou d'une unité",
        ],
        reponse: 'D',
      },
      {
        id: 'an_categorisation',
        enonce: "La catégorisation des flux en analytique consiste à :",
        options: [
          "affecter chaque opération à un axe d'analyse",
          "classer les factures par date de réception",
          "trier les relevés bancaires par montant",
          "regrouper les clients par secteur géographique",
        ],
        reponse: 'A',
      },
      {
        id: 'an_rapports',
        enonce: "Les rapports analytiques de Pennylane sont consultables :",
        options: [
          "uniquement après validation par le comptable du dossier",
          "en temps réel, dès que les flux sont ventilés",
          "uniquement à la clôture de l'exercice",
          "après un export retravaillé sous tableur",
        ],
        reponse: 'B',
      },
      {
        id: 'an_budget',
        enonce: "Un budget analytique est comparé :",
        options: [
          "au seul chiffre d'affaires de la période",
          "au bilan de l'exercice précédent",
          "aux écritures réelles ventilées sur l'axe",
          "aux factures clients restant à encaisser",
        ],
        reponse: 'C',
      },
      {
        id: 'an_besoin',
        enonce: "L'analytique répond d'abord à un besoin de :",
        options: [
          "déclaration fiscale auprès de l'administration",
          "conservation des pièces justificatives",
          "transmission des données à la banque",
          "pilotage, au-delà de l'obligation comptable",
        ],
        reponse: 'D',
      },
      {
        id: 'an_expliquer',
        enonce: "Pour expliquer l'analytique à un client, le plus efficace est de :",
        options: [
          "partir de ses questions de gestion concrètes",
          "détailler le paramétrage technique des axes",
          "lui transmettre la documentation complète",
          "attendre qu'il en fasse la demande lui-même",
        ],
        reponse: 'A',
      },
      {
        id: 'an_rentabilite',
        enonce: "L'analyse de rentabilité d'une mission repose sur :",
        options: [
          "le nombre de factures émises au client",
          "les temps saisis rapportés aux honoraires",
          "le solde du compte client au grand livre",
          "la durée de la lettre de mission signée",
        ],
        reponse: 'B',
      },
    ],
  },
  {
    id: 'achats',
    label: 'Achats, fournisseurs et notes de frais',
    motsCles: ['achat', 'fournisseur', 'note de frais', 'ocr', 'demande de paiement', 'circuit de validation'],
    questions: [
      {
        id: 'ac_cycle',
        enonce: "Dans Pennylane, le cycle d'achat démarre à :",
        options: [
          "l'émission d'une facture de vente",
          "l'enregistrement du règlement bancaire",
          "la réception de la facture fournisseur",
          "la clôture de l'exercice comptable",
        ],
        reponse: 'C',
      },
      {
        id: 'ac_ocr',
        enonce: "L'OCR appliqué à une facture fournisseur sert à :",
        options: [
          "archiver la facture au format compressé",
          "transmettre la facture à l'administration",
          "calculer le montant de TVA récupérable",
          "pré-remplir les champs depuis l'image reçue",
        ],
        reponse: 'D',
      },
      {
        id: 'ac_regle_fournisseur',
        enonce: "Une règle fournisseur dans Pennylane permet de :",
        options: [
          "appliquer un traitement récurrent",
          "bloquer tout nouveau fournisseur créé",
          "négocier les délais de paiement accordés",
          "éditer un relevé des achats du trimestre",
        ],
        reponse: 'A',
      },
      {
        id: 'ac_circuit',
        enonce: "Un circuit de validation des factures d'achat se paramètre selon :",
        options: [
          "le jour de la semaine de réception",
          "le montant, le type ou la catégorie",
          "la taille du fichier joint à la facture",
          "l'ancienneté du fournisseur au dossier",
        ],
        reponse: 'B',
      },
      {
        id: 'ac_demande_achat',
        enonce: "Une demande d'achat se distingue d'une facture fournisseur car elle :",
        options: [
          "solde définitivement la dette au fournisseur",
          "constate une charge dans les comptes",
          "précède l'engagement et attend validation",
          "déclenche le paiement immédiat du montant",
        ],
        reponse: 'C',
      },
      {
        id: 'ac_justificatif',
        enonce: "Dans une note de frais, le justificatif attendu est :",
        options: [
          "une déclaration sur l'honneur signée",
          "un email de confirmation du manager",
          "un relevé bancaire du mois concerné",
          "une photo ou un PDF du ticket",
        ],
        reponse: 'D',
      },
      {
        id: 'ac_bareme',
        enonce: "Le barème kilométrique appliqué aux notes de frais est :",
        options: [
          "celui publié par l'administration",
          "fixé librement par chaque entreprise",
          "calculé à partir du trajet GPS réel",
          "négocié avec le cabinet comptable",
        ],
        reponse: 'A',
      },
      {
        id: 'ac_ecriture_ndf',
        enonce: "Une note de frais validée génère :",
        options: [
          "un bulletin de paie complémentaire",
          "une écriture au journal des achats",
          "une facture adressée au client final",
          "un virement exécuté immédiatement",
        ],
        reponse: 'B',
      },
      {
        id: 'ac_rapprochement',
        enonce: "Le rapprochement commande / facture vérifie que :",
        options: [
          "le prix pratiqué est conforme au marché",
          "le fournisseur est bien référencé au dossier",
          "la facture correspond à une commande validée",
          "la TVA facturée est intégralement déductible",
        ],
        reponse: 'C',
      },
      {
        id: 'ac_paiement',
        enonce: "Pour programmer un paiement fournisseur, on passe par :",
        options: [
          "un export SEPA retraité à la main",
          "un virement réalisé hors de l'outil",
          "le module de paie du cabinet comptable",
          "le module Paiements, avec une échéance",
        ],
        reponse: 'D',
      },
    ],
  },
  {
    id: 'ventes',
    label: 'Ventes et facturation client',
    motsCles: ['vente', 'facturation client', 'devis', 'abonnement', 'relance', 'chorus', 'éditeur de factures', 'acompte', 'avoir'],
    questions: [
      {
        id: 've_editeur',
        enonce: "L'éditeur de factures de Pennylane permet d'abord de :",
        options: [
          "créer et personnaliser les documents de vente",
          "enregistrer les factures fournisseurs reçues",
          "paramétrer les journaux comptables du dossier",
          "suivre les encaissements sur le compte bancaire",
        ],
        reponse: 'A',
      },
      {
        id: 've_abonnement',
        enonce: "Un abonnement dans Pennylane sert à :",
        options: [
          "archiver les anciens devis du client",
          "facturer à périodicité régulière",
          "suivre les relances envoyées au client",
          "calculer la TVA due sur l'année",
        ],
        reponse: 'B',
      },
      {
        id: 've_devis',
        enonce: "Pour transformer un devis accepté en facture :",
        options: [
          "on le réimprime avec un nouveau numéro",
          "on crée une facture indépendante à la main",
          "on le convertit depuis le devis validé",
          "ce n'est pas prévu dans l'outil",
        ],
        reponse: 'C',
      },
      {
        id: 've_numerotation',
        enonce: "La numérotation des factures de vente est :",
        options: [
          "libre, au choix de l'utilisateur",
          "alphabétique, par nom de client",
          "fixée par le client destinataire",
          "séquentielle et automatique",
        ],
        reponse: 'D',
      },
      {
        id: 've_acompte',
        enonce: "Une facture d'acompte est émise :",
        options: [
          "avant la réalisation de la prestation",
          "après le solde complet de la commande",
          "à la clôture de l'exercice comptable",
          "en remplacement d'un avoir émis",
        ],
        reponse: 'A',
      },
      {
        id: 've_relances',
        enonce: "Les relances clients dans Pennylane se paramètrent :",
        options: [
          "en un seul envoi groupé mensuel",
          "par niveaux successifs à valider",
          "uniquement à la demande du client",
          "par le support, sur demande écrite",
        ],
        reponse: 'B',
      },
      {
        id: 've_chorus',
        enonce: "L'envoi de factures vers Chorus Pro concerne :",
        options: [
          "les clients établis hors de France",
          "les particuliers payant par carte",
          "les clients du secteur public",
          "les fournisseurs du cabinet comptable",
        ],
        reponse: 'C',
      },
      {
        id: 've_situation',
        enonce: "Une facture de situation s'utilise :",
        options: [
          "pour les ventes réalisées en boutique physique",
          "pour les opérations d'importation",
          "pour les associations non assujetties",
          "pour les marchés facturés par avancement",
        ],
        reponse: 'D',
      },
      {
        id: 've_lettre_mission',
        enonce: "Le lien entre lettre de mission et abonnement permet de :",
        options: [
          "facturer automatiquement les honoraires",
          "suivre les temps passés par collaborateur",
          "calculer la rentabilité de chaque dossier",
          "générer les relances des factures impayées",
        ],
        reponse: 'A',
      },
      {
        id: 've_suivi_paiements',
        enonce: "Le suivi des paiements clients s'appuie sur :",
        options: [
          "l'édition mensuelle du grand livre",
          "le rapprochement des règlements reçus",
          "la saisie manuelle de chaque encaissement",
          "l'export des factures vers un tableur",
        ],
        reponse: 'B',
      },
    ],
  },
  {
    id: 'revision',
    label: 'Révision et clôture',
    motsCles: ['révision', 'revision', 'dossier de travail', 'inventaire', 'clôture', 'cloture', 'balance', 'grand livre', 'grand-livre', 'cut-off', 'lettrage avancé'],
    questions: [
      {
        id: 'rv_dossier_travail',
        enonce: "Le dossier de travail dans Pennylane sert à :",
        options: [
          "rassembler les justificatifs de la révision",
          "éditer les factures de vente de la période",
          "paramétrer les journaux comptables",
          "suivre les relances clients en cours",
        ],
        reponse: 'A',
      },
      {
        id: 'rv_balance_aux',
        enonce: "La balance auxiliaire se distingue de la balance générale car elle :",
        options: [
          "regroupe les soldes par classe de compte",
          "détaille les soldes par compte de tiers",
          "présente les flux de trésorerie du mois",
          "ne reprend que les comptes de résultat",
        ],
        reponse: 'B',
      },
      {
        id: 'rv_inventaire',
        enonce: "Les écritures d'inventaire sont passées :",
        options: [
          "à chaque import de relevé bancaire",
          "au début de chaque mois civil",
          "à la clôture de l'exercice comptable",
          "lors de l'embarquement du client",
        ],
        reponse: 'C',
      },
      {
        id: 'rv_cutoff',
        enonce: "Un module de révision « cut-off » traite :",
        options: [
          "le classement des pièces dans la GED",
          "la numérotation des écritures saisies",
          "la connexion du compte bancaire client",
          "le rattachement des charges à l'exercice",
        ],
        reponse: 'D',
      },
      {
        id: 'rv_lettrage',
        enonce: "Le lettrage avancé en révision permet de :",
        options: [
          "solder les comptes de tiers ouverts",
          "éditer la liasse fiscale de l'exercice",
          "générer la déclaration de TVA du mois",
          "transmettre le FEC à l'administration",
        ],
        reponse: 'A',
      },
      {
        id: 'rv_grand_livre',
        enonce: "Le grand livre présente :",
        options: [
          "les soldes agrégés par classe",
          "le détail des écritures par compte",
          "la synthèse du compte de résultat",
          "l'état des immobilisations du dossier",
        ],
        reponse: 'B',
      },
      {
        id: 'rv_verrouillage',
        enonce: "Verrouiller une période révisée a pour effet de :",
        options: [
          "supprimer les écritures non lettrées",
          "transmettre le dossier à l'administration",
          "empêcher toute modification ultérieure",
          "clôturer définitivement le dossier client",
        ],
        reponse: 'C',
      },
      {
        id: 'rv_controle_soldes',
        enonce: "Un premier contrôle de révision consiste à vérifier :",
        options: [
          "le nombre de factures émises au client",
          "l'ancienneté des relances adressées",
          "la ventilation analytique des ventes",
          "la cohérence des soldes de la balance",
        ],
        reponse: 'D',
      },
      {
        id: 'rv_subventions',
        enonce: "Le module de révision « subventions » sert à :",
        options: [
          "étaler la subvention sur sa durée",
          "demander une subvention publique",
          "déclarer la subvention à l'URSSAF",
          "encaisser la subvention au compte",
        ],
        reponse: 'A',
      },
      {
        id: 'rv_cloture',
        enonce: "La clôture dans Pennylane intervient :",
        options: [
          "avant la saisie des factures du mois",
          "après la révision complète du dossier",
          "dès l'ouverture du dossier client",
          "à chaque déclaration de TVA déposée",
        ],
        reponse: 'B',
      },
    ],
  },
  {
    id: 'production',
    label: 'Tenue et production comptable',
    motsCles: ['tenue', 'production comptable', 'saisie', 'lettrage', 'rapprochement', 'transaction', 'écriture', 'centre de règles'],
    questions: [
      {
        id: 'pr_transactions',
        enonce: "Pour accélérer le traitement des transactions bancaires :",
        options: [
          "on saisit chaque ligne manuellement",
          "on exporte le relevé vers un tableur",
          "on valide en masse avec les raccourcis",
          "on attend la clôture de l'exercice",
        ],
        reponse: 'C',
      },
      {
        id: 'pr_regle_transaction',
        enonce: "Dans Pennylane, une règle de traitement peut être créée :",
        options: [
          "uniquement par le support technique",
          "seulement à l'ouverture du dossier",
          "à partir d'un import de fichier CSV",
          "depuis une transaction existante",
        ],
        reponse: 'D',
      },
      {
        id: 'pr_doublons',
        enonce: "Les doublons de transactions bancaires se traitent :",
        options: [
          "via le filtre dédié aux doublons",
          "en supprimant le relevé bancaire",
          "en ressaisissant toutes les lignes",
          "par un export vers la banque",
        ],
        reponse: 'A',
      },
      {
        id: 'pr_virements_internes',
        enonce: "Un virement entre deux comptes du même dossier se traite :",
        options: [
          "comme une charge d'exploitation",
          "par un compte de virements internes",
          "comme un produit exceptionnel",
          "en créant un compte de tiers dédié",
        ],
        reponse: 'B',
      },
      {
        id: 'pr_rapprochement',
        enonce: "Préparer un rapprochement bancaire suppose d'abord de :",
        options: [
          "éditer la liasse fiscale de l'exercice",
          "déposer la déclaration de TVA du mois",
          "vérifier les points de contrôle",
          "clôturer les comptes de l'exercice",
        ],
        reponse: 'C',
      },
      {
        id: 'pr_ecarts',
        enonce: "Pour identifier les écarts en priorité, on utilise :",
        options: [
          "un export mensuel vers un tableur",
          "la saisie manuelle de chaque ligne",
          "la liasse fiscale de l'exercice clos",
          "les filtres et les tris disponibles",
        ],
        reponse: 'D',
      },
      {
        id: 'pr_saisie_factures',
        enonce: "La saisie d'une facture dans Pennylane part :",
        options: [
          "de la pièce collectée et reconnue",
          "d'une écriture saisie au journal",
          "du relevé bancaire reçu du mois",
          "de la balance générale éditée",
        ],
        reponse: 'A',
      },
      {
        id: 'pr_balance_controle',
        enonce: "La balance de contrôle sert à :",
        options: [
          "éditer les factures de vente",
          "vérifier la cohérence des soldes",
          "calculer les amortissements",
          "déclarer la TVA de la période écoulée",
        ],
        reponse: 'B',
      },
      {
        id: 'pr_centre_regles',
        enonce: "Le centre de règles de Pennylane regroupe :",
        options: [
          "les modèles de documents de vente",
          "les droits d'accès des utilisateurs",
          "les automatisations de traitement",
          "les échéances fiscales du dossier",
        ],
        reponse: 'C',
      },
      {
        id: 'pr_export_revision',
        enonce: "Après contrôle, une période se transmet en révision :",
        options: [
          "par un envoi au support Pennylane",
          "après suppression des écritures",
          "en recopiant les données à la main",
          "verrouillée puis exportée",
        ],
        reponse: 'D',
      },
    ],
  },
  {
    id: 'parametrage',
    label: 'Paramétrage des dossiers',
    motsCles: ['paramétrage', 'parametrage', 'plan comptable', 'journaux', 'numérotation', 'connexion bancaire', 'exercice comptable', 'compte de tiers', 'rôles', 'accès'],
    questions: [
      {
        id: 'pm_creation',
        enonce: "Créer un dossier client dans Pennylane suppose de renseigner :",
        options: [
          "l'entreprise et ses exercices comptables",
          "les factures de vente du trimestre",
          "les relances clients déjà envoyées",
          "les temps saisis par les collaborateurs",
        ],
        reponse: 'A',
      },
      {
        id: 'pm_plan_comptable',
        enonce: "Le plan comptable d'un dossier se personnalise :",
        options: [
          "uniquement via le support Pennylane",
          "dans les paramètres du dossier",
          "par un import de fichier CSV seul",
          "il n'est pas modifiable après création",
        ],
        reponse: 'B',
      },
      {
        id: 'pm_comptes_auto',
        enonce: "Les comptes créés automatiquement doivent être :",
        options: [
          "conservés en l'état sans contrôle",
          "transmis à l'administration fiscale",
          "identifiés puis nettoyés",
          "supprimés dès la création du dossier",
        ],
        reponse: 'C',
      },
      {
        id: 'pm_journaux',
        enonce: "Les journaux comptables servent à :",
        options: [
          "regrouper les clients par secteur",
          "éditer les documents de vente",
          "suivre les droits des utilisateurs",
          "classer les écritures par nature",
        ],
        reponse: 'D',
      },
      {
        id: 'pm_numerotation',
        enonce: "La numérotation comptable d'un dossier est :",
        options: [
          "paramétrée à l'ouverture du dossier",
          "imposée et non modifiable",
          "définie par le client final",
          "tirée automatiquement du relevé bancaire",
        ],
        reponse: 'A',
      },
      {
        id: 'pm_comptes_attente',
        enonce: "Un compte d'attente doit être :",
        options: [
          "conservé jusqu'à la clôture suivante",
          "soldé vers un compte définitif",
          "transmis à l'administration",
          "supprimé du plan comptable",
        ],
        reponse: 'B',
      },
      {
        id: 'pm_connexion_bancaire',
        enonce: "La connexion bancaire d'un dossier permet :",
        options: [
          "le paiement direct des factures fournisseurs",
          "l'édition de la liasse fiscale",
          "la récupération des écritures bancaires",
          "la télédéclaration de la TVA due",
        ],
        reponse: 'C',
      },
      {
        id: 'pm_roles',
        enonce: "Les rôles et accès des collaborateurs se définissent :",
        options: [
          "dossier par dossier, un par un séparément",
          "à la demande écrite du support",
          "par le client dans son espace",
          "au niveau des paramètres du cabinet",
        ],
        reponse: 'D',
      },
      {
        id: 'pm_entite_facturante',
        enonce: "Vérifier l'entité facturante consiste à contrôler :",
        options: [
          "qui facture et sous quels paramètres",
          "quels clients ont réglé leurs factures",
          "quelles écritures restent à lettrer",
          "quels comptes bancaires sont connectés",
        ],
        reponse: 'A',
      },
      {
        id: 'pm_comptes_tiers',
        enonce: "Le paramétrage des comptes de tiers conditionne :",
        options: [
          "la ventilation analytique des flux",
          "le lettrage et le suivi des soldes",
          "le calcul des amortissements annuels",
          "la numérotation des factures émises",
        ],
        reponse: 'B',
      },
    ],
  },
  {
    id: 'gestion_interne',
    label: 'Gestion interne du cabinet',
    motsCles: ['gestion interne', 'lettre de mission', 'mission', 'saisie des temps', 'prospect', 'honoraires', 'portefeuille', 'boni', 'rentabilité du cabinet', 'mon cabinet'],
    questions: [
      {
        id: 'gi_distinction',
        enonce: "Dans « Mon cabinet », la gestion interne traite :",
        options: [
          "l'activité du cabinet lui-même",
          "la comptabilité des clients",
          "les déclarations fiscales dues",
          "les écritures bancaires reçues",
        ],
        reponse: 'A',
      },
      {
        id: 'gi_lettre_mission',
        enonce: "Une lettre de mission dans Pennylane se compose notamment :",
        options: [
          "du détail des factures fournisseurs",
          "des prestations et des honoraires",
          "des relevés bancaires du client",
          "des écritures d'inventaire passées",
        ],
        reponse: 'B',
      },
      {
        id: 'gi_apres_signature',
        enonce: "Après signature de la lettre de mission :",
        options: [
          "la comptabilité est clôturée",
          "le prospect est archivé sans suite",
          "le dossier client est créé",
          "les factures sont émises aussitôt",
        ],
        reponse: 'C',
      },
      {
        id: 'gi_millesime',
        enonce: "Rattacher une prestation à un millésime permet de :",
        options: [
          "éditer la liasse fiscale annuelle",
          "déclarer la TVA du trimestre",
          "paramétrer le plan comptable",
          "suivre les budgets par exercice",
        ],
        reponse: 'D',
      },
      {
        id: 'gi_abonnement_mission',
        enonce: "Un abonnement créé depuis une mission porte :",
        options: [
          "la périodicité et les honoraires",
          "le plan comptable du dossier",
          "les écritures restant à lettrer",
          "la déclaration de TVA à déposer",
        ],
        reponse: 'A',
      },
      {
        id: 'gi_saisie_temps',
        enonce: "La saisie des temps doit préciser :",
        options: [
          "le taux de TVA applicable",
          "le dossier, la tâche et le millésime",
          "le compte bancaire concerné du client",
          "le journal comptable utilisé",
        ],
        reponse: 'B',
      },
      {
        id: 'gi_temps_inclus',
        enonce: "Distinguer les temps inclus aux honoraires des temps au temps passé sert à :",
        options: [
          "éditer le grand livre du dossier",
          "déclarer les honoraires à l'URSSAF",
          "facturer sans double facturation",
          "calculer les amortissements dus",
        ],
        reponse: 'C',
      },
      {
        id: 'gi_boni_mali',
        enonce: "Un boni ou un mali sur une mission traduit :",
        options: [
          "le solde du compte client",
          "le montant de TVA collectée",
          "la durée de la lettre de mission",
          "l'écart entre prévu et réalisé",
        ],
        reponse: 'D',
      },
      {
        id: 'gi_derives',
        enonce: "Comparer prévu et réalisé par dossier permet de :",
        options: [
          "repérer les dérives du portefeuille",
          "éditer les factures du trimestre",
          "clôturer les comptes de l'exercice",
          "transmettre le FEC à l'administration",
        ],
        reponse: 'A',
      },
      {
        id: 'gi_actions',
        enonce: "Face à une mission durablement déficitaire, une action corrective est :",
        options: [
          "reporter la clôture de l'exercice",
          "réviser les honoraires convenus",
          "supprimer le dossier du cabinet",
          "arrêter toute saisie des temps",
        ],
        reponse: 'B',
      },
    ],
  },
  {
    id: 'rfe',
    label: 'Réforme de la facturation électronique',
    motsCles: ['rfe', 'facturation électronique', 'réforme', 'pdp', 'ppf', 'factur-x', 'e-invoicing', 'e-reporting', 'chorus'],
    questions: [
      {
        id: 'rfe_einvoicing',
        enonce: "L'e-invoicing au sens de la réforme désigne :",
        options: [
          "l'échange via une plateforme agréée",
          "l'envoi d'un PDF par email au client",
          "la signature électronique d'un devis",
          "l'archivage numérique des factures",
        ],
        reponse: 'A',
      },
      {
        id: 'rfe_ereporting',
        enonce: "L'e-reporting consiste à transmettre :",
        options: [
          "les lettres de mission aux clients",
          "des données de transaction",
          "les bulletins de paie aux salariés",
          "les relevés bancaires à la banque",
        ],
        reponse: 'B',
      },
      {
        id: 'rfe_ppf',
        enonce: "Le PPF, dans le dispositif de la réforme, est :",
        options: [
          "un format de fichier normalisé",
          "une plateforme privée payante",
          "le portail public de facturation",
          "un logiciel de comptabilité agréé",
        ],
        reponse: 'C',
      },
      {
        id: 'rfe_pdp',
        enonce: "Dans la réforme, une PDP désigne :",
        options: [
          "un prestataire de paie dématérialisée",
          "un portail de déclaration fiscale",
          "un protocole de dépôt de pièces",
          "une plateforme de dématérialisation",
        ],
        reponse: 'D',
      },
      {
        id: 'rfe_facturx',
        enonce: "Le format Factur-X associe :",
        options: [
          "un PDF et des données XML",
          "un tableur et une image",
          "un DOCX et une signature",
          "un CSV et un relevé bancaire",
        ],
        reponse: 'A',
      },
      {
        id: 'rfe_calendrier',
        enonce: "Le calendrier de la réforme s'applique :",
        options: [
          "seulement aux entreprises exportatrices",
          "par paliers selon la taille",
          "à toutes les entreprises en même temps",
          "uniquement aux grandes entreprises",
        ],
        reponse: 'B',
      },
      {
        id: 'rfe_obligation',
        enonce: "Pour un cabinet, la réforme implique d'abord :",
        options: [
          "de renégocier les honoraires",
          "de fermer les dossiers anciens",
          "d'adapter les usages quotidiens",
          "de changer de logiciel de paie",
        ],
        reponse: 'C',
      },
      {
        id: 'rfe_role_plateforme',
        enonce: "Le rôle de la plateforme agréée est de :",
        options: [
          "tenir la comptabilité du client",
          "calculer l'impôt sur les sociétés dû",
          "éditer les bulletins de paie",
          "transmettre et contrôler les factures",
        ],
        reponse: 'D',
      },
      {
        id: 'rfe_accompagnement',
        enonce: "Accompagner un client sur la réforme suppose de :",
        options: [
          "partir de ses flux de facturation",
          "attendre la date d'entrée en vigueur",
          "lui transmettre le texte officiel",
          "modifier son plan comptable",
        ],
        reponse: 'A',
      },
      {
        id: 'rfe_pennylane',
        enonce: "Dans la réforme, Pennylane intervient comme :",
        options: [
          "organisme de certification",
          "outil de facturation raccordé",
          "administration fiscale déléguée",
          "banque du client final",
        ],
        reponse: 'B',
      },
    ],
  },
  {
    id: 'tresorerie',
    label: 'Comptabilité de trésorerie',
    motsCles: ['trésorerie', 'tresorerie', 'encaissement', 'décaissement', 'règle bancaire', 'chèque', 'prélèvement', 'écart'],
    questions: [
      {
        id: 'tr_principe',
        enonce: "En comptabilité de trésorerie, l'écriture est constatée :",
        options: [
          "au moment du flux bancaire",
          "à la date d'émission de la facture",
          "à la clôture de l'exercice",
          "à la réception de la commande",
        ],
        reponse: 'A',
      },
      {
        id: 'tr_tva',
        enonce: "Sur un dossier en comptabilité de trésorerie, la TVA est :",
        options: [
          "calculée sur le résultat net",
          "exigible à l'encaissement",
          "exigible dès la facturation",
          "due une fois par exercice",
        ],
        reponse: 'B',
      },
      {
        id: 'tr_regles',
        enonce: "Les règles bancaires servent à :",
        options: [
          "éditer les relevés mensuels",
          "négocier les frais avec la banque",
          "automatiser le classement des flux",
          "bloquer les virements sortants",
        ],
        reponse: 'C',
      },
      {
        id: 'tr_ecarts',
        enonce: "Un écart de rapprochement se traite en :",
        options: [
          "supprimant le relevé bancaire",
          "clôturant l'exercice par avance",
          "modifiant le plan comptable",
          "identifiant l'opération manquante",
        ],
        reponse: 'D',
      },
      {
        id: 'tr_virement_interne',
        enonce: "Un virement interne entre deux comptes se passe par :",
        options: [
          "un compte de virements internes",
          "un compte de charges diverses",
          "un compte client provisoire",
          "un compte de produits exceptionnels",
        ],
        reponse: 'A',
      },
      {
        id: 'tr_cheques',
        enonce: "Une remise de chèques groupée se traite :",
        options: [
          "par un virement de régularisation",
          "en rapprochant la remise globale",
          "chèque par chèque obligatoirement",
          "après la clôture de l'exercice",
        ],
        reponse: 'B',
      },
      {
        id: 'tr_prelevements',
        enonce: "Les prélèvements récurrents gagnent à être traités :",
        options: [
          "par un export vers la banque",
          "à la clôture annuelle",
          "par une règle dédiée",
          "manuellement chaque mois",
        ],
        reponse: 'C',
      },
      {
        id: 'tr_plan',
        enonce: "Un plan de trésorerie projette :",
        options: [
          "le résultat fiscal de l'exercice",
          "les amortissements à constater",
          "le bilan de l'année précédente",
          "les encaissements et décaissements",
        ],
        reponse: 'D',
      },
      {
        id: 'tr_alimentation',
        enonce: "Le plan de trésorerie s'alimente notamment :",
        options: [
          "des factures en attente de paiement",
          "des écritures d'inventaire passées",
          "des données transmises par la DGFiP",
          "du plan comptable du dossier",
        ],
        reponse: 'A',
      },
      {
        id: 'tr_alerte',
        enonce: "Un solde projeté négatif doit conduire à :",
        options: [
          "annuler les factures clients émises",
          "anticiper un besoin de financement",
          "suspendre la saisie comptable",
          "clôturer l'exercice par prudence",
        ],
        reponse: 'B',
      },
    ],
  },
  {
    id: 'migration',
    label: 'Migration et reprise de dossiers',
    motsCles: ['migration', 'import de fec', 'fec', 'reprise', 'immobilisation', 'emprunt', 'crédit-bail', 'bascule', 'migrer'],
    questions: [
      {
        id: 'mi_fec',
        enonce: "L'import d'un FEC lors d'une migration permet de :",
        options: [
          "reprendre les écritures antérieures",
          "éditer la liasse fiscale de l'année",
          "déclarer la TVA du dernier trimestre",
          "paramétrer les droits des utilisateurs",
        ],
        reponse: 'A',
      },
      {
        id: 'mi_controle_comptes',
        enonce: "Après un import de FEC, le premier contrôle porte sur :",
        options: [
          "les temps saisis par les équipes",
          "la cohérence des comptes repris",
          "le nombre de factures à émettre",
          "les relances clients à envoyer",
        ],
        reponse: 'B',
      },
      {
        id: 'mi_immobilisations',
        enonce: "La reprise des immobilisations suppose :",
        options: [
          "une demande au support",
          "un export vers un tableur",
          "un import puis un cadrage",
          "une ressaisie ligne par ligne",
        ],
        reponse: 'C',
      },
      {
        id: 'mi_emprunts',
        enonce: "Les emprunts et crédits-baux repris doivent être :",
        options: [
          "supprimés puis recréés à la main",
          "déclarés à l'administration fiscale",
          "transmis à la banque du client",
          "rapprochés des tableaux fournis",
        ],
        reponse: 'D',
      },
      {
        id: 'mi_reprise_tva',
        enonce: "Le module de reprise de TVA sert, lors d'une migration, à :",
        options: [
          "reprendre les montants antérieurs",
          "recalculer les taux applicables",
          "déposer une déclaration rectificative",
          "clôturer l'exercice précédent",
        ],
        reponse: 'A',
      },
      {
        id: 'mi_tiers',
        enonce: "La reprise des bases tiers concerne :",
        options: [
          "les modèles de documents de vente",
          "les comptes clients et fournisseurs",
          "les relevés bancaires du mois",
          "les écritures d'inventaire",
        ],
        reponse: 'B',
      },
      {
        id: 'mi_comptes_attente',
        enonce: "Lors d'une migration, les comptes d'attente doivent être :",
        options: [
          "transmis à l'administration",
          "recréés à chaque exercice",
          "soldés avant la mise en service",
          "conservés jusqu'à la clôture suivante",
        ],
        reponse: 'C',
      },
      {
        id: 'mi_cadrage',
        enonce: "Le cadrage après migration consiste à vérifier :",
        options: [
          "la numérotation des factures émises",
          "le nombre de collaborateurs actifs",
          "les droits d'accès du client final",
          "la concordance des soldes repris",
        ],
        reponse: 'D',
      },
      {
        id: 'mi_etapes',
        enonce: "L'ordre logique d'une migration est :",
        options: [
          "paramétrer, importer, puis cadrer",
          "cadrer, puis importer et paramétrer",
          "importer, cadrer, puis paramétrer",
          "importer puis clôturer directement",
        ],
        reponse: 'A',
      },
      {
        id: 'mi_nettoyage',
        enonce: "Les comptes créés automatiquement lors de l'import sont :",
        options: [
          "à déclarer à l'administration",
          "à identifier puis à nettoyer",
          "à conserver systématiquement",
          "à transmettre au client final",
        ],
        reponse: 'B',
      },
    ],
  },
  {
    id: 'automatisation',
    label: 'Automatisation et Autopilot',
    motsCles: ['autopilot', 'autopilote', 'automatis', 'centre de règles', 'anomalie', 'lettrage automatique'],
    questions: [
      {
        id: 'au_autopilot',
        enonce: "L'Autopilot de Pennylane a pour fonction de :",
        options: [
          "proposer des écritures à valider",
          "déposer les déclarations fiscales",
          "éditer les factures de vente",
          "négocier avec les fournisseurs",
        ],
        reponse: 'A',
      },
      {
        id: 'au_supervision',
        enonce: "L'usage de l'Autopilot suppose :",
        options: [
          "un accord de l'administration",
          "une supervision régulière",
          "aucune intervention humaine",
          "une validation du client final",
        ],
        reponse: 'B',
      },
      {
        id: 'au_prerequis',
        enonce: "Activer l'Autopilot sans paramétrage initial soigné est :",
        options: [
          "imposé par défaut",
          "recommandé pour gagner du temps",
          "risqué pour la fiabilité",
          "sans aucune conséquence",
        ],
        reponse: 'C',
      },
      {
        id: 'au_dossiers',
        enonce: "L'Autopilot s'active en priorité sur les dossiers :",
        options: [
          "les plus atypiques du portefeuille",
          "en cours de contrôle fiscal",
          "ouverts depuis moins d'un mois",
          "à fort volume et récurrents",
        ],
        reponse: 'D',
      },
      {
        id: 'au_limites',
        enonce: "L'Autopilot est le moins fiable sur :",
        options: [
          "les opérations atypiques",
          "les écritures les plus répétitives",
          "les transactions bancaires simples",
          "les factures d'un même fournisseur",
        ],
        reponse: 'A',
      },
      {
        id: 'au_routine',
        enonce: "Pour sécuriser les écritures générées automatiquement :",
        options: [
          "on attend la clôture de l'exercice",
          "on met en place un contrôle mensuel",
          "on supprime les règles existantes",
          "on désactive la connexion bancaire",
        ],
        reponse: 'B',
      },
      {
        id: 'au_regle_multicritere',
        enonce: "Une règle multi-critères peut combiner :",
        options: [
          "journal, TVA et exercice",
          "compte, devise et pays",
          "libellé, montant et sens",
          "date, client et millésime",
        ],
        reponse: 'C',
      },
      {
        id: 'au_lettrage',
        enonce: "Le lettrage automatique rapproche :",
        options: [
          "deux dossiers d'un même groupe",
          "un devis et sa lettre de mission",
          "un relevé et le plan comptable",
          "une écriture et sa contrepartie",
        ],
        reponse: 'D',
      },
      {
        id: 'au_anomalies',
        enonce: "La détection d'anomalies sert à :",
        options: [
          "signaler les écritures douteuses",
          "bloquer les paiements sortants",
          "supprimer les doublons constatés",
          "éditer un rapport réglementaire",
        ],
        reponse: 'A',
      },
      {
        id: 'au_gain',
        enonce: "Le principal gain attendu de l'automatisation est :",
        options: [
          "l'arrêt des déclarations fiscales",
          "moins de saisie manuelle",
          "la fin de toute supervision",
          "la suppression des contrôles",
        ],
        reponse: 'B',
      },
    ],
  },
]

/** Un thème par son id. */
export function theme(id) {
  return THEMES.find(t => t.id === id) || null
}

/** Toutes les questions, tous thèmes confondus. */
export function toutesQuestions() {
  return THEMES.flatMap(t => t.questions.map(q => ({ ...q, themeId: t.id })))
}

/**
 * Thèmes couverts par un module, d'après son titre, ses objectifs et son
 * programme.
 *
 * ⚠️ Détection par VOCABULAIRE MÉTIER, et non par rapprochement de titres. Le
 * rapprochement de titres avait échoué pour les durées des modules
 * (« Saisie comptable » tombait sur « RFE, optimisation de la saisie ») : il
 * cherchait un module jumeau. Ici on cherche la présence d'un sujet — « TVA »
 * dans un programme signifie que la TVA est traitée, ce qui est bien plus sûr.
 */
// Empreinte entière stable d'une chaîne. Sert de décalage de départ dans les
// pools : deux modules qui partagent les mêmes thèmes ne reçoivent pas forcément
// les mêmes 5 questions, sans qu'aucun tirage aléatoire n'intervienne.
function empreinte(texte) {
  let h = 7
  for (let i = 0; i < texte.length; i++) h = (h * 31 + texte.charCodeAt(i)) % 1000003
  return h
}

/**
 * Les questions d'un module, composées depuis les thèmes que son programme
 * couvre. 5 par défaut, comme la banque historique.
 *
 * ⚠️ DÉTERMINISTE, et ce n'est pas un détail : la règle d'origine veut que le
 * pré-test et le post-test posent LES MÊMES questions, dans un ordre différent.
 * Un tirage aléatoire ici ferait porter les deux tests sur des items distincts,
 * et la progression mesurée ne voudrait plus rien dire.
 *
 * Les thèmes sont parcourus à tour de rôle : un module qui traite production,
 * TVA et révision reçoit un mélange des trois plutôt que cinq questions du
 * premier thème trouvé.
 */
export function questionsDuModule(module, n = 5) {
  const ids = themesDuModule(module)
  if (ids.length === 0) return []
  const pools = ids.map(id => theme(id)?.questions || []).filter(p => p.length > 0)
  if (pools.length === 0) return []

  const depart = empreinte(String(module.id || ''))
  const choisies = []
  const vues = new Set()
  const maxTours = Math.max(...pools.map(p => p.length))

  for (let tour = 0; tour < maxTours && choisies.length < n; tour++) {
    for (let i = 0; i < pools.length && choisies.length < n; i++) {
      const pool = pools[i]
      const q = pool[(depart + tour + i * 3) % pool.length]
      if (vues.has(q.id)) continue
      vues.add(q.id)
      choisies.push({ ...q, themeId: ids[i] })
    }
  }
  return choisies
}

export function themesDuModule(module) {
  if (!module) return []
  const programme = typeof module.programme === 'object' ? module.programme?.contenu : module.programme
  const objectifs = Array.isArray(module.objectifs) ? module.objectifs.join(' ') : String(module.objectifs || '')
  const texte = `${module.titre || ''} ${objectifs} ${programme || ''}`
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
  return THEMES
    .filter(t => t.motsCles.some(m => texte.includes(m.normalize('NFD').replace(/[̀-ͯ]/g, ''))))
    .map(t => t.id)
}
