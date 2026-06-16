import { useState, useMemo } from 'react'
import {
  getReclamations, saveReclamation, deleteReclamation,
  TYPES_REMONTEE, CANAUX_REMONTEE, STATUTS_RECLAMATION,
} from '../data/reclamations'
import { getSessions } from '../data/sessions'
import './Reclamations.css'

const EMPTY_FORM = {
  type: 'reclamation',
  statut: 'ouvert',
  date_remontee: new Date().toISOString().slice(0, 10),
  canal: 'email',
  emetteur_nom: '',
  emetteur_role: '',
  session_id: '',
  description: '',
  action_corrective: '',
  responsable: '',
  date_resolution: '',
  notes: '',
}

function Badge({ id, list, small }) {
  const item = list.find(x => x.id === id)
  if (!item) return null
  return (
    <span className={`badge-pill${small ? ' small' : ''}`} style={{ color: item.color, background: item.bg }}>
      {item.label}
    </span>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className="rec-stat">
      <div className="rec-stat-val" style={{ color }}>{value}</div>
      <div className="rec-stat-label">{label}</div>
    </div>
  )
}

export default function Reclamations() {
  const [recs, setRecs] = useState(getReclamations)
  const sessions = getSessions()
  const [filterType, setFilterType] = useState('all')
  const [filterStatut, setFilterStatut] = useState('all')
  const [modal, setModal] = useState(null) // null | { mode: 'edit'|'view', rec }
  const [form, setForm] = useState(EMPTY_FORM)
  const [confirmDel, setConfirmDel] = useState(null)

  function reload() { setRecs(getReclamations()) }

  function openNew() {
    setForm({ ...EMPTY_FORM, date_remontee: new Date().toISOString().slice(0, 10) })
    setModal({ mode: 'edit', rec: null })
  }

  function openEdit(rec) {
    setForm({ ...EMPTY_FORM, ...rec })
    setModal({ mode: 'edit', rec })
  }

  function openView(rec) {
    setModal({ mode: 'view', rec })
  }

  function handleSave() {
    saveReclamation({ ...form, id: modal?.rec?.id || null })
    reload()
    setModal(null)
  }

  function handleDelete(id) {
    deleteReclamation(id)
    reload()
    setConfirmDel(null)
  }

  const filtered = useMemo(() => {
    return recs.filter(r => {
      if (filterType !== 'all' && r.type !== filterType) return false
      if (filterStatut !== 'all' && r.statut !== filterStatut) return false
      return true
    })
  }, [recs, filterType, filterStatut])

  const stats = useMemo(() => ({
    total: recs.length,
    ouvert: recs.filter(r => r.statut === 'ouvert').length,
    en_cours: recs.filter(r => r.statut === 'en_cours').length,
    resolu: recs.filter(r => r.statut === 'resolu' || r.statut === 'clos').length,
  }), [recs])

  const sessionLabel = (id) => {
    const s = sessions.find(s => s.id === id)
    return s ? `${s.titre}${s.date ? ' — ' + new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR') : ''}` : ''
  }

  return (
    <div className="reclamations-page">
      <div className="rec-topbar">
        <div>
          <h1 className="rec-title">Réclamations & Aléas</h1>
          <p className="rec-sub">Suivi des remontées clients — Qualiopi indicateurs 7.31 / 7.32</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nouvelle remontée</button>
      </div>

      {/* Stats */}
      <div className="rec-stats">
        <StatCard label="Total" value={stats.total} color="#1A1A1A" />
        <StatCard label="Ouvertes" value={stats.ouvert} color="#DC2626" />
        <StatCard label="En cours" value={stats.en_cours} color="#D97706" />
        <StatCard label="Résolues / Closes" value={stats.resolu} color="#059669" />
      </div>

      {/* Filtres */}
      <div className="rec-filters">
        <div className="rec-filter-group">
          <button className={`filter-chip ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>Tous types</button>
          {TYPES_REMONTEE.map(t => (
            <button
              key={t.id}
              className={`filter-chip ${filterType === t.id ? 'active' : ''}`}
              style={filterType === t.id ? { background: t.bg, color: t.color, borderColor: t.color } : {}}
              onClick={() => setFilterType(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="rec-filter-group">
          <button className={`filter-chip ${filterStatut === 'all' ? 'active' : ''}`} onClick={() => setFilterStatut('all')}>Tous statuts</button>
          {STATUTS_RECLAMATION.map(s => (
            <button
              key={s.id}
              className={`filter-chip ${filterStatut === s.id ? 'active' : ''}`}
              style={filterStatut === s.id ? { background: s.bg, color: s.color, borderColor: s.color } : {}}
              onClick={() => setFilterStatut(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      {filtered.length === 0 ? (
        <div className="rec-empty">
          {recs.length === 0
            ? <><div className="rec-empty-icon">📋</div><p>Aucune remontée enregistrée.</p><p className="rec-empty-sub">Les réclamations, difficultés et aléas signalés par vos clients apparaîtront ici.</p></>
            : <p>Aucune remontée ne correspond aux filtres sélectionnés.</p>
          }
        </div>
      ) : (
        <div className="rec-table-wrap">
          <table className="rec-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Canal</th>
                <th>Émetteur</th>
                <th>Session liée</th>
                <th>Description</th>
                <th>Statut</th>
                <th>Responsable</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="rec-row" onClick={() => openView(r)}>
                  <td className="rec-date">{r.date_remontee ? new Date(r.date_remontee + 'T12:00:00').toLocaleDateString('fr-FR') : '—'}</td>
                  <td><Badge id={r.type} list={TYPES_REMONTEE} small /></td>
                  <td className="rec-canal">{CANAUX_REMONTEE.find(c => c.id === r.canal)?.label || r.canal}</td>
                  <td className="rec-emetteur">
                    <strong>{r.emetteur_nom || '—'}</strong>
                    {r.emetteur_role && <span className="rec-role">{r.emetteur_role}</span>}
                  </td>
                  <td className="rec-session">{r.session_id ? sessionLabel(r.session_id) : <span className="rec-none">—</span>}</td>
                  <td className="rec-desc-cell">{r.description}</td>
                  <td><Badge id={r.statut} list={STATUTS_RECLAMATION} small /></td>
                  <td className="rec-resp">{r.responsable || '—'}</td>
                  <td className="rec-actions" onClick={e => e.stopPropagation()}>
                    <button className="btn-icon" title="Modifier" onClick={() => openEdit(r)}>✏️</button>
                    <button className="btn-icon btn-danger" title="Supprimer" onClick={() => setConfirmDel(r.id)}>🗑</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal fiche */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box rec-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modal.mode === 'view' ? 'Détail de la remontée' : modal.rec ? 'Modifier la remontée' : 'Nouvelle remontée'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>

            {modal.mode === 'view' ? (
              <div className="rec-detail">
                <div className="rec-detail-row">
                  <Badge id={modal.rec.type} list={TYPES_REMONTEE} />
                  <Badge id={modal.rec.statut} list={STATUTS_RECLAMATION} />
                </div>
                <div className="rec-detail-grid">
                  <div className="rec-detail-field"><span>Date</span><strong>{modal.rec.date_remontee ? new Date(modal.rec.date_remontee + 'T12:00:00').toLocaleDateString('fr-FR') : '—'}</strong></div>
                  <div className="rec-detail-field"><span>Canal</span><strong>{CANAUX_REMONTEE.find(c => c.id === modal.rec.canal)?.label || modal.rec.canal}</strong></div>
                  <div className="rec-detail-field"><span>Émetteur</span><strong>{modal.rec.emetteur_nom || '—'}{modal.rec.emetteur_role ? ` (${modal.rec.emetteur_role})` : ''}</strong></div>
                  <div className="rec-detail-field"><span>Responsable</span><strong>{modal.rec.responsable || '—'}</strong></div>
                  {modal.rec.session_id && <div className="rec-detail-field rec-detail-full"><span>Session liée</span><strong>{sessionLabel(modal.rec.session_id)}</strong></div>}
                  {modal.rec.date_resolution && <div className="rec-detail-field"><span>Date résolution</span><strong>{new Date(modal.rec.date_resolution + 'T12:00:00').toLocaleDateString('fr-FR')}</strong></div>}
                </div>
                {modal.rec.description && <div className="rec-detail-block"><div className="rec-detail-label">Description</div><div className="rec-detail-text">{modal.rec.description}</div></div>}
                {modal.rec.action_corrective && <div className="rec-detail-block"><div className="rec-detail-label">Action corrective</div><div className="rec-detail-text">{modal.rec.action_corrective}</div></div>}
                {modal.rec.notes && <div className="rec-detail-block"><div className="rec-detail-label">Notes internes</div><div className="rec-detail-text">{modal.rec.notes}</div></div>}
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setModal(null)}>Fermer</button>
                  <button className="btn-primary" onClick={() => openEdit(modal.rec)}>Modifier</button>
                </div>
              </div>
            ) : (
              <div className="rec-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Type de remontée *</label>
                    <div className="type-selector">
                      {TYPES_REMONTEE.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          className={`type-btn ${form.type === t.id ? 'active' : ''}`}
                          style={form.type === t.id ? { background: t.bg, color: t.color, borderColor: t.color } : {}}
                          onClick={() => setForm(f => ({ ...f, type: t.id }))}
                        >
                          <strong>{t.label}</strong>
                          <small>{t.desc}</small>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date de remontée *</label>
                    <input type="date" value={form.date_remontee} onChange={e => setForm(f => ({ ...f, date_remontee: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Canal</label>
                    <select value={form.canal} onChange={e => setForm(f => ({ ...f, canal: e.target.value }))}>
                      {CANAUX_REMONTEE.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Statut</label>
                    <select value={form.statut} onChange={e => setForm(f => ({ ...f, statut: e.target.value }))}>
                      {STATUTS_RECLAMATION.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Nom de l'émetteur</label>
                    <input type="text" placeholder="Cabinet Dupont / Jean Martin…" value={form.emetteur_nom} onChange={e => setForm(f => ({ ...f, emetteur_nom: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Rôle / Fonction</label>
                    <input type="text" placeholder="Expert-comptable, stagiaire…" value={form.emetteur_role} onChange={e => setForm(f => ({ ...f, emetteur_role: e.target.value }))} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group form-full">
                    <label>Session liée (optionnel)</label>
                    <select value={form.session_id} onChange={e => setForm(f => ({ ...f, session_id: e.target.value }))}>
                      <option value="">— Aucune session liée —</option>
                      {sessions.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.titre}{s.date ? ' — ' + new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR') : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group form-full">
                    <label>Description *</label>
                    <textarea rows={3} placeholder="Décrivez précisément la réclamation, la difficulté ou l'aléa…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group form-full">
                    <label>Action corrective mise en place</label>
                    <textarea rows={3} placeholder="Mesures prises, réponse apportée au client…" value={form.action_corrective} onChange={e => setForm(f => ({ ...f, action_corrective: e.target.value }))} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Responsable du traitement</label>
                    <input type="text" placeholder="Prénom Nom" value={form.responsable} onChange={e => setForm(f => ({ ...f, responsable: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label>Date de résolution</label>
                    <input type="date" value={form.date_resolution} onChange={e => setForm(f => ({ ...f, date_resolution: e.target.value }))} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group form-full">
                    <label>Notes internes</label>
                    <textarea rows={2} placeholder="Contexte interne, suivi…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setModal(null)}>Annuler</button>
                  <button className="btn-primary" onClick={handleSave} disabled={!form.description || !form.date_remontee}>Enregistrer</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm suppression */}
      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal-box modal-confirm" onClick={e => e.stopPropagation()}>
            <p>Supprimer cette remontée ?</p>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setConfirmDel(null)}>Annuler</button>
              <button className="btn-danger" onClick={() => handleDelete(confirmDel)}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
