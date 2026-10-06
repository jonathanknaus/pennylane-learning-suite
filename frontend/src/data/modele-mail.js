// Mail accompagnant la synthèse de demande de formation.
//
// Le texte vit dans `parametres.js` (`mail_synthese_besoin_*`), à côté du modèle
// d'accès cabinet : un seul endroit pour les modèles de mails, modifiables
// depuis Paramètres sans déploiement — et tout déploiement republie le site.
//
// ⚠️ PLS NE PEUT PAS ENVOYER CE MAIL LUI-MÊME. Le site est statique (GitHub
// Pages) et son bundle est public : y mettre un identifiant SMTP reviendrait à
// le publier, ce qui est exactement ce qui s'est produit avec le token GitHub
// inliné par Vite. Le backend Python sait envoyer mais n'est pas déployé. D'ici
// là, l'outil ouvre le mail pré-rempli dans le client de messagerie et le PDF se
// joint à la main : rien ne part à l'insu de personne, aucun secret n'est exposé.

import { getParametres, saveParametres, TEMPLATE_SYNTHESE_BESOIN_DEFAUT } from './parametres'

// Variables substituables, listées dans l'éditeur pour être découvrables sans
// documentation à côté.
export const VARIABLES_MAIL = [
  { cle: 'cabinet', description: 'Nom du cabinet' },
  { cle: 'date', description: 'Date de la demande' },
  { cle: 'modules', description: 'Modules retenus, séparés par des virgules' },
  { cle: 'duree', description: 'Durée cumulée (ex. : 3h30)' },
  { cle: 'participants', description: 'Nombre de participants' },
  { cle: 'modalite', description: 'Présentiel, visioconférence ou webinar' },
  { cle: 'estimation', description: 'Montant estimé, ou « sur devis »' },
  { cle: 'niveaux', description: 'Niveau des participants, module par module' },
  { cle: 'ampleurs', description: 'Ampleur retenue par module (rappel, approfondissement, fondamentaux)' },
  { cle: 'of_signataire', description: 'Signataire (paramètres de l\'organisme)' },
  { cle: 'of_titre', description: 'Titre du signataire' },
  { cle: 'of_nom', description: 'Nom de l\'organisme' },
  { cle: 'of_email', description: 'Adresse d\'envoi AFS' },
]

/**
 * Remplace les {{variables}}. Une variable inconnue ou vide donne une chaîne
 * vide, jamais « {{machin}} » : un modèle mal rempli doit produire un mail
 * maladroit, pas un mail qui expose la mécanique au cabinet.
 */
export function appliquerModele(texte, variables = {}) {
  return String(texte || '').replace(/\{\{\s*(\w+)\s*\}\}/g, (_, cle) => {
    const v = variables[cle]
    return v === undefined || v === null ? '' : String(v)
  })
}

/** Variables réellement employées par le modèle et restées vides. */
export function variablesManquantes(modele, variables = {}) {
  const texte = `${modele?.objet || ''} ${modele?.corps || ''}`
  const utilisees = new Set()
  for (const m of texte.matchAll(/\{\{\s*(\w+)\s*\}\}/g)) utilisees.add(m[1])
  return [...utilisees].filter(c => {
    const v = variables[c]
    return v === undefined || v === null || String(v).trim() === ''
  })
}

export function getModeleSynthese() {
  const p = getParametres()
  return {
    expediteur: p.of_email || '',
    copie: p.mail_synthese_besoin_copie || '',
    objet: p.mail_synthese_besoin_objet || '',
    corps: p.mail_synthese_besoin_corps || '',
  }
}

export function saveModeleSynthese(modele) {
  return saveParametres({
    mail_synthese_besoin_copie: String(modele?.copie || '').trim(),
    mail_synthese_besoin_objet: String(modele?.objet || '').trim(),
    mail_synthese_besoin_corps: String(modele?.corps || ''),
  })
}

export function resetModeleSynthese() {
  return saveModeleSynthese(TEMPLATE_SYNTHESE_BESOIN_DEFAUT)
}

/** Variables tirées des paramètres de l'organisme, communes à tous les envois. */
export function variablesOrganisme() {
  const p = getParametres()
  return {
    of_signataire: p.of_signataire || '',
    of_titre: p.of_titre || '',
    of_nom: p.of_nom || '',
    of_email: p.of_email || '',
  }
}

/**
 * Construit le lien `mailto:` qui ouvre le client de messagerie pré-rempli.
 *
 * ⚠️ Le protocole mailto NE PERMET PAS de joindre un fichier : limite du
 * protocole, pas un choix d'implémentation. Le PDF est donc produit à côté et
 * joint à la main. Les clients tronquent au-delà de ~2 000 caractères, d'où un
 * corps volontairement court — le détail vit dans le PDF.
 */
export function lienMailto({ destinataire, modele, variables }) {
  const champs = []
  if (modele?.copie) champs.push(`cc=${encodeURIComponent(modele.copie)}`)
  champs.push(`subject=${encodeURIComponent(appliquerModele(modele?.objet, variables))}`)
  champs.push(`body=${encodeURIComponent(appliquerModele(modele?.corps, variables))}`)
  return `mailto:${encodeURIComponent(destinataire || '')}?${champs.join('&')}`
}
