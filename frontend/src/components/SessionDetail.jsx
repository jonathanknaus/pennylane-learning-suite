import { useState, useEffect } from 'react'
import { getStagiaires, getInscriptionsBySession, inscrire, desinscrire, updatePresence, updateStatutInscription, STATUTS_INSCRIPTION } from '../data/stagiaires'
import { FORMATS, STATUTS, ALL_MODULES } from '../data/sessions'
import { getResultat, calculerProgression } from '../data/questionnaires'
import { getReponsesChaud, getReponsesFroid, getAllReponsesChaudBySession } from '../data/satisfaction'
import Passation from '../pages/Passation'
import EnqueteSatisfaction from './EnqueteSatisfaction'
import './SessionDetail.css'

const TABS = ['participants', 'evaluations', 'satisfaction']

export default function SessionDetail({ session, onClose, onEdit }) {
  const [tab, setTab] = useState('participants')
  const [inscriptions, setInscriptions] = useState([])
  const [stagiaires, setStagiaires] = useState([])
  const [searchAjout, setSearchAjout] = useState('')
  const [showAjout, setShowAjout] = useState(false)
  const [passation, setPassation] = useState(null) // { stagiaireId, type }
  const [enquete, setEnquete] = useState(null) // { stagiaireId, type: 'chaud'|'froid' }

  useEffect(() => {
    setStagiaires(getStagiaires())
    setInscriptions(getInscriptionsBySession(session.id))
  }, [session.id])

  function refresh() {
    setInscriptions(getInscriptionsBySession(session.id))
    setStagiaires(getStagiaires())
  }

  function handleInscrire(stagiaireId) {
    inscrire(session.id, stagiaireId)
    refresh()
    setSearchAjout('')
    setShowAjout(false)
  }

  function handleDesinscrire(stagiaireId) {
    if (!confirm('Désinscrire cet apprenant ?')) return
    desinscrire(session.id, stagiaireId)
    refresh()
  }

  function handlePresence(stagiaireId, value) {
    updatePresence(session.id, stagiaireId, value)
    refresh()
  }

  function handleStatut(stagiaireId, statut) {
    updateStatutInscription(session.id, stagiaireId, statut)
    refresh()
  }

  const statut = STATUTS.find(s => s.id === session.statut) || STATUTS[0]
  const format = FORMATS.find(f => f.id === session.format)
  const modules = (session.modules || []).map(id => ALL_MODULES.find(m => m.id === id)).filter(Boolean)
  const prix = format ? (session.modalite === 'visio' ? format.visio : format.presentiel) : null

  const inscritsIds = new Set(inscriptions.map(i => i.stagiaireId))
  const nonInscrits = stagiaires.filter(s => !inscritsIds.has(s.id))
  const filtresAjout = searchAjout
    ? nonInscrits.filter(s => `${s.prenom} ${s.nom} ${s.cabinet} ${s.email}`.toLowerCase().includes(searchAjout.toLowerCase()))
    : nonInscrits

  const nbPresents = inscriptions.filter(i => i.presence === true).length
  const nbAbsents = inscriptions.filter(i => i.presence === false).length

  const dateFormatee = session.date
    ? new Date(session.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  // Si en mode passation, afficher uniquement le composant de passation
  if (passation) {
    return (
      <Passation
        sessionId={session.id}
        stagiaireId={passation.stagiaireId}
        type={passation.type}
        onDone={() => { setPassation(null); refresh() }}
      />
    )
  }

  // Si en mode enquête satisfaction
  if (enquete) {
    return (
      <div className="session-detail">
        <div className="detail-topbar">
          <button className="btn-back" onClick={() => setEnquete(null)}>← Retour à la session</button>
        </div>
        <EnqueteSatisfaction
          sessionId={session.id}
          stagiaireId={enquete.stagiaireId}
          type={enquete.type}
          onDone={() => { setEnquete(null); refresh() }}
        />
      </div>
    )
  }

  return (
    <div className="session-detail">
      <div className="detail-topbar">
        <button className="btn-back" onClick={onClose}>← Retour aux sessions</button>
        <button className="btn-edit" onClick={onEdit}>✏️ Modifier la session</button>
      </div>

      <div className="detail-layout">
        {/* Colonne principale */}
        <div className="detail-main">
          <div className="detail-tabs">
            <button className={`detail-tab ${tab === 'participants' ? 'active' : ''}`} onClick={() => setTab('participants')}>
              👥 Participants
            </button>
            <button className={`detail-tab ${tab === 'evaluations' ? 'active' : ''}`} onClick={() => setTab('evaluations')}>
              📊 Évaluations Qualiopi
            </button>
            <button className={`detail-tab ${tab === 'satisfaction' ? 'active' : ''}`} onClick={() => setTab('satisfaction')}>
              ⭐ Satisfaction
            </button>
          </div>

          {tab === 'participants' && (
            <>
              <div className="inscrits-header">
                <div>
                  <h2>Participants inscrits</h2>
                  <p>{inscriptions.length} / {session.participants_max || 15} places
                    {nbPresents > 0 && <span className="presence-summary"> · {nbPresents} présent{nbPresents > 1 ? 's' : ''}</span>}
                    {nbAbsents > 0 && <span className="absence-summary"> · {nbAbsents} absent{nbAbsents > 1 ? 's' : ''}</span>}
                  </p>
                </div>
                <button className="btn-primary" onClick={() => setShowAjout(v => !v)}>
                  {showAjout ? '— Fermer' : '+ Ajouter'}
                </button>
              </div>

              {showAjout && (
                <div className="ajout-panel">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Rechercher un apprenant par nom, cabinet, email…"
                    value={searchAjout}
                    onChange={e => setSearchAjout(e.target.value)}
                  />
                  <div className="ajout-list">
                    {filtresAjout.length === 0 ? (
                      <div className="ajout-empty">
                        {nonInscrits.length === 0 ? 'Tous les apprenants sont déjà inscrits' : 'Aucun résultat'}
                      </div>
                    ) : (
                      filtresAjout.slice(0, 8).map(s => (
                        <button key={s.id} className="ajout-item" onClick={() => handleInscrire(s.id)}>
                          <div className="ajout-avatar">{s.prenom[0]}{s.nom[0]}</div>
                          <div className="ajout-info">
                            <span className="ajout-nom">{s.prenom} {s.nom}</span>
                            <span className="ajout-cabinet">{s.cabinet || s.email}</span>
                          </div>
                          <span className="ajout-plus">+</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {inscriptions.length === 0 ? (
                <div className="inscrits-empty">
                  <div className="empty-icon">👥</div>
                  <p>Aucun participant inscrit</p>
                  <button className="btn-primary" onClick={() => setShowAjout(true)}>Ajouter des participants</button>
                </div>
              ) : (
                <div className="inscrits-table-wrap">
                  <table className="inscrits-table">
                    <thead>
                      <tr>
                        <th>Participant</th>
                        <th>Statut</th>
                        <th>Présence</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {inscriptions.map(ins => {
                        const stag = stagiaires.find(s => s.id === ins.stagiaireId)
                        if (!stag) return null
                        const statutIns = STATUTS_INSCRIPTION.find(s => s.id === ins.statut) || STATUTS_INSCRIPTION[0]
                        return (
                          <tr key={ins.id} className="inscrit-row">
                            <td>
                              <div className="inscrit-identity">
                                <div className="inscrit-avatar">{stag.prenom[0]}{stag.nom[0]}</div>
                                <div>
                                  <div className="inscrit-nom">{stag.prenom} {stag.nom}</div>
                                  <div className="inscrit-cabinet">{stag.cabinet || stag.email}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <select
                                className="statut-select"
                                value={ins.statut}
                                style={{ color: statutIns.color }}
                                onChange={e => handleStatut(stag.id, e.target.value)}
                              >
                                {STATUTS_INSCRIPTION.map(s => (
                                  <option key={s.id} value={s.id}>{s.label}</option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <div className="presence-toggle">
                                <button
                                  className={`presence-btn present ${ins.presence === true ? 'active' : ''}`}
                                  onClick={() => handlePresence(stag.id, ins.presence === true ? null : true)}
                                >✓ Présent</button>
                                <button
                                  className={`presence-btn absent ${ins.presence === false ? 'active' : ''}`}
                                  onClick={() => handlePresence(stag.id, ins.presence === false ? null : false)}
                                >✗ Absent</button>
                              </div>
                            </td>
                            <td>
                              <button className="btn-icon btn-danger" onClick={() => handleDesinscrire(stag.id)} title="Désinscrire">🗑</button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === 'evaluations' && (
            <EvaluationsTab
              session={session}
              inscriptions={inscriptions}
              stagiaires={stagiaires}
              onStartPassation={(stagiaireId, type) => setPassation({ stagiaireId, type })}
            />
          )}

          {tab === 'satisfaction' && (
            <SatisfactionTab
              session={session}
              inscriptions={inscriptions}
              stagiaires={stagiaires}
              onStartEnquete={(stagiaireId, type) => setEnquete({ stagiaireId, type })}
            />
          )}
        </div>

        {/* Aside — infos session */}
        <aside className="detail-aside">
          <div className="session-info-card">
            <div className="session-info-header">
              <span className="session-statut-badge" style={{ background: statut.color + '20', color: statut.color }}>{statut.label}</span>
              <h3>{session.titre}</h3>
              {session.client && <div className="session-info-client">{session.client}</div>}
            </div>

            <div className="session-info-rows">
              <div className="info-row"><span>📅</span><span>{dateFormatee}{session.heure ? ` · ${session.heure}` : ''}</span></div>
              <div className="info-row"><span>📡</span><span>{session.modalite === 'visio' ? 'Visio' : 'Présentiel'}</span></div>
              {format && <div className="info-row"><span>⏱</span><span>{format.label} · {format.duree}</span></div>}
              <div className="info-row"><span>👤</span><span>{session.formateur || 'Non assigné'}</span></div>
              {prix && <div className="info-row"><span>💶</span><strong>{prix}€ HT</strong></div>}
            </div>

            {modules.length > 0 && (
              <div className="session-info-modules">
                <div className="info-modules-label">Programme ({modules.length} module{modules.length > 1 ? 's' : ''})</div>
                <div className="info-programme">
                  {modules.map((m, i) => (
                    <div key={m.id} className="info-programme-item">
                      <div className="info-programme-num">{i + 1}</div>
                      <div>
                        <div className="info-programme-titre">{m.titre}</div>
                        {m.description && <div className="info-programme-desc">{m.description}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {session.notes && (
              <div className="session-info-notes">💬 {session.notes}</div>
            )}

            <div className="session-info-jauge">
              <div className="jauge-label">
                <span>Remplissage</span>
                <span className="jauge-val">{inscriptions.length} / {session.participants_max || 15}</span>
              </div>
              <div className="jauge-bar">
                <div className="jauge-fill" style={{
                  width: `${Math.min(100, (inscriptions.length / (session.participants_max || 15)) * 100)}%`,
                  background: inscriptions.length >= (session.participants_max || 15) ? '#EF4444' : 'var(--vert)'
                }} />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function EvaluationsTab({ session, inscriptions, stagiaires, onStartPassation }) {
  const rows = inscriptions.map(ins => {
    const stag = stagiaires.find(s => s.id === ins.stagiaireId)
    if (!stag) return null
    const pre = getResultat(session.id, ins.stagiaireId, 'pre')
    const post = getResultat(session.id, ins.stagiaireId, 'post')
    const progression = pre && post ? calculerProgression(pre.score, post.score) : null
    return { stag, ins, pre, post, progression }
  }).filter(Boolean)

  const moyennePre = rows.filter(r => r.pre).length
    ? Math.round(rows.filter(r => r.pre).reduce((s, r) => s + r.pre.score, 0) / rows.filter(r => r.pre).length)
    : null
  const moyennePost = rows.filter(r => r.post).length
    ? Math.round(rows.filter(r => r.post).reduce((s, r) => s + r.post.score, 0) / rows.filter(r => r.post).length)
    : null
  const moyenneProgression = rows.filter(r => r.progression !== null).length
    ? Math.round(rows.filter(r => r.progression !== null).reduce((s, r) => s + r.progression, 0) / rows.filter(r => r.progression !== null).length)
    : null

  if (inscriptions.length === 0) {
    return <div className="eval-empty">Aucun participant inscrit à cette session.</div>
  }

  const modulesCount = (session.modules || []).length
  const questionsCount = modulesCount * 5

  return (
    <div className="eval-tab">
      <div className="eval-info-banner">
        <span>📋</span>
        <span>{modulesCount} module{modulesCount > 1 ? 's' : ''} · {questionsCount} questions par questionnaire (5 par module, tirage aléatoire)</span>
      </div>

      {(moyennePre !== null || moyennePost !== null) && (
        <div className="eval-stats">
          {moyennePre !== null && (
            <div className="eval-stat-card">
              <span className="eval-stat-label">Moyenne pré</span>
              <span className="eval-stat-val">{moyennePre}%</span>
            </div>
          )}
          {moyennePost !== null && (
            <div className="eval-stat-card">
              <span className="eval-stat-label">Moyenne post</span>
              <span className="eval-stat-val">{moyennePost}%</span>
            </div>
          )}
          {moyenneProgression !== null && (
            <div className="eval-stat-card highlight">
              <span className="eval-stat-label">Progression moyenne</span>
              <span className="eval-stat-val">{moyenneProgression >= 0 ? '+' : ''}{moyenneProgression}%</span>
            </div>
          )}
        </div>
      )}

      <div className="eval-table-wrap">
        <table className="eval-table">
          <thead>
            <tr>
              <th>Participant</th>
              <th>Pré-formation</th>
              <th>Post-formation</th>
              <th>Progression</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ stag, pre, post, progression }) => (
              <tr key={stag.id}>
                <td>
                  <div className="inscrit-identity">
                    <div className="inscrit-avatar">{stag.prenom[0]}{stag.nom[0]}</div>
                    <div>
                      <div className="inscrit-nom">{stag.prenom} {stag.nom}</div>
                      <div className="inscrit-cabinet">{stag.cabinet || stag.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  {pre
                    ? <div className="eval-score-cell done">
                        <span className="eval-score">{pre.score}%</span>
                        <button className="eval-redo" onClick={() => onStartPassation(stag.id, 'pre')}>Refaire</button>
                      </div>
                    : <button className="eval-start pre" onClick={() => onStartPassation(stag.id, 'pre')}>▶ Démarrer</button>
                  }
                </td>
                <td>
                  {post
                    ? <div className="eval-score-cell done">
                        <span className="eval-score">{post.score}%</span>
                        <button className="eval-redo" onClick={() => onStartPassation(stag.id, 'post')}>Refaire</button>
                      </div>
                    : pre
                      ? <button className="eval-start post" onClick={() => onStartPassation(stag.id, 'post')}>▶ Démarrer</button>
                      : <span className="eval-pending">Pré requis</span>
                  }
                </td>
                <td>
                  {progression !== null
                    ? <span className={`eval-progression ${progression >= 0 ? 'pos' : 'neg'}`}>
                        {progression >= 0 ? '+' : ''}{progression}%
                      </span>
                    : <span className="eval-pending">—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SatisfactionTab({ session, inscriptions, stagiaires, onStartEnquete }) {
  const rows = inscriptions.map(ins => {
    const stag = stagiaires.find(s => s.id === ins.stagiaireId)
    if (!stag) return null
    const chaud = getReponsesChaud(session.id, ins.stagiaireId)
    const froid = getReponsesFroid(session.id, ins.stagiaireId)
    return { stag, ins, chaud, froid }
  }).filter(Boolean)

  const chaudRemplis = rows.filter(r => r.chaud).length
  const froidRemplis = rows.filter(r => r.froid).length
  const moyenneChaud = chaudRemplis
    ? Math.round((rows.filter(r => r.chaud).reduce((s, r) => s + (r.chaud.moyenne || 0), 0) / chaudRemplis) * 10) / 10
    : null

  return (
    <div className="satisfaction-tab">
      <div className="satisfaction-header">
        <div className="sat-stat">
          <div className="sat-stat-val">{chaudRemplis}/{rows.length}</div>
          <div className="sat-stat-label">Enquêtes à chaud</div>
        </div>
        {moyenneChaud !== null && (
          <div className="sat-stat">
            <div className="sat-stat-val" style={{ color: moyenneChaud >= 8 ? '#10B981' : moyenneChaud >= 6 ? '#F59E0B' : '#EF4444' }}>
              {moyenneChaud}/10
            </div>
            <div className="sat-stat-label">Satisfaction moyenne</div>
          </div>
        )}
        <div className="sat-stat">
          <div className="sat-stat-val">{froidRemplis}/{rows.length}</div>
          <div className="sat-stat-label">Enquêtes à froid</div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="sat-empty">Aucun participant inscrit.</div>
      ) : (
        <div className="sat-table-wrap">
          <table className="sat-table">
            <thead>
              <tr>
                <th>Apprenant</th>
                <th>Enquête à chaud</th>
                <th>Enquête à froid</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ stag, chaud, froid }) => (
                <tr key={stag.id}>
                  <td>
                    <div className="sat-stag-name">{stag.prenom} {stag.nom}</div>
                    <div className="sat-stag-cab">{stag.cabinet || stag.email}</div>
                  </td>
                  <td>
                    {chaud
                      ? <div className="sat-done">
                          <span className="sat-score" style={{ color: chaud.moyenne >= 8 ? '#10B981' : chaud.moyenne >= 6 ? '#F59E0B' : '#EF4444' }}>
                            {chaud.moyenne}/10
                          </span>
                          <button className="eval-redo" onClick={() => onStartEnquete(stag.id, 'chaud')}>Voir</button>
                        </div>
                      : <button className="eval-start post" onClick={() => onStartEnquete(stag.id, 'chaud')}>▶ Démarrer</button>
                    }
                  </td>
                  <td>
                    {froid
                      ? <div className="sat-done">
                          <span className="sat-score" style={{ color: froid.moyenne >= 8 ? '#10B981' : froid.moyenne >= 6 ? '#F59E0B' : '#EF4444' }}>
                            {froid.moyenne}/10
                          </span>
                          <button className="eval-redo" onClick={() => onStartEnquete(stag.id, 'froid')}>Voir</button>
                        </div>
                      : <button className="eval-start" onClick={() => onStartEnquete(stag.id, 'froid')}>▶ Démarrer</button>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
