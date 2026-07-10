import { useState, useEffect } from 'react'
import { getSessions, STATUTS, MODALITES, FORMATS } from '../data/sessions'
import { getFormateurs } from '../data/formateurs'
import { verifyCodeCabinet, getBesoin, saveBesoinReponses, addPrecisionBesoin, getQuestionsQB } from '../data/questionnaire-besoin'
import './PortailCabinet.css'

const SESSION_KEY = 'pls_portail_cabinet_session'

function savePortailSession(email) { localStorage.setItem(SESSION_KEY, email) }
function getPortailSession() { return localStorage.getItem(SESSION_KEY) || null }
function clearPortailSession() { localStorage.removeItem(SESSION_KEY) }

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ── Login ────────────────────────────────────────────────────────────────────
function LoginCabinet({ onLogin }) {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const sessions = getSessions()
    const hasSession = sessions.some(s => s.contact_email?.toLowerCase() === email.toLowerCase())
    if (!hasSession) { setError('Aucune session trouvée pour cet email.'); return }
    if (!verifyCodeCabinet(email, code)) { setError('Code d\'accès incorrect.'); return }
    savePortailSession(email.toLowerCase())
    onLogin(email.toLowerCase())
  }

  return (
    <div className="pc-login-wrap">
      <div className="pc-login-card">
        <div className="pc-login-icon">🏢</div>
        <h2 className="pc-login-title">Espace cabinet</h2>
        <p className="pc-login-sub">Connectez-vous avec l'email du contact et le code d'accès communiqué par l'équipe AFS.</p>
        <form onSubmit={handleSubmit} className="pc-login-form">
          <div className="pc-login-field">
            <label>Email du contact</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@cabinet.fr" autoComplete="email" required />
          </div>
          <div className="pc-login-field">
            <label>Code d'accès</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="ex. AFS2K4" autoComplete="off" maxLength={8} required />
          </div>
          {error && <div className="pc-login-error">{error}</div>}
          <button type="submit" className="pc-login-btn" disabled={!email || !code}>
            Accéder à mon espace →
          </button>
        </form>
        <div className="pc-login-footer">Espace cabinet · Pennylane Learning Suite</div>
      </div>
    </div>
  )
}

// ── Questionnaire intégré ─────────────────────────────────────────────────────
function QuestionnaireInline({ sessionId }) {
  const QUESTIONS = getQuestionsQB()
  const [besoin, setBesoin] = useState(() => getBesoin(sessionId))
  const [form, setForm] = useState(() => getBesoin(sessionId)?.reponses || {})
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [precision, setPrecision] = useState('')
  const [precisionSent, setPrecisionSent] = useState(false)

  const isVerrouille = besoin?.verrouille
  const hasReponses = besoin?.reponses && Object.keys(besoin.reponses).length > 0

  function validate() {
    const e = {}
    QUESTIONS.filter(q => q.required).forEach(q => {
      const v = form[q.id]
      if (!v || (typeof v === 'string' && !v.trim())) e[q.id] = 'Ce champ est requis'
    })
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    saveBesoinReponses(sessionId, form)
    setBesoin(getBesoin(sessionId))
    setSubmitted(true)
  }

  function handlePrecision(e) {
    e.preventDefault()
    if (!precision.trim()) return
    addPrecisionBesoin(sessionId, precision.trim())
    setBesoin(getBesoin(sessionId))
    setPrecision('')
    setPrecisionSent(true)
    setTimeout(() => setPrecisionSent(false), 3000)
  }

  // Verrouillé — lecture seule + précisions
  if (isVerrouille) {
    return (
      <div className="pc-qb-wrap">
        <div className="pc-qb-badge-lock">🔒 Réponses validées — non modifiables</div>
        <div className="pc-qb-reponses">
          {QUESTIONS.map(q => {
            const rep = besoin?.reponses?.[q.id]
            if (!rep) return null
            return (
              <div key={q.id} className="pc-qb-reponse-item">
                <div className="pc-qb-reponse-label">{q.label}</div>
                <div className="pc-qb-reponse-val">{rep}</div>
              </div>
            )
          })}
        </div>

        {(besoin?.precisions || []).length > 0 && (
          <div className="pc-qb-precisions">
            <div className="pc-qb-precisions-title">Précisions complémentaires</div>
            {besoin.precisions.map((p, i) => (
              <div key={i} className="pc-qb-precision-item">
                <div className="pc-qb-precision-texte">{p.texte}</div>
                <div className="pc-qb-precision-meta">Ajouté le {formatDate(p.ajoutAt)}</div>
              </div>
            ))}
          </div>
        )}

        <div className="pc-qb-precision-section">
          <div className="pc-qb-precision-desc">Vous pouvez ajouter des précisions complémentaires ci-dessous.</div>
          <form onSubmit={handlePrecision} className="pc-qb-precision-form">
            <textarea
              value={precision}
              onChange={e => setPrecision(e.target.value)}
              placeholder="Ajoutez une précision, un contexte complémentaire…"
              rows={3}
            />
            <button type="submit" className="pc-btn-primary" disabled={!precision.trim()}>
              {precisionSent ? '✓ Précision ajoutée !' : 'Ajouter cette précision'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Réponses déjà envoyées (en attente de validation)
  if (submitted || hasReponses) {
    return (
      <div className="pc-qb-wrap">
        <div className="pc-qb-badge-soumis">✓ Réponses transmises — en attente de validation</div>
        <div className="pc-qb-reponses">
          {QUESTIONS.map(q => {
            const rep = besoin?.reponses?.[q.id] || form[q.id]
            if (!rep) return null
            return (
              <div key={q.id} className="pc-qb-reponse-item">
                <div className="pc-qb-reponse-label">{q.label}</div>
                <div className="pc-qb-reponse-val">{rep}</div>
              </div>
            )
          })}
        </div>
        {besoin?.soumisAt && <div className="pc-qb-soumis-date">Envoyé le {formatDate(besoin.soumisAt)}</div>}
      </div>
    )
  }

  // Formulaire vierge
  return (
    <div className="pc-qb-wrap">
      <p className="pc-qb-intro">Remplissez ce questionnaire pour nous permettre de préparer votre formation au mieux.</p>
      <form onSubmit={handleSubmit} className="pc-qb-form">
        {QUESTIONS.map((q, i) => (
          <div key={q.id} className={`pc-qb-question ${errors[q.id] ? 'error' : ''}`}>
            <div className="pc-qb-question-num">{i + 1}</div>
            <div className="pc-qb-question-body">
              <label className="pc-qb-question-label">
                {q.question}
                {q.required && <span className="pc-qb-required"> *</span>}
              </label>
              {q.type === 'textarea' && (
                <textarea
                  value={form[q.id] || ''}
                  onChange={e => { setForm(f => ({ ...f, [q.id]: e.target.value })); setErrors(err => ({ ...err, [q.id]: '' })) }}
                  placeholder={q.placeholder}
                  rows={3}
                />
              )}
              {q.type === 'radio' && (
                <div className="pc-qb-radio-group">
                  {(q.options || []).map(opt => (
                    <label key={opt} className={`pc-qb-radio-option ${form[q.id] === opt ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={form[q.id] === opt}
                        onChange={() => { setForm(f => ({ ...f, [q.id]: opt })); setErrors(err => ({ ...err, [q.id]: '' })) }}
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
              {errors[q.id] && <div className="pc-qb-field-error">{errors[q.id]}</div>}
            </div>
          </div>
        ))}
        <div className="pc-qb-submit-row">
          <button type="submit" className="pc-btn-submit">Envoyer mes réponses →</button>
          <span className="pc-qb-submit-note">* Champs obligatoires</span>
        </div>
      </form>
    </div>
  )
}

// ── Carte session ─────────────────────────────────────────────────────────────
function SessionCabinet({ session }) {
  const [open, setOpen] = useState(false)
  const statut = STATUTS.find(s => s.id === session.statut) || STATUTS[0]
  const format = FORMATS.find(f => f.id === session.format)
  const formateurs = getFormateurs()
  const formateur = formateurs.find(f => f.id === session.formateurId)
  const besoin = getBesoin(session.id)
  const hasReponses = besoin?.reponses && Object.keys(besoin.reponses).length > 0
  const isVerrouille = besoin?.verrouille

  const dateFormatee = session.date
    ? new Date(session.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <div className="pc-session-card">
      <div className="pc-session-head">
        <div className="pc-session-titre-row">
          <span className="pc-session-statut" style={{ background: statut.color + '20', color: statut.color }}>{statut.label}</span>
          <h3 className="pc-session-titre">{session.titre}</h3>
        </div>
        <div className="pc-session-infos">
          <span>📅 {dateFormatee}{session.heure ? ` · ${session.heure}` : ''}</span>
          {format && <span>⏱ {format.label} · {format.duree}</span>}
          <span>📡 {MODALITES.find(m => m.id === session.modalite)?.label || session.modalite}</span>
          {formateur && <span>🧑‍🏫 {formateur.prenom} {formateur.nom}</span>}
        </div>
      </div>

      <div className="pc-qb-section">
        <div className="pc-qb-section-header" onClick={() => setOpen(o => !o)}>
          <div className="pc-qb-section-title-row">
            <span className="pc-qb-section-icon">📋</span>
            <span className="pc-qb-section-title">Questionnaire de besoin</span>
            {isVerrouille
              ? <span className="pc-qb-pill lock">🔒 Validé</span>
              : hasReponses
                ? <span className="pc-qb-pill soumis">✓ Transmis</span>
                : <span className="pc-qb-pill todo">À remplir</span>
            }
          </div>
          <span className="pc-qb-toggle">{open ? '▲' : '▼'}</span>
        </div>
        {open && <QuestionnaireInline sessionId={session.id} />}
      </div>
    </div>
  )
}

// ── Portail principal ─────────────────────────────────────────────────────────
export default function PortailCabinet() {
  const [email, setEmail] = useState(() => getPortailSession())
  const [sessions, setSessions] = useState([])

  useEffect(() => {
    if (!email) return
    const all = getSessions()
    const siennes = all.filter(s => s.contact_email?.toLowerCase() === email)
    setSessions(siennes.sort((a, b) => (b.date || '').localeCompare(a.date || '')))
  }, [email])

  function handleLogout() {
    clearPortailSession()
    setEmail(null)
  }

  if (!email) return <LoginCabinet onLogin={e => setEmail(e)} />

  const sessionsAVenir = sessions.filter(s => ['brouillon', 'confirme', 'en_cours'].includes(s.statut))
  const sessionsPassees = sessions.filter(s => s.statut === 'termine')
  const nomCabinet = sessions[0]?.client_nom || sessions[0]?.client || email

  return (
    <div className="pc-wrap">
      <div className="pc-header">
        <div className="pc-identity">
          <div className="pc-avatar">🏢</div>
          <div>
            <div className="pc-name">{nomCabinet}</div>
            <div className="pc-email">{sessions[0]?.contact_nom || email}</div>
          </div>
        </div>
        <button className="pc-logout-btn" onClick={handleLogout}>Déconnexion</button>
      </div>

      {sessionsAVenir.length > 0 && (
        <div className="pc-section">
          <div className="pc-section-title">Formations à venir</div>
          {sessionsAVenir.map(s => <SessionCabinet key={s.id} session={s} />)}
        </div>
      )}

      {sessionsPassees.length > 0 && (
        <div className="pc-section">
          <div className="pc-section-title">Formations passées</div>
          {sessionsPassees.map(s => <SessionCabinet key={s.id} session={s} />)}
        </div>
      )}

      {sessions.length === 0 && (
        <div className="pc-empty">Aucune session trouvée pour cet email.</div>
      )}

      <div className="pc-footer">Espace cabinet · Pennylane Learning Suite · Accès personnel et confidentiel</div>
    </div>
  )
}
