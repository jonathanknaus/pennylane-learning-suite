import { useState } from 'react'
import { saveSession, STATUTS, MODALITES, FORMATS, ALL_MODULES, QUALIOPI_OPTIONS } from '../data/sessions'
import { THEMATIQUES } from '../data/catalogue-afs'
import { getGestionnaires, getGestionnaireDefaut } from '../data/gestionnaires'
import { getFormateurs } from '../data/formateurs'
import './SessionForm.css'

const EMPTY = {
  titre: '',
  client: '',
  modules: [],
  format: 'session_2h',
  modalite: 'visio',
  statut: 'brouillon',
  date: '',
  heure: '09:00',
  occurrences: [],
  formateur: 'Équipe AFS',
  formateurId: '',
  formateurAppuiId: '',
  gestionnaireId: '',
  participants_max: 15,
  participants_inscrits: 0,
  qualiopi: 'non',
  lien_reunion: '',
  notes: '',
}

export default function SessionForm({ session, onSaved, onCancel }) {
  const gestionnaires = getGestionnaires()
  const formateurs = getFormateurs()
  const [form, setForm] = useState(session
    ? { qualiopi: 'non', occurrences: [], gestionnaireId: '', formateurId: '', formateurAppuiId: '', ...session }
    : { ...EMPTY, gestionnaireId: getGestionnaireDefaut()?.id || '' })
  const [errors, setErrors] = useState({})

  function addOccurrence() {
    setForm(f => ({
      ...f,
      occurrences: [...(f.occurrences || []), {
        id: `occ_${Date.now()}`,
        date: '',
        heure: f.heure,
        modalite: f.modalite,
        format: f.format,
        lien_reunion: f.lien_reunion || '',
        qualiopi: f.qualiopi,
        formateur: f.formateur,
      }]
    }))
  }

  function updateOccurrence(idx, key, value) {
    setForm(f => {
      const updated = [...(f.occurrences || [])]
      updated[idx] = { ...updated[idx], [key]: value }
      return { ...f, occurrences: updated }
    })
  }

  function removeOccurrence(idx) {
    setForm(f => ({
      ...f,
      occurrences: (f.occurrences || []).filter((_, i) => i !== idx)
    }))
  }

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }))
  }

  function toggleModule(id) {
    setForm(f => ({
      ...f,
      modules: f.modules.includes(id) ? f.modules.filter(m => m !== id) : [...f.modules, id]
    }))
  }

  function validate() {
    const e = {}
    if (!form.titre.trim()) e.titre = 'Le titre est requis'
    if (!form.date) e.date = 'La date est requise'
    if (form.modules.length === 0) e.modules = 'Sélectionnez au moins un module'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    saveSession(form)
    onSaved()
  }

  const formatSelectionne = FORMATS.find(f => f.id === form.format)
  const modaliteLabel = MODALITES.find(m => m.id === form.modalite)?.label || '—'
  const prix = formatSelectionne
    ? (form.modalite === 'presentiel' ? formatSelectionne.presentiel : formatSelectionne.visio)
    : null

  return (
    <div className="session-form-page">
      <div className="form-topbar">
        <button className="btn-back" onClick={onCancel}>← Retour</button>
        <h1 className="form-title">{session ? 'Modifier la session' : 'Nouvelle session'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="session-form">
        <div className="form-layout">
          <div className="form-main">

            {/* Infos générales */}
            <div className="form-section">
              <h2 className="form-section-title">Informations générales</h2>
              <div className="form-group">
                <label>Titre de la session *</label>
                <input
                  type="text"
                  value={form.titre}
                  onChange={e => set('titre', e.target.value)}
                  placeholder="Ex : Saisie comptable & TVA — Cabinet Martin"
                  className={errors.titre ? 'error' : ''}
                />
                {errors.titre && <span className="form-error">{errors.titre}</span>}
              </div>
              <div className="form-group">
                <label>Client / Cabinet</label>
                <input
                  type="text"
                  value={form.client}
                  onChange={e => set('client', e.target.value)}
                  placeholder="Nom du client ou cabinet"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Statut</label>
                  <select value={form.statut} onChange={e => set('statut', e.target.value)}>
                    {STATUTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Formateur responsable</label>
                  <select
                    value={form.formateurId}
                    onChange={e => {
                      const fmt = formateurs.find(f => f.id === e.target.value)
                      setForm(f => ({ ...f, formateurId: e.target.value, formateur: fmt ? `${fmt.prenom} ${fmt.nom}` : f.formateur }))
                    }}
                  >
                    <option value="">— Nom libre : {form.formateur || 'non renseigné'} —</option>
                    {formateurs.map(f => (
                      <option key={f.id} value={f.id}>{f.prenom} {f.nom}</option>
                    ))}
                  </select>
                  <p className="form-hint" style={{ fontSize: 12, color: 'var(--texte-secondaire)', marginTop: 4 }}>
                    Prend le lead sur le dossier jusqu'à la clôture de la formation.
                  </p>
                </div>
                <div className="form-group">
                  <label>Formateur en appui (optionnel)</label>
                  <select value={form.formateurAppuiId} onChange={e => set('formateurAppuiId', e.target.value)}>
                    <option value="">— Aucun —</option>
                    {formateurs.filter(f => f.id !== form.formateurId).map(f => (
                      <option key={f.id} value={f.id}>{f.prenom} {f.nom}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Gestionnaire attitré</label>
                <select value={form.gestionnaireId} onChange={e => set('gestionnaireId', e.target.value)}>
                  <option value="">— Aucun —</option>
                  {gestionnaires.map(g => (
                    <option key={g.id} value={g.id}>{g.prenom} {g.nom}</option>
                  ))}
                </select>
                <p className="form-hint" style={{ fontSize: 12, color: 'var(--texte-secondaire)', marginTop: 4 }}>
                  Reçoit les notifications administratives (dossier, devis, convention, facturation) pour cette session.
                </p>
              </div>
            </div>

            {/* Date & modalité */}
            <div className="form-section">
              <h2 className="form-section-title">Date & modalité</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => set('date', e.target.value)}
                    className={errors.date ? 'error' : ''}
                  />
                  {errors.date && <span className="form-error">{errors.date}</span>}
                </div>
                <div className="form-group">
                  <label>Heure de début</label>
                  <input
                    type="time"
                    value={form.heure}
                    onChange={e => set('heure', e.target.value)}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Modalité</label>
                  <div className="radio-group">
                    {MODALITES.map(m => (
                      <label key={m.id} className={`radio-option ${form.modalite === m.id ? 'selected' : ''}`}>
                        <input type="radio" name="modalite" value={m.id} checked={form.modalite === m.id} onChange={() => set('modalite', m.id)} />
                        {m.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Format</label>
                  <select value={form.format} onChange={e => set('format', e.target.value)}>
                    {FORMATS.map(f => (
                      <option key={f.id} value={f.id}>{f.label} — {f.duree}</option>
                    ))}
                  </select>
                </div>
              </div>
              {(form.modalite === 'visio' || form.modalite === 'mixte') && (
                <div className="form-group">
                  <label>Lien de réunion (Meet, Teams…)</label>
                  <input
                    type="url"
                    value={form.lien_reunion}
                    onChange={e => set('lien_reunion', e.target.value)}
                    placeholder="https://meet.google.com/..."
                  />
                </div>
              )}
              <div className="form-group">
                <label>QUALIOPI</label>
                <div className="radio-group">
                  {QUALIOPI_OPTIONS.map(q => (
                    <label key={q.id} className={`radio-option ${form.qualiopi === q.id ? 'selected' : ''}`}
                      style={form.qualiopi === q.id ? { borderColor: q.color, color: q.color, background: q.bg } : {}}>
                      <input type="radio" name="qualiopi" value={q.id} checked={form.qualiopi === q.id} onChange={() => set('qualiopi', q.id)} />
                      {q.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Occurrences / dates supplémentaires */}
            <div className="form-section">
              <h2 className="form-section-title">
                Dates supplémentaires
                {(form.occurrences || []).length > 0 && (
                  <span className="modules-count">{form.occurrences.length} occurrence{form.occurrences.length > 1 ? 's' : ''}</span>
                )}
              </h2>
              <p className="form-hint" style={{ fontSize: 13, color: 'var(--texte-secondaire)', marginTop: -4 }}>
                Pour une formation sur plusieurs jours ou plusieurs créneaux. Chaque occurrence génère sa propre feuille d'émargement.
              </p>
              {(form.occurrences || []).map((occ, idx) => (
                <div key={occ.id || idx} className="occurrence-card">
                  <div className="occurrence-card-header">
                    <div className="occurrence-num">{idx + 2}</div>
                    <span className="occurrence-card-title">
                      Occurrence {idx + 2}{occ.date ? ` — ${new Date(occ.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
                    </span>
                    <button
                      type="button"
                      className="occurrence-remove"
                      onClick={() => removeOccurrence(idx)}
                      title="Supprimer cette occurrence"
                    >✕</button>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date</label>
                      <input
                        type="date"
                        value={occ.date}
                        onChange={e => updateOccurrence(idx, 'date', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Heure de début</label>
                      <input
                        type="time"
                        value={occ.heure ?? form.heure}
                        onChange={e => updateOccurrence(idx, 'heure', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Modalité</label>
                      <div className="radio-group">
                        {MODALITES.map(m => (
                          <label key={m.id} className={`radio-option ${(occ.modalite ?? form.modalite) === m.id ? 'selected' : ''}`}>
                            <input type="radio" name={`modalite_occ_${idx}`} value={m.id}
                              checked={(occ.modalite ?? form.modalite) === m.id}
                              onChange={() => updateOccurrence(idx, 'modalite', m.id)} />
                            {m.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Format</label>
                      <select value={occ.format ?? form.format} onChange={e => updateOccurrence(idx, 'format', e.target.value)}>
                        {FORMATS.map(f => (
                          <option key={f.id} value={f.id}>{f.label} — {f.duree}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {((occ.modalite ?? form.modalite) === 'visio' || (occ.modalite ?? form.modalite) === 'mixte') && (
                    <div className="form-group">
                      <label>Lien de réunion (Meet, Teams…)</label>
                      <input
                        type="url"
                        value={occ.lien_reunion ?? form.lien_reunion}
                        onChange={e => updateOccurrence(idx, 'lien_reunion', e.target.value)}
                        placeholder="https://meet.google.com/..."
                      />
                    </div>
                  )}

                  <div className="form-row">
                    <div className="form-group">
                      <label>Formateur</label>
                      <input
                        type="text"
                        value={occ.formateur ?? form.formateur}
                        onChange={e => updateOccurrence(idx, 'formateur', e.target.value)}
                        placeholder="Nom du formateur"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>QUALIOPI</label>
                    <div className="radio-group">
                      {QUALIOPI_OPTIONS.map(q => (
                        <label key={q.id}
                          className={`radio-option ${(occ.qualiopi ?? form.qualiopi) === q.id ? 'selected' : ''}`}
                          style={(occ.qualiopi ?? form.qualiopi) === q.id ? { borderColor: q.color, color: q.color, background: q.bg } : {}}>
                          <input type="radio" name={`qualiopi_occ_${idx}`} value={q.id}
                            checked={(occ.qualiopi ?? form.qualiopi) === q.id}
                            onChange={() => updateOccurrence(idx, 'qualiopi', q.id)} />
                          {q.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn-add-occurrence" onClick={addOccurrence}>
                + Ajouter une date supplémentaire
              </button>
            </div>

            {/* Participants */}
            <div className="form-section">
              <h2 className="form-section-title">Participants</h2>
              <div className="form-row">
                <div className="form-group">
                  <label>Participants max</label>
                  <input
                    type="number"
                    min="1" max="15"
                    value={form.participants_max}
                    onChange={e => set('participants_max', parseInt(e.target.value) || 15)}
                  />
                </div>
                <div className="form-group">
                  <label>Inscrits actuellement</label>
                  <input
                    type="number"
                    min="0"
                    value={form.participants_inscrits}
                    onChange={e => set('participants_inscrits', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            {/* Modules */}
            <div className="form-section">
              <h2 className="form-section-title">
                Modules *
                {form.modules.length > 0 && <span className="modules-count">{form.modules.length} sélectionné{form.modules.length > 1 ? 's' : ''}</span>}
              </h2>
              {errors.modules && <div className="form-error form-error-block">{errors.modules}</div>}
              <div className="modules-picker">
                {THEMATIQUES.map(thematique => (
                  <div key={thematique.id} className="modules-group">
                    <div className="modules-group-title">{thematique.emoji} {thematique.titre}</div>
                    <div className="modules-group-items">
                      {thematique.modules.map(module => {
                        const selected = form.modules.includes(module.id)
                        return (
                          <button
                            type="button"
                            key={module.id}
                            className={`module-pick-btn ${selected ? 'selected' : ''}`}
                            onClick={() => toggleModule(module.id)}
                          >
                            {selected ? '✓ ' : ''}{module.titre}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="form-section">
              <h2 className="form-section-title">Notes internes</h2>
              <div className="form-group">
                <textarea
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Observations, demandes spécifiques, points de vigilance..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Récap */}
          <aside className="form-aside">
            <div className="form-recap">
              <h3>Récapitulatif</h3>

              <div className="recap-row">
                <span>Format</span>
                <strong>{formatSelectionne?.label || '—'} ({formatSelectionne?.duree || '—'})</strong>
              </div>
              <div className="recap-row">
                <span>Modalité</span>
                <strong>{modaliteLabel}</strong>
              </div>
              <div className="recap-row">
                <span>Modules</span>
                <strong>{form.modules.length}</strong>
              </div>
              <div className="recap-row">
                <span>Participants</span>
                <strong>{form.participants_inscrits} / {form.participants_max}</strong>
              </div>
              {form.qualiopi !== 'non' && (() => {
                const q = QUALIOPI_OPTIONS.find(o => o.id === form.qualiopi)
                return (
                  <div className="recap-row">
                    <span>Qualiopi</span>
                    <strong style={{ color: q.color }}>{q.label}</strong>
                  </div>
                )
              })()}

              {prix && (
                <div className="recap-prix">
                  <span>Tarif indicatif</span>
                  <div className="recap-prix-value">{prix}€ HT</div>
                  <div className="recap-prix-note">+300€/formateur supplémentaire (présentiel)</div>
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-submit">
                  {session ? 'Enregistrer les modifications' : 'Créer la session'}
                </button>
                <button type="button" className="btn-cancel" onClick={onCancel}>
                  Annuler
                </button>
              </div>
            </div>
          </aside>
        </div>
      </form>
    </div>
  )
}
