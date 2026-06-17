import { useState, useEffect } from 'react'
import { getFormateurs, saveFormateur, deleteFormateur, CIVILITES, STATUTS_BPF_FORMATEUR, TYPES_FORMATEUR } from '../data/formateurs'
import { THEMATIQUES } from '../data/catalogue-afs'
import './Formateurs.css'

const ALL_MODULES = THEMATIQUES.flatMap(t => t.modules.map(m => ({ ...m, thematique: t.titre, thematiqueId: t.id })))

const EMPTY_FORM = {
  civilite: '', prenom: '', nom: '', email: '', telephone: '',
  competences: [], statut_bpf: 'non', type_formateur: 'interne', adresse: '', cout_journalier: '', notes: '',
}

export default function Formateurs() {
  const [formateurs, setFormateurs] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => { setFormateurs(getFormateurs()) }, [])

  function refresh() { setFormateurs(getFormateurs()) }

  function openNew() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModal('form')
  }

  function openEdit(f) {
    setSelected(f)
    setForm({
      civilite: f.civilite || '',
      prenom: f.prenom || '',
      nom: f.nom || '',
      email: f.email || '',
      telephone: f.telephone || '',
      competences: f.competences || [],
      statut_bpf: f.statut_bpf || 'non',
      type_formateur: f.type_formateur || 'interne',
      adresse: f.adresse || '',
      cout_journalier: f.cout_journalier || '',
      notes: f.notes || '',
    })
    setErrors({})
    setModal('form')
  }

  function openDetail(f) {
    setSelected(f)
    setModal('detail')
  }

  function handleDelete(id) {
    if (!confirm('Supprimer ce formateur ?')) return
    deleteFormateur(id)
    refresh()
  }

  function toggleCompetence(moduleId) {
    setForm(f => ({
      ...f,
      competences: f.competences.includes(moduleId)
        ? f.competences.filter(c => c !== moduleId)
        : [...f.competences, moduleId],
    }))
  }

  function validate() {
    const e = {}
    if (!form.prenom.trim()) e.prenom = 'Requis'
    if (!form.nom.trim()) e.nom = 'Requis'
    if (!form.email.trim()) e.email = 'Requis'
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) e.email = 'Email invalide'
    return e
  }

  function handleSave(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    saveFormateur(selected ? { ...selected, ...form } : form)
    refresh()
    setModal(null)
  }

  const filtres = formateurs.filter(f => {
    if (!search) return true
    const q = search.toLowerCase()
    return [f.prenom, f.nom, f.email].some(v => v?.toLowerCase().includes(q))
  })

  return (
    <div className="formateurs">
      <div className="formateurs-topbar">
        <div>
          <h1 className="formateurs-title">Formateurs</h1>
          <p className="formateurs-sub">{formateurs.length} formateur{formateurs.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Ajouter un formateur</button>
      </div>

      <div className="formateurs-search">
        <input
          type="text"
          placeholder="Rechercher par nom ou email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
      </div>

      {filtres.length === 0 ? (
        <div className="formateurs-empty">
          <div className="empty-icon">👨‍🏫</div>
          <p>Aucun formateur{search ? ' pour cette recherche' : ''}</p>
          {!search && <button className="btn-primary" onClick={openNew}>Ajouter un formateur</button>}
        </div>
      ) : (
        <div className="formateurs-grid">
          {filtres.map(f => {
            const bpf = STATUTS_BPF_FORMATEUR.find(s => s.id === f.statut_bpf)
            const typeF = TYPES_FORMATEUR.find(t => t.id === f.type_formateur)
            return (
              <div key={f.id} className="formateur-card" onClick={() => openDetail(f)}>
                <div className="fmt-card-header">
                  <div className="fmt-avatar">{(f.prenom?.[0] || '?')}{(f.nom?.[0] || '')}</div>
                  <div className="fmt-card-info">
                    <div className="fmt-name">{f.civilite ? `${f.civilite} ` : ''}{f.prenom} {f.nom}</div>
                    <a href={`mailto:${f.email}`} className="fmt-email" onClick={e => e.stopPropagation()}>{f.email}</a>
                    {f.telephone && <div className="fmt-tel">{f.telephone}</div>}
                  </div>
                </div>
                {f.competences?.length > 0 && (
                  <div className="fmt-competences">
                    {f.competences.slice(0, 4).map(cid => {
                      const m = ALL_MODULES.find(mod => mod.id === cid)
                      return m ? <span key={cid} className="fmt-comp-tag">{m.titre}</span> : null
                    })}
                    {f.competences.length > 4 && <span className="fmt-comp-more">+{f.competences.length - 4}</span>}
                  </div>
                )}
                <div className="fmt-card-footer">
                  {typeF && (
                    <span className="fmt-type-badge" style={{ color: typeF.color, background: typeF.bg }}>{typeF.label}</span>
                  )}
                  {bpf && (
                    <span className="bpf-badge" style={{ color: bpf.color, background: bpf.bg }}>BPF {bpf.label}</span>
                  )}
                  {f.cout_journalier && (
                    <span className="fmt-cout">{f.cout_journalier} €/j</span>
                  )}
                </div>
                <div className="fmt-card-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn-icon" onClick={() => openEdit(f)} title="Modifier">✏️</button>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(f.id)} title="Supprimer">🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal formulaire */}
      {modal === 'form' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal modal-fmt-form" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selected ? 'Modifier le formateur' : 'Nouveau formateur'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <form onSubmit={handleSave} className="modal-form">

              <div className="form-section-title">Identité</div>
              <div className="form-row">
                <div className="form-group form-group-sm">
                  <label>Civilité</label>
                  <select value={form.civilite} onChange={e => setForm(f => ({...f, civilite: e.target.value}))}>
                    <option value="">—</option>
                    {CIVILITES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Prénom *</label>
                  <input value={form.prenom} onChange={e => setForm(f => ({...f, prenom: e.target.value}))} className={errors.prenom ? 'error' : ''} />
                  {errors.prenom && <span className="form-error">{errors.prenom}</span>}
                </div>
                <div className="form-group">
                  <label>Nom *</label>
                  <input value={form.nom} onChange={e => setForm(f => ({...f, nom: e.target.value}))} className={errors.nom ? 'error' : ''} />
                  {errors.nom && <span className="form-error">{errors.nom}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className={errors.email ? 'error' : ''} />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input value={form.telephone} onChange={e => setForm(f => ({...f, telephone: e.target.value}))} placeholder="06 00 00 00 00" />
                </div>
              </div>

              <div className="form-group">
                <label>Adresse</label>
                <input value={form.adresse} onChange={e => setForm(f => ({...f, adresse: e.target.value}))} placeholder="Adresse postale" />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select value={form.type_formateur} onChange={e => setForm(f => ({...f, type_formateur: e.target.value}))}>
                    {TYPES_FORMATEUR.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Coût journalier (€ HT)</label>
                  <input type="number" value={form.cout_journalier} onChange={e => setForm(f => ({...f, cout_journalier: e.target.value}))} placeholder="ex. 800" min="0" />
                </div>
                <div className="form-group">
                  <label>Statut BPF</label>
                  <select value={form.statut_bpf} onChange={e => setForm(f => ({...f, statut_bpf: e.target.value}))}>
                    {STATUTS_BPF_FORMATEUR.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-section-title">Compétences — Modules AFS</div>
              <div className="competences-selector">
                {THEMATIQUES.map(t => (
                  <div key={t.id} className="comp-thematique">
                    <div className="comp-theme-label">{t.emoji} {t.titre}</div>
                    <div className="comp-modules">
                      {t.modules.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          className={`comp-tag ${form.competences.includes(m.id) ? 'active' : ''}`}
                          onClick={() => toggleCompetence(m.id)}
                        >
                          {m.titre}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} placeholder="Informations complémentaires…" />
              </div>

              <div className="modal-actions">
                <button type="submit" className="btn-primary">{selected ? 'Enregistrer' : 'Ajouter'}</button>
                <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {modal === 'detail' && selected && (
        <DetailModal
          formateur={selected}
          onClose={() => setModal(null)}
          onEdit={() => openEdit(selected)}
        />
      )}
    </div>
  )
}

function DetailModal({ formateur, onClose, onEdit }) {
  const f = formateur
  const bpf = STATUTS_BPF_FORMATEUR.find(s => s.id === f.statut_bpf)
  const competenceModules = (f.competences || []).map(cid => ALL_MODULES.find(m => m.id === cid)).filter(Boolean)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-detail" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="detail-header-left">
            <div className="detail-avatar fmt-avatar-lg">{(f.prenom?.[0] || '?')}{(f.nom?.[0] || '')}</div>
            <div>
              <h2>{f.civilite ? `${f.civilite} ` : ''}{f.prenom} {f.nom}</h2>
              {f.adresse && <div className="detail-sub">{f.adresse}</div>}
            </div>
          </div>
          <div className="modal-header-actions">
            <button className="btn-icon" onClick={onEdit}>✏️</button>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="detail-contacts">
          <a href={`mailto:${f.email}`} className="contact-item">✉️ {f.email}</a>
          {f.telephone && <span className="contact-item">📞 {f.telephone}</span>}
          {f.cout_journalier && <span className="contact-item">💶 {f.cout_journalier} €/j HT</span>}
          {bpf && <span className="contact-item bpf-inline" style={{ color: bpf.color }}>BPF {bpf.label}</span>}
        </div>

        {competenceModules.length > 0 && (
          <div className="detail-section">
            <h3>Compétences ({competenceModules.length} module{competenceModules.length > 1 ? 's' : ''})</h3>
            <div className="detail-competences">
              {THEMATIQUES.map(t => {
                const mods = competenceModules.filter(m => m.thematiqueId === t.id)
                if (!mods.length) return null
                return (
                  <div key={t.id} className="detail-comp-group">
                    <div className="detail-comp-theme">{t.emoji} {t.titre}</div>
                    <div className="detail-comp-tags">
                      {mods.map(m => <span key={m.id} className="fmt-comp-tag">{m.titre}</span>)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {f.notes && (
          <div className="detail-section">
            <h3>Notes</h3>
            <p className="detail-notes">{f.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
