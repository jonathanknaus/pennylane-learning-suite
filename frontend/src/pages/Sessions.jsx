import { useState, useEffect } from 'react'
import { getSessions, deleteSession, seedDemoSessions, STATUTS, ALL_MODULES, FORMATS, MODALITES, QUALIOPI_OPTIONS } from '../data/sessions'
import { seedDemoStagiaires } from '../data/stagiaires'
import SessionForm from '../components/SessionForm'
import SessionDetail from '../components/SessionDetail'
import './Sessions.css'

export default function Sessions({ onNavigate }) {
  const [sessions, setSessions] = useState([])
  const [view, setView] = useState('liste') // 'liste' | 'form' | 'detail'
  const [editing, setEditing] = useState(null)
  const [filtreStatut, setFiltreStatut] = useState('tous')

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
    setEditing(session)
    setView('form')
  }

  function handleNew() {
    setEditing(null)
    setView('form')
  }

  function handleSaved() {
    refresh()
    setView('liste')
    setEditing(null)
  }

  function handleOpenDetail(session) {
    setEditing(session)
    setView('detail')
  }

  const sessionsFiltrees = filtreStatut === 'tous'
    ? sessions
    : sessions.filter(s => s.statut === filtreStatut)

  const sessionsTri = [...sessionsFiltrees].sort((a, b) => a.date < b.date ? -1 : 1)

  if (view === 'form') {
    return (
      <SessionForm
        session={editing}
        onSaved={handleSaved}
        onCancel={() => setView(editing ? 'detail' : 'liste')}
      />
    )
  }

  if (view === 'detail' && editing) {
    return (
      <SessionDetail
        session={editing}
        onClose={() => { refresh(); setView('liste') }}
        onEdit={() => setView('form')}
        onNavigateApp={onNavigate}
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
  const modulesDetails = (session.modules || [])
    .map(id => ALL_MODULES.find(m => m.id === id))
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
