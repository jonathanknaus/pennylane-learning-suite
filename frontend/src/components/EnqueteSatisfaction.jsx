import { useState } from 'react'
import { QUESTIONS_CHAUD, QUESTIONS_FROID, LABELS_ECHELLE, getReponsesChaud, getReponsesFroid, saveReponsesChaud, saveReponsesFroid } from '../data/satisfaction'
import './EnqueteSatisfaction.css'

function EchelleSlider({ value, onChange, disabled }) {
  return (
    <div className="echelle-row">
      <span className="echelle-label-min">0 — {LABELS_ECHELLE[0]}</span>
      <div className="echelle-buttons">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            type="button"
            disabled={disabled}
            className={`echelle-btn ${value === i ? 'active' : ''} ${i <= 4 ? 'zone-rouge' : i <= 6 ? 'zone-orange' : 'zone-verte'}`}
            onClick={() => !disabled && onChange(i)}
          >
            {i}
          </button>
        ))}
      </div>
      <span className="echelle-label-max">{LABELS_ECHELLE[10]} — 10</span>
    </div>
  )
}

function ResultatEnquete({ reponses, questions, moyenne, titre }) {
  const categories = [...new Set(questions.map(q => q.categorie).filter(Boolean))]

  return (
    <div className="enquete-resultat">
      <div className="enquete-res-header">
        <div className="enquete-res-score">{moyenne !== null ? moyenne : '—'}<span>/10</span></div>
        <div className="enquete-res-label">{titre || 'Score moyen de satisfaction'}</div>
      </div>

      {categories.length > 0 && (
        <div className="enquete-res-categories">
          {categories.map(cat => {
            const qs = questions.filter(q => q.categorie === cat)
            const vals = qs.map(q => reponses[q.id]).filter(v => v !== null && v !== undefined)
            const moy = vals.length ? Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10 : null
            return (
              <div key={cat} className="enquete-res-cat">
                <div className="enquete-res-cat-name">{cat}</div>
                <div className="enquete-res-cat-bar">
                  <div
                    className="enquete-res-cat-fill"
                    style={{
                      width: `${(moy !== null ? moy : 0) * 10}%`,
                      background: moy >= 8 ? '#10B981' : moy >= 6 ? '#F59E0B' : '#EF4444',
                    }}
                  />
                </div>
                <div className="enquete-res-cat-val">{moy !== null ? moy : '—'}/10</div>
              </div>
            )
          })}
        </div>
      )}

      <div className="enquete-res-detail">
        {questions.map(q => {
          const val = reponses[q.id]
          return (
            <div key={q.id} className="enquete-res-row">
              <div className="enquete-res-enonce">{q.enonce}</div>
              <div className="enquete-res-val" style={{ color: val >= 8 ? '#10B981' : val >= 6 ? '#F59E0B' : '#EF4444' }}>
                {val !== undefined && val !== null ? `${val}/10` : '—'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function EnqueteSatisfaction({ sessionId, stagiaireId, type, onDone }) {
  const questions = type === 'froid' ? QUESTIONS_FROID : QUESTIONS_CHAUD
  const existant = type === 'froid' ? getReponsesFroid(sessionId, stagiaireId) : getReponsesChaud(sessionId, stagiaireId)

  const [reponses, setReponses] = useState(() => {
    if (existant) return existant.reponses
    return Object.fromEntries(questions.map(q => [q.id, null]))
  })
  const [submitted, setSubmitted] = useState(!!existant)
  const [resultat, setResultat] = useState(existant)

  function handleChange(id, val) {
    setReponses(r => ({ ...r, [id]: val }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    const save = type === 'froid' ? saveReponsesFroid : saveReponsesChaud
    const res = save(sessionId, stagiaireId, reponses)
    setResultat(res)
    setSubmitted(true)
  }

  const allAnswered = questions.every(q => reponses[q.id] !== null && reponses[q.id] !== undefined)

  if (submitted && resultat) {
    return (
      <div className="enquete-wrapper">
        <ResultatEnquete
          reponses={resultat.reponses}
          questions={questions}
          moyenne={resultat.moyenne}
          titre={type === 'froid' ? 'Score moyen — Enquête à froid' : 'Score moyen — Enquête à chaud'}
        />
        {onDone && (
          <button className="btn-primary enquete-done-btn" onClick={onDone}>
            ← Retour
          </button>
        )}
      </div>
    )
  }

  const categories = [...new Set(questions.map(q => q.categorie).filter(Boolean))]
  const titre = type === 'froid'
    ? 'Enquête à froid — Impact de la formation'
    : 'Enquête de satisfaction à chaud'
  const sousTitre = type === 'froid'
    ? 'Quelques semaines après la formation, évaluez son impact sur votre pratique professionnelle.'
    : 'Votre avis nous aide à améliorer nos formations. Notez chaque aspect de 0 (pas du tout) à 10 (tout à fait).'

  return (
    <div className="enquete-wrapper">
      <div className="enquete-header">
        <h2 className="enquete-titre">{titre}</h2>
        <p className="enquete-sous-titre">{sousTitre}</p>
      </div>

      <form onSubmit={handleSubmit} className="enquete-form">
        {categories.length > 0 ? (
          categories.map(cat => (
            <div key={cat} className="enquete-section">
              <div className="enquete-section-title">{cat}</div>
              {questions.filter(q => q.categorie === cat).map(q => (
                <div key={q.id} className="enquete-question">
                  <div className="enquete-enonce">{q.enonce}</div>
                  <EchelleSlider
                    value={reponses[q.id]}
                    onChange={val => handleChange(q.id, val)}
                    disabled={submitted}
                  />
                </div>
              ))}
            </div>
          ))
        ) : (
          questions.map(q => (
            <div key={q.id} className="enquete-question">
              <div className="enquete-enonce">{q.enonce}</div>
              <EchelleSlider
                value={reponses[q.id]}
                onChange={val => handleChange(q.id, val)}
                disabled={submitted}
              />
            </div>
          ))
        )}

        <div className="enquete-actions">
          <button type="submit" className="btn-primary" disabled={!allAnswered}>
            Soumettre ({questions.filter(q => reponses[q.id] !== null && reponses[q.id] !== undefined).length}/{questions.length} réponses)
          </button>
          {onDone && (
            <button type="button" className="btn-secondary" onClick={onDone}>Annuler</button>
          )}
        </div>
      </form>
    </div>
  )
}
