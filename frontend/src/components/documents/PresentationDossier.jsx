import { calculerDevis } from '../../data/devis'
import { STATUTS } from '../../data/sessions'
import './print.css'

export default function PresentationDossier({ data, devis, of }) {
  const { session, participants, modules, format, dateFormatee, prix } = data
  const statut = STATUTS.find(s => s.id === session.statut)
  const totaux = devis ? calculerDevis(devis) : null

  return (
    <div className="doc-page presentation-page">
      {/* En-tête */}
      <div className="doc-header">
        <div className="doc-logo-area">
          <div className="doc-logo">◎ pennylane</div>
          <div className="doc-logo-sub">Learning Suite — AFS</div>
        </div>
        <div className="doc-header-right">
          <div className="doc-type-label">PRÉSENTATION DU DOSSIER</div>
          <div className="doc-ref">Réf. {session.id?.slice(-6).toUpperCase()}</div>
        </div>
      </div>

      <div className="doc-qualiopi-banner">
        <span className="qualiopi-badge">Qualiopi</span>
        <span>Récapitulatif du dossier de formation — usage interne et cabinet commanditaire</span>
      </div>

      {/* Bandeau titre formation */}
      <div className="presentation-hero">
        <div className="presentation-hero-titre">{session.titre}</div>
        <div className="presentation-hero-meta">
          {statut && (
            <span className="presentation-badge-statut" style={{ color: statut.color, borderColor: statut.color }}>
              {statut.label}
            </span>
          )}
          <span className="presentation-hero-client">{session.client || 'Cabinet non renseigné'}</span>
        </div>
      </div>

      {/* Programme */}
      <div className="doc-section">
        <h2 className="doc-section-title">Programme de la formation</h2>
        {modules.length === 0 ? (
          <p className="doc-text">Aucun module sélectionné pour cette session.</p>
        ) : (
          <ul className="doc-modules-list">
            {modules.map(m => (
              <li key={m.id}>
                <strong>{m.titre}</strong>
                <p>{m.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Dates & modalités */}
      <div className="doc-section">
        <h2 className="doc-section-title">Dates & modalités</h2>
        <div className="doc-info-grid">
          <div className="doc-info-row">
            <span>Date</span>
            <strong>{dateFormatee}{session.heure ? ` à ${session.heure}` : ''}</strong>
          </div>
          <div className="doc-info-row">
            <span>Durée</span>
            <strong>{format?.duree || '—'}</strong>
          </div>
          <div className="doc-info-row">
            <span>Modalité</span>
            <strong>{session.modalite === 'visio' ? 'Visioconférence' : session.modalite === 'presentiel' ? 'Présentiel' : 'Mixte'}</strong>
          </div>
          {session.lieu && (
            <div className="doc-info-row">
              <span>Lieu</span>
              <strong>{session.lieu}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Participants */}
      <div className="doc-section">
        <h2 className="doc-section-title">Participants ({participants.length})</h2>
        {participants.length === 0 ? (
          <p className="doc-text">Aucun participant inscrit à ce jour.</p>
        ) : (
          <table className="conv-participants-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nom / Prénom</th>
                <th>Fonction</th>
                <th>Cabinet</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p, i) => (
                <tr key={p.stagiaire.id} className={i % 2 === 0 ? 'row-even' : 'row-odd'}>
                  <td className="col-num">{i + 1}</td>
                  <td><strong>{p.stagiaire.prenom} {p.stagiaire.nom}</strong></td>
                  <td>{p.stagiaire.fonction || '—'}</td>
                  <td>{p.stagiaire.cabinet || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Formateur */}
      <div className="doc-section">
        <h2 className="doc-section-title">Formateur</h2>
        <div className="presentation-formateur-block">
          <div className="presentation-avatar">
            {(session.formateur || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <strong>{session.formateur || 'Non renseigné'}</strong>
            <p className="doc-text">Formateur Pennylane Learning Suite — AFS</p>
          </div>
        </div>
      </div>

      {/* Financement */}
      <div className="doc-section">
        <h2 className="doc-section-title">Financement</h2>
        {devis && totaux ? (
          <div className="presentation-financement-card">
            <div className="doc-info-row">
              <span>Montant HT</span>
              <strong>{totaux.ht.toFixed(2)} €</strong>
            </div>
            <div className="doc-info-row">
              <span>Montant TTC</span>
              <strong>{totaux.ttc.toFixed(2)} €</strong>
            </div>
            <div className="doc-info-row">
              <span>Financeur</span>
              <strong>{devis.financeur_nom || 'Autofinancement / TNS'}</strong>
            </div>
            {devis.acompte_pct > 0 && (
              <div className="doc-info-row">
                <span>Acompte ({devis.acompte_pct}%)</span>
                <strong>{totaux.acompte_ttc.toFixed(2)} € TTC</strong>
              </div>
            )}
          </div>
        ) : prix ? (
          <div className="presentation-financement-card">
            <div className="doc-info-row">
              <span>Montant HT</span>
              <strong>{prix} €</strong>
            </div>
            <p className="doc-note-box">Financement à définir — créer un devis depuis l'onglet Finance de la session.</p>
          </div>
        ) : (
          <p className="doc-note-box">Financement à définir — créer un devis depuis l'onglet Finance de la session.</p>
        )}
      </div>

      <div className="doc-footer">
        <div className="doc-footer-left">
          <div>{of.of_nom} — {of.of_adresse}</div>
          <div>{of.of_email}{of.of_tel ? ` · ${of.of_tel}` : ''}</div>
        </div>
        <div className="doc-footer-right">
          <div className="doc-footer-qualiopi">
            <span className="qualiopi-badge small">Qualiopi</span>
            <span>Document généré le {new Date().toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
