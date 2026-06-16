import { useState, useEffect, useRef } from 'react'
import { getFactures, saveFacture, deleteFacture, STATUTS_FACTURE, TYPES_FACTURE, createFactureFromSession, calculerFacture } from '../data/factures'
import { getSessions, FORMATS } from '../data/sessions'
import { getFinanceurs } from '../data/financeurs'
import { getParametres } from '../data/parametres'
import Facture from '../components/documents/Facture'
import './Facturation.css'

const EMPTY_FORM = {
  sessionId: '', type: 'principale', statut: 'brouillon',
  client_nom: '', client_adresse: '', client_siret: '',
  objet: '', date_emission: new Date().toISOString().split('T')[0],
  date_echeance: '', montant_ht: '', tva_taux: 20,
  acompte_pct: 0, financeur_nom: '', financeur_dossier: '', notes: '',
}

export default function Facturation() {
  const [factures, setFactures] = useState([])
  const [sessions, setSessions] = useState([])
  const [financeurs, setFinanceurs] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatut, setFilterStatut] = useState('')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [previewFacture, setPreviewFacture] = useState(null)
  const printRef = useRef()

  useEffect(() => {
    setFactures(getFactures())
    setSessions(getSessions())
    setFinanceurs(getFinanceurs())
  }, [])

  function refresh() { setFactures(getFactures()) }

  function openNew() {
    setSelected(null)
    setForm(EMPTY_FORM)
    setErrors({})
    setModal('form')
  }

  function openNewFromSession(session) {
    const format = FORMATS.find(f => f.id === session.format)
    const prix = format ? (session.modalite === 'visio' ? format.visio : format.presentiel) : null
    const base = createFactureFromSession(session, format, prix)
    setSelected(null)
    setForm({ ...EMPTY_FORM, ...base })
    setErrors({})
    setModal('form')
  }

  function openEdit(f) {
    setSelected(f)
    setForm({
      sessionId: f.sessionId || '',
      type: f.type || 'principale',
      statut: f.statut || 'brouillon',
      client_nom: f.client_nom || '',
      client_adresse: f.client_adresse || '',
      client_siret: f.client_siret || '',
      objet: f.objet || '',
      date_emission: f.date_emission || '',
      date_echeance: f.date_echeance || '',
      montant_ht: f.montant_ht || '',
      tva_taux: f.tva_taux ?? 20,
      acompte_pct: f.acompte_pct || 0,
      financeur_nom: f.financeur_nom || '',
      financeur_dossier: f.financeur_dossier || '',
      notes: f.notes || '',
    })
    setErrors({})
    setModal('form')
  }

  function handleDelete(id) {
    if (!confirm('Supprimer cette facture ?')) return
    deleteFacture(id)
    refresh()
  }

  function validate() {
    const e = {}
    if (!form.client_nom.trim()) e.client_nom = 'Requis'
    if (!form.objet.trim()) e.objet = 'Requis'
    if (!form.montant_ht) e.montant_ht = 'Requis'
    return e
  }

  function handleSave(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    saveFacture(selected ? { ...selected, ...form } : form)
    refresh()
    setModal(null)
  }

  function handlePrint() { window.print() }

  function handleSessionChange(sessionId) {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) { setForm(f => ({ ...f, sessionId })); return }
    const format = FORMATS.find(f => f.id === session.format)
    const prix = format ? (session.modalite === 'visio' ? format.visio : format.presentiel) : null
    setForm(f => ({
      ...f,
      sessionId,
      client_nom: f.client_nom || session.client || '',
      objet: f.objet || session.titre || '',
      montant_ht: f.montant_ht || prix || '',
    }))
  }

  const filtres = factures.filter(f => {
    const q = search.toLowerCase()
    const matchSearch = !search || [f.numero, f.client_nom, f.objet].some(v => v?.toLowerCase().includes(q))
    const matchStatut = !filterStatut || f.statut === filterStatut
    return matchSearch && matchStatut
  })

  const totalHT = filtres.reduce((s, f) => s + (parseFloat(f.montant_ht) || 0), 0)
  const totalPayees = filtres.filter(f => f.statut === 'payee').reduce((s, f) => s + (parseFloat(f.montant_ht) || 0), 0)

  const of = getParametres()

  return (
    <div className={`facturation ${previewFacture ? 'preview-mode' : ''}`}>
      {!previewFacture && (
        <>
          <div className="fact-topbar">
            <div>
              <h1 className="fact-title">Facturation</h1>
              <p className="fact-sub">{factures.length} facture{factures.length > 1 ? 's' : ''}</p>
            </div>
            <div className="fact-topbar-actions">
              <div className="fact-new-dropdown">
                <button className="btn-primary" onClick={openNew}>+ Nouvelle facture</button>
              </div>
            </div>
          </div>

          {/* Stats */}
          {factures.length > 0 && (
            <div className="fact-stats">
              <div className="fact-stat">
                <div className="fact-stat-val">{factures.filter(f => f.statut === 'emise').length}</div>
                <div className="fact-stat-label">En attente</div>
              </div>
              <div className="fact-stat">
                <div className="fact-stat-val">{factures.filter(f => f.statut === 'payee').length}</div>
                <div className="fact-stat-label">Payées</div>
              </div>
              <div className="fact-stat">
                <div className="fact-stat-val">{totalPayees.toLocaleString('fr-FR')} €</div>
                <div className="fact-stat-label">CA encaissé HT</div>
              </div>
              <div className="fact-stat">
                <div className="fact-stat-val">{totalHT.toLocaleString('fr-FR')} €</div>
                <div className="fact-stat-label">CA total affiché HT</div>
              </div>
            </div>
          )}

          {/* Filtres statut */}
          <div className="fact-statut-strip">
            <button className={`fact-statut-chip ${!filterStatut ? 'active' : ''}`} onClick={() => setFilterStatut('')}>
              Toutes <span>{factures.length}</span>
            </button>
            {STATUTS_FACTURE.map(s => {
              const count = factures.filter(f => f.statut === s.id).length
              if (count === 0) return null
              return (
                <button
                  key={s.id}
                  className={`fact-statut-chip ${filterStatut === s.id ? 'active' : ''}`}
                  onClick={() => setFilterStatut(filterStatut === s.id ? '' : s.id)}
                >
                  {s.label} <span>{count}</span>
                </button>
              )
            })}
          </div>

          <div className="fact-search">
            <input
              type="text"
              placeholder="Rechercher par numéro, client, objet…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button className="search-clear" onClick={() => setSearch('')}>×</button>}
          </div>

          {filtres.length === 0 ? (
            <div className="fact-empty">
              <div className="empty-icon">📄</div>
              <p>Aucune facture{search ? ' pour cette recherche' : ''}</p>
              {!search && <button className="btn-primary" onClick={openNew}>Créer une facture</button>}
              {!search && sessions.length > 0 && (
                <div className="fact-from-sessions">
                  <p className="fact-from-label">Créer depuis une session :</p>
                  {sessions.slice(0, 3).map(s => (
                    <button key={s.id} className="btn-secondary" onClick={() => openNewFromSession(s)}>
                      + {s.titre}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="fact-table-wrap">
              <table className="fact-table">
                <thead>
                  <tr>
                    <th>Numéro</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Objet</th>
                    <th>Montant HT</th>
                    <th>Statut</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtres.map(f => {
                    const statut = STATUTS_FACTURE.find(s => s.id === f.statut)
                    const montage = calculerFacture(f)
                    return (
                      <tr key={f.id} className="fact-row">
                        <td className="fact-numero">{f.numero || '—'}</td>
                        <td className="fact-date">{f.date_emission ? new Date(f.date_emission + 'T12:00:00').toLocaleDateString('fr-FR') : '—'}</td>
                        <td><strong>{f.client_nom}</strong></td>
                        <td className="fact-objet">{f.objet}</td>
                        <td className="fact-montant">{montage.ht ? `${montage.ht.toLocaleString('fr-FR')} €` : '—'}</td>
                        <td>
                          {statut && (
                            <span className="fact-statut-badge" style={{ color: statut.color, background: statut.bg }}>
                              {statut.label}
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="row-actions">
                            <button className="btn-icon" onClick={() => setPreviewFacture(f)} title="Aperçu">👁</button>
                            <button className="btn-icon" onClick={() => openEdit(f)} title="Modifier">✏️</button>
                            <button className="btn-icon btn-danger" onClick={() => handleDelete(f.id)} title="Supprimer">🗑</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Aperçu / impression */}
      {previewFacture && (
        <div className="preview-container">
          <div className="preview-toolbar no-print">
            <button className="btn-back-preview" onClick={() => setPreviewFacture(null)}>← Retour à la liste</button>
            <div className="preview-info">Facture {previewFacture.numero}</div>
            <button className="btn-print-now" onClick={handlePrint}>🖨 Imprimer / PDF</button>
          </div>
          <div ref={printRef} className="print-area">
            <Facture facture={previewFacture} of={of} />
          </div>
        </div>
      )}

      {/* Modal formulaire */}
      {modal === 'form' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal modal-fact-form" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selected ? `Modifier ${selected.numero || 'la facture'}` : 'Nouvelle facture'}</h2>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>
            <form onSubmit={handleSave} className="modal-form">

              {/* Session liée */}
              <div className="form-section-title">Session liée (optionnel)</div>
              <div className="form-group">
                <label>Session</label>
                <select value={form.sessionId} onChange={e => handleSessionChange(e.target.value)}>
                  <option value="">— Aucune —</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.titre}{s.date ? ` — ${new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR')}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type et statut */}
              <div className="form-section-title">Facture</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}>
                    {TYPES_FACTURE.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Statut</label>
                  <select value={form.statut} onChange={e => setForm(f => ({...f, statut: e.target.value}))}>
                    {STATUTS_FACTURE.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date d'émission</label>
                  <input type="date" value={form.date_emission} onChange={e => setForm(f => ({...f, date_emission: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>Date d'échéance</label>
                  <input type="date" value={form.date_echeance} onChange={e => setForm(f => ({...f, date_echeance: e.target.value}))} />
                </div>
              </div>

              {/* Client */}
              <div className="form-section-title">Client</div>
              <div className="form-group">
                <label>Nom / Raison sociale *</label>
                <input value={form.client_nom} onChange={e => setForm(f => ({...f, client_nom: e.target.value}))} className={errors.client_nom ? 'error' : ''} />
                {errors.client_nom && <span className="form-error">{errors.client_nom}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Adresse</label>
                  <input value={form.client_adresse} onChange={e => setForm(f => ({...f, client_adresse: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>SIRET</label>
                  <input value={form.client_siret} onChange={e => setForm(f => ({...f, client_siret: e.target.value}))} />
                </div>
              </div>

              {/* Prestation */}
              <div className="form-section-title">Prestation</div>
              <div className="form-group">
                <label>Objet *</label>
                <input value={form.objet} onChange={e => setForm(f => ({...f, objet: e.target.value}))} className={errors.objet ? 'error' : ''} placeholder="Intitulé de la formation" />
                {errors.objet && <span className="form-error">{errors.objet}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Montant HT (€) *</label>
                  <input type="number" value={form.montant_ht} onChange={e => setForm(f => ({...f, montant_ht: e.target.value}))} className={errors.montant_ht ? 'error' : ''} min="0" step="0.01" />
                  {errors.montant_ht && <span className="form-error">{errors.montant_ht}</span>}
                </div>
                <div className="form-group">
                  <label>TVA (%)</label>
                  <input type="number" value={form.tva_taux} onChange={e => setForm(f => ({...f, tva_taux: e.target.value}))} min="0" max="100" />
                </div>
              </div>

              {/* Acompte */}
              <div className="form-row">
                <div className="form-group">
                  <label>Acompte (%)</label>
                  <input type="number" value={form.acompte_pct} onChange={e => setForm(f => ({...f, acompte_pct: e.target.value}))} min="0" max="100" placeholder="0 = pas d'acompte" />
                </div>
                {form.acompte_pct > 0 && (
                  <div className="form-group">
                    <label>Acompte calculé</label>
                    <div className="form-readonly">
                      {((parseFloat(form.montant_ht) || 0) * form.acompte_pct / 100).toFixed(2)} € HT
                    </div>
                  </div>
                )}
              </div>

              {/* Financement OPCO */}
              <div className="form-section-title">Financement OPCO / Subrogation (optionnel)</div>
              <div className="form-row">
                <div className="form-group">
                  <label>Organisme financeur</label>
                  <select value={form.financeur_nom} onChange={e => setForm(f => ({...f, financeur_nom: e.target.value}))}>
                    <option value="">— Aucun —</option>
                    {financeurs.map(fin => <option key={fin.id} value={fin.nom}>{fin.nom}</option>)}
                    <option value="__autre__">Autre…</option>
                  </select>
                  {form.financeur_nom === '__autre__' && (
                    <input className="mt-4" placeholder="Nom de l'organisme" onChange={e => setForm(f => ({...f, financeur_nom: e.target.value}))} />
                  )}
                </div>
                <div className="form-group">
                  <label>N° dossier OPCO</label>
                  <input value={form.financeur_dossier} onChange={e => setForm(f => ({...f, financeur_dossier: e.target.value}))} placeholder="Référence dossier" />
                </div>
              </div>

              <div className="form-group">
                <label>Notes internes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} placeholder="Remarques internes (non affichées sur la facture)" />
              </div>

              {/* Récapitulatif */}
              {form.montant_ht && (
                <div className="fact-recap">
                  {(() => {
                    const { ht, tva, ttc, acompte_ht, acompte_ttc } = calculerFacture(form)
                    return (
                      <>
                        <div className="recap-row"><span>Montant HT</span><strong>{ht.toFixed(2)} €</strong></div>
                        <div className="recap-row"><span>TVA ({form.tva_taux}%)</span><strong>{tva.toFixed(2)} €</strong></div>
                        <div className="recap-row recap-total"><span>Total TTC</span><strong>{ttc.toFixed(2)} €</strong></div>
                        {form.acompte_pct > 0 && (
                          <>
                            <div className="recap-row recap-acompte"><span>Acompte ({form.acompte_pct}%) HT</span><strong>{acompte_ht.toFixed(2)} €</strong></div>
                            <div className="recap-row recap-acompte"><span>Acompte TTC</span><strong>{acompte_ttc.toFixed(2)} €</strong></div>
                            <div className="recap-row"><span>Solde TTC</span><strong>{(ttc - acompte_ttc).toFixed(2)} €</strong></div>
                          </>
                        )}
                      </>
                    )
                  })()}
                </div>
              )}

              <div className="modal-actions">
                <button type="submit" className="btn-primary">{selected ? 'Enregistrer' : 'Créer'}</button>
                <button type="button" className="btn-secondary" onClick={() => setModal(null)}>Annuler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
