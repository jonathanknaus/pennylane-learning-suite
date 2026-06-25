import { useState, useEffect } from 'react'
import { verifyBesoinToken, getBesoin, saveBesoinReponses, addPrecisionBesoin } from '../data/questionnaire-besoin'
import { getSessions } from '../data/sessions'
import './QuestionnaireBesoin.css'

const QUESTIONS = [
  {
    id: 'contexte',
    label: 'Contexte de la formation',
    question: 'Quelle est la situation qui motive cette demande de formation ?',
    type: 'textarea',
    placeholder: 'Décrivez le contexte : changements récents, difficultés rencontrées, évolutions à venir…',
    required: true,
  },
  {
    id: 'objectifs',
    label: 'Objectifs visés',
    question: 'Quels sont les principaux objectifs que vous souhaitez atteindre ?',
    type: 'textarea',
    placeholder: 'Ex. : maîtriser la saisie comptable, comprendre la TVA, automatiser les exports…',
    required: true,
  },
  {
    id: 'public',
    label: 'Public concerné',
    question: 'Qui sera formé ? Quel est leur niveau actuel sur le sujet ?',
    type: 'textarea',
    placeholder: 'Ex. : 4 collaborateurs, débutants sur Pennylane, utilisateurs depuis 6 mois…',
    required: true,
  },
  {
    id: 'niveau_depart',
    label: 'Niveau de départ',
    question: 'Comment évaluez-vous le niveau actuel de vos équipes sur les sujets à former ?',
    type: 'radio',
    options: ['Débutant — premier contact avec le sujet', 'Intermédiaire — notions de base acquises', 'Avancé — pratique régulière, perfectionnement souhaité'],
    required: true,
  },
  {
    id: 'contraintes',
    label: 'Contraintes pratiques',
    question: 'Y a-t-il des contraintes de planning, de disponibilité ou d\'organisation à prendre en compte ?',
    type: 'textarea',
    placeholder: 'Ex. : clôture comptable en mars, télétravail les lundis, 1h max par session…',
    required: false,
  },
  {
    id: 'attentes_specifiques',
    label: 'Attentes spécifiques',
    question: 'Avez-vous des attentes particulières sur le déroulement ou le format de la formation ?',
    type: 'textarea',
    placeholder: 'Ex. : exercices pratiques sur vos données réelles, support PDF, suivi post-formation…',
    required: false,
  },
  {
    id: 'indicateurs_succes',
    label: 'Indicateurs de succès',
    question: 'Comment saurez-vous que la formation a atteint ses objectifs ?',
    type: 'textarea',
    placeholder: 'Ex. : les collaborateurs gèrent seuls la TVA, gain de temps de X heures par semaine…',
    required: false,
  },
]

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function QuestionnaireBesoin({ sessionId, token }) {
  const [session, setSession] = useState(null)
  const [valid, setValid] = useState(null)
  const [besoin, setBesoin] = useState(null)
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [precision, setPrecision] = useState('')
  const [precisionSent, setPrecisionSent] = useState(false)

  useEffect(() => {
    const ok = verifyBesoinToken(sessionId, token)
    setValid(ok)
    if (!ok) return
    const sess = getSessions().find(s => s.id === sessionId)
    setSession(sess || null)
    const b = getBesoin(sessionId)
    setBesoin(b)
    if (b?.reponses) setForm(b.reponses)
  }, [sessionId, token])

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

  if (valid === null) return <div className="qb-loading">Chargement…</div>

  if (!valid) {
    return (
      <div className="qb-error">
        <div className="qb-error-icon">🔒</div>
        <h2>Accès refusé</h2>
        <p>Ce lien est invalide ou a expiré. Contactez l'équipe AFS pour obtenir un nouveau lien.</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="qb-error">
        <div className="qb-error-icon">❓</div>
        <h2>Session introuvable</h2>
        <p>Aucune session ne correspond à cet identifiant.</p>
      </div>
    )
  }

  const isVerrouille = besoin?.verrouille
  const hasReponses = besoin?.reponses && Object.keys(besoin.reponses).length > 0

  // Formulaire verrouillé — affichage lecture seule + précisions
  if (isVerrouille) {
    return (
      <div className="qb-wrap">
        <div className="qb-header">
          <div className="qb-header-top">
            <div className="qb-badge-verrouille">🔒 Réponses validées</div>
          </div>
          <h1 className="qb-title">Questionnaire de besoin</h1>
          <div className="qb-session-name">{session.titre}</div>
          {session.date && (
            <div className="qb-session-date">
              📅 {new Date(session.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          )}
        </div>

        <div className="qb-section">
          <h2 className="qb-section-title">Vos réponses</h2>
          <p className="qb-verrouille-msg">Ces réponses ont été validées. Vous pouvez ajouter des précisions ci-dessous.</p>
          <div className="qb-reponses-list">
            {QUESTIONS.map(q => {
              const rep = besoin?.reponses?.[q.id]
              if (!rep) return null
              return (
                <div key={q.id} className="qb-reponse-item">
                  <div className="qb-reponse-label">{q.label}</div>
                  <div className="qb-reponse-val">{rep}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Précisions */}
        <div className="qb-section">
          <h2 className="qb-section-title">Précisions complémentaires</h2>
          <p className="qb-precision-desc">Vous pouvez ajouter des informations complémentaires après la validation de vos réponses.</p>

          {(besoin?.precisions || []).map((p, i) => (
            <div key={i} className={`qb-precision-item ${p.verrouille ? 'verrouille' : ''}`}>
              <div className="qb-precision-texte">{p.texte}</div>
              <div className="qb-precision-meta">
                {p.verrouille ? '🔒 Validé · ' : ''}
                Ajouté le {formatDate(p.ajoutAt)}
              </div>
            </div>
          ))}

          <form onSubmit={handlePrecision} className="qb-precision-form">
            <textarea
              value={precision}
              onChange={e => setPrecision(e.target.value)}
              placeholder="Ajoutez une précision, un contexte complémentaire, une demande spécifique…"
              rows={3}
            />
            <button type="submit" className="qb-btn-primary" disabled={!precision.trim()}>
              {precisionSent ? '✓ Précision ajoutée !' : 'Ajouter cette précision'}
            </button>
          </form>
        </div>

        <div className="qb-footer">
          Questionnaire de besoin · AFS Pennylane Learning Suite · Accès confidentiel
        </div>
      </div>
    )
  }

  // Formulaire soumis (confirmé, pas encore verrouillé par admin)
  if (submitted || hasReponses) {
    return (
      <div className="qb-wrap">
        <div className="qb-header">
          <div className="qb-header-top">
            <div className="qb-badge-soumis">✓ Réponses transmises</div>
          </div>
          <h1 className="qb-title">Questionnaire de besoin</h1>
          <div className="qb-session-name">{session.titre}</div>
        </div>

        <div className="qb-section qb-confirmation">
          <div className="qb-confirmation-icon">✅</div>
          <h2>Merci pour vos réponses !</h2>
          <p>L'équipe AFS a bien reçu vos informations et préparera la formation en conséquence. Vous recevrez une confirmation de session dans les prochains jours.</p>
          {besoin?.soumisAt && <p className="qb-soumis-date">Réponses envoyées le {formatDate(besoin.soumisAt)}</p>}
        </div>

        <div className="qb-section">
          <h2 className="qb-section-title">Vos réponses</h2>
          <div className="qb-reponses-list">
            {QUESTIONS.map(q => {
              const rep = besoin?.reponses?.[q.id] || form[q.id]
              if (!rep) return null
              return (
                <div key={q.id} className="qb-reponse-item">
                  <div className="qb-reponse-label">{q.label}</div>
                  <div className="qb-reponse-val">{rep}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="qb-footer">
          Questionnaire de besoin · AFS Pennylane Learning Suite · Accès confidentiel
        </div>
      </div>
    )
  }

  // Formulaire vierge
  return (
    <div className="qb-wrap">
      <div className="qb-header">
        <h1 className="qb-title">Questionnaire de besoin</h1>
        <div className="qb-session-name">{session.titre}</div>
        {session.date && (
          <div className="qb-session-date">
            📅 {new Date(session.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        )}
        <p className="qb-intro">
          Ce questionnaire nous permet de préparer une formation parfaitement adaptée à vos besoins et à ceux de votre équipe. Vos réponses resteront confidentielles.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="qb-form">
        {QUESTIONS.map((q, i) => (
          <div key={q.id} className={`qb-question ${errors[q.id] ? 'error' : ''}`}>
            <div className="qb-question-num">{i + 1}</div>
            <div className="qb-question-body">
              <label className="qb-question-label">
                {q.question}
                {q.required && <span className="qb-required"> *</span>}
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
                <div className="qb-radio-group">
                  {q.options.map(opt => (
                    <label key={opt} className={`qb-radio-option ${form[q.id] === opt ? 'selected' : ''}`}>
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
              {errors[q.id] && <div className="qb-field-error">{errors[q.id]}</div>}
            </div>
          </div>
        ))}

        <div className="qb-submit-row">
          <button type="submit" className="qb-btn-submit">
            Envoyer mes réponses →
          </button>
          <p className="qb-submit-note">* Champs obligatoires</p>
        </div>
      </form>

      <div className="qb-footer">
        Questionnaire de besoin · AFS Pennylane Learning Suite · Accès confidentiel
      </div>
    </div>
  )
}
