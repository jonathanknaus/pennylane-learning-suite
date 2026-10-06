import { useState, useMemo } from 'react'
import { getAllModules, SOURCES_MODULE } from '../data/catalogue-afs'
import {
  blocsDisponibles, blocsCandidats, contenuModule, contenuSaisi,
  enregistrerContenu, etatContenu, champsQualiopi,
} from '../data/contenu-modules'
import './ContenuModules.css'

// Contenu pédagogique des modules : rattacher des blocs de programme et
// compléter à la main.
//
// Pourquoi cet écran : les 43 modules venus de SmartOF portent déjà leur
// programme et leurs champs Qualiopi, mais personne ne les voyait. Les 23 modules
// historiques de PLS, eux, n'ont aucun déroulé — or le déroulé est ce qu'on
// présente au cabinet et ce qu'un audit demande à voir.
//
// Les blocs proposés viennent des programmes déjà présents dans l'outil. Ils ne
// sont JAMAIS appliqués d'office : un intitulé proche ne garantit pas un contenu
// proche, et le rapprochement automatique par libellé s'était déjà trompé sur les
// durées des modules.

const ORIGINES = {
  saisi:     { label: 'Renseigné', classe: 'cm-o-saisi',     aide: 'Blocs rattachés ou texte saisi — fait foi' },
  catalogue: { label: 'Catalogue', classe: 'cm-o-catalogue', aide: 'Programme importé de SmartOF' },
  absent:    { label: 'À renseigner', classe: 'cm-o-absent', aide: 'Aucun contenu : ni programme, ni saisie' },
}

export default function ContenuModules() {
  const [version, setVersion] = useState(0)
  const [filtre, setFiltre] = useState('absent')
  const [recherche, setRecherche] = useState('')
  const [ouvert, setOuvert] = useState(null)
  const [brouillon, setBrouillon] = useState({ blocs: [], texte: '' })

  // Le contenu vit hors de React (cache + Firebase) : `version` force le recalcul
  // après chaque enregistrement.
  const modules = useMemo(() => getAllModules(), [version])
  const biblio = useMemo(() => blocsDisponibles(modules), [modules])
  const couverture = useMemo(() => etatContenu(modules), [modules, version])

  function ouvrir(module) {
    if (ouvert === module.id) { setOuvert(null); return }
    const saisi = contenuSaisi(module.id)
    setBrouillon({ blocs: saisi?.blocs || [], texte: saisi?.texte || '' })
    setOuvert(module.id)
  }

  function basculerBloc(cle) {
    setBrouillon(b => ({
      ...b,
      blocs: b.blocs.includes(cle) ? b.blocs.filter(x => x !== cle) : [...b.blocs, cle],
    }))
  }

  function enregistrer(moduleId) {
    enregistrerContenu(moduleId, brouillon)
    setVersion(v => v + 1)
    setOuvert(null)
  }

  function vider(moduleId) {
    if (!confirm('Retirer le contenu renseigné pour ce module ?')) return
    enregistrerContenu(moduleId, { blocs: [], texte: '' })
    setVersion(v => v + 1)
    setOuvert(null)
  }

  const visibles = modules.filter(m => {
    if (recherche && !`${m.titre} ${m.thematique}`.toLowerCase().includes(recherche.toLowerCase())) return false
    if (filtre === 'tous') return true
    return contenuModule(m, biblio).origine === filtre
  })

  return (
    <div className="param-section">
      <div className="param-section-header">
        <h2>Contenu des modules</h2>
        <p>Le déroulé présenté au cabinet, et attendu en audit</p>
      </div>

      <div className="cm-couverture">
        <div className="cm-stat">
          <span className="cm-stat-val">{couverture.total}</span>
          <span className="cm-stat-lbl">modules</span>
        </div>
        <div className="cm-stat cm-stat-ok">
          <span className="cm-stat-val">{couverture.catalogue}</span>
          <span className="cm-stat-lbl">programme SmartOF</span>
        </div>
        <div className="cm-stat cm-stat-ok">
          <span className="cm-stat-val">{couverture.saisi}</span>
          <span className="cm-stat-lbl">renseignés ici</span>
        </div>
        <div className={`cm-stat ${couverture.absent > 0 ? 'cm-stat-warn' : 'cm-stat-ok'}`}>
          <span className="cm-stat-val">{couverture.absent}</span>
          <span className="cm-stat-lbl">sans contenu</span>
        </div>
        <div className="cm-stat">
          <span className="cm-stat-val">{biblio.length}</span>
          <span className="cm-stat-lbl">blocs disponibles</span>
        </div>
      </div>

      {couverture.absent > 0 && (
        <p className="cm-alerte">
          <strong>{couverture.absent} module{couverture.absent > 1 ? 's' : ''}</strong> n’{couverture.absent > 1 ? 'ont' : 'a'} aucun
          déroulé : les 23 modules historiques de PLS, qui n’ont que des objectifs, et quelques
          produits SmartOF sans programme. Les blocs proposés ci-dessous viennent des programmes
          existants — ils sont <strong>proposés, jamais appliqués d’office</strong> : un intitulé
          proche ne garantit pas un contenu proche.
        </p>
      )}

      <div className="cm-barre">
        <div className="filtre-statut" style={{ marginBottom: 0 }}>
          {[
            { id: 'absent', label: `À renseigner (${couverture.absent})` },
            { id: 'saisi', label: `Renseignés (${couverture.saisi})` },
            { id: 'catalogue', label: `Catalogue (${couverture.catalogue})` },
            { id: 'tous', label: `Tous (${couverture.total})` },
          ].map(f => (
            <button key={f.id} className={`filtre-btn ${filtre === f.id ? 'actif' : ''}`} onClick={() => setFiltre(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <input
          className="cm-recherche"
          type="search"
          placeholder="Rechercher un module…"
          value={recherche}
          onChange={e => setRecherche(e.target.value)}
        />
      </div>

      {visibles.length === 0 ? (
        <p className="acces-empty">
          {filtre === 'absent'
            ? 'Tous les modules ont un contenu. Rien ne reste à renseigner.'
            : 'Aucun module pour ce filtre.'}
        </p>
      ) : (
        <div className="cm-liste">
          {visibles.map(m => {
            const c = contenuModule(m, biblio)
            const o = ORIGINES[c.origine]
            const candidats = blocsCandidats(m, biblio)
            const champs = champsQualiopi(m)
            const manquants = champs.filter(x => !x.valeur)
            const estOuvert = ouvert === m.id
            return (
              <div key={m.id} className={`cm-module ${estOuvert ? 'ouvert' : ''}`}>
                <button className="cm-module-tete" onClick={() => ouvrir(m)}>
                  <span className="cm-module-titre">{m.titre}</span>
                  <span className="cm-module-them">{m.thematique}</span>
                  <span className="cm-module-source">{SOURCES_MODULE[m.source]?.label || m.source}</span>
                  <span className={`cm-origine ${o.classe}`} title={o.aide}>{o.label}</span>
                  <span className="cm-chevron">{estOuvert ? '▾' : '▸'}</span>
                </button>

                {estOuvert && (
                  <div className="cm-detail">
                    {c.origine === 'catalogue' && (
                      <>
                        <div className="cm-sous-titre">Programme importé de SmartOF</div>
                        <pre className="cm-programme">{c.programme}</pre>
                        <p className="cm-note">
                          Ce programme fait foi tant que rien n’est renseigné ici. Rattacher des blocs
                          ou saisir un texte le remplacera dans l’affichage.
                        </p>
                      </>
                    )}

                    {candidats.length > 0 && (
                      <>
                        <div className="cm-sous-titre">
                          Blocs proposés
                          <span className="cm-compte">{candidats.length} sur les {biblio.length} disponibles</span>
                        </div>
                        <div className="cm-blocs">
                          {candidats.map(b => (
                            <label key={b.cle} className={`cm-bloc ${brouillon.blocs.includes(b.cle) ? 'actif' : ''}`}>
                              <input
                                type="checkbox"
                                checked={brouillon.blocs.includes(b.cle)}
                                onChange={() => basculerBloc(b.cle)}
                              />
                              <span className="cm-bloc-corps">
                                <span className="cm-bloc-titre">{b.titre}</span>
                                <span className="cm-bloc-origine">venu de « {b.origine} »</span>
                                <span className="cm-bloc-points">{b.points.slice(0, 4).join(' · ')}{b.points.length > 4 ? ' …' : ''}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="cm-sous-titre">Précisions à la main</div>
                    <textarea
                      className="cm-texte"
                      rows={4}
                      placeholder="Déroulé propre à ce module, cas pratiques, points de vigilance…"
                      value={brouillon.texte}
                      onChange={e => setBrouillon(b => ({ ...b, texte: e.target.value }))}
                    />

                    <div className="cm-sous-titre">
                      Champs Qualiopi
                      {manquants.length > 0 && <span className="cm-compte cm-manque">{manquants.length} manquant{manquants.length > 1 ? 's' : ''}</span>}
                    </div>
                    <table className="cm-qualiopi">
                      <tbody>
                        {champs.map(x => (
                          <tr key={x.cle} className={x.valeur ? '' : 'cm-vide'}>
                            <th>{x.label}</th>
                            <td>{x.valeur || <span className="td-vide">non renseigné</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="cm-note">
                      Ces champs viennent du catalogue SmartOF, qui les porte déjà pour ses modules.
                      Ils ne sont pas saisissables ici : les compléter suppose de les renseigner dans
                      SmartOF, qui reste la source — PLS ne lui écrit jamais.
                    </p>

                    <div className="cm-actions">
                      <button className="btn-save-param" onClick={() => enregistrer(m.id)}>Enregistrer</button>
                      {contenuSaisi(m.id) && (
                        <button className="btn-reset" onClick={() => vider(m.id)}>↩ Retirer</button>
                      )}
                      <button className="btn-reset" onClick={() => setOuvert(null)}>Fermer</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
