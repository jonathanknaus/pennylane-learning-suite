import { pousser, lireCache } from './store-firebase'

const KEY = 'pls_parametres'

export const TEMPLATE_ACCES_CABINET_DEFAUT = {
  objet: `Vos accès — Espace cabinet AFS Pennylane`,
  corps: `Bonjour {{contact_nom}},

Votre espace cabinet AFS Pennylane est maintenant ouvert.

Vous pourrez y décrire votre besoin de formation et déclarer les personnes à former.

🔗 Lien d'accès : {{lien}}

Aucun mot de passe à créer : saisissez simplement votre adresse {{contact_email}} sur cette page, et vous recevrez un lien de connexion par email.

Si vous avez besoin d'une adaptation liée à un prérequis ou à une situation de handicap, signalez-le nous directement : nous ne recueillons pas cette information par le formulaire.

Cordialement,
{{of_signataire}}
{{of_titre}} — {{of_nom}}`,
}

// Modèle du mail qui accompagne la synthèse de demande de formation.
//
// ⚠️ ADRESSE D'EXPÉDITION — Jonathan a demandé « afs-training@gmail.com ». Ce
// sont ici `of_email` et la copie ci-dessous qui font foi, et elles pointent sur
// afs-training@pennylane.com : une boîte Gmail grand public ferait transiter des
// données de cabinets hors des outils validés (ISO 27001, RGPD prépondérante),
// alors que l'adresse Workspace existe déjà. Modifiable, donc son arbitrage —
// mais l'écart devait être signalé plutôt que recopié en silence.
export const TEMPLATE_SYNTHESE_BESOIN_DEFAUT = {
  copie: 'afs-training@pennylane.com',
  objet: 'Votre demande de formation — {{cabinet}}',
  corps: `Bonjour,

Nous avons bien reçu votre demande de formation du {{date}} et vous en remercions.

Vous trouverez ci-joint la synthèse de votre analyse de besoin, qui reprend vos réponses, les modules retenus et l'estimation tarifaire :

• Modules retenus : {{modules}}
• Durée cumulée : {{duree}}
• Participants : {{participants}} — {{modalite}}
• Estimation : {{estimation}}

Cette estimation est indicative et ne constitue pas un devis : elle sera confirmée après échange avec vous.

Si une adaptation est nécessaire pour l'un des participants, quelle qu'en soit la raison, parlons-en directement : nous étudierons les aménagements possibles.

Prochaine étape : nous revenons vers vous pour caler les dates et vous transmettre la convention de formation.

Cordialement,
{{of_signataire}}
{{of_titre}} — {{of_nom}}`,
}

const DEFAUTS = {
  of_nom:        'PENNYLANE',
  of_siret:      '88026592100044',
  of_adresse:    '2 RUE JULES LEFEBVRE 75009 PARIS',
  of_da:         '28 50 01542 50',
  of_signataire: 'Jonathan Knaus',
  of_titre:      'Team Lead Accounting Firm Services',
  of_email:      'afs-training@pennylane.com',
  of_tel:        '',
  mail_acces_cabinet_objet: TEMPLATE_ACCES_CABINET_DEFAUT.objet,
  mail_acces_cabinet_corps: TEMPLATE_ACCES_CABINET_DEFAUT.corps,
  mail_synthese_besoin_copie: TEMPLATE_SYNTHESE_BESOIN_DEFAUT.copie,
  mail_synthese_besoin_objet: TEMPLATE_SYNTHESE_BESOIN_DEFAUT.objet,
  mail_synthese_besoin_corps: TEMPLATE_SYNTHESE_BESOIN_DEFAUT.corps,
}

export function getParametres() {
  // `lireCache` plutôt que localStorage brut : la valeur partagée fait foi dès
  // que la collection est déclarée migrée, sinon le cache local. Les modèles de
  // mails sont des textes d'équipe — modifiés par l'un, ils doivent valoir pour
  // les autres, pas rester sur le poste où on les a retouchés.
  const stored = lireCache(KEY, {})
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return { ...DEFAUTS }
  return { ...DEFAUTS, ...stored }
}

export function saveParametres(data) {
  const current = getParametres()
  const updated = { ...current, ...data }
  localStorage.setItem(KEY, JSON.stringify(updated))
  pousser(KEY, updated)
  return updated
}

export function getParametre(cle) {
  return getParametres()[cle] ?? ''
}

export function interpolerTemplate(texte, vars) {
  return Object.entries(vars).reduce((t, [k, v]) => t.replaceAll(`{{${k}}}`, v || ''), texte)
}

export const CHAMPS_OF = [
  { cle: 'of_nom',        label: 'Nom de l\'organisme',      placeholder: 'PENNYLANE' },
  { cle: 'of_siret',      label: 'SIRET',                    placeholder: '88026592100044' },
  { cle: 'of_adresse',    label: 'Adresse',                  placeholder: '2 RUE JULES LEFEBVRE 75009 PARIS' },
  { cle: 'of_da',         label: 'N° déclaration activité',  placeholder: '28 50 01542 50' },
  { cle: 'of_signataire', label: 'Signataire (nom complet)', placeholder: 'Jonathan Knaus' },
  { cle: 'of_titre',      label: 'Titre du signataire',      placeholder: 'Team Lead Accounting Firm Services' },
  { cle: 'of_email',      label: 'Email d\'envoi',           placeholder: 'afs-training@pennylane.com' },
  { cle: 'of_tel',        label: 'Téléphone',                placeholder: '+33 1 XX XX XX XX' },
]
