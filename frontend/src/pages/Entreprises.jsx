import { useState, useEffect } from 'react'
import { getEntreprises, saveEntreprise, deleteEntreprise, seedDemoEntreprises, fetchInfosSiret, STATUTS_BPF } from '../data/entreprises'
import { getStagiaires, getInscriptions } from '../data/stagiaires'
import { getSessions } from '../data/sessions'
import './Entreprises.css'

const EMPTY_FORM = {
  nom: '', siret: '', adresse: '',
  contact_prenom: '', contact_nom: '', contact_email: '', contact_tel: '', contact_fonction: '',
  statut_bpf: '', notes: '',
}

export default function Entreprises() {
  const [entreprises, setEntreprises] = useState([])
  const [stagiaires, setStagiaires] = useState([])
  const [sessions, setSessions] = useState([])
  const [inscriptions, setInscriptions] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'form' | 'detail'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [siretLoading, setSiretLoading] = useState(false)
  const [siretError, setSiretError] = useState('')

  useEffect(() => {
    seedDemoEntreprises()
    refresh()
  }, [])

  function refresh() {
    setEntreprises(getEntreprises())
    setStagiaires(getStagiaires())
    setSessions(getSessions())
    setInscriptions(getInscriptions())
  }

  function openNew() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setSiretError('')
    setModal('form')
  }

  function openEdit(e) {
    setSelected(e)
    setForm({
      nom: e.nom, siret: e.siret || '', adresse: e.adresse || '',
      contact_prenom: e.contact_prenom || '', contact_nom: e.contact_nom || '',
      contact_email: e.contact_email || '', contact_tel: e.contact_tel || '',
      contact_fonction: e.contact_fonction || '', statut_bpf: e.statut_bpf || '',
      notes: e.notes || '',
    })
    setErrors({})
    setSiretError('')
    setModal('form')
  }

  function openDetail(e) {
    setSelected(e)
    setModal('detail')
  }

  function handleDelete(id) {
    if (!confirm('Supprimer ce cabinet ?')) return
    deleteEntreprise(id)
    refresh()
  }

  async function handleSiretLookup() {
    if (!form.siret.trim()) { setSiretError('Saisissez un SIRET'); return }
    setSiretLoading(true)
    setSiretError('')
    try {
      const infos = await fetchInfosSiret(form.siret)
      setForm(f => ({ ...f, nom: infos.nom || f.nom, adresse: infos.adresse || f.adresse }))
    } catch (err) {
      setSiretError(err.message || 'Introuvable')
    } finally {
      setSiretLoading(false)
    }
  }

  function validate() {
    const e = {}
    if (!form.nom.trim()) e.nom = 'Requis'
    if (form.contact_email && !/^[^@]+@[^@]+\.[^@]+$/.test(form.contact_email)) e.contact_email = 'Email invalide'
    return e
  }

  function handleSave(ev) {
    ev.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    saveEntreprise(selected ? { ...selected, ...form } : form)
    refresh()
    setModal(null)
  }

  const filtres = entreprises.filter(e => {
    if (!search) return true
    const q = search.toLowerCase()
    return [e.nom, e.siret, e.contact_nom, e.contact_prenom, e.contact_email, e.adresse]
      .some(v => v?.toLowerCase().includes(q))
  })

  function getStagiairesOf(entrepriseNom) {
    return stagiaires.filter(s => s.cabinet === entrepriseNom)
  }

  function getSessionsOf(entrepriseNom) {
    const stags = getStagiairesOf(entrepriseNom)
    const stagIds = new Set(stags.map(s => s.id))
    const sessionIds = new Set(inscriptions.filter(i => stagIds.has(i.stagiaireId)).map(i => i.sessionId))
    return sessions.filter(s => sessionIds.has(s.id))
  }

  return (
    <div className="entreprises">
      <div className="entreprises-topbar">
        <div>
          <h1 className="entreprises-title">Cabinets & Entreprises</h1>
          <p className="entreprises-sub">{entreprises.length} cabinet{entreprises.length > 1 ? 's' : ''} enregistré{entreprises.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Ajouter un cabinet</button>
      </div>

      <div className="entreprises-search">
        <input
          type="text"
          placeholder="Rechercher par nom, SIRET, contact, adresse…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
      </div>

      {filtres.length === 0 ? (
        <div className="entreprises-empty">
          <div className="empty-icon">🏢</div>
          <p>Aucun cabinet{search ? ' pour cette recherche' : ''}</p>
          {!search && <button className="btn-primary" onClick={openNew}>Ajouter un cabinet</button>}
        </div>
      ) : (
        <div className="entreprises-grid">
          {filtres.map(ent => {
            const stags = getStagiairesOf(ent.nom)
            const sess = getSessionsOf(ent.nom)
            const bpf = STATUTS_BPF.find(s => s.id === ent.statut_bpf)
            return (
              <div key={ent.id} className="entreprise-card" onClick={() => openDetail(ent)}>
                <div className="ent-card-header">
                  <div className="ent-avatar">{ent.nom[0]}</div>
                  <div className="ent-card-title">
                    <div className="ent-nom">{ent.nom}</div>
                    {ent.siret && <div className="ent-siret">SIRET {ent.siret}</div>}
                  </div>
                  {bpf && (
                    <span className="bpf-badge" style={{ color: bpf.color, background: bpf.bg }}>
                      BPF {bpf.label}
                    </span>
                  )}
                </div>
                {ent.adresse && <div className="ent-adresse">{ent.adresse}</div>}
                {(ent.contact_nom || ent.contact_prenom) && (
                  <div className="ent-contact">
                    👤 {ent.contact_prenom} {ent.contact_nom}
                    {ent.contact_fonction ? ` · ${ent.contact_fonction}` : ''}
                  </div>
                )}
                {ent.contact_email && (
                  <a
                    className="ent-contact-email"
                    href={`mailto:${ent.contact_email}`}
                    onClick={ev => ev.stopPropagation()}
                  >
                    ✉️ {ent.contact_email}
                  </a>
                )}
                <div className="ent-stats">
                  <span className="ent-stat"><span className="ent-stat-val">{stags.length}</span> stagiaire{stags.length > 1 ? 's' : ''}</span>
                  <span className="ent-stat-sep">·</span>
                  <span className="ent-stat"><span className="ent-stat-val">{sess.length}</span> session{sess.length > 1 ? 's' : ''}</span>
                </div>
                <div className="ent-card-actions" onClick={ev => ev.stopPropagation()}>
                  <button className="btn-icon" onClick={() => openEdit(ent)} title="Modifier">✏️</button>
                  <button className="btn-icon btn-danger" onClick={() => handleDelete(ent.id)} title="Supprimer">🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal formulaire */}
      {modal === 'form' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal modal-ent-form" onClick={ev => ev.stopPropagation()}>
            <div className="modal-header">
              <h2>{selected ? 'Modifier le cabinet' : 'Nouveau cabinet'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <form onSubmit={handleSave} className="modal-form">

              {/* SIRET + lookup */}
              <div className="form-section-title">Informations légales</div>
              <div className="siret-row">
                <div className="form-group siret-field">
                  <label>SIRET</label>
                  <input
                    value={form.siret}
                    onChange={e => { setForm(f => ({...f, siret: e.target.value})); setSiretError('') }}
                    placeholder="12345678901234"
                  />
                </div>
                <button type="button" className="btn-siret-lookup" onClick={handleSiretLookup} disabled={siretLoading}>
                  {siretLoading ? '…' : '🔍 Auto-compléter'}
                </button>
              </div>
              {siretError && <span className="form-error">{siretError}</span>}

              <div className="form-group">
                <label>Nom du cabinet / entreprise *</label>
                <input
                  value={form.nom}
                  onChange={e => setForm(f => ({...f, nom: e.target.value}))}
                  className={errors.nom ? 'error' : ''}
                  placeholder="Cabinet Martin & Associés"
                />
                {errors.nom && <span className="form-error">{errors.nom}</span>}
              </div>

              <div className="form-group">
                <label>Adresse</label>
                <input
                  value={form.adresse}
                  onChange={e => setForm(f => ({...f, adresse: e.target.value}))}
                  placeholder="12 RUE DE LA PAIX 75002 PARIS"
                />
              </div>

              {/* Contact principal */}
              <div className="form-section-title">Contact principal</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Prénom</label>
                  <input value={form.contact_prenom} onChange={e => setForm(f => ({...f, contact_prenom: e.target.value}))} placeholder="Sophie" />
                </div>
                <div className="form-group">
                  <label>Nom</label>
                  <input value={form.contact_nom} onChange={e => setForm(f => ({...f, contact_nom: e.target.value}))} placeholder="Martin" />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={e => setForm(f => ({...f, contact_email: e.target.value}))}
                  className={errors.contact_email ? 'error' : ''}
                  placeholder="contact@cabinet.fr"
                />
                {errors.contact_email && <span className="form-error">{errors.contact_email}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone</label>
                  <input value={form.contact_tel} onChange={e => setForm(f => ({...f, contact_tel: e.target.value}))} placeholder="01 00 00 00 00" />
                </div>
                <div className="form-group">
                  <label>Fonction</label>
                  <input value={form.contact_fonction} onChange={e => setForm(f => ({...f, contact_fonction: e.target.value}))} placeholder="Expert-comptable" />
                </div>
              </div>

              {/* Suivi BPF */}
              <div className="form-section-title">Bilan pédagogique et financier</div>
              <div className="form-group">
                <label>Statut BPF</label>
                <select value={form.statut_bpf} onChange={e => setForm(f => ({...f, statut_bpf: e.target.value}))}>
                  <option value="">— Non renseigné —</option>
                  {STATUTS_BPF.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(f => ({...f, notes: e.target.value}))}
                  placeholder="Remarques, historique, contacts additionnels…"
                />
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
          entreprise={selected}
          stagiaires={getStagiairesOf(selected.nom)}
          sessions={getSessionsOf(selected.nom)}
          onClose={() => setModal(null)}
          onEdit={() => openEdit(selected)}
        />
      )}
    </div>
  )
}

function DetailModal({ entreprise, stagiaires, sessions, onClose, onEdit }) {
  const bpf = STATUTS_BPF.find(s => s.id === entreprise.statut_bpf)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-ent-detail" onClick={ev => ev.stopPropagation()}>
        <div className="modal-header">
          <div className="detail-header-left">
            <div className="ent-avatar ent-avatar-lg">{entreprise.nom[0]}</div>
            <div>
              <h2>{entreprise.nom}</h2>
              {entreprise.siret && <div className="detail-sub">SIRET {entreprise.siret}</div>}
              {entreprise.adresse && <div className="detail-sub">{entreprise.adresse}</div>}
            </div>
          </div>
          <div className="modal-header-actions">
            <button className="btn-icon" onClick={onEdit}>✏️</button>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Contact + BPF */}
        <div className="detail-contacts">
          {(entreprise.contact_prenom || entreprise.contact_nom) && (
            <span className="contact-item">👤 {entreprise.contact_prenom} {entreprise.contact_nom}{entreprise.contact_fonction ? ` (${entreprise.contact_fonction})` : ''}</span>
          )}
          {entreprise.contact_email && (
            <a href={`mailto:${entreprise.contact_email}`} className="contact-item">✉️ {entreprise.contact_email}</a>
          )}
          {entreprise.contact_tel && (
            <span className="contact-item">📞 {entreprise.contact_tel}</span>
          )}
          {bpf && (
            <span className="contact-item bpf-inline" style={{ color: bpf.color }}>
              BPF : {bpf.label}
            </span>
          )}
        </div>

        {entreprise.notes && (
          <div className="detail-notes">
            <p>{entreprise.notes}</p>
          </div>
        )}

        {/* Stagiaires */}
        <div className="detail-section">
          <h3>Stagiaires ({stagiaires.length})</h3>
          {stagiaires.length === 0 ? (
            <p className="detail-empty">Aucun stagiaire lié à ce cabinet</p>
          ) : (
            <div className="detail-stags-list">
              {stagiaires.map(s => (
                <div key={s.id} className="detail-stag-row">
                  <div className="stag-mini-avatar">{s.prenom[0]}{s.nom[0]}</div>
                  <div>
                    <div className="detail-stag-name">{s.prenom} {s.nom}</div>
                    {s.fonction && <div className="detail-stag-fn">{s.fonction}</div>}
                  </div>
                  <a href={`mailto:${s.email}`} className="detail-stag-email">{s.email}</a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sessions */}
        <div className="detail-section">
          <h3>Sessions ({sessions.length})</h3>
          {sessions.length === 0 ? (
            <p className="detail-empty">Aucune session liée à ce cabinet</p>
          ) : (
            <div className="detail-sessions-list">
              {sessions.map(s => (
                <div key={s.id} className="detail-session-row">
                  <div className="detail-session-info">
                    <div className="detail-session-titre">{s.titre}</div>
                    <div className="detail-session-date">
                      {s.date ? new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
