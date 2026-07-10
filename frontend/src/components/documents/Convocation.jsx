import './print.css'

export default function Convocation({ data, stagiaire }) {
  const { session, modules, format, dateFormatee, prix } = data
  const p = stagiaire

  return (
    <div className="doc-page convocation">
      <div className="doc-header">
        <div className="doc-logo-area">
          <div className="doc-logo">◎ pennylane</div>
          <div className="doc-logo-sub">Learning Suite — AFS</div>
        </div>
        <div className="doc-header-right">
          <div className="doc-type-label">CONVOCATION</div>
          <div className="doc-ref">Réf. {session.id?.slice(-6).toUpperCase()}</div>
        </div>
      </div>

      <div className="doc-qualiopi-banner">
        <span className="qualiopi-badge">Qualiopi</span>
        <span>Certification qualité délivrée à PENNYLANE — Catégorie : ACTIONS DE FORMATION</span>
      </div>

      <div className="doc-section">
        <h2 className="doc-section-title">Destinataire</h2>
        <div className="doc-info-grid">
          <div className="doc-info-row"><span>Nom</span><strong>{p.prenom} {p.nom}</strong></div>
          <div className="doc-info-row"><span>Fonction</span><strong>{p.fonction || '—'}</strong></div>
          <div className="doc-info-row"><span>Cabinet</span><strong>{p.cabinet || '—'}</strong></div>
          <div className="doc-info-row"><span>Email</span><strong>{p.email}</strong></div>
          {p.telephone && <div className="doc-info-row"><span>Téléphone</span><strong>{p.telephone}</strong></div>}
        </div>
      </div>

      <div className="doc-section">
        <h2 className="doc-section-title">Formation</h2>
        <div className="doc-info-grid">
          <div className="doc-info-row"><span>Intitulé</span><strong>{session.titre}</strong></div>
          <div className="doc-info-row"><span>Date</span><strong>{dateFormatee}</strong></div>
          {session.heure && <div className="doc-info-row"><span>Heure</span><strong>{session.heure}</strong></div>}
          <div className="doc-info-row"><span>Modalité</span><strong>{session.modalite === 'visio' ? 'Formation à distance (visioconférence)' : 'Formation en présentiel'}</strong></div>
          {format && <div className="doc-info-row"><span>Durée</span><strong>{format.duree}</strong></div>}
          <div className="doc-info-row"><span>Formateur</span><strong>{session.formateur || 'Équipe AFS Pennylane'}</strong></div>
          {session.client && <div className="doc-info-row"><span>Client</span><strong>{session.client}</strong></div>}
          {prix && <div className="doc-info-row"><span>Tarif</span><strong>{prix}€ HT</strong></div>}
        </div>
      </div>

      {modules.length > 0 && (
        <div className="doc-section">
          <h2 className="doc-section-title">Programme — Modules abordés</h2>
          <ul className="doc-modules-list">
            {modules.map(m => (
              <li key={m.id}>
                <strong>{m.titre}</strong>
                <p>{m.description}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="doc-section">
        <h2 className="doc-section-title">Informations pratiques</h2>
        {session.modalite === 'visio' ? (
          <p className="doc-text">
            Cette formation se déroule en visioconférence. Le lien de connexion vous sera communiqué par email avant la session. Merci de vous connecter 5 minutes avant le début de la formation.
          </p>
        ) : (
          <p className="doc-text">
            Cette formation se déroule en présentiel. L'adresse vous sera communiquée par email. Merci d'arriver 10 minutes avant le début de la formation.
          </p>
        )}
        {session.notes && (
          <div className="doc-note-box">
            <strong>Note :</strong> {session.notes}
          </div>
        )}
      </div>

      <div className="doc-section qualiopi-objectives">
        <h2 className="doc-section-title">Objectifs pédagogiques</h2>
        <p className="doc-text">À l'issue de cette formation, le participant sera capable de :</p>
        <ul className="doc-objectives-list">
          {modules.map(m => (
            <li key={m.id}>Maîtriser le module <strong>{m.titre}</strong> sur Pennylane</li>
          ))}
          <li>Appliquer les fonctionnalités apprises directement sur ses dossiers clients</li>
          <li>Poser des questions sur des cas pratiques rencontrés au quotidien</li>
        </ul>
      </div>

      <div className="doc-footer">
        <div className="doc-footer-left">
          <div>Pennylane — 4 Rue Jules Lefebvre, 75009 Paris</div>
          <div>afs-training@pennylane.com</div>
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
