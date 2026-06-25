import { useState, useEffect } from 'react'
import { verifyPortailStagiaire } from '../data/portails'
import { getStagiaires, getInscriptionsByStagiaire } from '../data/stagiaires'
import { getSessions, STATUTS, MODALITES, FORMATS, ALL_MODULES } from '../data/sessions'
import { getFormateurs } from '../data/formateurs'
import { getResultat, calculerProgression } from '../data/questionnaires'
import { getReponsesChaud, getReponsesFroid } from '../data/satisfaction'
import './PortailApprenant.css'

function ScoreBadge({ label, score, max = 100, unit = '%' }) {
  const color = max === 10
    ? (score >= 8 ? '#059669' : score >= 6 ? '#D97706' : '#DC2626')
    : (score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#DC2626')
  return (
    <div className="pa-score-badge" style={{ borderColor: color + '40', background: color + '10' }}>
      <span className="pa-score-label">{label}</span>
      <span className="pa-score-val" style={{ color }}>{score}{unit}</span>
    </div>
  )
}

function SessionCard({ session, inscription, stagiaire }) {
  const statut = STATUTS.find(s => s.id === session.statut) || STATUTS[0]
  const format = FORMATS.find(f => f.id === session.format)
  const modules = (session.modules || []).map(id => ALL_MODULES.find(m => m.id === id)).filter(Boolean)
  const formateurs = getFormateurs()
  const formateur = formateurs.find(f =>
    f.id === session.formateurId ||
    (session.formateur && session.formateur.toLowerCase().includes(f.nom.toLowerCase()))
  )

  const pre = getResultat(session.id, stagiaire.id, 'pre')
  const post = getResultat(session.id, stagiaire.id, 'post')
  const chaud = getReponsesChaud(session.id, stagiaire.id)
  const froid = getReponsesFroid(session.id, stagiaire.id)
  const progression = pre && post ? calculerProgression(pre.score, post.score) : null

  const dateFormatee = session.date
    ? new Date(session.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  const baseUrl = window.location.origin + window.location.pathname
  const lienQuizPre = `${baseUrl}#quiz/${session.id}/${stagiaire.id}/pre`
  const lienEval = `${baseUrl}#eval/${session.id}/${stagiaire.id}`

  return (
    <div className="pa-session-card">
      <div className="pa-session-head">
        <div className="pa-session-titre-row">
          <span className="pa-session-statut" style={{ background: statut.color + '20', color: statut.color }}>
            {statut.label}
          </span>
          <h3 className="pa-session-titre">{session.titre}</h3>
        </div>
        <div className="pa-session-infos">
          <span>📅 {dateFormatee}{session.heure ? ` · ${session.heure}` : ''}</span>
          {format && <span>⏱ {format.label} · {format.duree}</span>}
          <span>📡 {MODALITES.find(m => m.id === session.modalite)?.label || session.modalite}</span>
          {session.client && <span>🏢 {session.client}</span>}
          {inscription.presence === true && <span className="pa-badge-present">✓ Présent</span>}
          {inscription.presence === false && <span className="pa-badge-absent">✗ Absent</span>}
        </div>
      </div>

      {/* Lien réunion */}
      {session.lien_reunion && (
        <div className="pa-reunion-block">
          <a href={session.lien_reunion} target="_blank" rel="noopener noreferrer" className="pa-reunion-btn">
            🔗 Rejoindre la réunion
          </a>
        </div>
      )}

      {/* Formateur */}
      {formateur && (
        <div className="pa-formateur-block">
          <div className="pa-formateur-avatar">{formateur.prenom[0]}{formateur.nom[0]}</div>
          <div>
            <div className="pa-formateur-nom">{formateur.prenom} {formateur.nom}</div>
            <div className="pa-formateur-email">{formateur.email}</div>
          </div>
        </div>
      )}

      {/* Programme */}
      {modules.length > 0 && (
        <div className="pa-programme">
          <div className="pa-programme-label">Programme · {modules.length} module{modules.length > 1 ? 's' : ''}</div>
          <div className="pa-programme-list">
            {modules.map((m, i) => (
              <div key={m.id} className="pa-programme-item">
                <span className="pa-programme-num">{i + 1}</span>
                <span>{m.titre}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Évaluations */}
      <div className="pa-evals-block">
        <div className="pa-evals-label">Mes évaluations</div>
        <div className="pa-evals-row">
          {/* Quizz pré */}
          {pre ? (
            <ScoreBadge label="Pré-formation" score={pre.score} />
          ) : (
            <a href={lienQuizPre} className="pa-eval-link pre">▶ Quizz pré-formation</a>
          )}

          {/* Évaluation post + satisfaction chaud */}
          {post || chaud ? (
            <>
              {post && <ScoreBadge label="Post-formation" score={post.score} />}
              {chaud && <ScoreBadge label="Satisfaction" score={chaud.moyenne} max={10} unit="/10" />}
              {progression !== null && (
                <ScoreBadge label="Progression" score={(progression >= 0 ? '+' : '') + progression} unit="%" max={100} />
              )}
            </>
          ) : (
            pre && <a href={lienEval} className="pa-eval-link post">▶ Évaluation de fin de formation</a>
          )}

          {/* Satisfaction à froid */}
          {froid && <ScoreBadge label="À froid (30j)" score={froid.moyenne} max={10} unit="/10" />}
        </div>
      </div>
    </div>
  )
}

export default function PortailApprenant({ stagiaireId, token }) {
  const [stagiaire, setStagiaire] = useState(null)
  const [sessions, setSessions] = useState([])
  const [inscriptions, setInscriptions] = useState([])
  const [valid, setValid] = useState(null)

  useEffect(() => {
    const ok = verifyPortailStagiaire(stagiaireId, token)
    setValid(ok)
    if (!ok) return

    const stag = getStagiaires().find(s => s.id === stagiaireId)
    setStagiaire(stag || null)
    if (!stag) return

    const ins = getInscriptionsByStagiaire(stagiaireId)
    setInscriptions(ins)
    const toutes = getSessions()
    const siennes = ins.map(i => toutes.find(s => s.id === i.sessionId)).filter(Boolean)
    setSessions(siennes.sort((a, b) => (b.date || '').localeCompare(a.date || '')))
  }, [stagiaireId, token])

  if (valid === null) return <div className="pa-loading">Chargement…</div>

  if (!valid) {
    return (
      <div className="pa-error">
        <div className="pa-error-icon">🔒</div>
        <h2>Accès refusé</h2>
        <p>Ce lien est invalide ou a expiré. Contactez l'équipe AFS pour obtenir un nouveau lien.</p>
      </div>
    )
  }

  if (!stagiaire) {
    return (
      <div className="pa-error">
        <div className="pa-error-icon">❓</div>
        <h2>Apprenant introuvable</h2>
        <p>Aucun profil ne correspond à cet identifiant.</p>
      </div>
    )
  }

  const sessionsAVenir = sessions.filter(s => ['brouillon', 'confirme', 'en_cours'].includes(s.statut))
  const sessionsPassees = sessions.filter(s => s.statut === 'termine')

  return (
    <div className="pa-wrap">
      <div className="pa-header">
        <div className="pa-identity">
          <div className="pa-avatar">{stagiaire.prenom[0]}{stagiaire.nom[0]}</div>
          <div>
            <div className="pa-name">{stagiaire.prenom} {stagiaire.nom}</div>
            <div className="pa-cabinet">{stagiaire.cabinet || stagiaire.email}</div>
          </div>
        </div>
        <div className="pa-header-stats">
          <div className="pa-stat">
            <span className="pa-stat-val">{sessions.length}</span>
            <span className="pa-stat-label">Formation{sessions.length > 1 ? 's' : ''}</span>
          </div>
          <div className="pa-stat">
            <span className="pa-stat-val">{sessionsAVenir.length}</span>
            <span className="pa-stat-label">À venir</span>
          </div>
        </div>
      </div>

      {sessionsAVenir.length > 0 && (
        <div className="pa-section">
          <div className="pa-section-title">Mes formations à venir</div>
          {sessionsAVenir.map(s => {
            const ins = inscriptions.find(i => i.sessionId === s.id)
            return <SessionCard key={s.id} session={s} inscription={ins} stagiaire={stagiaire} />
          })}
        </div>
      )}

      {sessionsPassees.length > 0 && (
        <div className="pa-section">
          <div className="pa-section-title">Mes formations passées</div>
          {sessionsPassees.map(s => {
            const ins = inscriptions.find(i => i.sessionId === s.id)
            return <SessionCard key={s.id} session={s} inscription={ins} stagiaire={stagiaire} />
          })}
        </div>
      )}

      {sessions.length === 0 && (
        <div className="pa-empty">Aucune formation inscrite pour le moment.</div>
      )}

      <div className="pa-footer">
        Espace apprenant · AFS Pennylane Learning Suite · Accès personnel et confidentiel
      </div>
    </div>
  )
}
