import { useState, useEffect, useRef } from 'react'
import { getSessions, seedDemoSessions } from '../data/sessions'
import { seedDemoStagiaires } from '../data/stagiaires'
import { getSessionData, TYPES_DOCUMENT } from '../data/documents'
import Convocation from '../components/documents/Convocation'
import Convention from '../components/documents/Convention'
import Emargement from '../components/documents/Emargement'
import Attestation from '../components/documents/Attestation'
import './Documents.css'

export default function Documents() {
  const [sessions, setSessions] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [typeDoc, setTypeDoc] = useState('convocation')
  const [stagiaireId, setStagiaireId] = useState('tous')
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

  const needsStagiaire = typeDoc === 'convocation' || typeDoc === 'attestation'
  const noStagiaireNeeded = typeDoc === 'emargement' || typeDoc === 'convention'

  const stagiaireSelectionne = needsStagiaire && stagiaireId !== 'tous'
    ? participants.find(p => p.stagiaire.id === stagiaireId)?.stagiaire
    : null

  function handlePrint() {
    window.print()
  }

  function renderDocument() {
    if (!data) return null

    if (typeDoc === 'emargement') {
      return <Emargement data={data} />
    }

    if (typeDoc === 'convention') {
      return <Convention data={data} />
    }

    if (typeDoc === 'convocation') {
      const targets = stagiaireId === 'tous' ? participants : participants.filter(p => p.stagiaire.id === stagiaireId)
      return targets.map(p => (
        <div key={p.stagiaire.id} className="doc-wrapper">
          <Convocation data={data} stagiaire={p.stagiaire} />
          <div className="page-break" />
        </div>
      ))
    }

    if (typeDoc === 'attestation') {
      const targets = stagiaireId === 'tous' ? participants : participants.filter(p => p.stagiaire.id === stagiaireId)
      return targets.map(p => (
        <div key={p.stagiaire.id} className="doc-wrapper">
          <Attestation data={data} stagiaire={p.stagiaire} />
          <div className="page-break" />
        </div>
      ))
    }
  }

  const docCount = () => {
    if (!data) return 0
    if (typeDoc === 'emargement' || typeDoc === 'convention') return 1
    if (stagiaireId === 'tous') return participants.length
    return 1
  }

  return (
    <div className={`documents ${preview ? 'preview-mode' : ''}`}>
      {!preview && (
        <>
          <div className="documents-topbar">
            <div>
              <h1 className="documents-title">Documents Qualiopi</h1>
              <p className="documents-sub">Génération des documents réglementaires pour chaque session</p>
            </div>
          </div>

          <div className="doc-config-panel">
            {/* Étape 1 — Session */}
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
                  <div className="step-meta">
                    {participants.length} participant{participants.length > 1 ? 's' : ''} inscrit{participants.length > 1 ? 's' : ''}
                    {participants.length === 0 && <span className="step-warn"> · Aucun inscrit — ajoutez des apprenants depuis l'onglet Sessions</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Étape 2 — Type de document */}
            <div className="config-step">
              <div className="step-num">2</div>
              <div className="step-body">
                <label className="step-label">Type de document</label>
                <div className="doc-type-grid">
                  {TYPES_DOCUMENT.map(t => (
                    <button
                      key={t.id}
                      className={`doc-type-btn ${typeDoc === t.id ? 'active' : ''}`}
                      onClick={() => setTypeDoc(t.id)}
                    >
                      <span className="doc-type-icon">{t.icon}</span>
                      <span className="doc-type-name">{t.label}</span>
                      <span className="doc-type-desc">{t.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Étape 3 — Destinataire (si convocation ou attestation) */}
            {needsStagiaire && (
              <div className="config-step">
                <div className="step-num">3</div>
                <div className="step-body">
                  <label className="step-label">Destinataire</label>
                  <select value={stagiaireId} onChange={e => setStagiaireId(e.target.value)} className="step-select">
                    <option value="tous">Tous les participants ({participants.length})</option>
                    {participants.map(p => (
                      <option key={p.stagiaire.id} value={p.stagiaire.id}>
                        {p.stagiaire.prenom} {p.stagiaire.nom} — {p.stagiaire.cabinet || p.stagiaire.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="doc-actions">
              <button
                className="btn-preview"
                disabled={!sessionId || (participants.length === 0 && !noStagiaireNeeded)}
                onClick={() => setPreview(true)}
              >
                👁 Aperçu
              </button>
              <button
                className="btn-print"
                disabled={!sessionId || (participants.length === 0 && !noStagiaireNeeded)}
                onClick={() => { setPreview(true); setTimeout(handlePrint, 300) }}
              >
                🖨 Imprimer / PDF ({docCount()} document{docCount() > 1 ? 's' : ''})
              </button>
            </div>

            {(!sessionId || participants.length === 0) && sessionId && !noStagiaireNeeded && (
              <div className="doc-empty-warning">
                ⚠️ Cette session n'a pas de participants inscrits. Ajoutez des apprenants depuis l'onglet <strong>Sessions → ouvrir la session → Ajouter</strong>.
              </div>
            )}
          </div>

          {/* Aide Qualiopi */}
          <div className="qualiopi-help">
            <h3>Guide d'utilisation — Conformité Qualiopi</h3>
            <div className="qualiopi-help-grid">
              <div className="help-item">
                <span className="help-icon">📄</span>
                <div>
                  <strong>Convention de formation</strong>
                  <p>À faire signer <strong>avant le démarrage</strong> de la session. Obligatoire pour toute formation financée ou subrogée (Indicateur 3).</p>
                </div>
              </div>
              <div className="help-item">
                <span className="help-icon">✉️</span>
                <div>
                  <strong>Convocation</strong>
                  <p>À envoyer <strong>au moins 48h avant</strong> la session. Conserver une copie signée ou un accusé de réception email.</p>
                </div>
              </div>
              <div className="help-item">
                <span className="help-icon">✍️</span>
                <div>
                  <strong>Émargement</strong>
                  <p>Faire signer <strong>chaque demi-journée</strong>. Document obligatoire pour prouver la réalisation (Indicateur 6).</p>
                </div>
              </div>
              <div className="help-item">
                <span className="help-icon">🎓</span>
                <div>
                  <strong>Attestation</strong>
                  <p>Remettre à chaque participant <strong>à l'issue de la formation</strong>. Conserver dans le dossier de la session.</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Zone d'impression */}
      {preview && (
        <div className="preview-container">
          <div className="preview-toolbar no-print">
            <button className="btn-back-preview" onClick={() => setPreview(false)}>← Retour à la configuration</button>
            <div className="preview-info">
              {TYPES_DOCUMENT.find(t => t.id === typeDoc)?.icon} {TYPES_DOCUMENT.find(t => t.id === typeDoc)?.label}
              {data && ` — ${data.session.titre}`}
            </div>
            <button className="btn-print-now" onClick={handlePrint}>🖨 Imprimer / Enregistrer en PDF</button>
          </div>
          <div ref={printRef} className="print-area">
            {renderDocument()}
          </div>
        </div>
      )}
    </div>
  )
}
