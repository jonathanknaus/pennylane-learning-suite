import { useState, useEffect } from 'react'
import { verifyPortailFormateur } from '../data/portails'
import { getFormateurs } from '../data/formateurs'
import { getSessions, STATUTS, MODALITES, FORMATS, ALL_MODULES } from '../data/sessions'
import { getInscriptionsBySession, getStagiaires } from '../data/stagiaires'
import { getResultat } from '../data/questionnaires'
import { getReponsesChaud } from '../data/satisfaction'
import './PortailFormateur.css'

function SessionCard({ session, formateur }) {
  const [open, setOpen] = useState(false)
  const inscriptions = getInscriptionsBySession(session.id)
  const stagiaires = getStagiaires()
  const statut = STATUTS.find(s => s.id === session.statut) || STATUTS[0]
  const format = FORMATS.find(f => f.id === session.format)
  const modules = (session.modules || []).map(id => ALL_MODULES.find(m => m.id === id)).filter(Boolean)
  const dateFormatee = session.date
    ? new Date(session.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="pf-session-card">
      <div className="pf-session-header" onClick={() => setOpen(v => !v)}>
        <div className="pf-session-left">
          <span className="pf-session-statut" style={{ background: statut.color + '20', color: statut.color }}>
            {statut.label}
          </span>
          <div>
            <div className="pf-session-titre">{session.titre}</div>
            <div className="pf-session-meta">
              📅 {dateFormatee}{session.heure ? ` · ${session.heure}` : ''}
              {format && <> · ⏱ {format.duree}</>}
              {session.client && <> · 🏢 {session.client}</>}
            </div>
          </div>
        </div>
        <div className="pf-session-right">
          <span className="pf-session-participants">👥 {inscriptions.length} participant{inscriptions.length > 1 ? 's' : ''}</span>
          <span className="pf-chevron">{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="pf-session-body">
          {/* Modalité & lien */}
          <div className="pf-session-row">
            <span className="pf-row-label">Modalité</span>
            <span>{MODALITES.find(m => m.id === session.modalite)?.label || session.modalite}</span>
            {session.lien_reunion && (
              <a href={session.lien_reunion} target="_blank" rel="noopener noreferrer" className="pf-lien-reunion">
                🔗 Rejoindre la réunion
              </a>
            )}
          </div>

          {/* Modules */}
          {modules.length > 0 && (
            <div className="pf-session-row">
              <span className="pf-row-label">Programme</span>
              <div className="pf-modules-list">
                {modules.map((m, i) => (
                  <div key={m.id} className="pf-module-item">
                    <span className="pf-module-num">{i + 1}</span>
                    <span className="pf-module-titre">{m.titre}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Participants */}
          {inscriptions.length > 0 && (
            <div className="pf-session-row">
              <span className="pf-row-label">Participants</span>
              <div className="pf-participants-list">
                {inscriptions.map(ins => {
                  const stag = stagiaires.find(s => s.id === ins.stagiaireId)
                  if (!stag) return null
                  const pre = getResultat(session.id, ins.stagiaireId, 'pre')
                  const post = getResultat(session.id, ins.stagiaireId, 'post')
                  const sat = getReponsesChaud(session.id, ins.stagiaireId)
                  return (
                    <div key={ins.stagiaireId} className="pf-participant-row">
                      <div className="pf-participant-avatar">{stag.prenom[0]}{stag.nom[0]}</div>
                      <div className="pf-participant-info">
                        <div className="pf-participant-nom">{stag.prenom} {stag.nom}</div>
                        <div className="pf-participant-cab">{stag.cabinet || stag.email}</div>
                      </div>
                      <div className="pf-participant-badges">
                        {ins.presence === true && <span className="pf-badge present">Présent</span>}
                        {ins.presence === false && <span className="pf-badge absent">Absent</span>}
                        {pre && <span className="pf-badge quiz" title="Quizz pré-formation">Pré {pre.score}%</span>}
                        {post && <span className="pf-badge quiz post" title="Quizz post-formation">Post {post.score}%</span>}
                        {sat && <span className="pf-badge sat" title="Satisfaction à chaud">⭐ {sat.moyenne}/10</span>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {session.notes && (
            <div className="pf-session-row">
              <span className="pf-row-label">Notes</span>
              <span className="pf-notes">{session.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PortailFormateur({ formateurId, token }) {
  const [formateur, setFormateur] = useState(null)
  const [sessions, setSessions] = useState([])
  const [valid, setValid] = useState(null)
  const [filtre, setFiltre] = useState('all')

  useEffect(() => {
    const ok = verifyPortailFormateur(formateurId, token)
    setValid(ok)
    if (!ok) return

    const fmt = getFormateurs().find(f => f.id === formateurId)
    setFormateur(fmt || null)

    // Sessions où ce formateur est assigné (par id ou par email/nom)
    const toutes = getSessions()
    const siennes = toutes.filter(s => {
      if (!fmt) return false
      const nomComplet = `${fmt.prenom} ${fmt.nom}`.toLowerCase()
      return (
        s.formateurId === formateurId ||
        (s.formateur && s.formateur.toLowerCase().includes(fmt.nom.toLowerCase()))
      )
    })
    setSessions(siennes)
  }, [formateurId, token])

  if (valid === null) return <div className="pf-loading">Chargement…</div>

  if (!valid) {
    return (
      <div className="pf-error">
        <div className="pf-error-icon">🔒</div>
        <h2>Accès refusé</h2>
        <p>Ce lien est invalide ou a expiré. Contactez l'équipe AFS pour obtenir un nouveau lien.</p>
      </div>
    )
  }

  if (!formateur) {
    return (
      <div className="pf-error">
        <div className="pf-error-icon">❓</div>
        <h2>Formateur introuvable</h2>
        <p>Aucun profil ne correspond à cet identifiant.</p>
      </div>
    )
  }

  const FILTRES = [
    { id: 'all', label: 'Toutes' },
    { id: 'a_venir', label: 'À venir' },
    { id: 'en_cours', label: 'En cours' },
    { id: 'termine', label: 'Terminées' },
  ]

  const sessionsFiltrees = sessions.filter(s => {
    if (filtre === 'all') return true
    if (filtre === 'a_venir') return ['brouillon', 'confirme'].includes(s.statut)
    if (filtre === 'en_cours') return s.statut === 'en_cours'
    if (filtre === 'termine') return s.statut === 'termine'
    return true
  })

  const prochaine = sessions
    .filter(s => s.date && ['confirme', 'en_cours'].includes(s.statut))
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  return (
    <div className="pf-wrap">
      <div className="pf-header">
        <div className="pf-header-identity">
          <div className="pf-avatar">{formateur.prenom[0]}{formateur.nom[0]}</div>
          <div>
            <div className="pf-name">{formateur.prenom} {formateur.nom}</div>
            <div className="pf-role">Formateur · AFS Pennylane</div>
          </div>
        </div>
        <div className="pf-header-stats">
          <div className="pf-stat">
            <span className="pf-stat-val">{sessions.length}</span>
            <span className="pf-stat-label">Formation{sessions.length > 1 ? 's' : ''}</span>
          </div>
          <div className="pf-stat">
            <span className="pf-stat-val">
              {sessions.filter(s => ['confirme', 'en_cours'].includes(s.statut)).length}
            </span>
            <span className="pf-stat-label">À venir</span>
          </div>
        </div>
      </div>

      {prochaine && (
        <div className="pf-prochaine">
          <div className="pf-prochaine-label">Prochaine formation</div>
          <div className="pf-prochaine-titre">{prochaine.titre}</div>
          <div className="pf-prochaine-date">
            📅 {new Date(prochaine.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {prochaine.heure ? ` · ${prochaine.heure}` : ''}
          </div>
          {prochaine.lien_reunion && (
            <a href={prochaine.lien_reunion} target="_blank" rel="noopener noreferrer" className="pf-prochaine-lien">
              🔗 Rejoindre la réunion
            </a>
          )}
        </div>
      )}

      <div className="pf-filtres">
        {FILTRES.map(f => (
          <button
            key={f.id}
            className={`pf-filtre-btn ${filtre === f.id ? 'active' : ''}`}
            onClick={() => setFiltre(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {sessionsFiltrees.length === 0 ? (
        <div className="pf-empty">Aucune formation dans cette catégorie.</div>
      ) : (
        <div className="pf-sessions-list">
          {sessionsFiltrees.map(s => (
            <SessionCard key={s.id} session={s} formateur={formateur} />
          ))}
        </div>
      )}

      <div className="pf-footer">
        Portail formateur · AFS Pennylane Learning Suite · Accès personnel et confidentiel
      </div>
    </div>
  )
}
