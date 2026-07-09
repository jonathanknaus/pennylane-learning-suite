// Proposition automatique de formateur pour une session : croise les compétences
// (modules maîtrisés) avec la disponibilité, en respectant la règle Qualiopi de
// dépôt de dossier de financement à J-15 minimum — on retient ici une marge de
// sécurité de 21 jours avant la date souhaitée pour garder une semaine de marge.

import { getSessions } from './sessions'
import { getFormateurs } from './formateurs'

export const DELAI_MIN_JOURS = 21

export function joursAvantDate(dateStr) {
  if (!dateStr) return Infinity
  const cible = new Date(dateStr + 'T00:00:00')
  const aujourd_hui = new Date()
  aujourd_hui.setHours(0, 0, 0, 0)
  return Math.round((cible - aujourd_hui) / (1000 * 60 * 60 * 24))
}

export function respecteDelaiQualiopi(dateStr) {
  return joursAvantDate(dateStr) >= DELAI_MIN_JOURS
}

// Un formateur est considéré occupé s'il a déjà une session confirmée/en cours
// à la même date (pas de double-booking).
function estOccupe(formateurId, dateStr, excludeSessionId) {
  if (!dateStr) return false
  return getSessions().some(s =>
    s.id !== excludeSessionId &&
    s.date === dateStr &&
    ['brouillon', 'confirme', 'en_cours'].includes(s.statut) &&
    (s.formateurId === formateurId || s.formateurAppuiId === formateurId)
  )
}

// Retourne les formateurs actifs maîtrisant tous les modules de la session, triés
// par nombre de compétences correspondantes puis disponibilité, avec la session
// courante exclue du calcul de double-booking (utile en édition).
export function suggererFormateurs(moduleIds, dateStr, { excludeSessionId } = {}) {
  const formateurs = getFormateurs().filter(f => f.actif)
  const modules = moduleIds || []

  return formateurs
    .map(f => {
      const competences = f.competences || []
      const nbModulesCouverts = modules.filter(m => competences.includes(m)).length
      const couvreTout = modules.length > 0 && nbModulesCouverts === modules.length
      const disponible = !estOccupe(f.id, dateStr, excludeSessionId)
      return { formateur: f, nbModulesCouverts, couvreTout, disponible }
    })
    .filter(r => r.nbModulesCouverts > 0 || modules.length === 0)
    .sort((a, b) => {
      if (a.couvreTout !== b.couvreTout) return a.couvreTout ? -1 : 1
      if (a.disponible !== b.disponible) return a.disponible ? -1 : 1
      return b.nbModulesCouverts - a.nbModulesCouverts
    })
}
