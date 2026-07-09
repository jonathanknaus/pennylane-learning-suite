import { useState } from 'react'
import { getThematiques } from '../data/catalogue-afs'
import { getBanqueModule, saveBanqueCustom, deleteBanqueCustom, BANQUE_STANDARD } from '../data/questionnaires'
import './BanqueQuestions.css'

const OPTIONS_LABELS = ['A', 'B', 'C', 'D']

function emptyQuestion() {
  return { id: `q_${Date.now()}_${Math.floor(Math.random() * 9999)}`, enonce: '', options: ['', '', '', ''], reponse: 'A' }
}

export default function BanqueQuestions() {
  const [moduleSelId, setModuleSelId] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState([])
  const [saved, setSaved] = useState(false)

  const THEMATIQUES = getThematiques()
  const allModules = THEMATIQUES.flatMap(t => t.modules.map(m => ({ ...m, thematique: t.titre })))

  function selectModule(moduleId) {
    setModuleSelId(moduleId)
    setEditing(false)
    setSaved(false)
  }

  function startEdit() {
    const banque = getBanqueModule(moduleSelId)
    // Garantir au moins 7 questions dans le draft
    const base = banque.length ? [...banque] : [...(BANQUE_STANDARD[moduleSelId] || [])]
    while (base.length < 7) base.push(emptyQuestion())
    setDraft(base.map(q => ({ ...q, options: [...q.options] })))
    setEditing(true)
    setSaved(false)
  }

  function resetToStandard() {
    if (!confirm('Supprimer les questions personnalisées et revenir aux questions standard ?')) return
    deleteBanqueCustom(moduleSelId)
    setEditing(false)
    setSaved(false)
    setDraft([])
  }

  function updateQuestion(idx, field, value) {
    setDraft(d => d.map((q, i) => i === idx ? { ...q, [field]: value } : q))
  }

  function updateOption(qIdx, optIdx, value) {
    setDraft(d => d.map((q, i) => {
      if (i !== qIdx) return q
      const options = [...q.options]
      options[optIdx] = value
      return { ...q, options }
    }))
  }

  function addQuestion() {
    setDraft(d => [...d, emptyQuestion()])
  }

  function removeQuestion(idx) {
    if (draft.length <= 5) { alert('Minimum 5 questions requis.'); return }
    setDraft(d => d.filter((_, i) => i !== idx))
  }

  function handleSave() {
    // Validation
    for (let i = 0; i < draft.length; i++) {
      const q = draft[i]
      if (!q.enonce.trim()) { alert(`Q${i + 1} : l'énoncé est vide.`); return }
      if (q.options.some(o => !o.trim())) { alert(`Q${i + 1} : toutes les options doivent être remplies.`); return }
    }
    if (draft.length < 5) { alert('Minimum 5 questions requises.'); return }
    saveBanqueCustom(moduleSelId, draft)
    setEditing(false)
    setSaved(true)
  }

  const moduleSel = moduleSelId ? allModules.find(m => m.id === moduleSelId) : null
  const isCustom = moduleSelId ? (() => {
    const stored = JSON.parse(localStorage.getItem('pls_banque_questions') || '{}')
    return !!(stored[moduleSelId]?.custom?.length >= 5)
  })() : false

  return (
    <div className="banque-layout">
      {/* Sidebar modules */}
      <div className="banque-sidebar">
        <div className="banque-sidebar-title">Modules</div>
        {THEMATIQUES.map(t => (
          <div key={t.id} className="banque-thematique">
            <div className="banque-thematique-label">{t.emoji} {t.titre}</div>
            {t.modules.map(m => {
              const stored = JSON.parse(localStorage.getItem('pls_banque_questions') || '{}')
              const hasCustom = !!(stored[m.id]?.custom?.length >= 5)
              const hasStandard = !!(BANQUE_STANDARD[m.id]?.length)
              return (
                <button
                  key={m.id}
                  className={`banque-module-btn ${moduleSelId === m.id ? 'active' : ''}`}
                  onClick={() => selectModule(m.id)}
                >
                  <span className="banque-module-titre">{m.titre}</span>
                  {hasCustom
                    ? <span className="banque-badge custom">Perso</span>
                    : hasStandard
                      ? <span className="banque-badge standard">Standard</span>
                      : <span className="banque-badge empty">Vide</span>
                  }
                </button>
              )
            })}
          </div>
        ))}
      </div>

      {/* Contenu principal */}
      <div className="banque-main">
        {!moduleSel ? (
          <div className="banque-empty-state">
            <div className="empty-icon">📚</div>
            <h2>Banque de questions</h2>
            <p>Sélectionnez un module dans la liste pour voir et modifier ses questions.</p>
            <p className="banque-hint">Chaque module dispose de questions standard. Vous pouvez les remplacer par des questions personnalisées.</p>
          </div>
        ) : (
          <>
            <div className="banque-module-header">
              <div>
                <div className="banque-module-thematique">{moduleSel.thematique}</div>
                <h2>{moduleSel.titre}</h2>
                <p className="banque-module-desc">{moduleSel.description}</p>
              </div>
              <div className="banque-header-actions">
                {isCustom && !editing && (
                  <button className="btn-reset" onClick={resetToStandard}>↩ Revenir au standard</button>
                )}
                {!editing && (
                  <button className="btn-edit-banque" onClick={startEdit}>
                    {isCustom ? '✏️ Modifier les questions' : '✏️ Personnaliser'}
                  </button>
                )}
              </div>
            </div>

            {saved && <div className="banque-saved-banner">✓ Questions enregistrées avec succès.</div>}

            {!editing ? (
              <QuestionsList moduleId={moduleSelId} isCustom={isCustom} />
            ) : (
              <QuestionsEditor
                draft={draft}
                onUpdateQuestion={updateQuestion}
                onUpdateOption={updateOption}
                onAddQuestion={addQuestion}
                onRemoveQuestion={removeQuestion}
                onSave={handleSave}
                onCancel={() => setEditing(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function QuestionsList({ moduleId, isCustom }) {
  const banque = getBanqueModule(moduleId)
  return (
    <div className="questions-list">
      <div className="ql-meta">
        <span className={`ql-type-badge ${isCustom ? 'custom' : 'standard'}`}>
          {isCustom ? 'Questions personnalisées' : 'Questions standard'}
        </span>
        <span className="ql-count">{banque.length} question{banque.length > 1 ? 's' : ''} · 5 tirées aléatoirement par passation</span>
      </div>
      {banque.map((q, i) => (
        <div key={q.id} className="question-view">
          <div className="qv-header">
            <span className="qv-num">Q{i + 1}</span>
            <span className="qv-enonce">{q.enonce}</span>
          </div>
          <div className="qv-options">
            {OPTIONS_LABELS.map((opt, oi) => (
              <div key={opt} className={`qv-option ${q.reponse === opt ? 'correct' : ''}`}>
                <span className="qv-opt-letter">{opt}</span>
                <span>{q.options[oi]}</span>
                {q.reponse === opt && <span className="qv-correct-mark">✓</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function QuestionsEditor({ draft, onUpdateQuestion, onUpdateOption, onAddQuestion, onRemoveQuestion, onSave, onCancel }) {
  return (
    <div className="questions-editor">
      <div className="editor-info">
        Minimum 5 questions · Les 5 tirées aléatoirement pour pré et post seront différentes
      </div>
      {draft.map((q, idx) => (
        <div key={q.id} className="question-edit-card">
          <div className="qe-header">
            <span className="qe-num">Q{idx + 1}</span>
            <button className="qe-remove" onClick={() => onRemoveQuestion(idx)} title="Supprimer">✕</button>
          </div>
          <textarea
            className="qe-enonce"
            placeholder="Énoncé de la question…"
            value={q.enonce}
            rows={2}
            onChange={e => onUpdateQuestion(idx, 'enonce', e.target.value)}
          />
          <div className="qe-options">
            {OPTIONS_LABELS.map((opt, oi) => (
              <div key={opt} className="qe-option-row">
                <button
                  className={`qe-opt-letter ${q.reponse === opt ? 'selected' : ''}`}
                  onClick={() => onUpdateQuestion(idx, 'reponse', opt)}
                  title="Marquer comme bonne réponse"
                >{opt}</button>
                <input
                  type="text"
                  placeholder={`Option ${opt}…`}
                  value={q.options[oi]}
                  onChange={e => onUpdateOption(idx, oi, e.target.value)}
                />
                {q.reponse === opt && <span className="qe-correct-mark">✓ Bonne réponse</span>}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button className="btn-add-question" onClick={onAddQuestion}>+ Ajouter une question</button>

      <div className="editor-actions">
        <button className="btn-cancel" onClick={onCancel}>Annuler</button>
        <button className="btn-save-banque" onClick={onSave}>Enregistrer les questions</button>
      </div>
    </div>
  )
}
