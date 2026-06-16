import { useState, useEffect } from 'react'
import { getFinanceurs, saveFinanceur, deleteFinanceur, seedDemoFinanceurs, TYPES_FINANCEUR } from '../data/financeurs'
import './Financeurs.css'

const EMPTY_FORM = {
  nom: '', type: 'opco', siret: '',
  contact_prenom: '', contact_nom: '', contact_email: '', contact_tel: '',
  adresse: '', notes: '',
}

export default function Financeurs() {
  const [financeurs, setFinanceurs] = useState([])
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    seedDemoFinanceurs()
    setFinanceurs(getFinanceurs())
  }, [])

  function refresh() { setFinanceurs(getFinanceurs()) }

  function openNew() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModal('form')
  }

  function openEdit(f) {
    setSelected(f)
    setForm({
      nom: f.nom || '',
      type: f.type || 'opco',
      siret: f.siret || '',
      contact_prenom: f.contact_prenom || '',
      contact_nom: f.contact_nom || '',
      contact_email: f.contact_email || '',
      contact_tel: f.contact_tel || '',
      adresse: f.adresse || '',
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
    if (!confirm('Supprimer ce financeur ?')) return
    deleteFinanceur(id)
    refresh()
  }

  function validate() {
    const e = {}
    if (!form.nom.trim()) e.nom = 'Requis'
    return e
  }

  function handleSave(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    saveFinanceur(selected ? { ...selected, ...form } : form)
    refresh()
    setModal(null)
  }

  const filtres = financeurs.filter(f => {
    const q = search.toLowerCase()
    const matchSearch = !search || [f.nom, f.contact_email, f.contact_nom].some(v => v?.toLowerCase().includes(q))
    const matchType = !filterType || f.type === filterType
    return matchSearch && matchType
  })

  return (
    <div className="financeurs">
      <div className="financeurs-topbar">
        <div>
          <h1 className="financeurs-title">Financeurs / OPCO</h1>
          <p className="financeurs-sub">{financeurs.length} financeur{financeurs.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Ajouter un financeur</button>
      </div>

      {/* Filtres type */}
      <div className="fin-type-strip">
        <button
          className={`fin-type-chip ${!filterType ? 'active' : ''}`}
          onClick={() => setFilterType('')}
        >
          Tous <span>{financeurs.length}</span>
        </button>
        {TYPES_FINANCEUR.map(t => {
          const count = financeurs.filter(f => f.type === t.id).length
          if (count === 0) return null
          return (
            <button
              key={t.id}
              className={`fin-type-chip ${filterType === t.id ? 'active' : ''}`}
              onClick={() => setFilterType(filterType === t.id ? '' : t.id)}
            >
              {t.label} <span>{count}</span>
            </button>
          )
        })}
      </div>

      <div className="financeurs-search">
        <input
          type="text"
          placeholder="Rechercher par nom, contact, email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
      </div>

      {filtres.length === 0 ? (
        <div className="financeurs-empty">
          <div className="empty-icon">💰</div>
          <p>Aucun financeur{search ? ' pour cette recherche' : ''}</p>
          {!search && <button className="btn-primary" onClick={openNew}>Ajouter un financeur</button>}
        </div>
      ) : (
        <div className="financeurs-grid">
          {filtres.map(f => {
            const type = TYPES_FINANCEUR.find(t => t.id === f.type)
            return (
              <div key={f.id} className="financeur-card" onClick={() => openDetail(f)}>
                <div className="fin-card-header">
                  <div className="fin-avatar" style={{ background: type?.bg, color: type?.color }}>
                    {f.nom[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="fin-card-info">
                    <div className="fin-name">{f.nom}</div>
                    {type && (
                      <span className="fin-type-badge" style={{ color: type.color, background: type.bg }}>
                        {type.label}
                      </span>
                    )}
                  </div>
                </div>
                {(f.contact_prenom || f.contact_nom) && (
                  <div className="fin-contact">
                    👤 {f.contact_prenom} {f.contact_nom}
                    {f.contact_email && (
                      <a href={`mailto:${f.contact_email}`} className="fin-contact-email" onClick={e => e.stopPropagation()}>
                        {f.contact_email}
                      </a>
                    )}
                  </div>
                )}
                {f.siret && <div className="fin-siret">SIRET {f.siret}</div>}
                <div className="fin-card-actions" onClick={e => e.stopPropagation()}>
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
          <div className="modal modal-fin-form" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selected ? 'Modifier le financeur' : 'Nouveau financeur'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <form onSubmit={handleSave} className="modal-form">

              <div className="form-section-title">Organisme</div>
              <div className="form-group">
                <label>Nom *</label>
                <input value={form.nom} onChange={e => setForm(f => ({...f, nom: e.target.value}))} className={errors.nom ? 'error' : ''} placeholder="Ex: OPCO EP, FIFPL…" />
                {errors.nom && <span className="form-error">{errors.nom}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                    {TYPES_FINANCEUR.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>SIRET / Identifiant</label>
                  <input value={form.siret} onChange={e => setForm(f => ({...f, siret: e.target.value}))} placeholder="14 chiffres" />
                </div>
              </div>
              <div className="form-group">
                <label>Adresse</label>
                <input value={form.adresse} onChange={e => setForm(f => ({...f, adresse: e.target.value}))} placeholder="Adresse postale" />
              </div>

              <div className="form-section-title">Contact principal</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom</label>
                  <input value={form.contact_prenom} onChange={e => setForm(f => ({...f, contact_prenom: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Nom</label>
                  <input value={form.contact_nom} onChange={e => setForm(f => ({...f, contact_nom: e.target.value}))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={form.contact_email} onChange={e => setForm(f => ({...f, contact_email: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Téléphone</label>
                  <input value={form.contact_tel} onChange={e => setForm(f => ({...f, contact_tel: e.target.value}))} placeholder="01 00 00 00 00" />
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} placeholder="Conditions particulières, dossiers en cours…" />
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
        <DetailModal financeur={selected} onClose={() => setModal(null)} onEdit={() => openEdit(selected)} />
      )}
    </div>
  )
}

function DetailModal({ financeur, onClose, onEdit }) {
  const f = financeur
  const type = TYPES_FINANCEUR.find(t => t.id === f.type)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-detail" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="detail-header-left">
            <div className="fin-avatar fin-avatar-lg" style={{ background: type?.bg, color: type?.color }}>
              {f.nom[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h2>{f.nom}</h2>
              {type && <div className="detail-sub"><span className="fin-type-badge" style={{ color: type.color, background: type.bg }}>{type.label}</span></div>}
            </div>
          </div>
          <div className="modal-header-actions">
            <button className="btn-icon" onClick={onEdit}>✏️</button>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="detail-contacts">
          {f.siret && <span className="contact-item">🏢 SIRET {f.siret}</span>}
          {f.adresse && <span className="contact-item">📍 {f.adresse}</span>}
        </div>

        {(f.contact_prenom || f.contact_nom || f.contact_email) && (
          <div className="fin-detail-contact-block">
            <div className="fin-detail-contact-title">Contact</div>
            {(f.contact_prenom || f.contact_nom) && (
              <div className="fin-detail-contact-name">{f.contact_prenom} {f.contact_nom}</div>
            )}
            {f.contact_email && (
              <a href={`mailto:${f.contact_email}`} className="contact-item">✉️ {f.contact_email}</a>
            )}
            {f.contact_tel && <span className="contact-item">📞 {f.contact_tel}</span>}
          </div>
        )}

        {f.notes && (
          <div className="fin-detail-notes">
            <div className="fin-detail-contact-title">Notes</div>
            <p>{f.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
