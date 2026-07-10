import './print.css'

export default function Attestation({ data, stagiaire }) {
  const { session, modules, format, dateFormatee, prix } = data
  const p = stagiaire
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="doc-page attestation">
      <div className="doc-header">
        <div className="doc-logo-area">
          <div className="doc-logo">◎ pennylane</div>
          <div className="doc-logo-sub">Learning Suite — AFS</div>
        </div>
        <div className="doc-header-right">
          <div className="doc-type-label">ATTESTATION DE FORMATION</div>
          <div className="doc-ref">N° {session.id?.slice(-6).toUpperCase()}-{p.id?.slice(-4).toUpperCase()}</div>
        </div>
      </div>

      <div className="doc-qualiopi-banner">
        <span className="qualiopi-badge">Qualiopi</span>
        <span>Certification qualité délivrée à PENNYLANE — Catégorie : ACTIONS DE FORMATION</span>
      </div>

      <div className="attestation-body">
        <p className="attestation-intro">
          L'organisme de formation <strong>PENNYLANE</strong>, certifié Qualiopi pour la catégorie « Actions de formation », atteste que :
        </p>

        <div className="attestation-beneficiaire">
          <div className="beneficiaire-name">{p.prenom} {p.nom}</div>
          {p.fonction && <div className="beneficiaire-detail">{p.fonction}</div>}
          {p.cabinet && <div className="beneficiaire-detail">{p.cabinet}</div>}
        </div>

        <p className="attestation-body-text">
          a suivi et validé la formation suivante :
        </p>

        <div className="attestation-formation-card">
          <div className="formation-card-title">{session.titre}</div>
          <div className="formation-card-details">
            <div className="formation-detail-row">
              <span>Date</span><strong>{dateFormatee}</strong>
            </div>
            <div className="formation-detail-row">
              <span>Durée</span><strong>{format?.duree || '—'}</strong>
            </div>
            <div className="formation-detail-row">
              <span>Modalité</span><strong>{session.modalite === 'visio' ? 'Formation à distance (visioconférence)' : 'Formation en présentiel'}</strong>
            </div>
            <div className="formation-detail-row">
              <span>Formateur</span><strong>{session.formateur || 'Équipe AFS Pennylane'}</strong>
            </div>
            {session.client && (
              <div className="formation-detail-row">
                <span>Organisation</span><strong>{session.client}</strong>
              </div>
            )}
          </div>
        </div>

        {modules.length > 0 && (
          <div className="attestation-section">
            <h3>Compétences développées</h3>
            <ul className="attestation-competences">
              {modules.map(m => (
                <li key={m.id}>
                  <strong>{m.titre}</strong> — {m.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="attestation-section">
          <h3>Objectifs pédagogiques atteints</h3>
          <ul className="attestation-objectifs">
            {modules.map(m => (
              <li key={m.id}>Maîtrise du module <strong>{m.titre}</strong> sur Pennylane</li>
            ))}
            <li>Application des fonctionnalités sur des cas pratiques réels</li>
            <li>Capacité à utiliser Pennylane de façon autonome sur ce périmètre</li>
          </ul>
        </div>

        <div className="attestation-delivery">
          <p>La présente attestation est délivrée pour faire valoir ce que de droit.</p>
          <p>Fait à Paris, le {today}</p>
        </div>

        <div className="attestation-sign-area">
          <div className="sign-block">
            <div className="sign-label">Signature du formateur</div>
            <div className="sign-name">{session.formateur || 'Équipe AFS Pennylane'}</div>
            <div className="sign-box" />
          </div>
          <div className="sign-block">
            <div className="sign-label">Cachet et signature de l'organisme</div>
            <div className="sign-name">Pennylane</div>
            <div className="sign-box" />
          </div>
        </div>
      </div>

      <div className="doc-footer">
        <div className="doc-footer-left">
          <div>Pennylane — 4 Rue Jules Lefebvre, 75009 Paris</div>
          <div>afs-training@pennylane.com · N° déclaration d'activité : à compléter</div>
        </div>
        <div className="doc-footer-right">
          <div className="doc-footer-qualiopi">
            <span className="qualiopi-badge small">Qualiopi</span>
            <span>Actions de formation</span>
          </div>
        </div>
      </div>
    </div>
  )
}
