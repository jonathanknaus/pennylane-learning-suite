import { useState, useEffect, useRef } from 'react'
import { getSessions, seedDemoSessions } from '../data/sessions'
import { seedDemoStagiaires } from '../data/stagiaires'
import { getSessionData } from '../data/documents'
import { getDevisActifBySession } from '../data/devis'
import { getParametres } from '../data/parametres'
import PresentationDossierDoc from '../components/documents/PresentationDossier'
import './Documents.css'
import './PresentationDossier.css'

export default function PresentationDossier() {
  const [sessions, setSessions] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [preview, setPreview] = useState(false)
  const printRef = useRef()

  useEffect(() => {
    seedDemoSessions()
    seedDemoStagiaires()
    const list = getSessions()
    setSessions(list)
    if (list.length > 0) setSessionId(list[0].id)
  }, [])

  const data = sessionId ? getSessionData(sessionId) : null
  const participants = data?.participants || []
  const devis = sessionId ? getDevisActifBySession(sessionId) : null
  const of = getParametres()

  function handlePrint() {
    window.print()
  }

  return (
    <div className={`presentation-dossier ${preview ? 'preview-mode' : ''}`}>
      {!preview && (
        <>
          <div className="documents-topbar">
            <div>
              <h1 className="documents-title">Présentation dossier</h1>
              <p className="documents-sub">Récapitulatif visuel d'un dossier de formation — programme, dates, participants, financement</p>
            </div>
          </div>

          <div className="doc-config-panel">
            <div className="config-step">
              <div className="step-num">1</div>
              <div className="step-body">
                <label className="step-label">Session</label>
                <select value={sessionId} onChange={e => setSessionId(e.target.value)} className="step-select">
                  <option value="">— Choisir une session —</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.titre} {s.date ? `— ${new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                    </option>
                  ))}
                </select>
                {data && (
                  <div className="presentation-resume">
                    <span>{participants.length} participant{participants.length > 1 ? 's' : ''} inscrit{participants.length > 1 ? 's' : ''}</span>
                    <span>·</span>
                    <span>{devis ? 'Financement renseigné' : 'Financement à définir'}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="doc-actions">
              <button className="btn-preview" disabled={!sessionId} onClick={() => setPreview(true)}>
                👁 Aperçu
              </button>
              <button className="btn-print" disabled={!sessionId} onClick={() => { setPreview(true); setTimeout(handlePrint, 300) }}>
                🖨 Imprimer / PDF
              </button>
            </div>
          </div>
        </>
      )}

      {preview && (
        <div className="preview-container">
          <div className="preview-toolbar no-print">
            <button className="btn-back-preview" onClick={() => setPreview(false)}>← Retour à la configuration</button>
            <div className="preview-info">🖼️ Présentation dossier{data && ` — ${data.session.titre}`}</div>
            <button className="btn-print-now" onClick={handlePrint}>🖨 Imprimer / Enregistrer en PDF</button>
          </div>
          <div ref={printRef} className="print-area">
            {data && (
              <div className="doc-wrapper">
                <PresentationDossierDoc data={data} devis={devis} of={of} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
