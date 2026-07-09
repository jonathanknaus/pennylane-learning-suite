import { useState, useEffect } from 'react'
import { getSessions, deleteSession, seedDemoSessions, STATUTS, FORMATS, MODALITES, QUALIOPI_OPTIONS } from '../data/sessions'
import { getAllModules } from '../data/catalogue-afs'
import { seedDemoStagiaires } from '../data/stagiaires'
import SessionForm from '../components/SessionForm'
import SessionDetail from '../components/SessionDetail'
import './Sessions.css'

const NAV_LOCAL_FALLBACK = { view: 'liste', sessionId: null, tab: null }

export default function Sessions({ onNavigate, nav, onNavigateNav }) {
  const [sessions, setSessions] = useState([])
  const [filtreStatut, setFiltreStatut] = useState('tous')

  // Navigation locale repliée sur nav (page/session/onglet) quand disponible — permet
  // au bouton retour du navigateur de restaurer exactement la vue précédente. Sans
  // nav (composant utilisé hors contexte App), on retombe sur un état local classique.
  const [localNav, setLocalNav] = useState(NAV_LOCAL_FALLBACK)
  const effectiveNav = nav || localNav
  const view = effectiveNav.view || 'liste'
  const sessionId = effectiveNav.sessionId

  function setNav(patch, opts) {
    if (onNavigateNav) onNavigateNav(patch, opts)
    else setLocalNav(n => ({ ...n, ...patch }))
  }

  useEffect(() => {
    seedDemoSessions()
    seedDemoStagiaires()
    setSessions(getSessions())
  }, [])

  function refresh() {
    setSessions(getSessions())
  }

  function handleDelete(id) {
    if (!confirm('Supprimer cette session ?')) return
    setSessions(deleteSession(id))
  }

  function handleEdit(session) {
    setNav({ view: 'form', sessionId: session.id })
  }

  function handleNew() {
    setNav({ view: 'form', sessionId: null })
  }

  function handleSaved() {
    refresh()
    setNav({ view: 'liste', sessionId: null })
  }

  function handleOpenDetail(session) {
    setNav({ view: 'detail', sessionId: session.id, tab: null })
  }

  const editing = sessionId ? sessions.find(s => s.id === sessionId) : null

  const sessionsFiltrees = filtreStatut === 'tous'
    ? sessions
    : sessions.filter(s => s.statut === filtreStatut)

  const sessionsTri = [...sessionsFiltrees].sort((a, b) => a.date < b.date ? -1 : 1)

  if (view === 'form') {
    return (
      <SessionForm
        session={editing}
        onSaved={handleSaved}
        onCancel={() => setNav({ view: editing ? 'detail' : 'liste' })}
      />
    )
  }

  if (view === 'detail' && editing) {
    return (
      <SessionDetail
        session={editing}
        onClose={() => { refresh(); setNav({ view: 'liste', sessionId: null }) }}
        onEdit={() => setNav({ view: 'form' })}
        onNavigateApp={onNavigate}
        tab={effectiveNav.tab}
        onNavigateTab={t => setNav({ tab: t }, { replace: true })}
      />
    )
  }

  return (
    <div className="sessions">
      <div className="sessions-topbar">
        <div>
          <h1 className="sessions-title">Sessions de formation</h1>
          <p className="sessions-sub">{sessions.length} session{sessions.length > 1 ? 's' : ''} au total</p>
        </div>
        <button className="btn-primary" onClick={handleNew}>+ Nouvelle session</button>
      </div>

      <div className="sessions-filters">
        {['tous', ...STATUTS.map(s => s.id)].map(id => {
          const statut = STATUTS.find(s => s.id === id)
          const count = id === 'tous' ? sessions.length : sessions.filter(s => s.statut === id).length
          return (
            <button
              key={id}
              className={`filter-btn ${filtreStatut === id ? 'active' : ''}`}
              style={filtreStatut === id && statut ? { borderColor: statut.color, color: statut.color } : {}}
              onClick={() => setFiltreStatut(id)}
            >
              {id === 'tous' ? 'Toutes' : statut.label}
              <span className="filter-count">{count}</span>
            </button>
          )
        })}
      </div>

      {sessionsTri.length === 0 ? (
        <div className="sessions-empty">
          <div className="empty-icon">📅</div>
          <p>Aucune session{filtreStatut !== 'tous' ? ' dans ce statut' : ''}</p>
          <button className="btn-primary" onClick={handleNew}>Créer une session</button>
        </div>
      ) : (
        <div className="sessions-list">
          {sessionsTri.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onOpen={() => handleOpenDetail(session)}
              onEdit={() => handleEdit(session)}
              onDelete={() => handleDelete(session.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function SessionCard({ session, onOpen, onEdit, onDelete }) {
  const statut = STATUTS.find(s => s.id === session.statut) || STATUTS[0]
  const format = FORMATS.find(f => f.id === session.format)
  const allModules = getAllModules()
  const modulesDetails = (session.modules || [])
    .map(id => allModules.find(m => m.id === id))
    .filter(Boolean)

  const dateFormatee = session.date
    ? new Date(session.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const tauxRemplissage = session.participants_max > 0
    ? Math.round((session.participants_inscrits / session.participants_max) * 100)
    : 0

  return (
    <div className="session-card" onClick={onOpen} style={{ cursor: 'pointer' }}>
      <div className="session-card-header">
        <div className="session-card-left">
          <div className="session-statut-badge" style={{ background: statut.color + '20', color: statut.color }}>
            {statut.label}
          </div>
          <h3 className="session-titre">{session.titre || 'Session sans titre'}</h3>
          <div className="session-client">{session.client || 'Client non renseigné'}</div>
        </div>
        <div className="session-card-actions" onClick={e => e.stopPropagation()}>
          <button className="btn-icon" onClick={onEdit} title="Modifier">✏️</button>
          <button className="btn-icon btn-danger" onClick={onDelete} title="Supprimer">🗑</button>
        </div>
      </div>

      <div className="session-card-meta">
        <div className="meta-item">
          <span className="meta-icon">📅</span>
          <span>{dateFormatee}{session.heure ? ` · ${session.heure}` : ''}</span>
        </div>
        <div className="meta-item">
          <span className="meta-icon">📡</span>
          <span>{MODALITES.find(m => m.id === session.modalite)?.label || session.modalite}</span>
          {session.qualiopi && session.qualiopi !== 'non' && (() => {
            const q = QUALIOPI_OPTIONS.find(o => o.id === session.qualiopi)
            return q ? <span className="meta-qualiopi-badge" style={{ color: q.color, background: q.bg }}>{q.label}</span> : null
          })()}
        </div>
        {format && (
          <div className="meta-item">
            <span className="meta-icon">⏱</span>
            <span>{format.label} · {format.duree}</span>
          </div>
        )}
        <div className="meta-item">
          <span className="meta-icon">👤</span>
          <span>{session.formateur || 'Formateur non assigné'}</span>
        </div>
      </div>

      {modulesDetails.length > 0 && (
        <div className="session-modules">
          {modulesDetails.map(m => (
            <span key={m.id} className="session-module-tag">{m.titre}</span>
          ))}
        </div>
      )}

      <div className="session-card-footer">
        <div className="participants-bar-wrap">
          <div className="participants-label">
            <span>{session.participants_inscrits || 0} / {session.participants_max || 15} participants</span>
            <span className="participants-pct">{tauxRemplissage}%</span>
          </div>
          <div className="participants-bar">
            <div
              className="participants-fill"
              style={{
                width: `${tauxRemplissage}%`,
                background: tauxRemplissage >= 90 ? '#EF4444' : tauxRemplissage >= 60 ? '#F59E0B' : '#00C67A'
              }}
            />
          </div>
        </div>
        {format && (
          <div className="session-prix">
            {session.modalite === 'visio' && format.visio && <span>{format.visio}€ HT</span>}
            {session.modalite === 'presentiel' && format.presentiel && <span>{format.presentiel}€ HT</span>}
          </div>
        )}
      </div>

      {session.notes && (
        <div className="session-notes">💬 {session.notes}</div>
      )}
    </div>
  )
}
