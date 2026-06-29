const KEY = 'pls_parametres'

export const TEMPLATE_ACCES_CABINET_DEFAUT = {
  objet: `Vos accès — Espace cabinet AFS Pennylane`,
  corps: `Bonjour {{contact_nom}},

Votre espace cabinet AFS Pennylane est maintenant disponible.

Vous pouvez y accéder à tout moment pour consulter vos formations et remplir le questionnaire de besoin.

🔗 Lien d'accès : {{lien}}

🔑 Email : {{contact_email}}
🔑 Code d'accès : {{code}}

Conservez ces informations, elles vous permettront de vous connecter à tout moment.

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
}

export function getParametres() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { ...DEFAUTS, ...stored }
  } catch {
    return { ...DEFAUTS }
  }
}

export function saveParametres(data) {
  const current = getParametres()
  const updated = { ...current, ...data }
  localStorage.setItem(KEY, JSON.stringify(updated))
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
