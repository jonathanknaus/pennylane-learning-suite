import { useState } from 'react'
// Pour chaque module retenu : le NIVEAU des participants et l'AMPLEUR voulue.
//
// Remplace la question unique « quel est le niveau actuel de vos équipes ? ».
// Motif : un cabinet est couramment expert en tenue et débutant en TVA. Un
// niveau global oblige à moyenner, et le formateur arrive sans savoir où est la
// marche. Le formulaire Google demandait déjà un niveau par thématique ; comme
// le cabinet choisit ses MODULES, on descend d'un cran — plus précis, et sans
// rien demander de plus puisque la sélection existe déjà.
//
// ⚠️ Comme pour ChoixMultiple, la valeur est une CHAÎNE : les règles Firebase
// n'acceptent que des chaînes sous `…/besoins/<session>/reponses/<question>`.
// Format : « id_module=niveau, id_module=niveau ». Aucun id de module ne
// contient « = » ni « , » (vérifié sur les 66 modules des trois sources), donc
// la relecture est sans ambiguïté.
//
// Le niveau n'entre PAS dans le calcul du prix : la grille ne dépend que de la
// durée, de la modalité et du nombre de participants. C'est une information pour
// le formateur, et l'interface ne doit pas laisser croire autre chose.

import { FORMATS, formatSuggere, formatIncoherent, libelleDuree } from '../data/durees-modules'

export const NIVEAUX_PARTICIPANTS = [
  { id: 'debutant', label: 'Débutant' },
  { id: 'intermediaire', label: 'Intermédiaire' },
  { id: 'expert', label: 'Expert' },
]

const IDS_NIVEAUX = NIVEAUX_PARTICIPANTS.map(n => n.id)

/**
 * Chaîne stockée → { idModule: valeur }. Ignore ce qui n'est pas reconnu.
 * `idsPermis` permet de réutiliser le même format de stockage pour l'ampleur
 * (rappel / approfondissement / fondamentaux) sans dupliquer la mécanique.
 */
export function decomposerNiveaux(valeur, idsPermis) {
  const permis = idsPermis || IDS_NIVEAUX
  const table = {}
  for (const bloc of String(valeur || '').split(',')) {
    const [id, v] = bloc.split('=').map(s => (s || '').trim())
    if (id && permis.includes(v)) table[id] = v
  }
  return table
}

/**
 * { idModule: niveau } → chaîne stockée.
 * `idsRetenus` borne le résultat aux modules encore sélectionnés : sans ça, un
 * module décoché — ou disparu du catalogue — laisserait son niveau derrière lui
 * et le formateur lirait un niveau sur un module qui n'est pas au programme.
 */
export function composerNiveaux(table, idsRetenus, idsPermis) {
  const permis = idsPermis || IDS_NIVEAUX
  const ordre = Array.isArray(idsRetenus) ? idsRetenus : Object.keys(table || {})
  return ordre
    .filter(id => permis.includes((table || {})[id]))
    .map(id => `${id}=${table[id]}`)
    .join(', ')
}

/** Modules retenus dont l'ampleur n'est pas précisée. */
export function ampleursManquantes(valeur, modules, idsFormats) {
  const table = decomposerNiveaux(valeur, idsFormats)
  return (modules || []).filter(m => !table[m.id])
}

/** Modules retenus dont le niveau n'est pas renseigné. */
export function niveauxManquants(valeur, modules) {
  const table = decomposerNiveaux(valeur)
  return (modules || []).filter(m => !table[m.id])
}

export function libelleNiveau(id) {
  return NIVEAUX_PARTICIPANTS.find(n => n.id === id)?.label || ''
}

export default function ModulesRetenus({
  modules = [], valeur, onChange, formats, onChangeFormats, classe = '',
}) {
  const niveaux = decomposerNiveaux(valeur)
  const ampleurs = decomposerNiveaux(formats, FORMATS.map(f => f.id))
  const ids = modules.map(m => m.id)
  const [ouvert, setOuvert] = useState(null)

  function definirNiveau(moduleId, niveau) {
    const apres = { ...niveaux }
    // Recliquer sur le niveau déjà choisi l'annule : sans ça, un clic par erreur
    // serait impossible à défaire.
    if (apres[moduleId] === niveau) delete apres[moduleId]
    else apres[moduleId] = niveau
    onChange(composerNiveaux(apres, ids))

    // Le niveau suggère l'ampleur, et seulement si rien n'a encore été choisi :
    // on aide au premier passage sans jamais défaire un choix explicite.
    if (onChangeFormats && apres[moduleId] && !ampleurs[moduleId]) {
      const suite = { ...ampleurs, [moduleId]: formatSuggere(apres[moduleId]) }
      onChangeFormats(composerNiveaux(suite, ids, FORMATS.map(f => f.id)))
    }
  }

  function definirFormat(moduleId, idFormat) {
    if (!onChangeFormats) return
    const apres = { ...ampleurs }
    if (apres[moduleId] === idFormat) delete apres[moduleId]
    else apres[moduleId] = idFormat
    onChangeFormats(composerNiveaux(apres, ids, FORMATS.map(f => f.id)))
  }

  if (modules.length === 0) return null

  return (
    <div className={`nm-liste ${classe}`}>
      {modules.map(m => {
        const alerte = formatIncoherent(niveaux[m.id], ampleurs[m.id])
        return (
          <div key={m.id} className="nm-ligne">
            <div className="nm-tete">
              <span className="nm-module">{m.titre}</span>
              <div className="nm-choix">
                {NIVEAUX_PARTICIPANTS.map(n => (
                  <button
                    key={n.id}
                    type="button"
                    className={`nm-niveau ${niveaux[m.id] === n.id ? 'actif' : ''}`}
                    aria-pressed={niveaux[m.id] === n.id}
                    onClick={() => definirNiveau(m.id, n.id)}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            {onChangeFormats && (
              <>
                <div className="nm-formats">
                  {FORMATS.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      className={`nm-format ${ampleurs[m.id] === f.id ? 'actif' : ''}`}
                      aria-pressed={ampleurs[m.id] === f.id}
                      onClick={() => definirFormat(m.id, f.id)}
                      onMouseEnter={() => setOuvert(`${m.id}_${f.id}`)}
                      onMouseLeave={() => setOuvert(null)}
                    >
                      <span className="nm-format-duree">{libelleDuree(f.heures)}</span>
                      <span className="nm-format-label">{f.label}</span>
                      <span className="nm-format-accroche">{f.accroche}</span>
                    </button>
                  ))}
                </div>
                {FORMATS.filter(f => ouvert === `${m.id}_${f.id}` || (ouvert === null && ampleurs[m.id] === f.id)).map(f => (
                  <p key={f.id} className="nm-format-explication">{f.explication}</p>
                ))}
                {alerte && <p className="nm-alerte">{alerte}</p>}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
