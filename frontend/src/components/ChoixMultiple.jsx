import { useState } from 'react'

// Choix multiple avec option libre, pour les questions du questionnaire de
// besoin où plusieurs réponses se cumulent (« postes occupés par les
// participants » : un cabinet envoie souvent des collaborateurs ET un chef de
// mission).
//
// ⚠️ La valeur est une CHAÎNE, pas un tableau. Deux raisons :
//   1. Les règles Firebase n'acceptent que des chaînes sous
//      `cabinets/<clé>/besoins/<session>/reponses/<question>` — un tableau
//      serait refusé à l'écriture, et `enregistrerBesoin()` l'écarte déjà.
//   2. La validation des champs obligatoires teste une chaîne non vide : rien
//      à adapter, le même code vaut pour tous les types de questions.
//
// Les valeurs sont séparées par « , ». Au rechargement, toute valeur absente
// des options connues est traitée comme la saisie libre : on retrouve donc
// l'état sans avoir à stocker la structure à côté.

export function separer(valeur) {
  return String(valeur || '').split(',').map(s => s.trim()).filter(Boolean)
}

/** Décompose une valeur stockée en { cochees, libre }. */
export function decomposer(valeur, options = []) {
  const parties = separer(valeur)
  return {
    cochees: options.filter(o => parties.includes(o)),
    libre: parties.filter(p => !options.includes(p)).join(', '),
  }
}

/** Recompose la chaîne à stocker. Les options gardent leur ordre d'affichage. */
export function composerValeur(options = [], cochees = [], libre = '') {
  const ordonnees = options.filter(o => cochees.includes(o))
  return [...ordonnees, String(libre || '').trim()].filter(Boolean).join(', ')
}

export default function ChoixMultiple({ id, options = [], valeur, onChange, classe = '', labelLibre = 'Autre' }) {
  const { cochees, libre } = decomposer(valeur, options)

  // Garde la case « Autre » ouverte entre le clic et la saisie : sans cet état,
  // cocher la case ne produirait rien de visible tant que le champ est vide.
  const [libreOuvert, setLibreOuvert] = useState(libre !== '')

  function composer(nouvellesCochees, nouveauLibre) {
    onChange(composerValeur(options, nouvellesCochees, nouveauLibre))
  }

  function basculer(option) {
    const apres = cochees.includes(option) ? cochees.filter(o => o !== option) : [...cochees, option]
    composer(apres, libre)
  }

  function basculerLibre() {
    if (libreOuvert) {
      setLibreOuvert(false)
      composer(cochees, '')   // décocher « Autre » retire la saisie libre
    } else {
      setLibreOuvert(true)
    }
  }

  return (
    <div className={`cm-groupe ${classe}`}>
      {options.map(o => (
        <label key={o} className={`cm-option ${cochees.includes(o) ? 'selected' : ''}`}>
          <input
            type="checkbox"
            name={id}
            value={o}
            checked={cochees.includes(o)}
            onChange={() => basculer(o)}
          />
          {o}
        </label>
      ))}

      <label className={`cm-option ${libreOuvert ? 'selected' : ''}`}>
        <input type="checkbox" checked={libreOuvert} onChange={basculerLibre} />
        {labelLibre}
      </label>

      {libreOuvert && (
        <input
          className="cm-libre"
          type="text"
          placeholder="Précisez…"
          value={libre}
          onChange={e => composer(cochees, e.target.value)}
        />
      )}
    </div>
  )
}
