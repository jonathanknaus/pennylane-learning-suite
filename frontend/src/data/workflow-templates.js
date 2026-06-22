export function getTemplate(stepId, session) {
  const date = session.date
    ? new Date(session.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '[DATE À CONFIRMER]'
  const heure = session.heure || '[HEURE]'
  const client = session.client || '[CLIENT]'
  const titre = session.titre || '[TITRE]'
  const formateur = session.formateur || '[FORMATEUR]'
  const lien = session.lien_reunion || '[LIEN RÉUNION]'
  const modaliteLabel = session.modalite === 'presentiel' ? 'Présentiel' : session.modalite === 'mixte' ? 'Mixte' : 'Visioconférence'

  const TEMPLATES = {
    questionnaire_besoins: {
      objet: `[Formation AFS] Questionnaire de besoins — ${titre}`,
      corps: `Bonjour,\n\nSuite à notre échange au sujet de la formation "${titre}", je vous adresse notre questionnaire de besoins.\n\nObjectif : adapter au mieux le contenu et le programme à vos équipes.\n\n→ [INSÉRER LIEN QUESTIONNAIRE]\n\nMerci de le compléter idéalement avant le [DATE LIMITE].\n\nCordialement,\n${formateur}\nÉquipe Formation AFS — Pennylane`,
    },
    collecte_dates: {
      objet: `[Formation AFS] Confirmation date & participants — ${titre}`,
      corps: `Bonjour,\n\nNous revenons vers vous pour confirmer les modalités de la formation "${titre}".\n\nNous vous proposons le ${date} à ${heure}. Merci de nous confirmer :\n\n1. Si cette date vous convient\n2. La liste définitive des participants (nom, prénom, email)\n\nSans confirmation sous 5 jours ouvrés, nous vous contacterons par téléphone.\n\nCordialement,\n${formateur}\nÉquipe Formation AFS — Pennylane`,
    },
    devis: {
      objet: `[Formation AFS] Devis — ${titre}`,
      corps: `Bonjour,\n\nVeuillez trouver en pièce jointe notre devis pour la formation "${titre}" prévue le ${date}.\n\nÀ réception de votre accord, nous vous adresserons la convention de formation.\n\nSans retour sous 3 jours ouvrés, nous nous permettrons de vous relancer.\n\nCordialement,\n${formateur}\nÉquipe Formation AFS — Pennylane`,
    },
    convention: {
      objet: `[Formation AFS] Convention + programme à valider — ${titre}`,
      corps: `Bonjour Sarah,\n\nMerci de trouver ci-joint la convention de formation et le programme pour :\n\n• Session : ${titre}\n• Client : ${client}\n• Date : ${date}\n\nMerci de valider ces documents avant envoi au client.\n\nCordialement,\n${formateur}`,
    },
    convocation: {
      objet: `[Formation AFS] Convocation — ${titre} — ${date}`,
      corps: `Bonjour [PRÉNOM],\n\nNous avons le plaisir de vous convoquer à la formation suivante :\n\n📚 Formation : ${titre}\n📅 Date : ${date}\n⏰ Heure : ${heure}\n📡 Modalité : ${modaliteLabel}${session.modalite !== 'presentiel' ? `\n🔗 Lien : ${lien}` : ''}\n\nVeuillez trouver le programme détaillé en pièce jointe.\n\nEn cas d'empêchement, merci de nous prévenir au moins 48h à l'avance.\n\nCordialement,\n${formateur}\nÉquipe Formation AFS — Pennylane`,
    },
    emargement: {
      objet: `[Formation AFS] Émargement & rapport — ${titre}`,
      corps: `Bonjour,\n\nLa session "${titre}" du ${date} s'est terminée.\n\nMerci de compléter les documents suivants (requis Qualiopi) :\n\n1. Feuille d'émargement → [LIEN ÉMARGEMENT]\n2. Rapport de fin de session → [LIEN RAPPORT]\n\nDélai : 48h maximum.\n\nCordialement,\n${formateur}\nÉquipe Formation AFS — Pennylane`,
    },
    certificat: {
      objet: `[Formation AFS] Certificat de réalisation — ${titre}`,
      corps: `Bonjour,\n\nVeuillez trouver en pièce jointe le certificat de réalisation pour la formation "${titre}" du ${date}.\n\nCe document atteste de la bonne réalisation de la formation pour l'ensemble des participants présents.\n\nCordialement,\n${formateur}\nÉquipe Formation AFS — Pennylane`,
    },
    attestation: {
      objet: `[Formation AFS] Attestation de formation — ${titre}`,
      corps: `Bonjour [PRÉNOM],\n\nVeuillez trouver ci-joint votre attestation individuelle de participation à la formation "${titre}" du ${date}.\n\nCe document certifie votre présence et participation à l'intégralité de la session.\n\nCordialement,\n${formateur}\nÉquipe Formation AFS — Pennylane`,
    },
  }

  return TEMPLATES[stepId] || null
}
