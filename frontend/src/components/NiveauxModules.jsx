// Niveau des participants, module par module.
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

export const NIVEAUX_PARTICIPANTS = [
  { id: 'debutant', label: 'Débutant' },
  { id: 'intermediaire', label: 'Intermédiaire' },
  { id: 'expert', label: 'Expert' },
]

const IDS_NIVEAUX = NIVEAUX_PARTICIPANTS.map(n => n.id)

/** Chaîne stockée → { idModule: niveau }. Ignore ce qui n'est pas reconnu. */
export function decomposerNiveaux(valeur) {
  const table = {}
  for (const bloc of String(valeur || '').split(',')) {
    const [id, niveau] = bloc.split('=').map(s => (s || '').trim())
    if (id && IDS_NIVEAUX.includes(niveau)) table[id] = niveau
  }
  return table
}

/**
 * { idModule: niveau } → chaîne stockée.
 * `idsRetenus` borne le résultat aux modules encore sélectionnés : sans ça, un
 * module décoché — ou disparu du catalogue — laisserait son niveau derrière lui
 * et le formateur lirait un niveau sur un module qui n'est pas au programme.
 */
export function composerNiveaux(table, idsRetenus) {
  const ordre = Array.isArray(idsRetenus) ? idsRetenus : Object.keys(table || {})
  return ordre
    .filter(id => IDS_NIVEAUX.includes((table || {})[id]))
    .map(id => `${id}=${table[id]}`)
    .join(', ')
}

/** Modules retenus dont le niveau n'est pas renseigné. */
export function niveauxManquants(valeur, modules) {
  const table = decomposerNiveaux(valeur)
  return (modules || []).filter(m => !table[m.id])
}

export function libelleNiveau(id) {
  return NIVEAUX_PARTICIPANTS.find(n => n.id === id)?.label || ''
}

export default function NiveauxModules({ modules = [], valeur, onChange, classe = '' }) {
  const table = decomposerNiveaux(valeur)
  const ids = modules.map(m => m.id)

  function definir(moduleId, niveau) {
    const apres = { ...table }
    // Recliquer sur le niveau déjà choisi l'annule : sans ça, un clic par
    // erreur serait impossible à défaire.
    if (apres[moduleId] === niveau) delete apres[moduleId]
    else apres[moduleId] = niveau
    onChange(composerNiveaux(apres, ids))
  }

  if (modules.length === 0) return null

  return (
    <div className={`nm-liste ${classe}`}>
      {modules.map(m => (
        <div key={m.id} className="nm-ligne">
          <span className="nm-module">{m.titre}</span>
          <div className="nm-choix">
            {NIVEAUX_PARTICIPANTS.map(n => (
              <button
                key={n.id}
                type="button"
                className={`nm-niveau ${table[m.id] === n.id ? 'actif' : ''}`}
                aria-pressed={table[m.id] === n.id}
                onClick={() => definir(m.id, n.id)}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
