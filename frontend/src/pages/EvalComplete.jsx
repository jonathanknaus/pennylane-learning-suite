import { useState, useEffect } from 'react'
import { genererQuestionnaire, sauvegarderReponses, getResultat, calculerProgression } from '../data/questionnaires'
import { QUESTIONS_CHAUD, LABELS_ECHELLE, getReponsesChaud, saveReponsesChaud } from '../data/satisfaction'
import { getSessions } from '../data/sessions'
import { getStagiaires } from '../data/stagiaires'
import './EvalComplete.css'

// Section 1 : Quizz post-formation (MCQ)
function QuizzPost({ session, stagiaire, onDone }) {
  const [questions, setQuestions] = useState(null)
  const [reponses, setReponses] = useState({})
  const [current, setCurrent] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [resultat, setResultat] = useState(null)

  useEffect(() => {
    const dejaFait = getResultat(session.id, stagiaire.id, 'post')
    if (dejaFait) { setResultat(dejaFait); setSubmitted(true); return }
    const pre = getResultat(session.id, stagiaire.id, 'pre')
    const preIds = pre ? pre.questions.map(q => q.id) : []
    const q = genererQuestionnaire(session.modules || [], 'post', preIds)
    setQuestions(q)
  }, [session.id, stagiaire.id])

  function handleReponse(qId, opt) { setReponses(r => ({ ...r, [qId]: opt })) }

  function handleSubmit() {
    const entry = sauvegarderReponses({ sessionId: session.id, stagiaireId: stagiaire.id, type: 'post', questions, reponses })
    setResultat(entry)
    setSubmitted(true)
  }

  if (submitted && resultat) {
    const pre = getResultat(session.id, stagiaire.id, 'pre')
    const progression = pre ? calculerProgression(pre.score, resultat.score) : null
    return (
      <div className="eval-section">
        <div className="eval-section-header done">
          <span className="eval-section-num">1</span>
          <div>
            <div className="eval-section-title">Questionnaire post-formation</div>
            <div className="eval-section-sub">Complété — Score : <strong>{resultat.score}%</strong>{progression !== null ? ` · Progression : ${progression >= 0 ? '+' : ''}${progression}%` : ''}</div>
          </div>
          <span className="eval-check">✓</span>
        </div>
        <div className="eval-section-done-cta">
          <button className="eval-btn-secondary" onClick={() => onDone(resultat)}>Continuer vers l'enquête de satisfaction →</button>
        </div>
      </div>
    )
  }

  if (!questions) return <div className="eval-loading">Préparation du questionnaire…</div>
  if (!questions.length) return (
    <div className="eval-section">
      <div className="eval-section-header">
        <span className="eval-section-num">1</span>
        <div>
          <div className="eval-section-title">Questionnaire post-formation</div>
          <div className="eval-section-sub">Aucune question disponible pour ce module</div>
        </div>
      </div>
      <div className="eval-section-done-cta">
        <button className="eval-btn-secondary" onClick={() => onDone(null)}>Continuer →</button>
      </div>
    </div>
  )

  const q = questions[current]
  const OPTIONS = ['A', 'B', 'C', 'D']
  const allAnswered = questions.every(q => reponses[q.id])
  const progress = Math.round(((current + 1) / questions.length) * 100)

  return (
    <div className="eval-section">
      <div className="eval-section-header">
        <span className="eval-section-num">1</span>
        <div>
          <div className="eval-section-title">Questionnaire post-formation</div>
          <div className="eval-section-sub">{current + 1} / {questions.length} questions</div>
        </div>
      </div>

      <div className="eval-progress-bar">
        <div className="eval-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="eval-question-card">
        <div className="eval-q-module">Module : {q.moduleId.replace(/_/g, ' ')}</div>
        <h3 className="eval-q-enonce">{q.enonce}</h3>
        <div className="eval-q-options">
          {OPTIONS.map((opt, i) => (
            <button
              key={opt}
              className={`eval-opt-btn ${reponses[q.id] === opt ? 'selected' : ''}`}
              onClick={() => handleReponse(q.id, opt)}
            >
              <span className="eval-opt-letter">{opt}</span>
              <span className="eval-opt-text">{q.options[i]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="eval-q-nav">
        <button className="eval-btn-nav" onClick={() => setCurrent(c => c - 1)} disabled={current === 0}>← Précédent</button>
        <div className="eval-dots">
          {questions.map((_, i) => (
            <button key={i} className={`eval-dot ${i === current ? 'active' : ''} ${reponses[questions[i].id] ? 'answered' : ''}`} onClick={() => setCurrent(i)} />
          ))}
        </div>
        {current < questions.length - 1
          ? <button className="eval-btn-nav primary" onClick={() => setCurrent(c => c + 1)} disabled={!reponses[q.id]}>Suivant →</button>
          : <button className="eval-btn-submit" onClick={handleSubmit} disabled={!allAnswered}>Valider le questionnaire →</button>
        }
      </div>
    </div>
  )
}

// Section 2 : Satisfaction à chaud (échelle 0-10)
function SatisfactionChaud({ session, stagiaire, onDone }) {
  const CATEGORIES = [...new Set(QUESTIONS_CHAUD.map(q => q.categorie))]
  const dejaFait = getReponsesChaud(session.id, stagiaire.id)
  const [reponses, setReponses] = useState(() => {
    if (dejaFait) return dejaFait.reponses
    return Object.fromEntries(QUESTIONS_CHAUD.map(q => [q.id, null]))
  })
  const [submitted, setSubmitted] = useState(!!dejaFait)
  const [resultat, setResultat] = useState(dejaFait)

  function handleNote(qId, val) {
    if (submitted) return
    setReponses(r => ({ ...r, [qId]: val }))
  }

  function handleSubmit() {
    const entry = saveReponsesChaud(session.id, stagiaire.id, reponses)
    setResultat(entry)
    setSubmitted(true)
  }

  const allAnswered = QUESTIONS_CHAUD.every(q => reponses[q.id] !== null && reponses[q.id] !== undefined)

  return (
    <div className="eval-section">
      <div className={`eval-section-header ${submitted ? 'done' : ''}`}>
        <span className="eval-section-num">2</span>
        <div>
          <div className="eval-section-title">Enquête de satisfaction à chaud</div>
          <div className="eval-section-sub">
            {submitted
              ? `Complétée — Moyenne : ${resultat?.moyenne ?? '?'}/10`
              : `${QUESTIONS_CHAUD.length} questions · Qualiopi indicateur 13`}
          </div>
        </div>
        {submitted && <span className="eval-check">✓</span>}
      </div>

      <div className="eval-sat-categories">
        {CATEGORIES.map(cat => (
          <div key={cat} className="eval-sat-cat">
            <div className="eval-sat-cat-label">{cat}</div>
            {QUESTIONS_CHAUD.filter(q => q.categorie === cat).map(q => (
              <div key={q.id} className={`eval-sat-question ${submitted ? 'locked' : ''}`}>
                <p className="eval-sat-enonce">{q.enonce}</p>
                <div className="eval-sat-scale">
                  {[0,1,2,3,4,5,6,7,8,9,10].map(v => (
                    <button
                      key={v}
                      className={`eval-sat-btn ${reponses[q.id] === v ? 'selected' : ''}`}
                      onClick={() => handleNote(q.id, v)}
                      disabled={submitted}
                      title={LABELS_ECHELLE[v] || ''}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <div className="eval-sat-labels">
                  <span>Pas du tout</span>
                  <span>Tout à fait</span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {!submitted && (
        <div className="eval-sat-footer">
          <button className="eval-btn-submit" onClick={handleSubmit} disabled={!allAnswered}>
            Soumettre mon évaluation
          </button>
          {!allAnswered && <span className="eval-sat-hint">Répondez à toutes les questions pour continuer</span>}
        </div>
      )}

      {submitted && (
        <div className="eval-complete-banner">
          <span className="eval-complete-icon">🎉</span>
          <div>
            <div className="eval-complete-title">Merci pour votre retour !</div>
            <div className="eval-complete-sub">Votre évaluation a bien été enregistrée. Elle ne peut plus être modifiée.</div>
          </div>
        </div>
      )}
    </div>
  )
}

// Page principale
export default function EvalComplete({ sessionId, stagiaireId }) {
  const [session, setSession] = useState(null)
  const [stagiaire, setStagiaire] = useState(null)
  const [step, setStep] = useState(1) // 1 = quizz post, 2 = satisfaction chaud

  useEffect(() => {
    setSession(getSessions().find(x => x.id === sessionId) || null)
    setStagiaire(getStagiaires().find(x => x.id === stagiaireId) || null)
  }, [sessionId, stagiaireId])

  // Si déjà les deux complétés, afficher directement l'étape 2 (avec état done)
  useEffect(() => {
    if (!session || !stagiaire) return
    const postFait = getResultat(sessionId, stagiaireId, 'post')
    if (postFait) setStep(2)
  }, [session, stagiaire, sessionId, stagiaireId])

  if (!session || !stagiaire) {
    return (
      <div className="eval-error">
        <span>Session ou apprenant introuvable.</span>
      </div>
    )
  }

  return (
    <div className="eval-wrap">
      <div className="eval-header">
        <div className="eval-header-info">
          <div className="eval-session-title">{session.titre}</div>
          <div className="eval-stagiaire-name">{stagiaire.prenom} {stagiaire.nom}</div>
        </div>
        <div className="eval-steps-indicator">
          <div className={`eval-step-dot ${step >= 1 ? 'active' : ''} ${getResultat(sessionId, stagiaireId, 'post') ? 'done' : ''}`}>1</div>
          <div className="eval-step-line" />
          <div className={`eval-step-dot ${step >= 2 ? 'active' : ''} ${getReponsesChaud(sessionId, stagiaireId) ? 'done' : ''}`}>2</div>
        </div>
      </div>

      <div className="eval-intro">
        <div className="eval-intro-badge">Évaluation de fin de formation</div>
        <p className="eval-intro-text">
          Cette évaluation se compose de deux parties enchaînées : un questionnaire de connaissances post-formation, puis une enquête de satisfaction.
          Vos réponses sont confidentielles et ne pourront plus être modifiées une fois soumises.
        </p>
      </div>

      {step === 1 && (
        <QuizzPost
          session={session}
          stagiaire={stagiaire}
          onDone={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <SatisfactionChaud
          session={session}
          stagiaire={stagiaire}
          onDone={() => {}}
        />
      )}
    </div>
  )
}
