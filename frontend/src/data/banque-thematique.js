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
