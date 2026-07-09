import { useState, useEffect } from 'react'
import { getStagiaires, getInscriptionsByStagiaire } from '../data/stagiaires'
import { getSessions, STATUTS, MODALITES, FORMATS } from '../data/sessions'
import { getAllModules } from '../data/catalogue-afs'
import { getFormateurs } from '../data/formateurs'
import { getResultat, calculerProgression } from '../data/questionnaires'
import { getReponsesChaud, getReponsesFroid } from '../data/satisfaction'
import { getSignaturesModule, signerModule, estSigne } from '../data/emargement'
import './PortailApprenant.css'

const SESSION_KEY = 'pls_portail_app_session'

function savePortailSession(stagiaireId) { localStorage.setItem(SESSION_KEY, stagiaireId) }
function getPortailSession() { return localStorage.getItem(SESSION_KEY) || null }
function clearPortailSession() { localStorage.removeItem(SESSION_KEY) }

function LoginApprenant({ onLogin }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const stagiaires = getStagiaires()
    const stag = stagiaires.find(s => s.email?.toLowerCase() === email.toLowerCase())
    if (!stag) { setError('Aucun compte trouvé pour cet email.'); setLoading(false); return }
    if (!stag.code_acces) { setError('Aucun code d\'accès défini. Contactez l\'équipe AFS.'); setLoading(false); return }
    if (stag.code_acces.trim() !== code.trim()) { setError('Code d\'accès incorrect.'); setLoading(false); return }
    savePortailSession(stag.id)
    onLogin(stag.id)
    setLoading(false)
  }

  return (
    <div className="pa-login-wrap">
      <div className="pa-login-card">
        <div className="pa-login-icon">👤</div>
        <h2 className="pa-login-title">Espace apprenant</h2>
        <p className="pa-login-sub">Connectez-vous avec votre email et le code d'accès communiqué par votre formateur.</p>
        <form onSubmit={handleSubmit} className="pa-login-form">
          <div className="pa-login-field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.com" autoComplete="email" required />
          </div>
          <div className="pa-login-field">
            <label>Code d'accès</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="ex. AFS2026" autoComplete="off" required />
          </div>
          {error && <div className="pa-login-error">{error}</div>}
          <button type="submit" className="pa-login-btn" disabled={loading || !email || !code}>
            {loading ? 'Connexion…' : 'Accéder à mon espace →'}
          </button>
        </form>
        <div className="pa-login-footer">AFS Pennylane Learning Suite · Espace apprenants</div>
      </div>
    </div>
  )
}

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

function EmargementModule({ session, module, stagiaire }) {
  const [, setTick] = useState(0)
  const signe = estSigne(session.id, module.id, 'apprenant', stagiaire.id)
  const sig = getSignaturesModule(session.id, module.id)[`apprenant_${stagiaire.id}`]

  function signer() {
    signerModule(session.id, module.id, 'apprenant', stagiaire.id)
    setTick(t => t + 1)
  }

  return (
    <div className={`pa-emargement-row ${signe ? 'signed' : ''}`}>
      <div className="pa-emargement-info">
        <span className="pa-emargement-module">{module.titre}</span>
        {signe && sig && (
          <span className="pa-emargement-date">Signé le {new Date(sig.signedAt).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        )}
      </div>
      {signe ? (
        <span className="pa-emargement-badge">✓ Émargé</span>
      ) : (
        <button className="pa-emargement-btn" onClick={signer}>✍️ Émarger ce module</button>
      )}
    </div>
  )
}

function SessionCard({ session, inscription, stagiaire }) {
  const statut = STATUTS.find(s => s.id === session.statut) || STATUTS[0]
  const format = FORMATS.find(f => f.id === session.format)
  const modules = (session.modules || []).map(id => getAllModules().find(m => m.id === id)).filter(Boolean)
  const formateurs = getFormateurs()
  const formateur = formateurs.find(f =>
    f.id === session.formateurId ||
    (session.formateur && session.formateur.toLowerCase().includes(f.nom.toLowerCase()))
  )
  const emargementActif = session.statut === 'en_cours' || session.statut === 'termine'

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

      {session.lien_reunion && (
        <div className="pa-reunion-block">
          <a href={session.lien_reunion} target="_blank" rel="noopener noreferrer" className="pa-reunion-btn">
            🔗 Rejoindre la réunion
          </a>
        </div>
      )}

      {formateur && (
        <div className="pa-formateur-block">
          <div className="pa-formateur-avatar">{formateur.prenom[0]}{formateur.nom[0]}</div>
          <div>
            <div className="pa-formateur-nom">{formateur.prenom} {formateur.nom}</div>
            <div className="pa-formateur-email">{formateur.email}</div>
          </div>
        </div>
      )}

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

      {emargementActif && modules.length > 0 && inscription.presence !== false && (
        <div className="pa-emargement-block">
          <div className="pa-emargement-label">✍️ Émargement électronique — obligatoire (Qualiopi)</div>
          {modules.map(m => (
            <EmargementModule key={m.id} session={session} module={m} stagiaire={stagiaire} />
          ))}
        </div>
      )}

      <div className="pa-evals-block">
        <div className="pa-evals-label">Mes évaluations</div>
        <div className="pa-evals-row">
          {pre ? (
            <ScoreBadge label="Pré-formation" score={pre.score} />
          ) : (
            <a href={lienQuizPre} className="pa-eval-link pre">▶ Quizz pré-formation</a>
          )}

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

          {froid && <ScoreBadge label="À froid (30j)" score={froid.moyenne} max={10} unit="/10" />}
        </div>
      </div>
    </div>
  )
}

export default function PortailApprenant() {
  const [stagiaireId, setStagiaireId] = useState(() => getPortailSession())
  const [stagiaire, setStagiaire] = useState(null)
  const [sessions, setSessions] = useState([])
  const [inscriptions, setInscriptions] = useState([])

  useEffect(() => {
    if (!stagiaireId) return
    const stag = getStagiaires().find(s => s.id === stagiaireId)
    if (!stag) { clearPortailSession(); setStagiaireId(null); return }
    setStagiaire(stag)
    const ins = getInscriptionsByStagiaire(stagiaireId)
    setInscriptions(ins)
    const toutes = getSessions()
    const siennes = ins.map(i => toutes.find(s => s.id === i.sessionId)).filter(Boolean)
    setSessions(siennes.sort((a, b) => (b.date || '').localeCompare(a.date || '')))
  }, [stagiaireId])

  function handleLogout() {
    clearPortailSession()
    setStagiaireId(null)
    setStagiaire(null)
    setSessions([])
  }

  if (!stagiaireId) return <LoginApprenant onLogin={id => setStagiaireId(id)} />

  if (!stagiaire) return <div className="pa-loading">Chargement…</div>

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
        <div className="pa-header-right">
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
          <button className="pa-logout-btn" onClick={handleLogout}>Déconnexion</button>
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
