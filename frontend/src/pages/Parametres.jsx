import { useState } from 'react'
import { getParametres, saveParametres, CHAMPS_OF, TEMPLATE_ACCES_CABINET_DEFAUT } from '../data/parametres'
import { THEMATIQUES } from '../data/catalogue-afs'
import { getBanqueModule, saveBanqueCustom, deleteBanqueCustom, BANQUE_STANDARD } from '../data/questionnaires'
import { getQuestionsQB, saveQuestionsQB, resetQuestionsQB, DEFAULT_QUESTIONS_QB } from '../data/questionnaire-besoin'
import './Parametres.css'
import './BanqueQuestions.css'

// ── Onglet Infos OF ───────────────────────────────────────────────────────────
function InfosOF() {
  const [form, setForm] = useState(getParametres())
  const [saved, setSaved] = useState(false)

  function handleChange(cle, val) {
    setForm(f => ({ ...f, [cle]: val }))
    setSaved(false)
  }

  function handleSave(e) {
    e.preventDefault()
    saveParametres(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="param-section">
      <div className="param-section-header">
        <h2>Informations de l'organisme de formation</h2>
        <p>Ces données apparaissent sur tous les documents générés (conventions, attestations, émargements…)</p>
      </div>

      <form className="param-form" onSubmit={handleSave}>
        <div className="param-fields">
          {CHAMPS_OF.map(({ cle, label, placeholder }) => (
            <div key={cle} className="param-field">
              <label className="param-label">{label}</label>
              <input
                className="param-input"
                type="text"
                value={form[cle] || ''}
                placeholder={placeholder}
                onChange={e => handleChange(cle, e.target.value)}
              />
            </div>
          ))}
        </div>

        <div className="param-actions">
          {saved && <span className="param-saved">✓ Enregistré</span>}
          <button type="submit" className="btn-save-param">Enregistrer</button>
        </div>
      </form>
    </div>
  )
}

// ── Banque de questions (présentation originale) ──────────────────────────────
const OPTIONS_LABELS = ['A', 'B', 'C', 'D']

function emptyQuestion() {
  return { id: `q_${Date.now()}_${Math.floor(Math.random() * 9999)}`, enonce: '', options: ['', '', '', ''], reponse: 'A' }
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

function BanqueQuestions() {
  const [moduleSelId, setModuleSelId] = useState(null)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState([])
  const [saved, setSaved] = useState(false)

  const allModules = THEMATIQUES.flatMap(t => t.modules.map(m => ({ ...m, thematique: t.titre })))

  function selectModule(moduleId) {
    setModuleSelId(moduleId)
    setEditing(false)
    setSaved(false)
  }

  function startEdit() {
    const banque = getBanqueModule(moduleSelId)
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

  function addQuestion() { setDraft(d => [...d, emptyQuestion()]) }

  function removeQuestion(idx) {
    if (draft.length <= 5) { alert('Minimum 5 questions requis.'); return }
    setDraft(d => d.filter((_, i) => i !== idx))
  }

  function handleSave() {
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
            {!editing
              ? <QuestionsList moduleId={moduleSelId} isCustom={isCustom} />
              : <QuestionsEditor
                  draft={draft}
                  onUpdateQuestion={updateQuestion}
                  onUpdateOption={updateOption}
                  onAddQuestion={addQuestion}
                  onRemoveQuestion={removeQuestion}
                  onSave={handleSave}
                  onCancel={() => setEditing(false)}
                />
            }
          </>
        )}
      </div>
    </div>
  )
}

// ── Éditeur questionnaire de besoin ──────────────────────────────────────────
function emptyQBQuestion() {
  return { id: `qb_${Date.now()}_${Math.floor(Math.random() * 9999)}`, label: '', question: '', type: 'textarea', placeholder: '', options: ['', '', ''], required: false }
}

function QuestionnaireBesoinEditor() {
  const [questions, setQuestions] = useState(getQuestionsQB())
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(null) // index | null

  function update(idx, field, value) {
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, [field]: value } : q))
    setSaved(false)
  }

  function updateOption(qIdx, optIdx, value) {
    setQuestions(qs => qs.map((q, i) => {
      if (i !== qIdx) return q
      const options = [...(q.options || [])]
      options[optIdx] = value
      return { ...q, options }
    }))
    setSaved(false)
  }

  function addOption(qIdx) {
    setQuestions(qs => qs.map((q, i) => i === qIdx ? { ...q, options: [...(q.options || []), ''] } : q))
  }

  function removeOption(qIdx, optIdx) {
    setQuestions(qs => qs.map((q, i) => {
      if (i !== qIdx) return q
      const options = (q.options || []).filter((_, oi) => oi !== optIdx)
      return { ...q, options }
    }))
  }

  function addQuestion() {
    setQuestions(qs => [...qs, emptyQBQuestion()])
    setEditing(questions.length)
    setSaved(false)
  }

  function removeQuestion(idx) {
    if (!confirm('Supprimer cette question ?')) return
    setQuestions(qs => qs.filter((_, i) => i !== idx))
    if (editing === idx) setEditing(null)
    setSaved(false)
  }

  function moveQuestion(idx, dir) {
    const newQs = [...questions]
    const target = idx + dir
    if (target < 0 || target >= newQs.length) return
    ;[newQs[idx], newQs[target]] = [newQs[target], newQs[idx]]
    setQuestions(newQs)
    setEditing(target)
    setSaved(false)
  }

  function handleSave() {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question.trim()) { alert(`Question ${i + 1} : le texte de la question est vide.`); return }
      if (!q.label.trim()) { alert(`Question ${i + 1} : le libellé est vide.`); return }
      if (q.type === 'radio' && (q.options || []).filter(o => o.trim()).length < 2) {
        alert(`Question ${i + 1} : au moins 2 options sont requises pour une question à choix.`); return
      }
    }
    saveQuestionsQB(questions)
    setSaved(true)
    setEditing(null)
  }

  function handleReset() {
    if (!confirm('Remettre le questionnaire aux questions par défaut ? Toutes les modifications seront perdues.')) return
    resetQuestionsQB()
    setQuestions(DEFAULT_QUESTIONS_QB)
    setSaved(false)
    setEditing(null)
  }

  const isCustom = JSON.stringify(questions) !== JSON.stringify(DEFAULT_QUESTIONS_QB)

  return (
    <div className="param-section">
      <div className="param-section-header">
        <h2>Questionnaire de besoin</h2>
        <p>Personnalisez les questions envoyées aux clients commanditaires avant chaque formation.</p>
      </div>

      <div className="qb-editor-toolbar">
        <span className="qb-editor-count">{questions.length} question{questions.length > 1 ? 's' : ''}</span>
        {isCustom && <span className="qb-editor-badge-custom">Personnalisé</span>}
        <div style={{ flex: 1 }} />
        {isCustom && <button className="btn-reset" onClick={handleReset}>↩ Remettre par défaut</button>}
        {saved && <span className="param-saved">✓ Enregistré</span>}
        <button className="btn-save-param" onClick={handleSave}>Enregistrer</button>
      </div>

      <div className="qb-editor-list">
        {questions.map((q, idx) => (
          <div key={q.id} className={`qb-editor-card ${editing === idx ? 'open' : ''}`}>
            <div className="qb-editor-card-header" onClick={() => setEditing(editing === idx ? null : idx)}>
              <span className="qb-editor-num">{idx + 1}</span>
              <div className="qb-editor-card-info">
                <span className="qb-editor-card-label">{q.label || <em className="qb-editor-placeholder">Libellé vide</em>}</span>
                <span className="qb-editor-card-question">{q.question || <em className="qb-editor-placeholder">Question vide</em>}</span>
              </div>
              <div className="qb-editor-card-badges">
                <span className={`qb-type-badge ${q.type}`}>{q.type === 'textarea' ? 'Texte libre' : 'Choix unique'}</span>
                {q.required && <span className="qb-required-badge">Obligatoire</span>}
              </div>
              <div className="qb-editor-card-actions" onClick={e => e.stopPropagation()}>
                <button className="qb-move-btn" onClick={() => moveQuestion(idx, -1)} disabled={idx === 0} title="Monter">↑</button>
                <button className="qb-move-btn" onClick={() => moveQuestion(idx, 1)} disabled={idx === questions.length - 1} title="Descendre">↓</button>
                <button className="qb-remove-btn" onClick={() => removeQuestion(idx)} title="Supprimer">✕</button>
              </div>
            </div>

            {editing === idx && (
              <div className="qb-editor-card-body">
                <div className="qb-editor-row">
                  <div className="qb-editor-field">
                    <label>Libellé <span className="qb-required-star">*</span></label>
                    <input type="text" value={q.label} placeholder="Ex. : Contexte de la formation" onChange={e => update(idx, 'label', e.target.value)} />
                  </div>
                  <div className="qb-editor-field qb-editor-field-type">
                    <label>Type de réponse</label>
                    <select value={q.type} onChange={e => update(idx, 'type', e.target.value)}>
                      <option value="textarea">Texte libre</option>
                      <option value="radio">Choix unique</option>
                    </select>
                  </div>
                  <div className="qb-editor-field qb-editor-field-required">
                    <label>Obligatoire</label>
                    <label className="qb-toggle">
                      <input type="checkbox" checked={q.required} onChange={e => update(idx, 'required', e.target.checked)} />
                      <span className="qb-toggle-slider" />
                    </label>
                  </div>
                </div>

                <div className="qb-editor-field">
                  <label>Texte de la question <span className="qb-required-star">*</span></label>
                  <textarea rows={2} value={q.question} placeholder="Quelle est la situation qui motive cette demande ?" onChange={e => update(idx, 'question', e.target.value)} />
                </div>

                {q.type === 'textarea' && (
                  <div className="qb-editor-field">
                    <label>Placeholder (optionnel)</label>
                    <input type="text" value={q.placeholder || ''} placeholder="Texte d'aide dans le champ…" onChange={e => update(idx, 'placeholder', e.target.value)} />
                  </div>
                )}

                {q.type === 'radio' && (
                  <div className="qb-editor-field">
                    <label>Options de réponse <span className="qb-required-star">*</span></label>
                    <div className="qb-options-list">
                      {(q.options || []).map((opt, oi) => (
                        <div key={oi} className="qb-option-row">
                          <span className="qb-option-dot" />
                          <input type="text" value={opt} placeholder={`Option ${oi + 1}…`} onChange={e => updateOption(idx, oi, e.target.value)} />
                          {(q.options || []).length > 2 && (
                            <button className="qb-remove-option" onClick={() => removeOption(idx, oi)}>✕</button>
                          )}
                        </div>
                      ))}
                      <button className="qb-add-option" onClick={() => addOption(idx)}>+ Ajouter une option</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="qb-add-question-btn" onClick={addQuestion}>+ Ajouter une question</button>
    </div>
  )
}

// ── Éditeur email accès cabinet ───────────────────────────────────────────────
const VARS_ACCES = [
  { var: '{{contact_nom}}',   desc: 'Nom du contact' },
  { var: '{{contact_email}}', desc: 'Email du contact' },
  { var: '{{code}}',          desc: 'Code d\'accès cabinet' },
  { var: '{{lien}}',          desc: 'Lien portail cabinet' },
  { var: '{{of_nom}}',        desc: 'Nom de l\'organisme' },
  { var: '{{of_signataire}}', desc: 'Signataire' },
  { var: '{{of_titre}}',      desc: 'Titre du signataire' },
]

function MailAccesCabinetEditor() {
  const [form, setForm] = useState(() => {
    const p = getParametres()
    return {
      objet: p.mail_acces_cabinet_objet,
      corps: p.mail_acces_cabinet_corps,
    }
  })
  const [saved, setSaved] = useState(false)

  function handleSave() {
    saveParametres({ mail_acces_cabinet_objet: form.objet, mail_acces_cabinet_corps: form.corps })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function handleReset() {
    if (!confirm('Remettre le template par défaut ?')) return
    const def = { objet: TEMPLATE_ACCES_CABINET_DEFAUT.objet, corps: TEMPLATE_ACCES_CABINET_DEFAUT.corps }
    setForm(def)
    saveParametres({ mail_acces_cabinet_objet: def.objet, mail_acces_cabinet_corps: def.corps })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="param-section">
      <div className="param-section-header">
        <h2>Email d'envoi des accès cabinet</h2>
        <p>Template envoyé au commanditaire pour lui communiquer son email et son code d'accès au portail cabinet.</p>
      </div>

      <div className="mail-vars-list">
        <div className="mail-vars-title">Variables disponibles</div>
        <div className="mail-vars-grid">
          {VARS_ACCES.map(v => (
            <div key={v.var} className="mail-var-item">
              <code className="mail-var-code">{v.var}</code>
              <span className="mail-var-desc">{v.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="param-form">
        <div className="param-field">
          <label className="param-label">Objet du mail</label>
          <input
            className="param-input"
            type="text"
            value={form.objet}
            onChange={e => { setForm(f => ({ ...f, objet: e.target.value })); setSaved(false) }}
          />
        </div>
        <div className="param-field" style={{ gridColumn: '1 / -1' }}>
          <label className="param-label">Corps du mail</label>
          <textarea
            className="param-input"
            value={form.corps}
            rows={14}
            style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
            onChange={e => { setForm(f => ({ ...f, corps: e.target.value })); setSaved(false) }}
          />
        </div>
        <div className="param-actions" style={{ gridColumn: '1 / -1' }}>
          <button type="button" className="btn-reset" onClick={handleReset}>↩ Remettre par défaut</button>
          {saved && <span className="param-saved">✓ Enregistré</span>}
          <button type="button" className="btn-save-param" onClick={handleSave}>Enregistrer</button>
        </div>
      </div>
    </div>
  )
}

// ── Page principale Paramètres ────────────────────────────────────────────────
const ONGLETS = [
  { id: 'of',        label: 'Organisme de formation' },
  { id: 'questions', label: 'Banque de questions' },
  { id: 'qbesoin',   label: 'Questionnaire de besoin' },
  { id: 'mails',     label: 'Modèles de mails' },
]

export default function Parametres() {
  const [onglet, setOnglet] = useState('of')

  return (
    <div className="param-page">
      <div className="param-inner">
        <div className="param-head">
          <h1 className="param-title">Paramètres</h1>
          <p className="param-subtitle">Configuration de l'outil Pennylane Learning Suite</p>
        </div>

        <div className="param-tabs">
          {ONGLETS.map(o => (
            <button
              key={o.id}
              className={`param-tab ${onglet === o.id ? 'active' : ''}`}
              onClick={() => setOnglet(o.id)}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="param-content">
          {onglet === 'of'        && <InfosOF />}
          {onglet === 'questions' && <BanqueQuestions />}
          {onglet === 'qbesoin'   && <QuestionnaireBesoinEditor />}
          {onglet === 'mails'     && <MailAccesCabinetEditor />}
        </div>
      </div>
    </div>
  )
}
