import { useState } from 'react'
import { getThematiques } from '../data/catalogue-afs'
import { getBanqueModule, saveBanqueCustom, deleteBanqueCustom, BANQUE_STANDARD } from '../data/questionnaires'
import { origineBanque } from '../data/questionnaires'
import { themesDuModule, theme } from '../data/banque-thematique'
import { getAllModules } from '../data/catalogue-afs'

// Origine des questions d'un module, dite à l'écran : une question composée
// automatiquement depuis les thèmes doit pouvoir être relue comme telle.
const ORIGINES = {
  personnalisee: { court: 'Perso',      long: 'Questions personnalisées', classe: 'custom' },
  historique:    { court: 'Standard',   long: 'Questions standard',       classe: 'standard' },
  thematique:    { court: 'Thématique', long: 'Composées par thème',      classe: 'thematique' },
  aucune:        { court: 'Vide',       long: 'Aucune question',          classe: 'empty' },
}
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
              const o = ORIGINES[origineBanque(m.id)] || ORIGINES.aucune
              return (
                <button
                  key={m.id}
                  className={`banque-module-btn ${moduleSelId === m.id ? 'active' : ''}`}
                  onClick={() => selectModule(m.id)}
                >
                  <span className="banque-module-titre">{m.titre}</span>
                  <span className={`banque-badge ${o.classe}`}>{o.court}</span>
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
              <QuestionsList moduleId={moduleSelId} />
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

function QuestionsList({ moduleId }) {
  const banque = getBanqueModule(moduleId)
  const origine = origineBanque(moduleId)
  const o = ORIGINES[origine] || ORIGINES.aucune
  const module = getAllModules().find(m => m.id === moduleId)
  const themes = origine === 'thematique' && module
    ? themesDuModule(module).map(id => theme(id)?.label).filter(Boolean)
    : []

  return (
    <div className="questions-list">
      <div className="ql-meta">
        <span className={`ql-type-badge ${o.classe}`}>{o.long}</span>
        <span className="ql-count">
          {banque.length} question{banque.length > 1 ? 's' : ''}
          {origine === 'historique' && ' · 5 tirées par passation'}
        </span>
      </div>
      {themes.length > 0 && (
        <p className="ql-themes">
          Ce module n'avait aucune question propre : les siennes sont composées depuis les thèmes
          que son programme couvre — <strong>{themes.join(', ')}</strong>. Elles sont les mêmes au
          pré-test et au post-test, dans un ordre différent. Pour les remplacer, saisis des
          questions personnalisées.
        </p>
      )}
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
