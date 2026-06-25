import { useState, useEffect, useRef } from 'react'
import { getStagiaires, getInscriptionsBySession, inscrire, desinscrire, updatePresence, updateStatutInscription, STATUTS_INSCRIPTION } from '../data/stagiaires'
import { FORMATS, STATUTS, ALL_MODULES, MODALITES, QUALIOPI_OPTIONS, formatDateLong } from '../data/sessions'
import { getResultat, calculerProgression } from '../data/questionnaires'
import { getReponsesChaud, getReponsesFroid, getAllReponsesChaudBySession } from '../data/satisfaction'
import { WORKFLOW_STEPS, getWorkflowsForSession, setWorkflowStep } from '../data/workflows'
import { getTemplate } from '../data/workflow-templates'
import { getPlanification, savePlanification, DEFAULT_PLANIFICATION } from '../data/planification'
import { getLienBesoin, getBesoin, verrouillerBesoin, deverrouillerBesoin, regenererBesoinToken } from '../data/questionnaire-besoin'
import { getSessionData } from '../data/documents'
import Convocation from './documents/Convocation'
import Convention from './documents/Convention'
import Emargement from './documents/Emargement'
import Attestation from './documents/Attestation'
import Passation from '../pages/Passation'
import EnqueteSatisfaction from './EnqueteSatisfaction'
import './SessionDetail.css'

const TABS = ['participants', 'evaluations', 'satisfaction', 'workflows', 'planification', 'besoin', 'documents']

export default function SessionDetail({ session, onClose, onEdit }) {
  const [tab, setTab] = useState('participants')
  const [wfStatuts, setWfStatuts] = useState(() => getWorkflowsForSession(session.id))
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
            <button className={`detail-tab ${tab === 'workflows' ? 'active' : ''}`} onClick={() => setTab('workflows')}>
              ⚡ Workflows
            </button>
            <button className={`detail-tab ${tab === 'planification' ? 'active' : ''}`} onClick={() => setTab('planification')}>
              🗓 Planification
            </button>
            <button className={`detail-tab ${tab === 'besoin' ? 'active' : ''}`} onClick={() => setTab('besoin')}>
              📋 Besoin
            </button>
            <button className={`detail-tab ${tab === 'documents' ? 'active' : ''}`} onClick={() => setTab('documents')}>
              🗂 Documents
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

          {tab === 'workflows' && (
            <WorkflowsTab
              session={session}
              statuts={wfStatuts}
              inscriptions={inscriptions}
              stagiaires={stagiaires}
              onUpdate={(stepId, status) => {
                setWorkflowStep(session.id, stepId, status)
                setWfStatuts(getWorkflowsForSession(session.id))
              }}
            />
          )}

          {tab === 'planification' && (
            <PlanificationTab session={session} inscriptions={inscriptions} stagiaires={stagiaires} />
          )}

          {tab === 'besoin' && (
            <BesoinTab session={session} />
          )}

          {tab === 'documents' && (
            <DocumentsTab session={session} inscriptions={inscriptions} stagiaires={stagiaires} />
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
              {(session.occurrences || []).filter(o => o.date).map((occ, idx) => (
                <div key={idx} className="info-row info-row-occurrence">
                  <span>📅</span>
                  <span className="occurrence-label">J{idx + 2} &nbsp;</span>
                  <span>{formatDateLong(occ.date)}{occ.heure ? ` · ${occ.heure}` : ''}</span>
                </div>
              ))}
              <div className="info-row">
                <span>📡</span>
                <span>{MODALITES.find(m => m.id === session.modalite)?.label || session.modalite}</span>
                {session.qualiopi && session.qualiopi !== 'non' && (() => {
                  const q = QUALIOPI_OPTIONS.find(o => o.id === session.qualiopi)
                  return q ? <span className="qualiopi-badge" style={{ color: q.color, background: q.bg }}>{q.label}</span> : null
                })()}
              </div>
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

const GROUPES_LABELS = { client: 'Workflows client', apprenants: 'Workflows apprenants' }

function QuizzStepDetail({ session, inscriptions, stagiaires, type }) {
  const baseUrl = window.location.origin + window.location.pathname
  const [copied, setCopied] = useState(null)

  function getLien(stagiaireId) {
    return `${baseUrl}#quiz/${session.id}/${stagiaireId}/${type}`
  }

  function copyLink(stagiaireId) {
    navigator.clipboard.writeText(getLien(stagiaireId)).then(() => {
      setCopied(stagiaireId)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  if (inscriptions.length === 0) {
    return <div className="wf-quizz-empty">Aucun participant inscrit à cette session.</div>
  }

  return (
    <div className="wf-quizz-list">
      {inscriptions.map(ins => {
        const stag = stagiaires.find(s => s.id === ins.stagiaireId)
        if (!stag) return null
        const resultat = getResultat(session.id, ins.stagiaireId, type)
        return (
          <div key={ins.stagiaireId} className={`wf-quizz-row ${resultat ? 'done' : ''}`}>
            <div className="wf-quizz-avatar">{stag.prenom[0]}{stag.nom[0]}</div>
            <div className="wf-quizz-info">
              <div className="wf-quizz-nom">{stag.prenom} {stag.nom}</div>
              <div className="wf-quizz-cab">{stag.cabinet || stag.email}</div>
            </div>
            <div className="wf-quizz-statut">
              {resultat
                ? <span className="wf-quizz-score">✓ {resultat.score}%</span>
                : <span className="wf-quizz-pending">En attente</span>
              }
            </div>
            <div className="wf-quizz-actions">
              <button
                className={`wf-btn wf-btn-copy ${copied === ins.stagiaireId ? 'copied' : ''}`}
                onClick={() => copyLink(ins.stagiaireId)}
                title="Copier le lien du quizz"
              >
                {copied === ins.stagiaireId ? '✓ Copié !' : '🔗 Copier lien'}
              </button>
              <a
                href={getLien(ins.stagiaireId)}
                target="_blank"
                rel="noopener noreferrer"
                className="wf-btn wf-btn-open"
                title="Ouvrir le quizz"
              >
                ▶ Ouvrir
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TemplatePanel({ stepId, session }) {
  const tpl = getTemplate(stepId, session)
  const [copied, setCopied] = useState(null)

  if (!tpl) return null

  function copy(text, key) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  return (
    <div className="wf-tpl-panel">
      <div className="wf-tpl-row">
        <span className="wf-tpl-label">Objet</span>
        <span className="wf-tpl-value">{tpl.objet}</span>
        <button
          className={`wf-btn wf-btn-copy ${copied === 'objet' ? 'copied' : ''}`}
          onClick={() => copy(tpl.objet, 'objet')}
        >{copied === 'objet' ? '✓ Copié' : '🔗 Copier'}</button>
      </div>
      <div className="wf-tpl-body">
        <div className="wf-tpl-label">Corps du mail</div>
        <pre className="wf-tpl-pre">{tpl.corps}</pre>
        <button
          className={`wf-btn wf-btn-copy ${copied === 'corps' ? 'copied' : ''}`}
          onClick={() => copy(tpl.corps, 'corps')}
        >{copied === 'corps' ? '✓ Corps copié !' : '📋 Copier le corps'}</button>
      </div>
    </div>
  )
}

function WorkflowsTab({ session, statuts, onUpdate, inscriptions, stagiaires }) {
  const groupes = ['client', 'apprenants']
  const [openQuizz, setOpenQuizz] = useState(null)
  const [openTpl, setOpenTpl] = useState(null)

  const quizzSteps = { quizz_initial: 'pre', quizz_final: 'post' }

  return (
    <div className="workflows-tab">
      <div className="workflows-aws-banner">
        <span>⚠️</span>
        <div>
          <strong>Envois email — disponible après déploiement AWS</strong>
          <span>Les boutons d'envoi seront actifs une fois le backend FastAPI déployé. Les quizz sont disponibles dès maintenant via lien partageable.</span>
        </div>
      </div>

      {groupes.map(groupe => {
        const steps = WORKFLOW_STEPS.filter(s => s.groupe === groupe)
        return (
          <div key={groupe} className="wf-groupe">
            <div className="wf-groupe-title">{GROUPES_LABELS[groupe]}</div>
            <div className="wf-steps">
              {steps.map(step => {
                const entry = statuts[step.id]
                const status = entry?.status || 'pending'
                const isQuizz = step.id in quizzSteps
                const quizzType = quizzSteps[step.id]
                const quizzOpen = openQuizz === step.id

                const nbInscrits = inscriptions.length
                const nbCompletes = isQuizz
                  ? inscriptions.filter(ins => getResultat(session.id, ins.stagiaireId, quizzType)).length
                  : 0

                return (
                  <div key={step.id} className={`wf-step wf-step-${isQuizz && nbCompletes === nbInscrits && nbInscrits > 0 ? 'done' : status}`}>
                    <div className="wf-step-icon">{step.icon}</div>
                    <div className="wf-step-body">
                      <div className="wf-step-label">{step.label}</div>
                      <div className="wf-step-desc">{step.description}</div>
                      {isQuizz && nbInscrits > 0 && (
                        <div className="wf-quizz-progress">
                          <div className="wf-quizz-progress-bar-wrap">
                            <div
                              className="wf-quizz-bar"
                              style={{ width: `${Math.round((nbCompletes / nbInscrits) * 100)}%` }}
                            />
                          </div>
                          <span>{nbCompletes}/{nbInscrits} complétés</span>
                        </div>
                      )}
                      {!isQuizz && entry?.updatedAt && (
                        <div className="wf-step-date">
                          {status === 'done' ? 'Fait' : 'Ignoré'} le {new Date(entry.updatedAt).toLocaleDateString('fr-FR')}
                        </div>
                      )}
                    </div>
                    <div className="wf-step-actions">
                      {isQuizz ? (
                        <button
                          className={`wf-btn wf-btn-done ${quizzOpen ? 'active' : ''}`}
                          onClick={() => setOpenQuizz(quizzOpen ? null : step.id)}
                        >
                          {quizzOpen ? '▲ Masquer' : '👥 Gérer'}
                        </button>
                      ) : (
                        <>
                          <button
                            className={`wf-btn wf-btn-tpl ${openTpl === step.id ? 'active' : ''}`}
                            onClick={() => setOpenTpl(openTpl === step.id ? null : step.id)}
                            title="Voir le modèle email"
                          >
                            {openTpl === step.id ? '▲ Modèle' : '✉️ Modèle'}
                          </button>
                          <button className="wf-btn wf-btn-send" disabled title="Envoyer (indisponible — AWS requis)">
                            📤 Envoyer
                          </button>
                          <button
                            className={`wf-btn wf-btn-done ${status === 'done' ? 'active' : ''}`}
                            onClick={() => onUpdate(step.id, status === 'done' ? 'pending' : 'done')}
                          >
                            {status === 'done' ? '✓ Fait' : 'Marquer fait'}
                          </button>
                        </>
                      )}
                    </div>
                    {isQuizz && quizzOpen && (
                      <div className="wf-quizz-panel">
                        <QuizzStepDetail
                          session={session}
                          inscriptions={inscriptions}
                          stagiaires={stagiaires}
                          type={quizzType}
                        />
                      </div>
                    )}
                    {!isQuizz && openTpl === step.id && (
                      <div className="wf-quizz-panel">
                        <TemplatePanel stepId={step.id} session={session} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
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

// ====================================================
// Onglet Planification des envois
// ====================================================

const PLAN_ITEMS = [
  {
    key: 'quizz_pre',
    label: 'Quizz pré-formation',
    icon: '📋',
    desc: 'Envoyé au démarrage de la session (J0)',
    delaiLabel: 'Au début de la session',
    lienType: 'quiz_pre',
    couleur: '#6366F1',
    bg: '#EEF2FF',
  },
  {
    key: 'eval_post',
    label: 'Évaluation post-formation + satisfaction à chaud',
    icon: '📊',
    desc: 'Envoyé à la fin de la session, avec rappels J+1, J+2, J+3',
    lienType: 'eval',
    couleur: '#059669',
    bg: '#D1FAE5',
  },
  {
    key: 'satisfaction_froid',
    label: 'Enquête de satisfaction à froid',
    icon: '❄️',
    desc: 'Envoyé 30 jours après la fin de la session',
    lienType: 'quiz_froid',
    couleur: '#0EA5E9',
    bg: '#E0F2FE',
  },
]

function PlanificationTab({ session, inscriptions, stagiaires }) {
  const [plan, setPlan] = useState(() => getPlanification(session.id))
  const [editKey, setEditKey] = useState(null)
  const [copied, setCopied] = useState(null)

  function updatePlan(key, updates) {
    const next = { ...plan, [key]: { ...plan[key], ...updates } }
    setPlan(next)
    savePlanification(session.id, next)
  }

  function resetPlan(key) {
    const next = { ...plan, [key]: { ...DEFAULT_PLANIFICATION[key] } }
    setPlan(next)
    savePlanification(session.id, next)
  }

  function getLien(stagiaireId, lienType) {
    const base = window.location.origin + window.location.pathname
    if (lienType === 'quiz_pre') return `${base}#quiz/${session.id}/${stagiaireId}/pre`
    if (lienType === 'eval') return `${base}#eval/${session.id}/${stagiaireId}`
    if (lienType === 'quiz_froid') return `${base}#quiz/${session.id}/${stagiaireId}/froid`
    return base
  }

  function copyAllLinks(lienType) {
    const liens = inscriptions.map(ins => {
      const stag = stagiaires.find(s => s.id === ins.stagiaireId)
      if (!stag) return null
      return `${stag.prenom} ${stag.nom} : ${getLien(ins.stagiaireId, lienType)}`
    }).filter(Boolean).join('\n')
    navigator.clipboard.writeText(liens).then(() => {
      setCopied(lienType)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  function formatDateEnvoi(key) {
    if (!session.date) return null
    const base = new Date(session.date + 'T' + (session.heure || '09:00') + ':00')
    if (key === 'quizz_pre') {
      return base.toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    }
    if (key === 'eval_post') {
      return base.toLocaleString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) + ' (fin de session)'
    }
    if (key === 'satisfaction_froid') {
      const jours = plan.satisfaction_froid.delai_jours || 30
      const date = new Date(base.getTime() + jours * 24 * 60 * 60 * 1000)
      return date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
    }
    return null
  }

  return (
    <div className="plan-tab">
      <div className="plan-aws-banner">
        <span>⚠️</span>
        <div>
          <strong>Envois automatiques — disponibles après déploiement AWS</strong>
          <span>Les règles ci-dessous seront appliquées automatiquement une fois le backend connecté. En attendant, utilisez les liens partageables manuellement.</span>
        </div>
      </div>

      {PLAN_ITEMS.map(item => {
        const conf = plan[item.key]
        const dateEnvoi = formatDateEnvoi(item.key)
        const isEdit = editKey === item.key

        return (
          <div key={item.key} className={`plan-item ${conf.actif ? 'actif' : 'inactif'}`}>
            <div className="plan-item-header">
              <div className="plan-item-icon" style={{ background: item.bg, color: item.couleur }}>{item.icon}</div>
              <div className="plan-item-info">
                <div className="plan-item-label">{item.label}</div>
                <div className="plan-item-desc">{item.desc}</div>
                {dateEnvoi && conf.actif && (
                  <div className="plan-item-date">📅 {dateEnvoi}</div>
                )}
              </div>
              <div className="plan-item-controls">
                <label className="plan-toggle" title={conf.actif ? 'Désactiver' : 'Activer'}>
                  <input
                    type="checkbox"
                    checked={!!conf.actif}
                    onChange={e => updatePlan(item.key, { actif: e.target.checked })}
                  />
                  <span className={`plan-toggle-slider ${conf.actif ? 'on' : ''}`} />
                </label>
                <button
                  className={`plan-btn-edit ${isEdit ? 'active' : ''}`}
                  onClick={() => setEditKey(isEdit ? null : item.key)}
                  title="Personnaliser le mail"
                >
                  {isEdit ? '▲ Fermer' : '✏️ Modifier'}
                </button>
              </div>
            </div>

            {/* Rappels (eval_post uniquement) */}
            {item.key === 'eval_post' && conf.actif && (
              <div className="plan-rappels">
                <span className="plan-rappels-label">Rappels si non répondu :</span>
                {[1, 2, 3].map(j => {
                  const actif = (conf.rappels || []).includes(j)
                  return (
                    <button
                      key={j}
                      className={`plan-rappel-btn ${actif ? 'on' : ''}`}
                      onClick={() => {
                        const rappels = conf.rappels || []
                        updatePlan(item.key, {
                          rappels: actif ? rappels.filter(r => r !== j) : [...rappels, j].sort()
                        })
                      }}
                    >
                      J+{j}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Délai satisfaction à froid */}
            {item.key === 'satisfaction_froid' && conf.actif && (
              <div className="plan-delai-froid">
                <span className="plan-delai-label">Délai après fin de session :</span>
                <div className="plan-delai-input-wrap">
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={conf.delai_jours || 30}
                    onChange={e => updatePlan(item.key, { delai_jours: parseInt(e.target.value) || 30 })}
                    className="plan-delai-input"
                  />
                  <span className="plan-delai-unit">jours</span>
                </div>
              </div>
            )}

            {/* Éditeur de mail */}
            {isEdit && (
              <div className="plan-mail-editor">
                <div className="plan-mail-field">
                  <label className="plan-mail-label">Objet du mail</label>
                  <input
                    type="text"
                    value={conf.objet_mail || ''}
                    onChange={e => updatePlan(item.key, { objet_mail: e.target.value })}
                    className="plan-mail-input"
                    placeholder="Objet du mail d'envoi"
                  />
                </div>
                <div className="plan-mail-field">
                  <label className="plan-mail-label">Corps du mail</label>
                  <textarea
                    value={conf.corps_mail || ''}
                    onChange={e => updatePlan(item.key, { corps_mail: e.target.value })}
                    className="plan-mail-textarea"
                    rows={8}
                    placeholder="Corps du mail..."
                  />
                </div>
                {item.key === 'eval_post' && (
                  <>
                    <div className="plan-mail-field">
                      <label className="plan-mail-label">Objet du mail de rappel</label>
                      <input
                        type="text"
                        value={conf.objet_rappel || ''}
                        onChange={e => updatePlan(item.key, { objet_rappel: e.target.value })}
                        className="plan-mail-input"
                      />
                    </div>
                    <div className="plan-mail-field">
                      <label className="plan-mail-label">Corps du mail de rappel</label>
                      <textarea
                        value={conf.corps_rappel || ''}
                        onChange={e => updatePlan(item.key, { corps_rappel: e.target.value })}
                        className="plan-mail-textarea"
                        rows={6}
                      />
                    </div>
                  </>
                )}
                <div className="plan-mail-vars">
                  <span className="plan-mail-vars-label">Variables disponibles :</span>
                  {['{prenom}', '{nom}', '{titre}', '{date}', '{lien}', '{delai_jours}'].map(v => (
                    <code key={v} className="plan-mail-var">{v}</code>
                  ))}
                </div>
                <div className="plan-mail-actions">
                  <button className="plan-btn-reset" onClick={() => { resetPlan(item.key); setEditKey(null) }}>
                    ↺ Réinitialiser
                  </button>
                </div>
              </div>
            )}

            {/* Liens partageables */}
            {conf.actif && inscriptions.length > 0 && (
              <div className="plan-liens">
                <div className="plan-liens-header">
                  <span className="plan-liens-label">Liens partageables ({inscriptions.length} apprenant{inscriptions.length > 1 ? 's' : ''})</span>
                  <button
                    className={`plan-btn-copy-all ${copied === item.lienType ? 'copied' : ''}`}
                    onClick={() => copyAllLinks(item.lienType)}
                  >
                    {copied === item.lienType ? '✓ Copié !' : '📋 Copier tous les liens'}
                  </button>
                </div>
                <div className="plan-liens-list">
                  {inscriptions.map(ins => {
                    const stag = stagiaires.find(s => s.id === ins.stagiaireId)
                    if (!stag) return null
                    const lien = getLien(ins.stagiaireId, item.lienType)
                    const copKey = item.lienType + ins.stagiaireId
                    return (
                      <div key={ins.stagiaireId} className="plan-lien-row">
                        <div className="plan-lien-avatar">{stag.prenom[0]}{stag.nom[0]}</div>
                        <div className="plan-lien-nom">{stag.prenom} {stag.nom}</div>
                        <div className="plan-lien-url">{lien}</div>
                        <button
                          className={`plan-btn-copy ${copied === copKey ? 'copied' : ''}`}
                          onClick={() => {
                            navigator.clipboard.writeText(lien).then(() => {
                              setCopied(copKey)
                              setTimeout(() => setCopied(null), 2000)
                            })
                          }}
                        >
                          {copied === copKey ? '✓' : '🔗'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {conf.actif && inscriptions.length === 0 && (
              <div className="plan-no-inscrits">Aucun participant inscrit — ajoutez des participants pour générer les liens.</div>
            )}
          </div>
        )
      })}
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

// ====================================================
// Onglet Documents Qualiopi
// ====================================================

const TYPES_DOCS = [
  { id: 'convocation',  label: 'Convocation',             icon: '✉️',  desc: 'Envoyée avant la session à chaque participant', perParticipant: true },
  { id: 'convention',   label: 'Convention de formation', icon: '📄',  desc: '10 clauses légales, liste participants, prix, signatures', perParticipant: false },
  { id: 'emargement',   label: "Feuille d'émargement",   icon: '✍️',  desc: 'Preuve de présence — 1 feuille par occurrence', perParticipant: false },
  { id: 'attestation',  label: 'Attestation',             icon: '🎓',  desc: 'Remise à chaque participant après la session', perParticipant: true },
]

function DocumentsTab({ session, inscriptions, stagiaires }) {
  const [typeDoc, setTypeDoc] = useState('convocation')
  const [stagiaireId, setStagiaireId] = useState('tous')
  const [occurrenceIdx, setOccurrenceIdx] = useState(0)
  const [preview, setPreview] = useState(false)
  const printRef = useRef()

  const data = getSessionData(session.id)
  if (!data) return <div className="docs-empty">Impossible de charger les données de la session.</div>

  const participants = data.participants
  const typeInfo = TYPES_DOCS.find(t => t.id === typeDoc)

  const allOccurrences = [
    { date: session.date, heure: session.heure, label: 'J1 — Session principale' },
    ...(session.occurrences || []).filter(o => o.date).map((o, i) => ({
      date: o.date, heure: o.heure, label: `J${i + 2} — ${formatDateLong(o.date)}`
    }))
  ]

  function buildDataForOccurrence(idx) {
    if (idx === 0 || typeDoc !== 'emargement') return data
    const occ = allOccurrences[idx]
    const occDateFormatee = formatDateLong(occ.date)
    return {
      ...data,
      dateFormatee: occDateFormatee,
      session: { ...data.session, date: occ.date, heure: occ.heure || data.session.heure }
    }
  }

  function renderDoc() {
    const d = buildDataForOccurrence(occurrenceIdx)
    if (typeDoc === 'emargement') return <Emargement data={d} />
    if (typeDoc === 'convention') return <Convention data={d} />
    if (typeDoc === 'convocation') {
      const targets = stagiaireId === 'tous'
        ? participants
        : participants.filter(p => p.stagiaire.id === stagiaireId)
      return targets.map(p => (
        <div key={p.stagiaire.id}>
          <Convocation data={d} stagiaire={p.stagiaire} />
          <div className="page-break" />
        </div>
      ))
    }
    if (typeDoc === 'attestation') {
      const targets = stagiaireId === 'tous'
        ? participants
        : participants.filter(p => p.stagiaire.id === stagiaireId)
      return targets.map(p => (
        <div key={p.stagiaire.id}>
          <Attestation data={d} stagiaire={p.stagiaire} />
          <div className="page-break" />
        </div>
      ))
    }
  }

  if (preview) {
    return (
      <div className="docs-preview-mode">
        <div className="docs-preview-bar no-print">
          <button className="btn-back" onClick={() => setPreview(false)}>← Retour</button>
          <span className="docs-preview-title">{typeInfo?.icon} {typeInfo?.label}</span>
          <button className="btn-primary" onClick={() => window.print()}>🖨 Imprimer / PDF</button>
        </div>
        <div ref={printRef}>
          {renderDoc()}
        </div>
      </div>
    )
  }

  return (
    <div className="docs-tab">
      <div className="docs-types-grid">
        {TYPES_DOCS.map(t => (
          <button
            key={t.id}
            className={`docs-type-btn ${typeDoc === t.id ? 'active' : ''}`}
            onClick={() => { setTypeDoc(t.id); setStagiaireId('tous'); setOccurrenceIdx(0) }}
          >
            <span className="docs-type-icon">{t.icon}</span>
            <span className="docs-type-label">{t.label}</span>
            <span className="docs-type-desc">{t.desc}</span>
          </button>
        ))}
      </div>

      <div className="docs-options">
        {typeInfo?.perParticipant && (
          <div className="docs-option-group">
            <label>Participant</label>
            <select value={stagiaireId} onChange={e => setStagiaireId(e.target.value)} className="docs-select">
              <option value="tous">Tous les participants ({participants.length})</option>
              {participants.map(p => (
                <option key={p.stagiaire.id} value={p.stagiaire.id}>
                  {p.stagiaire.prenom} {p.stagiaire.nom}
                </option>
              ))}
            </select>
          </div>
        )}

        {typeDoc === 'emargement' && allOccurrences.length > 1 && (
          <div className="docs-option-group">
            <label>Occurrence</label>
            <select value={occurrenceIdx} onChange={e => setOccurrenceIdx(+e.target.value)} className="docs-select">
              {allOccurrences.map((occ, i) => (
                <option key={i} value={i}>{occ.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {participants.length === 0 && (
        <div className="docs-warn">
          ⚠️ Aucun participant inscrit à cette session — les documents nominatifs seront vides.
        </div>
      )}

      <div className="docs-actions">
        <button className="btn-primary" onClick={() => setPreview(true)}>
          👁 Prévisualiser et imprimer
        </button>
        <span className="docs-count-info">
          {typeInfo?.perParticipant
            ? stagiaireId === 'tous'
              ? `${participants.length} document${participants.length > 1 ? 's' : ''} (un par participant)`
              : '1 document'
            : typeDoc === 'emargement' && allOccurrences.length > 1
              ? `${allOccurrences.length} feuilles disponibles (1 par occurrence)`
              : '1 document'}
        </span>
      </div>

      {allOccurrences.length > 1 && typeDoc === 'emargement' && (
        <div className="docs-occurrences-info">
          <div className="docs-occ-title">Feuilles d'émargement disponibles</div>
          {allOccurrences.map((occ, i) => (
            <div key={i} className="docs-occ-row">
              <span className="docs-occ-badge">J{i + 1}</span>
              <span>{occ.label.replace(/^J\d+ — /, '')}</span>
              <span className="docs-occ-heure">{occ.heure || '—'}</span>
              <button
                className="docs-occ-btn"
                onClick={() => { setOccurrenceIdx(i); setPreview(true) }}
              >
                👁 Ouvrir
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const BESOIN_LABELS = {
  contexte: 'Contexte',
  objectifs: 'Objectifs visés',
  public: 'Public concerné',
  niveau_depart: 'Niveau de départ',
  contraintes: 'Contraintes pratiques',
  attentes_specifiques: 'Attentes spécifiques',
  indicateurs_succes: 'Indicateurs de succès',
}

function BesoinTab({ session }) {
  const [besoin, setBesoin] = useState(() => getBesoin(session.id))
  const [lien, setLien] = useState(() => getLienBesoin(session.id))
  const [copied, setCopied] = useState(false)

  function refresh() {
    setBesoin(getBesoin(session.id))
    setLien(getLienBesoin(session.id))
  }

  function copyLien() {
    navigator.clipboard.writeText(lien).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleVerrouiller() {
    verrouillerBesoin(session.id)
    refresh()
  }

  function handleDeverrouiller() {
    if (!confirm('Déverrouiller les réponses ? Le commanditaire pourra les modifier.')) return
    deverrouillerBesoin(session.id)
    refresh()
  }

  function handleRegenerer() {
    if (!confirm('Générer un nouveau lien ? L\'ancien lien ne fonctionnera plus.')) return
    regenererBesoinToken(session.id)
    refresh()
  }

  const hasReponses = besoin?.reponses && Object.keys(besoin.reponses).length > 0

  return (
    <div className="besoin-tab">
      <div className="besoin-lien-section">
        <h3 className="besoin-section-title">Lien à envoyer au commanditaire</h3>
        <p className="besoin-lien-desc">Partagez ce lien avec le commanditaire de la formation. Il pourra remplir le questionnaire sans se connecter.</p>
        <div className="besoin-lien-row">
          <div className="besoin-lien-url">{lien}</div>
          <button className={`besoin-copy-btn ${copied ? 'copied' : ''}`} onClick={copyLien}>
            {copied ? '✓ Copié !' : '🔗 Copier'}
          </button>
          <a href={lien} target="_blank" rel="noopener noreferrer" className="besoin-open-btn">↗ Ouvrir</a>
        </div>
        <button className="besoin-regen-btn" onClick={handleRegenerer}>↺ Nouveau lien (invalider l'ancien)</button>
      </div>

      {!hasReponses && (
        <div className="besoin-empty">
          <div className="besoin-empty-icon">📋</div>
          <p>Aucune réponse reçue pour le moment.</p>
          <p className="besoin-empty-sub">Envoyez le lien ci-dessus au commanditaire.</p>
        </div>
      )}

      {hasReponses && (
        <div className="besoin-reponses">
          <div className="besoin-reponses-header">
            <h3 className="besoin-section-title">
              Réponses du commanditaire
              {besoin.verrouille && <span className="besoin-badge-lock">🔒 Verrouillées</span>}
            </h3>
            <div className="besoin-reponses-meta">
              {besoin.soumisAt && <span>Reçues le {new Date(besoin.soumisAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>}
            </div>
          </div>

          <div className="besoin-reponses-list">
            {Object.entries(besoin.reponses).map(([key, val]) => (
              <div key={key} className="besoin-reponse-item">
                <div className="besoin-reponse-label">{BESOIN_LABELS[key] || key}</div>
                <div className="besoin-reponse-val">{val}</div>
              </div>
            ))}
          </div>

          {(besoin.precisions || []).length > 0 && (
            <div className="besoin-precisions">
              <div className="besoin-precisions-title">Précisions complémentaires</div>
              {besoin.precisions.map((p, i) => (
                <div key={i} className="besoin-precision-item">
                  <div className="besoin-precision-texte">{p.texte}</div>
                  <div className="besoin-precision-meta">
                    {p.verrouille ? '🔒 Validé · ' : ''}
                    {new Date(p.ajoutAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="besoin-actions">
            {!besoin.verrouille ? (
              <button className="besoin-btn-verrouiller" onClick={handleVerrouiller}>
                🔒 Valider et verrouiller les réponses
              </button>
            ) : (
              <button className="besoin-btn-deverrouiller" onClick={handleDeverrouiller}>
                🔓 Déverrouiller
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
