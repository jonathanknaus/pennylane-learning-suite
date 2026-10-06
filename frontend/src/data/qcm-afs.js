// QCM rédigés par l'équipe AFS, repris du Drive (« 2. Formations / 3. Quizz / CAB »).
//
// Ces questions FONT FOI sur celles composées par thème : elles viennent des
// formateurs, qui savent ce qu'ils évaluent. Elles passent donc en premier dans
// la banque d'un module.
//
// ⚠️ ON NE REPREND QUE LES QCM DONT LA BONNE RÉPONSE EST INDIQUÉE dans le
// document. Quatre QCM du Drive ne l'indiquent pas (Analytique, Gestion, Ventes,
// Achats initial) et un cinquième ne la marque que sur 1 question sur 5 (RFE) :
// deviner un corrigé pour un outil qui calcule un score serait pire que de ne pas
// l'importer. Ils sont listés dans QCM_SANS_CORRIGE pour que l'écart soit visible.
//
// Les libellés sont repris À L'IDENTIQUE, y compris quand ils comptent 3 options
// au lieu de 4 : l'affichage s'adapte au nombre d'options plutôt que d'inventer
// une quatrième réponse. Seules les fautes de frappe manifestes sont corrigées.
//
// ⚠️ Dans « PROJET QUIZZ ACHATS FINAL », les 4 bonnes réponses sont toutes la
// deuxième option. Sans effet ici — les options sont permutées à chaque passation
// par `melangerOptions` — mais c'est à savoir si ce document est réutilisé ailleurs.

/** QCM repris, par document d'origine. */
export const QCM_AFS = [
  {
    source: 'PROJET QUIZZ FINAL Compta / Gestion',
    majDrive: '2026-05-28',
    // Transversal : réforme, emprunts, liasse, révision, migration.
    themesCouverts: ['rfe', 'revision', 'migration'],
    modules: ['reforme_rfe', 'revision'],
    questions: [
      {
        id: 'afs_cg1',
        enonce: "Dans le cadre de la réforme de la facturation électronique, quel est le statut officiel de Pennylane ?",
        options: [
          "Un Opérateur de Dématérialisation (OD) sans agrément DGFiP",
          "Une Plateforme de Dématérialisation Partenaire (PDP) agréée par la DGFiP",
          "Un simple portail d'archivage des factures sans rôle dans les flux B2B",
        ],
        reponse: 'B',
      },
      {
        id: 'afs_cg2',
        enonce: "Lors de la création d'un emprunt avec remboursement différé dans Pennylane, comment cela se paramètre-t-il ?",
        options: [
          "Il faut créer deux emprunts distincts : un pour la période de différé, un pour le remboursement effectif",
          "Il faut passer par le module Cut-off pour gérer les intérêts intercalaires",
          "On paramètre directement le différé (remboursement différé, déblocage partiel, suspension d'échéance) dans le module Emprunts",
        ],
        reponse: 'C',
      },
      {
        id: 'afs_cg3',
        enonce: "Dans Pennylane, comment la liasse fiscale est-elle transmise à l'administration fiscale ?",
        options: [
          "Par export PDF à envoyer manuellement sur impots.gouv.fr",
          "Par EDI directement depuis Pennylane, sans intervention manuelle sur un portail externe",
          "Via un partenaire bancaire dédié, après validation du cabinet",
        ],
        reponse: 'B',
      },
      {
        id: 'afs_cg4',
        enonce: "Dans Pennylane, à quoi sert le dossier de travail dans le cadre de la révision comptable ?",
        options: [
          "À remplacer automatiquement la liasse fiscale en fin d'exercice",
          "À stocker uniquement des fichiers PDF joints au dossier client",
          "À organiser les feuilles de travail de révision avec des liaisons vers les écritures et soldes comptables",
        ],
        reponse: 'C',
      },
      {
        id: 'afs_cg5',
        enonce: "Lors de la migration d'un dossier dans Pennylane, à quoi sert l'import de la base des tiers ?",
        options: [
          "À importer automatiquement toutes les factures de l'exercice précédent",
          "À pré-remplir les fiches fournisseurs et clients (SIREN, adresse, compte comptable…) sans les ressaisir manuellement",
          "À synchroniser les relevés bancaires avec le nouvel établissement financier",
        ],
        reponse: 'B',
      },
    ],
  },
  {
    source: 'Quizz workshop embarquement client',
    majDrive: '2026-06-02',
    themesCouverts: ['posture', 'embarquement'],
    modules: ['webinaire_embarquement', 'posture'],
    questions: [
      {
        id: 'afs_eb1',
        enonce: "Quelle est la première étape d'une méthodologie d'onboarding client réussie sur Pennylane ?",
        options: [
          "Créer le compte du client et lui envoyer ses identifiants",
          "Réaliser un diagnostic des besoins et de la maturité numérique du client",
          "Former le client à toutes les fonctionnalités de l'outil",
          "Connecter les comptes bancaires du client",
        ],
        reponse: 'B',
      },
      {
        id: 'afs_eb2',
        enonce: "Quel élément est indispensable à configurer en priorité lors de l'onboarding ?",
        options: [
          "Les tableaux de bord et rapports avancés",
          "L'intégration avec tous les outils tiers du client",
          "La connexion bancaire et les flux de base liés à l'activité du client",
          "Les droits d'accès de l'ensemble des collaborateurs du cabinet",
        ],
        reponse: 'C',
      },
      {
        id: 'afs_eb3',
        enonce: "Face à un client résistant au changement, quelle est la meilleure approche ?",
        options: [
          "Insister sur les obligations légales à venir (facture électronique…)",
          "Lui laisser du temps et ne pas le forcer",
          "Lui montrer concrètement un bénéfice immédiat et personnalisé à son activité",
          "Lui proposer de continuer avec son ancien fonctionnement",
        ],
        reponse: 'C',
      },
      {
        id: 'afs_eb4',
        enonce: "À quelle fréquence recommande-t-on de faire un point de suivi avec le client dans les 3 premiers mois ?",
        options: [
          "Une seule fois, à la fin des 3 mois",
          "Uniquement si le client rencontre des problèmes",
          "Régulièrement (toutes les 2 à 4 semaines) pour accompagner l'adoption",
          "Tous les jours",
        ],
        reponse: 'C',
      },
      {
        id: 'afs_eb5',
        enonce: "Quel indicateur permet de mesurer le succès de l'onboarding d'un client sur Pennylane ?",
        options: [
          "Le nombre de fonctionnalités activées dans l'outil",
          "Le taux d'utilisation autonome du client et la réduction des échanges manuels",
          "Le montant de l'abonnement souscrit par le client",
          "La vitesse à laquelle le compte a été créé",
        ],
        reponse: 'B',
      },
    ],
  },
  {
    source: 'PROJET QUIZZ ACHATS FINAL',
    majDrive: '2026-05-28',
    // Le corrigé n'est pas en gras mais déduit du document : chaque bonne réponse
    // y est signalée par un retrait, et les encarts « Rappel » la confirment en
    // clair (ex. « le statut En attente n'est PAS un outil de planification de
    // paiement — il est réservé aux factures qu'on ne peut pas encore régler »).
    themesCouverts: ['achats'],
    modules: ['module_achat', 'circuit_validation', 'notes_de_frais'],
    questions: [
      {
        id: 'afs_ac1',
        enonce: "Un collaborateur en déplacement reçoit un ticket de caisse papier. Quelle est la méthode recommandée pour l'importer dans Pennylane ?",
        options: [
          "Il attend de revenir au bureau pour le scanner et le déposer manuellement",
          "Il prend le justificatif en photo directement via l'application mobile Pennylane",
          "Il transfère le ticket par email à son comptable, qui l'importera manuellement",
        ],
        reponse: 'B',
      },
      {
        id: 'afs_ac2',
        enonce: "Dans quel cas est-il correct d'utiliser le statut « En attente » sur une facture fournisseur ?",
        options: [
          "Lorsque je souhaite planifier le paiement à une date future",
          "Lorsque je suis en litige avec mon fournisseur et ne peux pas encore régler la facture",
          "Lorsque la facture n'a pas encore été lue par l'OCR",
        ],
        reponse: 'B',
      },
      {
        id: 'afs_ac3',
        enonce: "Une facture fournisseur est soumise par un employé via le module Achats. Quand apparaît-elle en comptabilité ?",
        options: [
          "Dès son import dans Pennylane, même avant validation",
          "Uniquement une fois validée dans le circuit de validation",
          "Uniquement si elle est rapprochée avec une transaction bancaire",
        ],
        reponse: 'B',
      },
      {
        id: 'afs_ac4',
        enonce: "Je saisis une facture avec un compte de classe 2 et je coche la case « Immobilisation ». Après validation, que se passe-t-il automatiquement ?",
        options: [
          "L'immobilisation reste à créer manuellement dans le module Révision",
          "La facture se déverse automatiquement dans le module Immobilisations avec le statut « En cours »",
          "L'amortissement démarre immédiatement sans aucun paramétrage supplémentaire",
        ],
        reponse: 'B',
      },
    ],
  },
]

/**
 * QCM du Drive NON repris, faute de corrigé. À compléter côté Drive : c'est à
 * l'équipe de dire quelle réponse est la bonne, pas à l'outil de la supposer.
 */
export const QCM_SANS_CORRIGE = [
  { source: 'QCM ANALYTIQUE', motif: 'aucune bonne réponse indiquée', questions: 5 },
  { source: 'QCM GESTION', motif: 'aucune bonne réponse indiquée', questions: 6 },
  { source: 'QCM VENTES', motif: 'aucune bonne réponse indiquée', questions: 5 },
  { source: 'QCM ACHATS INITIAL', motif: 'aucune bonne réponse indiquée', questions: 5 },
  { source: 'QCM RFE', motif: 'bonne réponse marquée sur 1 question sur 5', questions: 5 },
]

/** Toutes les questions AFS, à plat, avec leur document d'origine. */
export function toutesQuestionsAfs() {
  return QCM_AFS.flatMap(q => q.questions.map(x => ({ ...x, sourceAfs: q.source })))
}

/**
 * Questions AFS visant un module, par RATTACHEMENT EXPLICITE uniquement.
 *
 * ⚠️ Le rattachement par thème a été essayé puis retiré : ces QCM sont
 * transversaux (le QCM Compta/Gestion touche réforme, emprunts, liasse, révision
 * et migration), si bien que la détection par thème les faisait remonter sur
 * 51 modules sur 66 — un module d'analytique se retrouvait interrogé sur la
 * liasse fiscale. Un QCM écrit pour une formation donnée ne vaut que pour elle.
 *
 * Le champ `themesCouverts` de chaque QCM reste INFORMATIF : il dit de quoi parle
 * le document, il ne sert pas à l'attribuer.
 */
export function questionsAfsPourModule(module) {
  if (!module) return []
  const retenues = []
  for (const qcm of QCM_AFS) {
    if (!(qcm.modules || []).includes(module.id)) continue
    for (const q of qcm.questions) {
      if (!retenues.some(r => r.id === q.id)) retenues.push({ ...q, sourceAfs: qcm.source })
    }
  }
  return retenues
}
