import { useState, useEffect } from 'react'
import { genererQuestionnaire, sauvegarderReponses, getResultat, calculerProgression } from '../data/questionnaires'
import { getSessions } from '../data/sessions'
import { getStagiaires } from '../data/stagiaires'
import './Passation.css'

export default function Passation({ sessionId, stagiaireId, type, onDone }) {
  const [questions, setQuestions] = useState(null)
  const [reponses, setReponses] = useState({})
  const [current, setCurrent] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [resultat, setResultat] = useState(null)
  const [session, setSession] = useState(null)
  const [stagiaire, setStagiaire] = useState(null)

  useEffect(() => {
    const s = getSessions().find(x => x.id === sessionId)
    const st = getStagiaires().find(x => x.id === stagiaireId)
    setSession(s)
    setStagiaire(st)
    if (!s) return

    const dejaFait = getResultat(sessionId, stagiaireId, type)
    if (dejaFait) { setResultat(dejaFait); setSubmitted(true); return }

    let preIds = []
    if (type === 'post') {
      const pre = getResultat(sessionId, stagiaireId, 'pre')
      if (pre) preIds = pre.questions.map(q => q.id)
    }
    const modules = s.modules || []
    const q = genererQuestionnaire(modules, type, preIds)
    setQuestions(q)
  }, [sessionId, stagiaireId, type])

  function handleReponse(qId, option) {
    setReponses(r => ({ ...r, [qId]: option }))
  }

  function handleSubmit() {
    const entry = sauvegarderReponses({ sessionId, stagiaireId, type, questions, reponses })
    setResultat(entry)
    setSubmitted(true)
  }

  if (!session || !stagiaire) return <div className="passation-error">Session ou stagiaire introuvable.</div>

  if (submitted && resultat) {
    const pre = type === 'post' ? getResultat(sessionId, stagiaireId, 'pre') : null
    const progression = pre ? calculerProgression(pre.score, resultat.score) : null
    return (
      <div className="passation-result">
        <div className="result-header">
          <span className="result-icon">{resultat.score >= 60 ? '🎉' : '📚'}</span>
          <h2>Questionnaire {type === 'pre' ? 'pré-formation' : 'post-formation'} terminé</h2>
          <p>{stagiaire.prenom} {stagiaire.nom} — {session.titre}</p>
        </div>
        <div className="result-scores">
          <div className="score-card big">
            <span className="score-label">Score</span>
            <span className="score-val">{resultat.score}%</span>
            <span className="score-detail">{resultat.questions.filter(q => resultat.reponses[q.id] === q.reponse).length} / {resultat.questions.length} bonnes réponses</span>
          </div>
          {progression !== null && (
            <div className={`score-card big ${progression >= 0 ? 'positive' : 'negative'}`}>
              <span className="score-label">Progression</span>
              <span className="score-val">{progression >= 0 ? '+' : ''}{progression}%</span>
              <span className="score-detail">Pré : {pre.score}% → Post : {resultat.score}%</span>
            </div>
          )}
        </div>
        <div className="result-detail">
          {resultat.questions.map((q, i) => {
            const rep = resultat.reponses[q.id]
            const ok = rep === q.reponse
            return (
              <div key={q.id} className={`result-question ${ok ? 'correct' : 'wrong'}`}>
                <div className="rq-header">
                  <span className="rq-num">Q{i + 1}</span>
                  <span className="rq-icon">{ok ? '✓' : '✗'}</span>
                </div>
                <p className="rq-enonce">{q.enonce}</p>
                {!ok && (
                  <div className="rq-correction">
                    <span className="wrong-ans">Votre réponse : {rep ? `${rep}. ${q.options['ABCD'.indexOf(rep)]}` : 'Sans réponse'}</span>
                    <span className="right-ans">Bonne réponse : {q.reponse}. {q.options['ABCD'.indexOf(q.reponse)]}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        {onDone && <button className="btn-done" onClick={onDone}>← Retour à la session</button>}
      </div>
    )
  }

  if (!questions) return <div className="passation-loading">Préparation du questionnaire…</div>
  if (!questions.length) return <div className="passation-error">Aucune question disponible pour les modules de cette session.</div>

  const q = questions[current]
  const OPTIONS = ['A', 'B', 'C', 'D']
  const allAnswered = questions.every(q => reponses[q.id])
  const progress = Math.round(((current + 1) / questions.length) * 100)

  return (
    <div className="passation-wrap">
      <div className="passation-top">
        {onDone && (
          <button className="passation-back" onClick={onDone}>← Retour à la session</button>
        )}
        <div className="passation-meta">
          <span className="passation-type-badge">{type === 'pre' ? 'Pré-formation' : 'Post-formation'}</span>
          <span className="passation-who">{stagiaire.prenom} {stagiaire.nom}</span>
          <span className="passation-session">{session.titre}</span>
        </div>
        <div className="passation-progress-bar">
          <div className="passation-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="passation-counter">{current + 1} / {questions.length}</div>
      </div>

      <div className="passation-body">
        <div className="question-card">
          <div className="question-module-tag">Module : {q.moduleId.replace(/_/g, ' ')}</div>
          <h3 className="question-enonce">{q.enonce}</h3>
          <div className="question-options">
            {OPTIONS.map((opt, i) => (
              <button
                key={opt}
                className={`option-btn ${reponses[q.id] === opt ? 'selected' : ''}`}
                onClick={() => handleReponse(q.id, opt)}
              >
                <span className="option-letter">{opt}</span>
                <span className="option-text">{q.options[i]}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="passation-nav">
          <button className="btn-nav" onClick={() => setCurrent(c => c - 1)} disabled={current === 0}>← Précédent</button>
          {current < questions.length - 1
            ? <button className="btn-nav primary" onClick={() => setCurrent(c => c + 1)} disabled={!reponses[q.id]}>Suivant →</button>
            : <button className="btn-submit" onClick={handleSubmit} disabled={!allAnswered}>Terminer et voir les résultats</button>
          }
        </div>

        <div className="passation-dots">
          {questions.map((_, i) => (
            <button key={i} className={`dot ${i === current ? 'active' : ''} ${reponses[questions[i].id] ? 'answered' : ''}`} onClick={() => setCurrent(i)} />
          ))}
        </div>
      </div>
    </div>
  )
}
