import { useState, useMemo } from 'react'
import { getAllModules, SOURCES_MODULE } from '../data/catalogue-afs'
import {
  dureeModule, origineDuree, dureeConfirmee, enregistrerDuree, etatCouverture,
  suggestions, libelleDuree, DUREES_PROPOSEES, DUREE_PROPOSEE_DEFAUT,
} from '../data/durees-modules'
import './DureesModules.css'

// Saisie de la durée pédagogique de chaque module.
//
// Pourquoi cet écran existe : le simulateur de tarif part de la durée pour
// déduire le format, donc le prix. Une durée fausse produit un prix faux. Les
// modules importés de SmartOF portent la leur, les 23 modules historiques de PLS
// n'en ont aucune — c'est ici qu'on les renseigne.
//
// Trois origines, toujours affichées :
//   catalogue — venue de SmartOF, fait foi, non modifiable ici
//   saisie    — renseignée à la main, fait foi
//   proposee  — convention de 1 h, À CONFIRMER

const ORIGINES = {
  catalogue: { label: 'Catalogue', classe: 'dm-o-catalogue', aide: 'Importée de SmartOF — fait foi' },
  saisie:    { label: 'Saisie',    classe: 'dm-o-saisie',    aide: 'Renseignée à la main' },
  proposee:  { label: 'À confirmer', classe: 'dm-o-proposee', aide: `Convention de ${DUREE_PROPOSEE_DEFAUT} h, non vérifiée` },
}

export default function DureesModules() {
  const [version, setVersion] = useState(0)
  const [filtre, setFiltre] = useState('a_confirmer')
  const [recherche, setRecherche] = useState('')

  // `version` force le recalcul après chaque enregistrement : les durées vivent
  // hors de React (cache + Firebase), elles ne sont pas un état de composant.
  const modules = useMemo(() => getAllModules(), [version])
  const couverture = useMemo(() => etatCouverture(modules), [modules, version])

  function definir(moduleId, heures) {
    enregistrerDuree(moduleId, heures)
    setVersion(v => v + 1)
  }

  const visibles = modules.filter(m => {
    if (recherche && !`${m.titre} ${m.thematique}`.toLowerCase().includes(recherche.toLowerCase())) return false
    if (filtre === 'tous') return true
    if (filtre === 'a_confirmer') return !dureeConfirmee(m)
    return origineDuree(m) === filtre
  })

  return (
    <div className="param-section">
      <div className="param-section-header">
        <h2>Durées des modules</h2>
        <p>La durée sert au simulateur de tarif : elle détermine le format, donc le prix</p>
      </div>

      <div className="dm-couverture">
        <div className="dm-stat">
          <span className="dm-stat-val">{couverture.total}</span>
          <span className="dm-stat-lbl">modules</span>
        </div>
        <div className="dm-stat dm-stat-ok">
          <span className="dm-stat-val">{couverture.catalogue}</span>
          <span className="dm-stat-lbl">venus du catalogue</span>
        </div>
        <div className="dm-stat dm-stat-ok">
          <span className="dm-stat-val">{couverture.saisie}</span>
          <span className="dm-stat-lbl">renseignés</span>
        </div>
        <div className={`dm-stat ${couverture.proposee > 0 ? 'dm-stat-warn' : 'dm-stat-ok'}`}>
          <span className="dm-stat-val">{couverture.proposee}</span>
          <span className="dm-stat-lbl">à confirmer</span>
        </div>
      </div>

      {couverture.proposee > 0 && (
        <p className="dm-alerte">
          <strong>{couverture.proposee} module{couverture.proposee > 1 ? 's' : ''}</strong> {couverture.proposee > 1 ? 'reposent' : 'repose'} sur
          la convention de {DUREE_PROPOSEE_DEFAUT} h, déduite de ta grille — qui énonce
          « Session 1h = 1 ou 2 modules ». Ce n'est pas une mesure. Toute estimation qui en dépend
          sera signalée comme à confirmer auprès du cabinet.
        </p>
      )}

      <div className="dm-barre">
        <div className="filtre-statut" style={{ marginBottom: 0 }}>
          {[
            { id: 'a_confirmer', label: `À confirmer (${couverture.proposee})` },
            { id: 'saisie', label: `Renseignés (${couverture.saisie})` },
            { id: 'catalogue', label: `Catalogue (${couverture.catalogue})` },
            { id: 'tous', label: `Tous (${couverture.total})` },
          ].map(f => (
            <button
              key={f.id}
              className={`filtre-btn ${filtre === f.id ? 'actif' : ''}`}
              onClick={() => setFiltre(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          className="dm-recherche"
          type="search"
          placeholder="Rechercher un module…"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
        />
      </div>

      {visibles.length === 0 ? (
        <p className="acces-empty">
          {filtre === 'a_confirmer'
            ? 'Toutes les durées sont établies. Le simulateur donnera des estimations confirmées.'
            : 'Aucun module pour ce filtre.'}
        </p>
      ) : (
        <div className="acces-users-table-wrap">
          <table className="acces-table dm-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Thématique</th>
                <th>Source</th>
                <th>Durée</th>
                <th>Origine</th>
                <th>Suggestions</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map(m => {
                const origine = origineDuree(m)
                const o = ORIGINES[origine]
                const duree = dureeModule(m)
                const verrouille = origine === 'catalogue'
                const sugg = verrouille ? [] : suggestions(m, modules)
                return (
                  <tr key={m.id} className={origine === 'proposee' ? 'dm-ligne-a-confirmer' : ''}>
                    <td className="dm-titre">{m.titre}</td>
                    <td className="dm-them">{m.thematique}</td>
                    <td>
                      <span className="dm-source">{SOURCES_MODULE[m.source]?.label || m.source || '—'}</span>
                    </td>
                    <td>
                      {verrouille ? (
                        <span className="dm-duree-fixe" title="Durée importée de SmartOF — elle fait foi">
                          {libelleDuree(duree)}
                        </span>
                      ) : (
                        <select
                          className="dm-select"
                          value={origine === 'saisie' ? duree : ''}
                          onChange={e => definir(m.id, e.target.value)}
                        >
                          <option value="">— à renseigner —</option>
                          {DUREES_PROPOSEES.map(h => (
                            <option key={h} value={h}>{libelleDuree(h)}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td>
                      <span className={`dm-origine ${o.classe}`} title={o.aide}>{o.label}</span>
                    </td>
                    <td className="dm-sugg">
                      {sugg.length === 0 ? (
                        <span className="td-vide">—</span>
                      ) : (
                        sugg.map(s => (
                          <button
                            key={s.id}
                            className="dm-sugg-btn"
                            title={`Module SmartOF au libellé proche : « ${s.titre} ». Vérifie que c'est bien le même contenu avant d'adopter sa durée.`}
                            onClick={() => definir(m.id, s.duree)}
                          >
                            {libelleDuree(s.duree)} · {s.titre.slice(0, 32)}{s.titre.length > 32 ? '…' : ''}
                          </button>
                        ))
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="acces-pwd-hint" style={{ marginTop: 14 }}>
        Les suggestions viennent de modules SmartOF dont le libellé ressemble à celui de la ligne.
        Elles ne sont <strong>jamais</strong> appliquées automatiquement : un rapprochement par
        libellé se trompe facilement — « Saisie comptable » tombait sur « RFE, optimisation de la
        saisie ». Vérifie avant d'adopter.
      </p>
    </div>
  )
}
