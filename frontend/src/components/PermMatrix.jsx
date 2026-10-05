import { MODULES_ACCES, permVide } from '../data/firebase-config'

// Case à cocher custom : les cases natives restaient illisibles à l'état
// désactivé, quelle que soit la valeur d'accent-color.
function PermCheck({ checked, onChange, readOnly }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={readOnly ? undefined : onChange}
      className={`perm-check ${checked ? 'perm-check-on' : ''} ${readOnly ? 'perm-check-readonly' : ''}`}
    >
      {checked && (
        <svg viewBox="0 0 12 10" fill="none" className="perm-check-svg">
          <polyline points="1.5,5 4.5,8.5 10.5,1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

// Applique les règles de cohérence : écriture implique lecture, qui implique
// l'accès ; retirer l'accès retire tout le reste.
export function appliquerCoherence(courant, champ) {
  let suivant = { ...courant, [champ]: !courant[champ] }
  if (champ === 'acces' && !suivant.acces) return { acces: false, lecture: false, ecriture: false }
  if (champ === 'lecture' && suivant.lecture) suivant.acces = true
  if (champ === 'lecture' && !suivant.lecture) suivant.ecriture = false
  if (champ === 'ecriture' && suivant.ecriture) { suivant.acces = true; suivant.lecture = true }
  return suivant
}

// Matrice module × (accès / lecture / écriture).
// `onChange(moduleId, nouvellePerm)` n'est appelé qu'en mode éditable.
export default function PermMatrix({ perms, onChange, readOnly }) {
  function basculer(moduleId, champ) {
    if (readOnly) return
    const courant = perms?.[moduleId] || permVide()
    onChange(moduleId, appliquerCoherence(courant, champ))
  }

  return (
    <div className="perm-matrix">
      <div className="perm-matrix-head">
        <div className="perm-col-module">Module</div>
        <div className="perm-col-check">Accès</div>
        <div className="perm-col-check">Lecture</div>
        <div className="perm-col-check">Écriture</div>
      </div>
      {MODULES_ACCES.map(groupe => (
        <div key={groupe.group} className="perm-group">
          <div className="perm-group-label">{groupe.group}</div>
          {groupe.items.map(item => {
            const p = perms?.[item.id] || permVide()
            return (
              <div key={item.id} className={`perm-row ${p.acces ? 'perm-row-on' : ''}`}>
                <div className="perm-col-module">{item.label}</div>
                {['acces', 'lecture', 'ecriture'].map(champ => (
                  <div key={champ} className="perm-col-check">
                    <PermCheck
                      checked={!!p[champ]}
                      onChange={() => basculer(item.id, champ)}
                      readOnly={readOnly}
                    />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// Résumé court : « 12/20 modules · 4 en écriture »
export function ResumePerms({ perms }) {
  const ids = MODULES_ACCES.flatMap(g => g.items.map(i => i.id))
  const avecAcces = ids.filter(id => perms?.[id]?.acces).length
  const enEcriture = ids.filter(id => perms?.[id]?.ecriture).length
  return (
    <span className="acces-perm-summary">
      {avecAcces}/{ids.length} modules · {enEcriture} en écriture
    </span>
  )
}
