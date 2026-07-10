import { useState, useRef } from 'react'
import { getSessions } from '../data/sessions'
import { getStagiaires, getInscriptionsBySession } from '../data/stagiaires'
import { getFactures } from '../data/factures'
import { getAllReponsesChaudBySession, getAllReponsesFroidBySession } from '../data/satisfaction'
import { getResultatsSession } from '../data/questionnaires'
import { getReclamations, TYPES_REMONTEE } from '../data/reclamations'
import { getBilanSession, saveBilanSession } from '../data/bilan-session'
import { getParametres } from '../data/parametres'
import './BilanAnnuel.css'

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i)

function computeBilan(year) {
  const sessions = getSessions().filter(s => {
    if (!s.date) return false
    return new Date(s.date).getFullYear() === year
  })

  const stagiaires = getStagiaires()

  let nbStagiaires = 0
  let nbHeures = 0
  let nbPresents = 0
  let nbInscriptions = 0
  const cabinetsSet = new Set()
  const formatCounts = {}
  const moduleCounts = {}

  sessions.forEach(s => {
    const inscriptions = getInscriptionsBySession(s.id).filter(i => i.statut !== 'annule')
    nbInscriptions += inscriptions.length
    inscriptions.forEach(i => {
      const stag = stagiaires.find(st => st.id === i.stagiaireId)
      if (stag) {
        cabinetsSet.add(stag.cabinet || stag.email)
        if (stag.id) nbStagiaires++
      }
      if (i.presence === true) nbPresents++
    })

    if (s.format) {
      formatCounts[s.format] = (formatCounts[s.format] || 0) + 1
    }
    ;(s.modules || []).forEach(m => {
      moduleCounts[m] = (moduleCounts[m] || 0) + 1
    })
  })

  const sessionsByModalite = {
    visio: sessions.filter(s => s.modalite === 'visio').length,
    presentiel: sessions.filter(s => s.modalite === 'presentiel').length,
  }

  const sessionsByStatut = {
    termine: sessions.filter(s => s.statut === 'termine').length,
    confirme: sessions.filter(s => s.statut === 'confirme').length,
    annule: sessions.filter(s => s.statut === 'annule').length,
  }

  // CA depuis factures
  const factures = getFactures().filter(f => {
    const fa = getSessions().find(s => s.id === f.sessionId)
    if (!fa) {
      const d = f.date_emission
      return d && new Date(d).getFullYear() === year
    }
    return fa.date && new Date(fa.date).getFullYear() === year
  })
  const caTotal = factures.filter(f => f.statut !== 'annulee' && f.statut !== 'avoir').reduce((s, f) => s + (parseFloat(f.montant_ht) || 0), 0)
  const caEncaisse = factures.filter(f => f.statut === 'payee').reduce((s, f) => s + (parseFloat(f.montant_ht) || 0), 0)

  // Satisfaction
  let totalSat = 0
  let nbSatReponses = 0
  sessions.forEach(s => {
    const rep = getAllReponsesChaudBySession(s.id)
    rep.forEach(r => {
      if (r.moyenne !== null) { totalSat += r.moyenne; nbSatReponses++ }
    })
  })
  const moyenneSatisfaction = nbSatReponses > 0 ? Math.round((totalSat / nbSatReponses) * 10) / 10 : null
  const tauxSatisfaction = nbSatReponses > 0 ? Math.round((nbSatReponses / Math.max(nbInscriptions, 1)) * 100) : 0

  const tauxPresence = nbInscriptions > 0 ? Math.round((nbPresents / nbInscriptions) * 100) : null

  return {
    sessions, nbSessions: sessions.length,
    nbInscriptions, nbStagiaires, nbCabinets: cabinetsSet.size,
    sessionsByModalite, sessionsByStatut,
    caTotal, caEncaisse,
    moyenneSatisfaction, tauxSatisfaction, nbSatReponses,
    tauxPresence, nbPresents,
    formatCounts, moduleCounts,
  }
}

// Bilan qualité d'une session unique — satisfaction, incidents, résultats d'évaluation
// et actions d'amélioration, tel que défini pour le suivi Qualiopi par session.
function computeBilanSession(sessionId) {
  const session = getSessions().find(s => s.id === sessionId)
  if (!session) return null

  const inscriptions = getInscriptionsBySession(sessionId).filter(i => i.statut !== 'annule')
  const stagiaires = getStagiaires()

  const nbPresents = inscriptions.filter(i => i.presence === true).length
  const tauxPresence = inscriptions.length > 0 ? Math.round((nbPresents / inscriptions.length) * 100) : null
  const nbAbsents = inscriptions.length - nbPresents

  const reponsesChaud = getAllReponsesChaudBySession(sessionId)
  const moyennesChaud = reponsesChaud.map(r => r.moyenne).filter(m => m !== null)
  const satisfactionMoyenne = moyennesChaud.length
    ? Math.round((moyennesChaud.reduce((s, m) => s + m, 0) / moyennesChaud.length) * 10) / 10
    : null
  const tauxSatisfaction = inscriptions.length > 0 ? Math.round((reponsesChaud.length / inscriptions.length) * 100) : 0

  const reponsesFroid = getAllReponsesFroidBySession(sessionId)
  const recommandation = reponsesFroid
    .map(r => r.reponses?.f4)
    .filter(v => v !== null && v !== undefined)
  const tauxRecommandation = recommandation.length
    ? Math.round((recommandation.filter(v => v >= 7).length / recommandation.length) * 100)
    : null

  const incidents = getReclamations().filter(r => r.session_id === sessionId)

  const resultats = getResultatsSession(sessionId).filter(r => r.type === 'post')
  const scores = resultats.map(r => r.score).filter(s => s !== undefined && s !== null)
  const tauxAtteinteObjectifs = scores.length
    ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
    : null
  const nbAtteignentObjectifs = scores.filter(s => s >= 70).length

  return {
    session,
    nbInscrits: inscriptions.length,
    nbPresents, nbAbsents, tauxPresence,
    satisfactionMoyenne, tauxSatisfaction, nbReponsesChaud: reponsesChaud.length,
    tauxRecommandation, nbReponsesFroid: reponsesFroid.length,
    incidents,
    tauxAtteinteObjectifs, nbResultats: resultats.length, nbAtteignentObjectifs,
    stagiaires,
  }
}

export default function BilanAnnuel() {
  const [mode, setMode] = useState('annuel') // 'annuel' | 'session'
  const [year, setYear] = useState(CURRENT_YEAR)
  const [printMode, setPrintMode] = useState(false)
  const bilan = computeBilan(year)
  const of = getParametres()
  const printRef = useRef()

  function handlePrint() { window.print() }

  const KPIs = [
    { label: 'Sessions réalisées', value: bilan.sessionsByStatut.termine, total: bilan.nbSessions, icon: '🎓' },
    { label: 'Inscriptions', value: bilan.nbInscriptions, icon: '👥' },
    { label: 'Cabinets clients', value: bilan.nbCabinets, icon: '🏢' },
    { label: 'CA total HT', value: `${bilan.caTotal.toLocaleString('fr-FR')} €`, icon: '💶' },
    { label: 'CA encaissé HT', value: `${bilan.caEncaisse.toLocaleString('fr-FR')} €`, icon: '✅' },
    { label: 'Satisfaction moyenne', value: bilan.moyenneSatisfaction !== null ? `${bilan.moyenneSatisfaction}/10` : '—', icon: '⭐' },
    { label: 'Taux de présence', value: bilan.tauxPresence !== null ? `${bilan.tauxPresence}%` : '—', icon: '📋' },
    { label: 'Sessions visio', value: bilan.sessionsByModalite.visio, icon: '💻' },
    { label: 'Sessions présentiel', value: bilan.sessionsByModalite.presentiel, icon: '🏫' },
  ]

  const ModeSwitch = () => (
    <div className="bilan-mode-switch">
      <button className={`bilan-mode-btn ${mode === 'annuel' ? 'active' : ''}`} onClick={() => setMode('annuel')}>
        📊 Bilan annuel
      </button>
      <button className={`bilan-mode-btn ${mode === 'session' ? 'active' : ''}`} onClick={() => setMode('session')}>
        🎓 Bilan qualité par session
      </button>
    </div>
  )

  if (mode === 'session') {
    return (
      <div className="bilan-annuel">
        <div className="bilan-topbar">
          <div>
            <h1 className="bilan-title">Bilan qualité par session</h1>
            <p className="bilan-sub">Satisfaction, incidents, résultats d'évaluation et actions d'amélioration</p>
          </div>
        </div>
        <ModeSwitch />
        <BilanSessionView />
      </div>
    )
  }

  if (printMode) {
    return (
      <div className={`bilan-annuel ${printMode ? 'preview-mode' : ''}`}>
        <div className="preview-toolbar no-print">
          <button className="btn-back-preview" onClick={() => setPrintMode(false)}>← Retour au bilan</button>
          <div className="preview-info">Bilan pédagogique et financier — {year}</div>
          <button className="btn-print-now" onClick={handlePrint}>🖨 Imprimer / PDF</button>
        </div>
        <div ref={printRef} className="print-area">
          <BilanPrint bilan={bilan} of={of} year={year} KPIs={KPIs} />
        </div>
      </div>
    )
  }

  return (
    <div className="bilan-annuel">
      <div className="bilan-topbar">
        <div>
          <h1 className="bilan-title">Bilan pédagogique et financier</h1>
          <p className="bilan-sub">Synthèse annuelle — Indicateur Qualiopi 18 · Bilan pédagogique et financier</p>
        </div>
        <div className="bilan-topbar-right">
          <select className="bilan-year-select" value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn-primary" onClick={() => setPrintMode(true)}>🖨 Exporter PDF</button>
        </div>
      </div>
      <ModeSwitch />

      {/* KPIs */}
      <div className="bilan-kpis">
        {KPIs.map(k => (
          <div key={k.label} className="bilan-kpi">
            <div className="bilan-kpi-icon">{k.icon}</div>
            <div className="bilan-kpi-val">{k.value !== undefined ? k.value : '—'}</div>
            {k.total !== undefined && <div className="bilan-kpi-total">/ {k.total} programmées</div>}
            <div className="bilan-kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Sessions par statut */}
      <div className="bilan-grid">
        <div className="bilan-card">
          <h3>Sessions par statut</h3>
          <div className="bilan-bars">
            {[
              { label: 'Terminées', val: bilan.sessionsByStatut.termine, color: '#10B981' },
              { label: 'Confirmées', val: bilan.sessionsByStatut.confirme, color: '#2563EB' },
              { label: 'Annulées', val: bilan.sessionsByStatut.annule, color: '#EF4444' },
            ].map(item => (
              <div key={item.label} className="bilan-bar-row">
                <span className="bilan-bar-label">{item.label}</span>
                <div className="bilan-bar-track">
                  <div
                    className="bilan-bar-fill"
                    style={{
                      width: `${bilan.nbSessions > 0 ? (item.val / bilan.nbSessions) * 100 : 0}%`,
                      background: item.color,
                    }}
                  />
                </div>
                <span className="bilan-bar-val">{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bilan-card">
          <h3>Modalités</h3>
          <div className="bilan-bars">
            {[
              { label: 'Visioconférence', val: bilan.sessionsByModalite.visio, color: '#6366F1' },
              { label: 'Présentiel', val: bilan.sessionsByModalite.presentiel, color: '#F97316' },
            ].map(item => (
              <div key={item.label} className="bilan-bar-row">
                <span className="bilan-bar-label">{item.label}</span>
                <div className="bilan-bar-track">
                  <div
                    className="bilan-bar-fill"
                    style={{
                      width: `${bilan.nbSessions > 0 ? (item.val / bilan.nbSessions) * 100 : 0}%`,
                      background: item.color,
                    }}
                  />
                </div>
                <span className="bilan-bar-val">{item.val}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bilan-card">
          <h3>Satisfaction apprenants</h3>
          {bilan.moyenneSatisfaction !== null ? (
            <>
              <div className="bilan-score-big">
                <span style={{ color: bilan.moyenneSatisfaction >= 8 ? '#10B981' : bilan.moyenneSatisfaction >= 6 ? '#F59E0B' : '#EF4444' }}>
                  {bilan.moyenneSatisfaction}
                </span>
                <span className="bilan-score-max">/10</span>
              </div>
              <p className="bilan-score-detail">
                {bilan.nbSatReponses} enquête{bilan.nbSatReponses > 1 ? 's' : ''} complétée{bilan.nbSatReponses > 1 ? 's' : ''}
                {' · '}{bilan.tauxSatisfaction}% de taux de réponse
              </p>
            </>
          ) : (
            <p className="bilan-empty-msg">Aucune enquête de satisfaction complétée pour {year}</p>
          )}
        </div>

        <div className="bilan-card">
          <h3>Financier</h3>
          <div className="bilan-fin-rows">
            <div className="bilan-fin-row">
              <span>CA total HT facturé</span>
              <strong>{bilan.caTotal.toLocaleString('fr-FR')} €</strong>
            </div>
            <div className="bilan-fin-row">
              <span>CA encaissé HT</span>
              <strong style={{ color: '#10B981' }}>{bilan.caEncaisse.toLocaleString('fr-FR')} €</strong>
            </div>
            <div className="bilan-fin-row">
              <span>CA en attente HT</span>
              <strong style={{ color: '#F59E0B' }}>{(bilan.caTotal - bilan.caEncaisse).toLocaleString('fr-FR')} €</strong>
            </div>
            {bilan.nbSessions > 0 && bilan.caTotal > 0 && (
              <div className="bilan-fin-row">
                <span>Panier moyen / session</span>
                <strong>{Math.round(bilan.caTotal / bilan.nbSessions).toLocaleString('fr-FR')} €</strong>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sessions du bilan */}
      {bilan.sessions.length > 0 && (
        <div className="bilan-sessions-section">
          <h3>Détail des sessions {year}</h3>
          <table className="bilan-sessions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Intitulé</th>
                <th>Modalité</th>
                <th>Formateur</th>
                <th>Client</th>
                <th>Inscrits</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {bilan.sessions.map(s => {
                const inscrits = getInscriptionsBySession(s.id).filter(i => i.statut !== 'annule').length
                return (
                  <tr key={s.id}>
                    <td>{s.date ? new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR') : '—'}</td>
                    <td><strong>{s.titre}</strong></td>
                    <td>{s.modalite === 'visio' ? 'Visio' : 'Présentiel'}</td>
                    <td>{s.formateur || '—'}</td>
                    <td>{s.client || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{inscrits}</td>
                    <td>
                      <span className="bilan-statut-pill" style={{
                        color: s.statut === 'termine' ? '#059669' : s.statut === 'annule' ? '#DC2626' : '#2563EB',
                        background: s.statut === 'termine' ? '#D1FAE5' : s.statut === 'annule' ? '#FEE2E2' : '#EFF6FF',
                      }}>
                        {s.statut === 'termine' ? 'Terminée' : s.statut === 'annule' ? 'Annulée' : s.statut === 'confirme' ? 'Confirmée' : s.statut}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function BilanSessionView() {
  const [sessionId, setSessionId] = useState('')
  const [printMode, setPrintMode] = useState(false)
  const [champs, setChamps] = useState(() => sessionId ? getBilanSession(sessionId) : null)
  const of = getParametres()
  const sessions = getSessions()
    .filter(s => s.statut === 'termine')
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const bilan = sessionId ? computeBilanSession(sessionId) : null

  function selectSession(id) {
    setSessionId(id)
    setChamps(getBilanSession(id))
  }

  function updateChamp(key, value) {
    const next = { ...champs, [key]: value }
    setChamps(next)
    saveBilanSession(sessionId, next)
  }

  if (!sessionId) {
    return (
      <div className="bilan-session-select">
        <label>Choisir une session terminée</label>
        <select className="bilan-year-select" value={sessionId} onChange={e => selectSession(e.target.value)}>
          <option value="">— Sélectionner —</option>
          {sessions.map(s => (
            <option key={s.id} value={s.id}>{s.titre} — {s.client} {s.date ? `(${new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR')})` : ''}</option>
          ))}
        </select>
        {sessions.length === 0 && <p className="bilan-empty-msg">Aucune session terminée pour le moment.</p>}
      </div>
    )
  }

  if (!bilan) return null

  if (printMode) {
    return (
      <div className="bilan-annuel preview-mode">
        <div className="preview-toolbar no-print">
          <button className="btn-back-preview" onClick={() => setPrintMode(false)}>← Retour au bilan</button>
          <div className="preview-info">Bilan qualité — {bilan.session.titre}</div>
          <button className="btn-print-now" onClick={() => window.print()}>🖨 Imprimer / PDF</button>
        </div>
        <div className="print-area">
          <BilanSessionPrint bilan={bilan} champs={champs} of={of} />
        </div>
      </div>
    )
  }

  return (
    <div className="bilan-session-detail">
      <div className="bilan-session-header">
        <div>
          <select className="bilan-year-select" value={sessionId} onChange={e => selectSession(e.target.value)}>
            {sessions.map(s => (
              <option key={s.id} value={s.id}>{s.titre} — {s.client} {s.date ? `(${new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR')})` : ''}</option>
            ))}
          </select>
        </div>
        <button className="btn-primary" onClick={() => setPrintMode(true)}>🖨 Exporter PDF</button>
      </div>

      <div className="bilan-grid">
        <div className="bilan-card">
          <div className="bilan-qualiopi-badge-row">
            <span className="bilan-qualiopi-ref">Indicateur 5</span>
            <span className="bilan-qualiopi-ref">Indicateur 30</span>
          </div>
          <h3>Satisfaction et présence</h3>
          <div className="bilan-session-metrics">
            <div className="bilan-metric">
              <div className="bilan-metric-val" style={{ color: bilan.tauxPresence >= 80 ? '#10B981' : bilan.tauxPresence >= 60 ? '#F59E0B' : '#EF4444' }}>
                {bilan.tauxPresence !== null ? `${bilan.tauxPresence}%` : '—'}
              </div>
              <div className="bilan-metric-label">Taux de présence</div>
              {bilan.tauxPresence !== null && (
                <div className="bilan-metric-detail">{bilan.nbPresents} présent{bilan.nbPresents > 1 ? 's' : ''} / {bilan.nbInscrits} inscrit{bilan.nbInscrits > 1 ? 's' : ''}</div>
              )}
            </div>
            <div className="bilan-metric">
              <div className="bilan-metric-val" style={{ color: bilan.satisfactionMoyenne >= 8 ? '#10B981' : bilan.satisfactionMoyenne >= 6 ? '#F59E0B' : '#EF4444' }}>
                {bilan.satisfactionMoyenne !== null ? `${bilan.satisfactionMoyenne}/10` : '—'}
              </div>
              <div className="bilan-metric-label">Satisfaction à chaud</div>
              {bilan.satisfactionMoyenne !== null && (
                <div className="bilan-metric-detail">{bilan.nbReponsesChaud}/{bilan.nbInscrits} réponse{bilan.nbReponsesChaud > 1 ? 's' : ''} · {bilan.tauxSatisfaction}% de taux de réponse</div>
              )}
            </div>
          </div>
          {bilan.tauxRecommandation !== null && (
            <p className="bilan-score-detail" style={{ marginTop: 8 }}>Recommandation (à froid) : <strong>{bilan.tauxRecommandation}%</strong> ({bilan.nbReponsesFroid} réponse{bilan.nbReponsesFroid > 1 ? 's' : ''})</p>
          )}
          {bilan.satisfactionMoyenne === null && <p className="bilan-empty-msg">Aucune enquête à chaud complétée</p>}
        </div>

        <div className="bilan-card">
          <div className="bilan-qualiopi-badge-row">
            <span className="bilan-qualiopi-ref">Indicateur 5</span>
          </div>
          <h3>Résultats d'évaluation</h3>
          {bilan.tauxAtteinteObjectifs !== null ? (
            <>
              <div className="bilan-score-big">
                <span style={{ color: bilan.tauxAtteinteObjectifs >= 80 ? '#10B981' : bilan.tauxAtteinteObjectifs >= 60 ? '#F59E0B' : '#EF4444' }}>
                  {bilan.tauxAtteinteObjectifs}
                </span>
                <span className="bilan-score-max">%</span>
              </div>
              <p className="bilan-score-detail">Taux d'atteinte des objectifs · {bilan.nbAtteignentObjectifs}/{bilan.nbResultats} apprenant{bilan.nbResultats > 1 ? 's' : ''} ≥ 70%</p>
              <p className="bilan-score-detail">{bilan.nbResultats} évaluation{bilan.nbResultats > 1 ? 's' : ''} post-formation complétée{bilan.nbResultats > 1 ? 's' : ''}</p>
            </>
          ) : (
            <p className="bilan-empty-msg">Aucune évaluation post-formation complétée</p>
          )}
        </div>

        <div className="bilan-card bilan-card-full">
          <div className="bilan-qualiopi-badge-row">
            <span className="bilan-qualiopi-ref">Indicateur 31</span>
          </div>
          <h3>Incidents ou signalements ({bilan.incidents.length})</h3>
          {bilan.incidents.length === 0 ? (
            <p className="bilan-empty-msg">Aucun incident ou signalement enregistré pour cette session.</p>
          ) : (
            <div className="bilan-incidents-list">
              {bilan.incidents.map(inc => {
                const type = TYPES_REMONTEE.find(t => t.id === inc.type)
                return (
                  <div key={inc.id} className="bilan-incident-row">
                    {type && <span className="badge-pill small" style={{ color: type.color, background: type.bg }}>{type.label}</span>}
                    <span>{inc.description || '—'}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="bilan-session-form">
        <div className="bilan-qualiopi-badge-row" style={{ marginBottom: 8 }}>
          <span className="bilan-qualiopi-ref">Indicateur 32</span>
        </div>
        <h3>Synthèse qualitative</h3>
        <div className="form-group">
          <label>Points positifs essentiels signalés</label>
          <textarea rows={2} value={champs.points_positifs} onChange={e => updateChamp('points_positifs', e.target.value)} placeholder="Éléments décrits par les apprenants dans le questionnaire de satisfaction…" />
        </div>
        <div className="form-group">
          <label>Points à améliorer</label>
          <textarea rows={2} value={champs.points_ameliorer} onChange={e => updateChamp('points_ameliorer', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Besoins complémentaires</label>
          <textarea rows={2} value={champs.besoins_complementaires} onChange={e => updateChamp('besoins_complementaires', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Précisions sur la satisfaction / recommandation (si nécessaire)</label>
          <textarea rows={2} value={champs.precisions_satisfaction} onChange={e => updateChamp('precisions_satisfaction', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Précisions sur le taux d'atteinte des objectifs (si nécessaire)</label>
          <textarea rows={2} value={champs.precisions_evaluation} onChange={e => updateChamp('precisions_evaluation', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Actions d'amélioration envisagées</label>
            <textarea rows={2} value={champs.actions_amelioration} onChange={e => updateChamp('actions_amelioration', e.target.value)} placeholder="Ex : vérification du matériel en amont, modification des supports…" />
          </div>
          <div className="form-group">
            <label>Délai de mise en œuvre</label>
            <input type="text" value={champs.delai_action} onChange={e => updateChamp('delai_action', e.target.value)} placeholder="Ex : avant la prochaine session" />
          </div>
        </div>
      </div>
    </div>
  )
}

function BilanSessionPrint({ bilan, champs, of }) {
  const s = bilan.session
  return (
    <div className="bilan-print-page">
      <div className="bilan-print-header">
        <div>
          <div className="bilan-print-of">{of.of_nom}</div>
          <div className="bilan-print-of-detail">SIRET {of.of_siret} · N° DA {of.of_da}</div>
          <div className="bilan-print-of-detail">{of.of_adresse}</div>
        </div>
        <div className="bilan-print-title-block">
          <div className="bilan-print-title">Bilan qualité — session</div>
          <div className="bilan-print-year">{s.titre}</div>
          <div className="bilan-print-qualiopi">
            <span className="qualiopi-badge small">Qualiopi</span>
            <span>{s.client} · {s.date ? new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR') : '—'}</span>
          </div>
        </div>
      </div>

      <div className="bilan-print-section-title">Indicateur 5 — Atteinte des objectifs et présence</div>
      <table className="bilan-print-fin-table">
        <tbody>
          <tr><td>Nombre d'inscrits</td><td>{bilan.nbInscrits}</td></tr>
          <tr><td>Nombre de présents</td><td>{bilan.nbPresents}</td></tr>
          <tr><td>Taux de présence</td><td><strong>{bilan.tauxPresence !== null ? `${bilan.tauxPresence}%` : '—'}</strong></td></tr>
          <tr><td>Taux d'atteinte des objectifs (post-test)</td><td><strong>{bilan.tauxAtteinteObjectifs !== null ? `${bilan.tauxAtteinteObjectifs}%` : '—'}</strong></td></tr>
          <tr><td>Apprenants ≥ 70%</td><td>{bilan.tauxAtteinteObjectifs !== null ? `${bilan.nbAtteignentObjectifs} / ${bilan.nbResultats}` : '—'}</td></tr>
          <tr><td>Précisions sur l'évaluation</td><td>{champs.precisions_evaluation || '—'}</td></tr>
        </tbody>
      </table>

      <div className="bilan-print-section-title">Indicateurs 5 & 30 — Satisfaction stagiaires</div>
      <table className="bilan-print-fin-table">
        <tbody>
          <tr><td>Taux de satisfaction global (à chaud)</td><td><strong>{bilan.satisfactionMoyenne !== null ? `${bilan.satisfactionMoyenne}/10` : '—'}</strong></td></tr>
          <tr><td>Taux de recommandation (à froid)</td><td>{bilan.tauxRecommandation !== null ? `${bilan.tauxRecommandation}%` : '—'}</td></tr>
          <tr><td>Points positifs essentiels signalés</td><td>{champs.points_positifs || '—'}</td></tr>
          <tr><td>Points à améliorer</td><td>{champs.points_ameliorer || '—'}</td></tr>
          <tr><td>Besoins complémentaires</td><td>{champs.besoins_complementaires || '—'}</td></tr>
          <tr><td>Précisions sur la satisfaction</td><td>{champs.precisions_satisfaction || '—'}</td></tr>
        </tbody>
      </table>

      <div className="bilan-print-section-title">Indicateur 31 — Incidents ou signalements</div>
      {bilan.incidents.length === 0 ? (
        <p className="bilan-print-empty">Aucun incident ou signalement.</p>
      ) : (
        <table className="bilan-print-fin-table">
          <tbody>
            {bilan.incidents.map(inc => {
              const type = TYPES_REMONTEE.find(t => t.id === inc.type)
              return <tr key={inc.id}><td>{type?.label || inc.type}</td><td>{inc.description || '—'}</td></tr>
            })}
          </tbody>
        </table>
      )}

      <div className="bilan-print-section-title">Indicateur 32 — Bilan pédagogique et actions d'amélioration</div>
      <table className="bilan-print-fin-table">
        <tbody>
          <tr><td>Action</td><td>{champs.actions_amelioration || '—'}</td></tr>
          <tr><td>Délai</td><td>{champs.delai_action || '—'}</td></tr>
        </tbody>
      </table>

      <div className="bilan-print-signatures">
        <div className="bilan-print-sig-block">
          <div className="bilan-print-sig-label">Établi par</div>
          <div className="bilan-print-sig-name">{of.of_signataire}</div>
          <div className="bilan-print-sig-title">{of.of_titre}</div>
          <div className="bilan-print-sig-box" />
        </div>
        <div className="bilan-print-sig-block">
          <div className="bilan-print-sig-label">Date d'établissement</div>
          <div className="bilan-print-sig-name">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>
    </div>
  )
}

function BilanPrint({ bilan, of, year, KPIs }) {
  return (
    <div className="bilan-print-page">
      {/* Header */}
      <div className="bilan-print-header">
        <div>
          <div className="bilan-print-of">{of.of_nom}</div>
          <div className="bilan-print-of-detail">SIRET {of.of_siret} · N° DA {of.of_da}</div>
          <div className="bilan-print-of-detail">{of.of_adresse}</div>
        </div>
        <div className="bilan-print-title-block">
          <div className="bilan-print-title">Bilan pédagogique et financier</div>
          <div className="bilan-print-year">Année {year}</div>
          <div className="bilan-print-qualiopi">
            <span className="qualiopi-badge small">Qualiopi</span>
            <span>Indicateur n°18</span>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="bilan-print-kpis">
        {KPIs.slice(0, 6).map(k => (
          <div key={k.label} className="bilan-print-kpi">
            <div className="bilan-print-kpi-val">{k.value}</div>
            <div className="bilan-print-kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Sessions */}
      <div className="bilan-print-section-title">Récapitulatif des sessions</div>
      {bilan.sessions.length === 0 ? (
        <p className="bilan-print-empty">Aucune session enregistrée pour {year}.</p>
      ) : (
        <table className="bilan-print-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Intitulé</th>
              <th>Modalité</th>
              <th>Formateur</th>
              <th>Client</th>
              <th>Inscrits</th>
              <th>Satisfaction</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {bilan.sessions.map(s => {
              const inscrits = getInscriptionsBySession(s.id).filter(i => i.statut !== 'annule').length
              const reps = getAllReponsesChaudBySession(s.id)
              const moyS = reps.length ? Math.round((reps.reduce((acc, r) => acc + (r.moyenne || 0), 0) / reps.length) * 10) / 10 : null
              return (
                <tr key={s.id}>
                  <td>{s.date ? new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR') : '—'}</td>
                  <td>{s.titre}</td>
                  <td>{s.modalite === 'visio' ? 'Visio' : 'Présentiel'}</td>
                  <td>{s.formateur || '—'}</td>
                  <td>{s.client || '—'}</td>
                  <td style={{ textAlign: 'center' }}>{inscrits}</td>
                  <td style={{ textAlign: 'center' }}>{moyS !== null ? `${moyS}/10` : '—'}</td>
                  <td>{s.statut === 'termine' ? 'Terminée' : s.statut === 'annule' ? 'Annulée' : 'Confirmée'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Récap financier */}
      <div className="bilan-print-section-title">Récapitulatif financier</div>
      <table className="bilan-print-fin-table">
        <tbody>
          <tr><td>Nombre de sessions</td><td>{bilan.nbSessions}</td></tr>
          <tr><td>Nombre d'inscriptions</td><td>{bilan.nbInscriptions}</td></tr>
          <tr><td>Cabinets/clients distincts</td><td>{bilan.nbCabinets}</td></tr>
          <tr><td>CA total HT facturé</td><td><strong>{bilan.caTotal.toLocaleString('fr-FR')} €</strong></td></tr>
          <tr><td>CA encaissé HT</td><td><strong>{bilan.caEncaisse.toLocaleString('fr-FR')} €</strong></td></tr>
          <tr><td>Taux de présence</td><td>{bilan.tauxPresence !== null ? `${bilan.tauxPresence}%` : '—'}</td></tr>
          <tr><td>Satisfaction moyenne (enquête à chaud)</td><td>{bilan.moyenneSatisfaction !== null ? `${bilan.moyenneSatisfaction}/10` : '—'}</td></tr>
        </tbody>
      </table>

      {/* Signature */}
      <div className="bilan-print-signatures">
        <div className="bilan-print-sig-block">
          <div className="bilan-print-sig-label">Établi par</div>
          <div className="bilan-print-sig-name">{of.of_signataire}</div>
          <div className="bilan-print-sig-title">{of.of_titre}</div>
          <div className="bilan-print-sig-box" />
        </div>
        <div className="bilan-print-sig-block">
          <div className="bilan-print-sig-label">Date d'établissement</div>
          <div className="bilan-print-sig-name">{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>
    </div>
  )
}
