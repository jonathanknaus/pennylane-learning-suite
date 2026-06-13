import { useState, useEffect } from 'react'
import { getStagiaires, saveStagiaire, deleteStagiaire, seedDemoStagiaires, getInscriptionsByStagiaire, FONCTIONS } from '../data/stagiaires'
import { getSessions } from '../data/sessions'
import './Stagiaires.css'

const EMPTY_FORM = { prenom: '', nom: '', email: '', telephone: '', fonction: '', cabinet: '' }

// Format téléphone : on ne garde que les chiffres et on insère un espace tous les
// deux chiffres (06 12 34 56 78). Cap à 10 chiffres (numéro français).
function formatTelephone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 10)
  return digits.replace(/(\d{2})(?=\d)/g, '$1 ')
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

export default function Stagiaires() {
  const [stagiaires, setStagiaires] = useState([])
  const [sessions, setSessions] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'form' | 'detail'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    seedDemoStagiaires()
    setStagiaires(getStagiaires())
    setSessions(getSessions())
  }, [])

  function refresh() {
    setStagiaires(getStagiaires())
    setSessions(getSessions())
  }

  function openNew() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModal('form')
  }

  function openEdit(s) {
    setSelected(s)
    setForm({ prenom: s.prenom, nom: s.nom, email: s.email, telephone: s.telephone || '', fonction: s.fonction || '', cabinet: s.cabinet || '' })
    setErrors({})
    setModal('form')
  }

  function openDetail(s) {
    setSelected(s)
    setModal('detail')
  }

  function handleDelete(id) {
    if (!confirm('Supprimer ce stagiaire ? Toutes ses inscriptions seront supprimées.')) return
    deleteStagiaire(id)
    refresh()
  }

  function validate() {
    const e = {}
    if (!form.prenom.trim()) e.prenom = 'Requis'
    if (!form.nom.trim()) e.nom = 'Requis'
    if (!form.email.trim()) e.email = 'Requis'
    else if (!EMAIL_RE.test(form.email.trim())) e.email = 'Email invalide'
    // Téléphone optionnel, mais s'il est rempli il doit faire 10 chiffres (FR).
    if (form.telephone.trim()) {
      const digits = form.telephone.replace(/\D/g, '')
      if (digits.length !== 10) e.telephone = 'Numéro invalide (10 chiffres attendus)'
    }
    return e
  }

  function handleSave(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    saveStagiaire(selected ? { ...selected, ...form } : form)
    refresh()
    setModal(null)
  }

  const filtres = stagiaires.filter(s => {
    if (!search) return true
    const q = search.toLowerCase()
    return [s.prenom, s.nom, s.email, s.cabinet, s.fonction].some(v => v?.toLowerCase().includes(q))
  })

  const cabinets = [...new Set(stagiaires.map(s => s.cabinet).filter(Boolean))].sort()

  return (
    <div className="stagiaires">
      <div className="stagiaires-topbar">
        <div>
          <h1 className="stagiaires-title">Stagiaires</h1>
          <p className="stagiaires-sub">{stagiaires.length} stagiaire{stagiaires.length > 1 ? 's' : ''} · {cabinets.length} cabinet{cabinets.length > 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Ajouter un stagiaire</button>
      </div>

      {/* Stats cabinets */}
      {cabinets.length > 0 && (
        <div className="cabinets-strip">
          {cabinets.map(cab => {
            const count = stagiaires.filter(s => s.cabinet === cab).length
            return (
              <button key={cab} className={`cabinet-chip ${search === cab ? 'active' : ''}`} onClick={() => setSearch(search === cab ? '' : cab)}>
                {cab} <span>{count}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="stagiaires-search">
        <input
          type="text"
          placeholder="Rechercher par nom, email, cabinet, fonction…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
      </div>

      {filtres.length === 0 ? (
        <div className="stagiaires-empty">
          <div className="empty-icon">👤</div>
          <p>Aucun stagiaire{search ? ' pour cette recherche' : ''}</p>
          {!search && <button className="btn-primary" onClick={openNew}>Ajouter un stagiaire</button>}
        </div>
      ) : (
        <div className="stagiaires-table-wrap">
          <table className="stagiaires-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Fonction</th>
                <th>Cabinet</th>
                <th>Sessions</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtres.map(s => {
                const inscriptions = getInscriptionsByStagiaire(s.id)
                return (
                  <tr key={s.id} className="stagiaire-row" onClick={() => openDetail(s)}>
                    <td>
                      <div className="stagiaire-avatar-name">
                        <div className="stagiaire-avatar">{s.prenom[0]}{s.nom[0]}</div>
                        <div>
                          <div className="stagiaire-fullname">{s.prenom} {s.nom}</div>
                          {s.telephone && <div className="stagiaire-tel">{s.telephone}</div>}
                        </div>
                      </div>
                    </td>
                    <td><a href={`mailto:${s.email}`} onClick={e => e.stopPropagation()} className="stagiaire-email">{s.email}</a></td>
                    <td><span className="fonction-badge">{s.fonction || '—'}</span></td>
                    <td className="stagiaire-cabinet">{s.cabinet || '—'}</td>
                    <td>
                      <span className="sessions-count-badge">{inscriptions.length}</span>
                    </td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="row-actions">
                        <button className="btn-icon" onClick={() => openEdit(s)} title="Modifier">✏️</button>
                        <button className="btn-icon btn-danger" onClick={() => handleDelete(s.id)} title="Supprimer">🗑</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal formulaire */}
      {modal === 'form' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selected ? 'Modifier le stagiaire' : 'Nouveau stagiaire'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <form onSubmit={handleSave} className="modal-form">
              <div className="form-row">
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
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className={errors.email ? 'error' : ''} />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={form.telephone}
                    onChange={e => setForm(f => ({ ...f, telephone: formatTelephone(e.target.value) }))}
                    className={errors.telephone ? 'error' : ''}
                    placeholder="06 00 00 00 00"
                    maxLength={14}
                  />
                  {errors.telephone && <span className="form-error">{errors.telephone}</span>}
                </div>
                <div className="form-group">
                  <label>Fonction</label>
                  <select value={form.fonction} onChange={e => setForm(f => ({...f, fonction: e.target.value}))}>
                    <option value="">— Sélectionner —</option>
                    {FONCTIONS.map(fn => <option key={fn} value={fn}>{fn}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Cabinet / Organisation</label>
                <input value={form.cabinet} onChange={e => setForm(f => ({...f, cabinet: e.target.value}))} placeholder="Nom du cabinet" />
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
          stagiaire={selected}
          sessions={sessions}
          onClose={() => setModal(null)}
          onEdit={() => openEdit(selected)}
        />
      )}
    </div>
  )
}

function DetailModal({ stagiaire, sessions, onClose, onEdit }) {
  const inscriptions = getInscriptionsByStagiaire(stagiaire.id)
  const sessionsStagiaire = inscriptions.map(ins => ({
    ...ins,
    session: sessions.find(s => s.id === ins.sessionId),
  })).filter(i => i.session)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-detail" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="detail-header-left">
            <div className="detail-avatar">{stagiaire.prenom[0]}{stagiaire.nom[0]}</div>
            <div>
              <h2>{stagiaire.prenom} {stagiaire.nom}</h2>
              <div className="detail-sub">{stagiaire.fonction}{stagiaire.cabinet ? ` · ${stagiaire.cabinet}` : ''}</div>
            </div>
          </div>
          <div className="modal-header-actions">
            <button className="btn-icon" onClick={onEdit}>✏️</button>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="detail-contacts">
          <a href={`mailto:${stagiaire.email}`} className="contact-item">✉️ {stagiaire.email}</a>
          {stagiaire.telephone && <span className="contact-item">📞 {stagiaire.telephone}</span>}
        </div>

        <div className="detail-sessions">
          <h3>Sessions ({sessionsStagiaire.length})</h3>
          {sessionsStagiaire.length === 0 ? (
            <p className="detail-empty">Aucune inscription à ce jour</p>
          ) : (
            <div className="detail-sessions-list">
              {sessionsStagiaire.map(({ session, statut, presence }) => (
                <div key={session.id} className="detail-session-row">
                  <div className="detail-session-info">
                    <div className="detail-session-titre">{session.titre}</div>
                    <div className="detail-session-date">
                      {session.date ? new Date(session.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                  <div className="detail-session-badges">
                    <span className="statut-mini" style={{ background: statut === 'confirme' ? '#D1FAE5' : statut === 'annule' ? '#FEE2E2' : '#EFF6FF', color: statut === 'confirme' ? '#059669' : statut === 'annule' ? '#DC2626' : '#3B82F6' }}>
                      {statut === 'confirme' ? 'Confirmé' : statut === 'annule' ? 'Annulé' : statut === 'liste_attente' ? "Liste d'attente" : 'Inscrit'}
                    </span>
                    {presence !== null && (
                      <span className="presence-mini">{presence ? '✓ Présent' : '✗ Absent'}</span>
                    )}
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
