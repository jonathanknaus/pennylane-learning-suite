import { useState, useEffect } from 'react'
import {
  getGestionnaires, saveGestionnaire, deleteGestionnaire, CIVILITES,
  getDelegations, addDelegation, endDelegation, getDelegationActive, resolveResponsable,
} from '../data/gestionnaires'
import './Gestionnaires.css'

const EMPTY_FORM = { civilite: '', prenom: '', nom: '', email: '', telephone: '', notes: '' }

export default function Gestionnaires() {
  const [gestionnaires, setGestionnaires] = useState([])
  const [delegations, setDelegations] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // 'form' | 'detail' | 'delegation'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [delegForm, setDelegForm] = useState({ versId: '', type: 'temporaire', dateDebut: '', dateFin: '', motif: '' })

  useEffect(() => { refresh() }, [])

  function refresh() {
    setGestionnaires(getGestionnaires())
    setDelegations(getDelegations())
  }

  function openNew() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModal('form')
  }

  function openEdit(g) {
    setSelected(g)
    setForm({
      civilite: g.civilite || '', prenom: g.prenom || '', nom: g.nom || '',
      email: g.email || '', telephone: g.telephone || '', notes: g.notes || '',
    })
    setErrors({})
    setModal('form')
  }

  function openDetail(g) {
    setSelected(g)
    setModal('detail')
  }

  function handleDelete(id) {
    if (!confirm('Supprimer ce gestionnaire ? Les sessions qui lui sont attribuées perdront leur gestionnaire attitré.')) return
    deleteGestionnaire(id)
    refresh()
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
    saveGestionnaire(selected ? { ...selected, ...form } : form)
    refresh()
    setModal(null)
  }

  function openDelegation(g) {
    setSelected(g)
    setDelegForm({ versId: '', type: 'temporaire', dateDebut: new Date().toISOString().slice(0, 10), dateFin: '', motif: '' })
    setModal('delegation')
  }

  function handleSaveDelegation(e) {
    e.preventDefault()
    if (!delegForm.versId) return
    addDelegation({ deId: selected.id, versId: delegForm.versId, ...delegForm })
    refresh()
    setModal(null)
  }

  function handleEndDelegation(id) {
    if (!confirm('Mettre fin à cette délégation ?')) return
    endDelegation(id)
    refresh()
  }

  const filtres = gestionnaires.filter(g => {
    if (!search) return true
    const q = search.toLowerCase()
    return [g.prenom, g.nom, g.email].some(v => v?.toLowerCase().includes(q))
  })

  return (
    <div className="gestionnaires">
      <div className="gestionnaires-topbar">
        <div>
          <h1 className="gestionnaires-title">Responsable administratif & réglementaire</h1>
          <p className="gestionnaires-sub">{gestionnaires.length} gestionnaire{gestionnaires.length > 1 ? 's' : ''} · reçoivent les notifications de suivi des dossiers (Salesforce, devis, conventions, facturation)</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Ajouter un gestionnaire</button>
      </div>

      <div className="gestionnaires-search">
        <input
          type="text"
          placeholder="Rechercher par nom ou email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
      </div>

      {filtres.length === 0 ? (
        <div className="gestionnaires-empty">
          <div className="empty-icon">🗂️</div>
          <p>Aucun gestionnaire{search ? ' pour cette recherche' : ''}</p>
          {!search && <button className="btn-primary" onClick={openNew}>Ajouter un gestionnaire</button>}
        </div>
      ) : (
        <div className="gestionnaires-grid">
          {filtres.map(g => {
            const delegActive = getDelegationActive(g.id)
            const versQui = delegActive ? gestionnaires.find(x => x.id === delegActive.versId) : null
            return (
              <div key={g.id} className="gest-card" onClick={() => openDetail(g)}>
                <div className="gest-card-header">
                  <div className="gest-avatar">{(g.prenom?.[0] || '?')}{(g.nom?.[0] || '')}</div>
                  <div className="gest-card-info">
                    <div className="gest-name">{g.civilite ? `${g.civilite} ` : ''}{g.prenom} {g.nom}</div>
                    <a href={`mailto:${g.email}`} className="gest-email" onClick={e => e.stopPropagation()}>{g.email}</a>
                    {g.telephone && <div className="gest-tel">{g.telephone}</div>}
                  </div>
                </div>
                {g.notes && <div className="gest-notes-preview">{g.notes}</div>}
                {delegActive && versQui && (
                  <div className={`gest-deleg-badge gest-deleg-${delegActive.type}`}>
                    {delegActive.type === 'permanente' ? '➡️ Délégation permanente vers' : '⏳ Délégation temporaire vers'} <strong>{versQui.prenom} {versQui.nom}</strong>
                  </div>
                )}
                <div className="gest-card-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn-icon" onClick={() => openDelegation(g)} title="Déléguer">↪️</button>
                  <button className="btn-icon" onClick={() => openEdit(g)} title="Modifier">✏️</button>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(g.id)} title="Supprimer">🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {delegations.filter(d => d.active).length > 0 && (
        <div className="deleg-section">
          <h2 className="deleg-section-title">Délégations en cours</h2>
          <div className="deleg-list">
            {delegations.filter(d => d.active).map(d => {
              const de = gestionnaires.find(g => g.id === d.deId)
              const vers = gestionnaires.find(g => g.id === d.versId)
              if (!de || !vers) return null
              return (
                <div key={d.id} className="deleg-row">
                  <div className="deleg-row-main">
                    <span className={`deleg-type-badge deleg-type-${d.type}`}>{d.type === 'permanente' ? 'Permanente' : 'Temporaire'}</span>
                    <span>{de.prenom} {de.nom} <strong>→</strong> {vers.prenom} {vers.nom}</span>
                    {d.dateFin && <span className="deleg-dates">jusqu'au {new Date(d.dateFin + 'T12:00:00').toLocaleDateString('fr-FR')}</span>}
                    {d.motif && <span className="deleg-motif">— {d.motif}</span>}
                  </div>
                  <button className="btn-secondary-sm" onClick={() => handleEndDelegation(d.id)}>Mettre fin</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal formulaire gestionnaire */}
      {modal === 'form' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal modal-gest-form" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selected ? 'Modifier le gestionnaire' : 'Nouveau gestionnaire'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-row">
                <div className="form-group form-group-sm">
                  <label>Civilité</label>
                  <select value={form.civilite} onChange={e => setForm(f => ({ ...f, civilite: e.target.value }))}>
                    <option value="">—</option>
                    {CIVILITES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Prénom *</label>
                  <input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} className={errors.prenom ? 'error' : ''} />
                  {errors.prenom && <span className="form-error">{errors.prenom}</span>}
                </div>
                <div className="form-group">
                  <label>Nom *</label>
                  <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} className={errors.nom ? 'error' : ''} />
                  {errors.nom && <span className="form-error">{errors.nom}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={errors.email ? 'error' : ''} />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))} placeholder="06 00 00 00 00" />
                </div>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Périmètre, particularités…" />
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
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal modal-detail" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="detail-header-left">
                <div className="detail-avatar gest-avatar-lg">{(selected.prenom?.[0] || '?')}{(selected.nom?.[0] || '')}</div>
                <div>
                  <h2>{selected.civilite ? `${selected.civilite} ` : ''}{selected.prenom} {selected.nom}</h2>
                  <div className="detail-sub">Responsable administratif & réglementaire</div>
                </div>
              </div>
              <div className="modal-header-actions">
                <button className="btn-icon" onClick={() => openEdit(selected)}>✏️</button>
                <button className="modal-close" onClick={() => setModal(null)}>×</button>
              </div>
            </div>
            <div className="detail-contacts">
              <a href={`mailto:${selected.email}`} className="contact-item">✉️ {selected.email}</a>
              {selected.telephone && <span className="contact-item">📞 {selected.telephone}</span>}
            </div>
            {selected.notes && (
              <div className="detail-section">
                <h3>Notes</h3>
                <p className="detail-notes">{selected.notes}</p>
              </div>
            )}
            <div className="detail-section">
              <h3>Délégation d'attributions</h3>
              <p className="portail-desc">Transférer temporairement (congés, absence) ou définitivement (départ) les tâches et rappels de ce gestionnaire vers une autre personne de l'équipe.</p>
              <button className="btn-secondary" onClick={() => openDelegation(selected)}>↪️ Déléguer mes attributions</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal délégation */}
      {modal === 'delegation' && selected && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal modal-deleg-form" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Déléguer les attributions de {selected.prenom} {selected.nom}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <form onSubmit={handleSaveDelegation} className="modal-form">
              <div className="form-group">
                <label>Déléguer vers *</label>
                <select value={delegForm.versId} onChange={e => setDelegForm(f => ({ ...f, versId: e.target.value }))} required>
                  <option value="">— Choisir un gestionnaire —</option>
                  {gestionnaires.filter(g => g.id !== selected.id).map(g => (
                    <option key={g.id} value={g.id}>{g.prenom} {g.nom}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Type de délégation</label>
                <div className="radio-group">
                  <label className={`radio-option ${delegForm.type === 'temporaire' ? 'selected' : ''}`}>
                    <input type="radio" name="deleg_type" checked={delegForm.type === 'temporaire'} onChange={() => setDelegForm(f => ({ ...f, type: 'temporaire' }))} />
                    Temporaire (congés, absence)
                  </label>
                  <label className={`radio-option ${delegForm.type === 'permanente' ? 'selected' : ''}`}>
                    <input type="radio" name="deleg_type" checked={delegForm.type === 'permanente'} onChange={() => setDelegForm(f => ({ ...f, type: 'permanente' }))} />
                    Permanente (départ définitif)
                  </label>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date de début</label>
                  <input type="date" value={delegForm.dateDebut} onChange={e => setDelegForm(f => ({ ...f, dateDebut: e.target.value }))} />
                </div>
                {delegForm.type === 'temporaire' && (
                  <div className="form-group">
                    <label>Date de fin</label>
                    <input type="date" value={delegForm.dateFin} onChange={e => setDelegForm(f => ({ ...f, dateFin: e.target.value }))} />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Motif</label>
                <input value={delegForm.motif} onChange={e => setDelegForm(f => ({ ...f, motif: e.target.value }))} placeholder="Ex : congés du 14 au 28 juillet" />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary" disabled={!delegForm.versId}>Confirmer la délégation</button>
                <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
