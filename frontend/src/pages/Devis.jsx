import { useState, useMemo } from 'react'
import {
  getDevis, saveDevis, deleteDevis, calculerDevis,
  STATUTS_DEVIS, EMPTY_DEVIS, nextNumeroDevis, convertirEnFacture,
} from '../data/devis'
import { saveFacture } from '../data/factures'
import { getSessions } from '../data/sessions'
import { getParametres } from '../data/parametres'
import { THEMATIQUES } from '../data/catalogue-afs'
import DevisDoc from '../components/documents/DevisDoc'
import './Devis.css'

const ALL_MODULES_CATALOGUE = THEMATIQUES.flatMap(t =>
  t.modules.map(m => ({ ...m, thematique: t.titre, thematiqueId: t.id }))
)

function Badge({ id, list, small }) {
  const item = list.find(x => x.id === id)
  if (!item) return null
  return (
    <span className={`dv-badge${small ? ' small' : ''}`} style={{ color: item.color, background: item.bg }}>
      {item.label}
    </span>
  )
}

const EMPTY_FORM = { ...EMPTY_DEVIS }

export default function Devis() {
  const [list, setList] = useState(getDevis)
  const sessions = getSessions()
  const of = getParametres()

  const [filterStatut, setFilterStatut] = useState('all')
  const [preview, setPreview] = useState(null)
  const [modal, setModal] = useState(null) // null | { mode: 'edit'|'view', item }
  const [form, setForm] = useState(EMPTY_FORM)
  const [confirmDel, setConfirmDel] = useState(null)
  const [convertMsg, setConvertMsg] = useState(null)

  function reload() { setList(getDevis()) }

  function openNew() {
    setForm({
      ...EMPTY_FORM,
      date_emission: new Date().toISOString().slice(0, 10),
      date_validite: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    })
    setModal({ mode: 'edit', item: null })
  }

  function openEdit(item) {
    setForm({ ...EMPTY_FORM, ...item })
    setModal({ mode: 'edit', item })
  }

  function openView(item) { setModal({ mode: 'view', item }) }

  function handleSave() {
    const d = { ...form, id: modal?.item?.id || null }
    if (!d.numero) d.numero = nextNumeroDevis()
    saveDevis(d)
    reload()
    setModal(null)
  }

  function handleDelete(id) {
    deleteDevis(id)
    reload()
    setConfirmDel(null)
  }

  function handleConvertir(item) {
    const facture = convertirEnFacture(item)
    saveFacture(facture)
    const updated = { ...item, statut: 'converti' }
    saveDevis(updated)
    reload()
    setModal(null)
    setConvertMsg(`Devis ${item.numero} converti en facture (brouillon).`)
    setTimeout(() => setConvertMsg(null), 4000)
  }

  const filtered = useMemo(() => {
    if (filterStatut === 'all') return list
    return list.filter(d => d.statut === filterStatut)
  }, [list, filterStatut])

  const stats = useMemo(() => ({
    total: list.length,
    envoye: list.filter(d => d.statut === 'envoye').length,
    accepte: list.filter(d => d.statut === 'accepte').length,
    caAccepte: list.filter(d => d.statut === 'accepte' || d.statut === 'converti').reduce((s, d) => s + (parseFloat(d.montant_ht) || 0), 0),
  }), [list])

  const f = v => setForm(prev => ({ ...prev, ...v }))

  const sessionLabel = (id) => {
    const s = sessions.find(s => s.id === id)
    return s ? `${s.titre}${s.date ? ' — ' + new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR') : ''}` : ''
  }

  if (preview) {
    return (
      <div className="devis-preview-wrap">
        <div className="preview-toolbar no-print">
          <button className="btn-back-preview" onClick={() => setPreview(null)}>← Retour</button>
          <div className="preview-info">{preview.numero} — {preview.client_nom}</div>
          <button className="btn-print-now" onClick={() => window.print()}>🖨 Imprimer / PDF</button>
        </div>
        <div className="print-area">
          <DevisDoc devis={preview} of={of} />
        </div>
      </div>
    )
  }

  return (
    <div className="devis-page">
      <div className="dv-topbar">
        <div>
          <h1 className="dv-title">Devis</h1>
          <p className="dv-sub">Propositions commerciales formations AFS</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nouveau devis</button>
      </div>

      {convertMsg && <div className="dv-toast">{convertMsg}</div>}

      {/* Stats */}
      <div className="dv-stats">
        <div className="dv-stat"><div className="dv-stat-val">{stats.total}</div><div className="dv-stat-label">Total</div></div>
        <div className="dv-stat"><div className="dv-stat-val" style={{ color: '#2563EB' }}>{stats.envoye}</div><div className="dv-stat-label">Envoyés</div></div>
        <div className="dv-stat"><div className="dv-stat-val" style={{ color: '#059669' }}>{stats.accepte}</div><div className="dv-stat-label">Acceptés</div></div>
        <div className="dv-stat"><div className="dv-stat-val" style={{ color: '#059669' }}>{stats.caAccepte.toLocaleString('fr-FR')} €</div><div className="dv-stat-label">CA accepté HT</div></div>
      </div>

      {/* Filtres */}
      <div className="dv-filters">
        <button className={`filter-chip ${filterStatut === 'all' ? 'active' : ''}`} onClick={() => setFilterStatut('all')}>Tous</button>
        {STATUTS_DEVIS.map(s => (
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

      {/* Tableau */}
      {filtered.length === 0 ? (
        <div className="dv-empty">
          <div className="dv-empty-icon">📝</div>
          <p>{list.length === 0 ? 'Aucun devis créé.' : 'Aucun devis pour ce filtre.'}</p>
        </div>
      ) : (
        <div className="dv-table-wrap">
          <table className="dv-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>Date</th>
                <th>Validité</th>
                <th>Client</th>
                <th>Objet</th>
                <th>Montant HT</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(d => {
                const { ht } = calculerDevis(d)
                const expired = d.statut === 'envoye' && d.date_validite && new Date(d.date_validite) < new Date()
                return (
                  <tr key={d.id} className={`dv-row${expired ? ' dv-expired' : ''}`} onClick={() => openView(d)}>
                    <td className="dv-numero">{d.numero}</td>
                    <td className="dv-date">{d.date_emission ? new Date(d.date_emission + 'T12:00:00').toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="dv-date">{d.date_validite ? new Date(d.date_validite + 'T12:00:00').toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="dv-client"><strong>{d.client_nom || '—'}</strong>{d.contact_nom && <span className="dv-contact">{d.contact_nom}</span>}</td>
                    <td className="dv-objet">{d.objet}</td>
                    <td className="dv-montant">{ht.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</td>
                    <td><Badge id={expired ? 'expire' : d.statut} list={STATUTS_DEVIS} small /></td>
                    <td className="dv-actions" onClick={e => e.stopPropagation()}>
                      <button className="btn-icon" title="Aperçu PDF" onClick={() => setPreview(d)}>👁</button>
                      <button className="btn-icon" title="Modifier" onClick={() => openEdit(d)}>✏️</button>
                      {(d.statut === 'accepte') && (
                        <button className="btn-icon btn-convert" title="Convertir en facture" onClick={() => handleConvertir(d)}>→ Facture</button>
                      )}
                      <button className="btn-icon btn-danger" title="Supprimer" onClick={() => setConfirmDel(d.id)}>🗑</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal formulaire / détail */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-box dv-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modal.mode === 'view'
                  ? `Devis ${modal.item.numero}`
                  : modal.item ? 'Modifier le devis' : 'Nouveau devis'}
              </h2>
              <button className="modal-close" onClick={() => setModal(null)}>×</button>
            </div>

            {modal.mode === 'view' ? (
              <div className="dv-detail">
                <div className="dv-detail-badges">
                  <Badge id={modal.item.statut} list={STATUTS_DEVIS} />
                  <span className="dv-detail-num">{modal.item.numero}</span>
                </div>
                <div className="dv-detail-grid">
                  <div className="dv-detail-field"><span>Émission</span><strong>{modal.item.date_emission ? new Date(modal.item.date_emission + 'T12:00:00').toLocaleDateString('fr-FR') : '—'}</strong></div>
                  <div className="dv-detail-field"><span>Validité</span><strong>{modal.item.date_validite ? new Date(modal.item.date_validite + 'T12:00:00').toLocaleDateString('fr-FR') : '—'}</strong></div>
                  <div className="dv-detail-field"><span>Client</span><strong>{modal.item.client_nom}</strong></div>
                  <div className="dv-detail-field"><span>Contact</span><strong>{modal.item.contact_nom || '—'}{modal.item.contact_email ? ` — ${modal.item.contact_email}` : ''}</strong></div>
                  <div className="dv-detail-field"><span>Objet</span><strong>{modal.item.objet}</strong></div>
                  <div className="dv-detail-field"><span>Montant HT</span><strong>{(parseFloat(modal.item.montant_ht) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</strong></div>
                  <div className="dv-detail-field"><span>Modalité</span><strong>{modal.item.modalite === 'visio' ? 'Visioconférence' : 'Présentiel'}</strong></div>
                  <div className="dv-detail-field"><span>Durée</span><strong>{modal.item.format_duree || '—'}</strong></div>
                </div>
                {modal.item.description && <div className="dv-detail-block"><div className="dv-detail-label">Description</div><div className="dv-detail-text">{modal.item.description}</div></div>}
                {modal.item.notes && <div className="dv-detail-block"><div className="dv-detail-label">Notes</div><div className="dv-detail-text">{modal.item.notes}</div></div>}
                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setModal(null)}>Fermer</button>
                  <button className="btn-secondary" onClick={() => setPreview(modal.item)}>👁 Aperçu PDF</button>
                  <button className="btn-primary" onClick={() => openEdit(modal.item)}>Modifier</button>
                  {modal.item.statut === 'accepte' && (
                    <button className="btn-convert-full" onClick={() => handleConvertir(modal.item)}>→ Convertir en facture</button>
                  )}
                </div>
              </div>
            ) : (
              <div className="dv-form">
                {/* Statut */}
                <div className="form-section-title">Statut</div>
                <div className="dv-statut-strip">
                  {STATUTS_DEVIS.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      className={`dv-statut-btn ${form.statut === s.id ? 'active' : ''}`}
                      style={form.statut === s.id ? { background: s.bg, color: s.color, borderColor: s.color } : {}}
                      onClick={() => f({ statut: s.id })}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Dates */}
                <div className="form-section-title">Dates</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date d'émission *</label>
                    <input type="date" value={form.date_emission} onChange={e => f({ date_emission: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Date de validité *</label>
                    <input type="date" value={form.date_validite} onChange={e => f({ date_validite: e.target.value })} />
                  </div>
                </div>

                {/* Client */}
                <div className="form-section-title">Client</div>
                <div className="form-row">
                  <div className="form-group form-full">
                    <label>Nom du cabinet / entreprise *</label>
                    <input type="text" placeholder="Cabinet Dupont…" value={form.client_nom} onChange={e => f({ client_nom: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>SIRET</label>
                    <input type="text" placeholder="000 000 000 00000" value={form.client_siret} onChange={e => f({ client_siret: e.target.value })} />
                  </div>
                  <div className="form-group form-full">
                    <label>Adresse</label>
                    <input type="text" value={form.client_adresse} onChange={e => f({ client_adresse: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Contact — Nom</label>
                    <input type="text" value={form.contact_nom} onChange={e => f({ contact_nom: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Email contact</label>
                    <input type="email" value={form.contact_email} onChange={e => f({ contact_email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Téléphone</label>
                    <input type="text" value={form.contact_tel} onChange={e => f({ contact_tel: e.target.value })} />
                  </div>
                </div>

                {/* Prestation */}
                <div className="form-section-title">Prestation</div>
                <div className="form-row">
                  <div className="form-group form-full">
                    <label>Formation du catalogue (optionnel)</label>
                    <select
                      value=""
                      onChange={e => {
                        const m = ALL_MODULES_CATALOGUE.find(mod => mod.id === e.target.value)
                        if (!m) return
                        const modaliteLabel = form.modalite === 'visio' ? 'en distanciel' : 'en présentiel'
                        const objetAuto = `Formation Pennylane — ${m.titre} (${modaliteLabel})`
                        const descAuto = `La formation est dispensée par des experts formateurs qui vont traiter les thèmes suivants :\n${m.titre} — ${m.description}\n\nFinancement possible par OPCO/FAF sous réserve d'un dépôt de dossier 15 jours au moins avant la date de la formation.`
                        f({ objet: objetAuto, description: descAuto, formation_id: m.id })
                      }}
                    >
                      <option value="">— Sélectionner une formation pour auto-remplir —</option>
                      {THEMATIQUES.map(t => (
                        <optgroup key={t.id} label={`${t.emoji} ${t.titre}`}>
                          {t.modules.map(m => (
                            <option key={m.id} value={m.id}>{m.titre}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group form-full">
                    <label>Intitulé *</label>
                    <input type="text" placeholder="Formation Pennylane — Production comptable…" value={form.objet} onChange={e => f({ objet: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group form-full">
                    <label>Description</label>
                    <textarea rows={3} placeholder="Objectifs, programme, modalités pédagogiques…" value={form.description} onChange={e => f({ description: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Modalité</label>
                    <select value={form.modalite} onChange={e => f({ modalite: e.target.value })}>
                      <option value="visio">Visioconférence</option>
                      <option value="presentiel">Présentiel</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Durée</label>
                    <input type="text" placeholder="7h (1 jour)" value={form.format_duree} onChange={e => f({ format_duree: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Formateur</label>
                    <input type="text" value={form.formateur} onChange={e => f({ formateur: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Nb participants</label>
                    <input type="number" min="1" value={form.participants} onChange={e => f({ participants: e.target.value })} />
                  </div>
                </div>

                {/* Session liée */}
                <div className="form-row">
                  <div className="form-group form-full">
                    <label>Session liée (optionnel)</label>
                    <select value={form.session_id} onChange={e => f({ session_id: e.target.value })}>
                      <option value="">— Aucune —</option>
                      {sessions.map(s => (
                        <option key={s.id} value={s.id}>{s.titre}{s.date ? ' — ' + new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR') : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Financier */}
                <div className="form-section-title">Financier</div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Montant HT *</label>
                    <input type="number" min="0" step="0.01" placeholder="0.00" value={form.montant_ht} onChange={e => f({ montant_ht: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>TVA (%)</label>
                    <input type="number" min="0" max="100" value={form.tva_taux} onChange={e => f({ tva_taux: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Acompte (%)</label>
                    <input type="number" min="0" max="100" value={form.acompte_pct} onChange={e => f({ acompte_pct: e.target.value })} />
                  </div>
                </div>

                {/* Récap */}
                {form.montant_ht > 0 && (() => {
                  const { ht, tva, ttc, acompte_ttc } = calculerDevis(form)
                  return (
                    <div className="dv-recap">
                      <div className="dv-recap-row"><span>HT</span><strong>{ht.toFixed(2)} €</strong></div>
                      <div className="dv-recap-row"><span>TVA {form.tva_taux}%</span><strong>{tva.toFixed(2)} €</strong></div>
                      <div className="dv-recap-row dv-recap-ttc"><span>TTC</span><strong>{ttc.toFixed(2)} €</strong></div>
                      {form.acompte_pct > 0 && <div className="dv-recap-row"><span>Acompte TTC</span><strong>{acompte_ttc.toFixed(2)} €</strong></div>}
                    </div>
                  )
                })()}

                {/* Financement */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Financeur OPCO</label>
                    <input type="text" placeholder="AGEFOS-PME, FIFPL…" value={form.financeur_nom} onChange={e => f({ financeur_nom: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>N° dossier OPCO</label>
                    <input type="text" value={form.financeur_dossier} onChange={e => f({ financeur_dossier: e.target.value })} />
                  </div>
                </div>

                {/* Notes */}
                <div className="form-row">
                  <div className="form-group form-full">
                    <label>Notes / Conditions particulières</label>
                    <textarea rows={2} value={form.notes} onChange={e => f({ notes: e.target.value })} />
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn-secondary" onClick={() => setModal(null)}>Annuler</button>
                  <button className="btn-secondary" onClick={() => { handleSave(); setTimeout(() => setPreview(getDevis()[0]), 100) }}>Aperçu PDF</button>
                  <button className="btn-primary" onClick={handleSave} disabled={!form.client_nom || !form.objet || !form.date_emission}>Enregistrer</button>
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
            <p>Supprimer ce devis ?</p>
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
