export const TARIFS = {
  session_1h: { label: "Session 1h", duree: "1h", visio: 200, presentiel: null, participants_max: 15, modules: "1 ou 2 modules" },
  session_2h: { label: "Session 2h", duree: "2h", visio: 400, presentiel: null, participants_max: 15, modules: "3 à 4 modules" },
  demi_journee: { label: "½ Journée", duree: "3h30", visio: 600, presentiel: 1000, participants_max: 15, modules: "jusqu'à 5 modules" },
  journee: { label: "Journée complète", duree: "7h", visio: 1200, presentiel: 2000, participants_max: 15, modules: "programme sur mesure" },
  journee_sur_mesure: { label: "Journée sur mesure (présentiel)", duree: "7h", visio: null, presentiel: 2000, participants_max: 15, modules: "100% personnalisé", note: "Frais de déplacement inclus pour 1 formateur, +300€ par formateur supplémentaire" },
}

export const THEMATIQUES = [
  {
    id: "comptabilite",
    emoji: "✏️",
    titre: "Saisie comptable / Révision / TVA / Paramétrage",
    modules: [
      {
        id: "saisie_comptable",
        titre: "Saisie comptable",
        description: "Maîtrisez la saisie sur Pennylane et exploitez toutes les automatisations disponibles pour gagner en efficacité et simplifier votre quotidien.",
        objectifs: [
          "Utiliser les règles de catégorisation automatique pour réduire la saisie manuelle",
          "Importer des relevés bancaires via connecteur bancaire ou fichier OFX/CSV",
          "Effectuer le lettrage des écritures et le rapprochement bancaire",
          "Exploiter le flux documentaire pour centraliser les pièces justificatives",
          "Paramétrer les automatisations de saisie récurrente",
        ],
      },
      {
        id: "revision",
        titre: "Révision",
        description: "Apprenez à structurer et accélérer vos révisions et clôtures dans Pennylane : maîtrisez les étapes clés du processus et activez les automatisations pour réduire les délais et fiabiliser vos arrêtés de comptes.",
        objectifs: [
          "Utiliser la checklist de révision et le dossier de travail Pennylane",
          "Réaliser les écritures d'inventaire et les provisions de clôture",
          "Exploiter le mode comparatif d'un exercice à l'autre",
          "Générer et valider le Fichier des Écritures Comptables (FEC)",
          "Automatiser les contrôles de cohérence avant arrêté",
        ],
      },
      {
        id: "tva",
        titre: "TVA",
        description: "Approfondissez votre maîtrise du module TVA de Pennylane : paramétrage avancé, gestion des spécificités fiscales et télédéclaration optimisée.",
        objectifs: [
          "Paramétrer les taux et régimes de TVA dans les dossiers clients",
          "Distinguer TVA sur débits et TVA sur encaissements",
          "Générer et contrôler la déclaration de TVA (CA3/CA12)",
          "Télédéclarer via le connecteur EDI impôts.gouv.fr",
          "Gérer les cas spécifiques : TVA intracommunautaire, autoliquidation",
        ],
      },
      {
        id: "parametrage",
        titre: "Paramétrage",
        description: "Paramétrez convenablement votre espace cabinet, vos dossiers et ceux de vos clients : connectez les outils tiers, contrôlez les échéances fiscales en un clic, introduction à la gestion interne, et bien plus encore.",
        objectifs: [
          "Configurer les rôles et droits d'accès des collaborateurs et clients",
          "Personnaliser le plan comptable d'un dossier client",
          "Connecter des outils tiers (Silae, Sellsy, etc.) via les intégrations natives",
          "Paramétrer les alertes d'échéances fiscales et sociales",
          "Structurer l'espace cabinet pour une gestion multi-dossiers efficace",
        ],
      },
    ],
  },
  {
    id: "achats",
    emoji: "📦",
    titre: "Module Achats & Notes de Frais",
    modules: [
      {
        id: "module_achat",
        titre: "Module Achat",
        description: "Maîtrisez chaque étape du cycle d'achat dans Pennylane : réception, traitement et validation des factures fournisseurs jusqu'au paiement final.",
        objectifs: [
          "Enregistrer et traiter les factures fournisseurs (PDF, Factur-X, UBL)",
          "Paramétrer et exécuter le workflow de validation des achats",
          "Effectuer le rapprochement commande / facture",
          "Programmer les paiements fournisseurs avec date d'échéance",
          "Générer les écritures comptables depuis le module achat",
        ],
      },
      {
        id: "notes_de_frais",
        titre: "Gestion des Notes de Frais",
        description: "Simplifiez la gestion des notes de frais de vos clients de A à Z : traitement des dépenses classiques, calcul des frais kilométriques et suivi des remboursements.",
        objectifs: [
          "Soumettre et valider des notes de frais depuis l'application mobile",
          "Calculer les indemnités kilométriques via le barème fiscal officiel",
          "Utiliser l'OCR pour pré-remplir automatiquement les champs depuis un ticket",
          "Valider et rembourser les notes de frais approuvées",
          "Générer les écritures comptables dans le journal des achats/frais",
        ],
      },
      {
        id: "demandes_achats",
        titre: "Gestion des Demandes d'Achats",
        description: "Maîtrisez le module de demandes d'achat de Pennylane : suivez chaque demande en temps réel et assurez leur traçabilité complète en les rattachant aux factures.",
        objectifs: [
          "Créer et soumettre une demande d'achat avec budget prévisionnel",
          "Définir les circuits d'approbation selon le montant ou la catégorie",
          "Suivre l'avancement de chaque demande en temps réel",
          "Rattacher la facture à la demande validée pour assurer la traçabilité",
          "Exploiter les catégories analytiques pour le suivi budgétaire",
        ],
      },
      {
        id: "circuit_validation",
        titre: "Circuit de validation",
        description: "Apprenez à paramétrer des circuits d'approbation adaptés à chaque structure : définissez les niveaux de validation, encadrez les dépenses et protégez vos clients contre les risques de fraude.",
        objectifs: [
          "Créer des circuits multi-niveaux selon le montant ou le type de dépense",
          "Désigner les approbateurs et configurer les délégations",
          "Activer les alertes et notifications automatiques aux valideurs",
          "Comprendre comment le circuit réduit les risques de fraude aux paiements",
          "Auditer les validations effectuées via l'historique des approbations",
        ],
      },
    ],
  },
  {
    id: "facturation",
    emoji: "📋",
    titre: "Facturation & Réforme de la Facturation Électronique",
    modules: [
      {
        id: "reforme_rfe",
        titre: "Réforme RFE",
        description: "Appréhendez les enjeux et le fonctionnement de la RFE : maîtrisez les notions d'e-invoicing et d'e-reporting, et repartez avec des réponses claires aux questions les plus fréquentes.",
        objectifs: [
          "Comprendre le calendrier et le périmètre de la réforme de la facturation électronique",
          "Distinguer e-invoicing (B2B) et e-reporting (B2C, international)",
          "Identifier les formats obligatoires (Factur-X, UBL, CII) et les plateformes PDP",
          "Expliquer la réforme à vos clients et anticiper leur transition",
          "Positionner Pennylane comme solution conforme à la réforme",
        ],
      },
      {
        id: "methode_facturation",
        titre: "Méthode de facturation",
        description: "Maîtrisez chaque étape de votre facturation : émission de factures courantes et d'acompte, gestion des abonnements récurrents et création de vos documents commerciaux.",
        objectifs: [
          "Émettre des factures, avoirs et factures d'acompte dans Pennylane",
          "Paramétrer des abonnements et factures récurrentes automatiques",
          "Créer et personnaliser les modèles de documents commerciaux",
          "Suivre l'état des paiements et les encaissements en attente",
          "Gérer les devis et leur conversion en factures",
        ],
      },
      {
        id: "relancer_clients",
        titre: "Relancer ses clients",
        description: "Configurez le système de relances Pennylane pour suivre vos encaissements, automatiser vos relances et réduire significativement vos démarches et délais de recouvrement.",
        objectifs: [
          "Paramétrer des scénarios de relances automatiques par palier de retard",
          "Personnaliser les modèles d'emails de relance",
          "Suivre les créances échues via le tableau de bord recouvrement",
          "Enregistrer les promesses de paiement et litiges clients",
          "Mesurer l'impact des relances sur le DSO (délai de règlement client)",
        ],
      },
      {
        id: "integration_gestion_commerciale",
        titre: "Intégration pour faciliter la gestion commerciale",
        description: "Découvrez les intégrations natives de Pennylane et apprenez à les valoriser auprès de vos clients pour automatiser leurs processus.",
        objectifs: [
          "Identifier les intégrations CRM, e-commerce et SaaS disponibles dans Pennylane",
          "Configurer une intégration et paramétrer la synchronisation des données",
          "Présenter la valeur ajoutée des intégrations à vos clients",
          "Diagnostiquer les problèmes courants de synchronisation",
          "Proposer un plan de déploiement des intégrations adapté au client",
        ],
      },
    ],
  },
  {
    id: "analytique",
    emoji: "📊",
    titre: "Analytique, Trésorerie & Pilotage",
    modules: [
      {
        id: "famille_analytique",
        titre: "Famille Analytique",
        description: "Apprenez à exploiter les catégories analytiques de Pennylane pour classer vos opérations, affiner votre suivi et obtenir une vision précise de l'activité financière de vos clients.",
        objectifs: [
          "Créer et paramétrer des axes analytiques (centre de coût, projet, activité)",
          "Affecter les opérations à des catégories analytiques lors de la saisie",
          "Analyser la rentabilité par axe depuis les tableaux de bord Pennylane",
          "Exporter les données analytiques pour un reporting personnalisé",
          "Présenter l'analyse analytique à un dirigeant client",
        ],
      },
      {
        id: "plans_tresorerie",
        titre: "Plans de Trésorerie",
        description: "Maîtrisez le fonctionnement du plan de trésorerie Pennylane : paramétrez-le efficacement, interprétez les données et optimisez-le pour offrir à vos clients une vision claire et anticipée.",
        objectifs: [
          "Configurer le plan de trésorerie et renseigner les flux prévisionnels",
          "Distinguer flux réels (soldes bancaires) et flux prévisionnels",
          "Interpréter les indicateurs clés : solde prévisionnel, creux de trésorerie",
          "Ajuster les prévisions en temps réel selon les événements",
          "Utiliser le plan comme outil de conseil auprès des dirigeants",
        ],
      },
      {
        id: "outils_analyse",
        titre: "Les autres outils d'analyse de Pennylane",
        description: "Découvrez les outils d'analyse disponibles dans Pennylane, comprenez leurs utilités et apprenez à les utiliser pour offrir à vos clients une vision claire et pertinente de leur performance financière.",
        objectifs: [
          "Utiliser le tableau de bord financier (P&L, bilan simplifié, ratios)",
          "Générer des reportings personnalisés exportables",
          "Analyser les indicateurs de performance clés (KPIs) du dossier client",
          "Comparer les performances sur plusieurs exercices",
          "Partager les analyses de façon claire avec les clients non-comptables",
        ],
      },
      {
        id: "posture",
        titre: "Posture",
        description: "Développez votre aisance pour présenter et valoriser les fonctionnalités Pennylane auprès de vos clients : les bons arguments, le bon niveau de détail et le bon timing pour maximiser leur adoption.",
        objectifs: [
          "Adopter la posture de conseiller digital auprès des clients",
          "Identifier le bon moment et le bon interlocuteur pour présenter Pennylane",
          "Structurer une démonstration efficace en moins de 15 minutes",
          "Répondre aux objections courantes avec des arguments de valeur",
          "Mesurer et améliorer le taux d'adoption post-formation",
        ],
      },
    ],
  },
  {
    id: "compte_pro",
    emoji: "🏦",
    titre: "Compte Pro & Financement",
    modules: [
      {
        id: "presentation_partenaire",
        titre: "Présentation de notre partenaire",
        description: "Découvrez le partenariat Pennylane x Swan et exploitez la solution bancaire intégrée, sans frais supplémentaire, qui enrichit votre offre.",
        objectifs: [
          "Comprendre le partenariat Pennylane x Swan et ses avantages",
          "Présenter la solution bancaire intégrée aux clients éligibles",
          "Identifier les cas d'usage où le Compte Pro apporte le plus de valeur",
          "Guider un client dans l'ouverture et l'activation du Compte Pro",
          "Positionner le Compte Pro dans votre offre de services cabinet",
        ],
      },
      {
        id: "gestion_compte_pro",
        titre: "Gestion du compte Pro",
        description: "Maîtrisez l'intégralité des fonctionnalités du Compte Pro de Pennylane : règlement des factures, gestion des cartes bancaires, virements et suivi des encaissements clients.",
        objectifs: [
          "Effectuer des virements et des paiements de factures depuis Pennylane",
          "Gérer les cartes bancaires virtuelles et physiques des utilisateurs",
          "Suivre les encaissements clients et les transactions en temps réel",
          "Paramétrer les plafonds et les autorisations par carte",
          "Réconcilier automatiquement les opérations bancaires avec la comptabilité",
        ],
      },
      {
        id: "solutions_paiement",
        titre: "Solutions de paiement et financements",
        description: "Prélèvements, encaissements de chèques, TPE… choisissez la méthode d'encaissement adéquate ! Explorez les possibilités d'avances de trésorerie pour financer le BFR.",
        objectifs: [
          "Paramétrer les prélèvements SEPA et les mandats clients",
          "Gérer les encaissements par chèque et par TPE",
          "Présenter les solutions de financement du BFR (avances de trésorerie)",
          "Choisir la méthode d'encaissement adaptée à chaque type de client",
          "Expliquer le fonctionnement du financement de factures à un dirigeant",
        ],
      },
      {
        id: "mettre_en_avant_compte_pro",
        titre: "Mettre en avant le Compte Pro",
        description: "Développez votre argumentaire autour du Compte Pro : positionnement, discours clé et bonnes pratiques pour convaincre vos clients et renforcer votre rôle de conseiller.",
        objectifs: [
          "Maîtriser les arguments différenciants du Compte Pro Pennylane",
          "Identifier les profils de clients les plus réceptifs à l'offre",
          "Préparer et délivrer un pitch Compte Pro en moins de 5 minutes",
          "Traiter les objections bancaires (sécurité, garanties, plafonds)",
          "Suivre les clients ayant activé le Compte Pro et mesurer leur satisfaction",
        ],
      },
    ],
  },
  {
    id: "onboarding",
    emoji: "🎯",
    titre: "Workshop — Onboarding Client",
    modules: [
      {
        id: "webinaire_embarquement",
        titre: "Webinaire embarquement client",
        description: "Formation collective sous format webinaire pour présenter et rendre autonome vos clients sur l'outil.",
        format_special: "Webinaire collectif — sans limite d'apprenants",
        objectifs: [
          "Présenter Pennylane à vos clients de façon claire et engageante",
          "Guider les clients dans leur premier paramétrage et prise en main",
          "Répondre aux questions fréquentes lors du lancement",
          "Maximiser l'autonomie des clients dès les premières semaines",
          "Identifier les clients nécessitant un accompagnement complémentaire",
        ],
      },
      {
        id: "construction_strategie",
        titre: "Construction d'une stratégie",
        description: "Workshop interactif : travaillez en groupe sur votre stratégie client, identifiez les opportunités, levez les freins et repartez avec une feuille de route claire.",
        objectifs: [
          "Réaliser un diagnostic de l'adoption Pennylane dans votre portefeuille",
          "Segmenter vos clients selon leur potentiel et leur maturité digitale",
          "Co-construire une feuille de route d'adoption avec votre équipe",
          "Définir des KPIs de suivi (taux d'adoption, fonctionnalités actives)",
          "Prioriser les actions à fort impact pour les 90 prochains jours",
        ],
      },
      {
        id: "mise_en_situation",
        titre: "Mise en situation",
        description: "Affinez votre maîtrise des fonctionnalités clés de Pennylane et renforcez votre posture commerciale : les bons arguments, les bonnes réponses aux objections.",
        objectifs: [
          "Pratiquer des scénarios réels sur un dossier de démonstration",
          "Renforcer les réflexes sur les fonctionnalités clés les plus utilisées",
          "S'entraîner à répondre aux objections clients les plus fréquentes",
          "Affiner sa posture de formateur et de conseiller Pennylane",
          "Repartir avec des supports de démonstration prêts à l'emploi",
        ],
      },
    ],
  },
]

// ── Modules personnalisés ──────────────────────────────────────────────────────
// Modules et thématiques créés depuis l'UI (Catalogue AFS), stockés en localStorage
// et fusionnés avec le catalogue statique ci-dessus. getThematiques() est la seule
// source de vérité à utiliser dans l'app — ne jamais lire THEMATIQUES directement
// pour l'affichage ou les sélecteurs, sous peine d'ignorer les modules custom.
const KEY_CUSTOM = 'pls_catalogue_custom'

function loadCustom() {
  try { return JSON.parse(localStorage.getItem(KEY_CUSTOM) || '{"thematiques":[]}') }
  catch { return { thematiques: [] } }
}

function saveCustom(data) {
  localStorage.setItem(KEY_CUSTOM, JSON.stringify(data))
}

export function getThematiquesCustom() {
  return loadCustom().thematiques
}

// Fusionne les thématiques statiques et personnalisées ; si une thématique custom
// reprend l'id d'une thématique statique, ses modules sont ajoutés à la suite.
export function getThematiques() {
  const custom = getThematiquesCustom()
  const merged = THEMATIQUES.map(t => ({ ...t, modules: [...t.modules] }))
  custom.forEach(ct => {
    const existante = merged.find(t => t.id === ct.id)
    if (existante) existante.modules.push(...ct.modules)
    else merged.push(ct)
  })
  return merged
}

export function getAllModules() {
  return getThematiques().flatMap(t => t.modules.map(m => ({ ...m, thematique: t.titre, thematiqueId: t.id })))
}

export function ajouterThematiqueCustom(thematique) {
  const data = loadCustom()
  data.thematiques.push({ ...thematique, id: thematique.id || `custom_${Date.now()}`, modules: [], custom: true })
  saveCustom(data)
  return data.thematiques
}

export function ajouterModuleCustom(thematiqueId, module) {
  const data = loadCustom()
  let thematique = data.thematiques.find(t => t.id === thematiqueId)
  if (!thematique) {
    // La thématique cible est une thématique statique : on crée son pendant
    // custom (mêmes id/emoji/titre) pour y accrocher les modules ajoutés.
    const statique = THEMATIQUES.find(t => t.id === thematiqueId)
    thematique = { id: thematiqueId, emoji: statique?.emoji || '📦', titre: statique?.titre || thematiqueId, modules: [], custom: true }
    data.thematiques.push(thematique)
  }
  const nouveauModule = { ...module, id: module.id || `module_${Date.now()}`, custom: true }
  thematique.modules.push(nouveauModule)
  saveCustom(data)
  return nouveauModule
}

export function supprimerModuleCustom(thematiqueId, moduleId) {
  const data = loadCustom()
  const thematique = data.thematiques.find(t => t.id === thematiqueId)
  if (thematique) thematique.modules = thematique.modules.filter(m => m.id !== moduleId)
  saveCustom(data)
}

export const WEBINAIRES_EMBARQUEMENT = [
  {
    id: "webinar_collectif_collab",
    titre: "Webinar collectif — Plan Collaboratif",
    duree: "45 min",
    prix: "Offert",
    apprenants: "Sans limite",
    contenu: ["Présentation de Pennylane", "Paramétrage de l'outil", "Découverte des modules facturation", "Imports de factures, réconciliation"],
    url: "https://app.livestorm.co/pennylane-8/introduction-a-la-compta-light-sur-pennylane",
  },
  {
    id: "webinar_collectif_compta",
    titre: "Webinar collectif — Plan Collaboratif + Comptabilité",
    duree: "90 min",
    prix: "Offert",
    apprenants: "Sans limite",
    contenu: ["Présentation de Pennylane", "Paramétrage de l'outil", "Découverte des modules comptables", "Imports de factures, réconciliation"],
    url: "https://app.livestorm.co/pennylane-8/decouverte-de-votre-nouvelle-plateforme-collaborative",
  },
  {
    id: "webinar_privatif",
    titre: "Webinar privatif — Plan au choix",
    duree: "Sur mesure",
    prix: "Sur devis",
    apprenants: "Sans limite",
    contenu: ["Embarquement selon plan d'abonnement", "Présentation exclusive à votre cabinet", "Accès limité à vos clients", "Adaptation possible à votre demande"],
    url: "mailto:afs-training@pennylane.com?subject=Demande%20webinar%20privatif",
  },
]
