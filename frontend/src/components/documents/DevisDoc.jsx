import { calculerDevis, STATUTS_DEVIS } from '../../data/devis'
import './print.css'

export default function DevisDoc({ devis, of }) {
  const { ht, tva, ttc, acompte_ht, acompte_ttc } = calculerDevis(devis)
  const statut = STATUTS_DEVIS.find(s => s.id === devis.statut)

  const fmt = (d) => d ? new Date(d + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

  return (
    <div className="doc-page devis-page">
      {/* En-tête */}
      <div className="doc-header">
        <div className="doc-logo-area">
          <div className="doc-logo">◎ pennylane</div>
          <div className="doc-logo-sub">Learning Suite — AFS</div>
        </div>
        <div className="doc-header-right">
          <div className="doc-type-label">DEVIS</div>
          <div className="doc-ref">{devis.numero || '—'}</div>
          {statut && (
            <div className="facture-statut" style={{ color: statut.color, background: statut.bg }}>
              {statut.label}
            </div>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="facture-dates">
        <div className="facture-date-row"><span>Date d'émission :</span><strong>{fmt(devis.date_emission)}</strong></div>
        <div className="facture-date-row"><span>Valable jusqu'au :</span><strong>{fmt(devis.date_validite)}</strong></div>
      </div>

      {/* Parties */}
      <div className="conv-parties">
        <div className="conv-partie">
          <div className="conv-partie-label">ÉMETTEUR</div>
          <div className="conv-partie-nom">{of.of_nom}</div>
          <div className="conv-partie-detail">SIRET {of.of_siret}</div>
          <div className="conv-partie-detail">N° DA : {of.of_da}</div>
          <div className="conv-partie-detail">{of.of_adresse}</div>
          <div className="conv-partie-detail">{of.of_email}</div>
        </div>
        <div className="conv-et">▶</div>
        <div className="conv-partie">
          <div className="conv-partie-label">DESTINATAIRE</div>
          <div className="conv-partie-nom">{devis.client_nom || '—'}</div>
          {devis.client_siret && <div className="conv-partie-detail">SIRET {devis.client_siret}</div>}
          {devis.client_adresse && <div className="conv-partie-detail">{devis.client_adresse}</div>}
          {devis.contact_nom && <div className="conv-partie-detail">Contact : {devis.contact_nom}</div>}
          {devis.contact_email && <div className="conv-partie-detail">{devis.contact_email}</div>}
          {devis.contact_tel && <div className="conv-partie-detail">{devis.contact_tel}</div>}
          {devis.financeur_nom && devis.financeur_nom !== '__autre__' && (
            <div className="conv-partie-detail facture-opco">
              Financeur OPCO : <strong>{devis.financeur_nom}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Description de la prestation */}
      {devis.description && (
        <div className="devis-description">
          <div className="facture-cond-title">Présentation</div>
          <p style={{ fontSize: '9pt', color: '#374151', lineHeight: 1.6, margin: 0 }}>{devis.description}</p>
        </div>
      )}

      {/* Tableau prestation */}
      <div className="doc-section">
        <table className="conv-tarif-table">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Désignation</th>
              <th>Modalité</th>
              <th>Durée</th>
              <th>Participants</th>
              <th>Montant HT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>{devis.objet || '—'}</strong>
                {devis.formateur && <div style={{ fontSize: '8pt', color: '#6B7280', marginTop: '2px' }}>Formateur : {devis.formateur}</div>}
                {devis.financeur_nom && devis.financeur_nom !== '__autre__' && (
                  <div style={{ fontSize: '8pt', color: '#6B7280' }}>Financement : {devis.financeur_nom}{devis.financeur_dossier ? ` (${devis.financeur_dossier})` : ''}</div>
                )}
              </td>
              <td>{devis.modalite === 'visio' ? 'Visioconférence' : 'Présentiel'}</td>
              <td>{devis.format_duree || '—'}</td>
              <td style={{ textAlign: 'center' }}>{devis.participants || '—'}</td>
              <td style={{ textAlign: 'right' }}><strong>{ht.toFixed(2)} €</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totaux */}
      <div className="facture-totaux">
        <div className="facture-total-row"><span>Total HT</span><strong>{ht.toFixed(2)} €</strong></div>
        <div className="facture-total-row"><span>TVA ({devis.tva_taux}%)</span><strong>{tva.toFixed(2)} €</strong></div>
        <div className="facture-total-row facture-total-ttc"><span>Total TTC</span><strong>{ttc.toFixed(2)} €</strong></div>
        {devis.acompte_pct > 0 && (
          <>
            <div className="facture-total-row facture-total-acompte">
              <span>Acompte proposé ({devis.acompte_pct}%) TTC</span>
              <strong>{acompte_ttc.toFixed(2)} €</strong>
            </div>
            <div className="facture-total-row facture-total-solde">
              <span>Solde à la réalisation</span>
              <strong>{(ttc - acompte_ttc).toFixed(2)} €</strong>
            </div>
          </>
        )}
      </div>

      {/* Conditions d'acceptation */}
      <div className="facture-conditions">
        <div className="facture-cond-title">Conditions d'acceptation</div>
        <p>
          Ce devis est valable jusqu'au {fmt(devis.date_validite)}.
          Pour l'accepter, retournez-le signé avec la mention « Bon pour accord » à {of.of_email}.
        </p>
        {devis.notes && <p style={{ marginTop: '6px' }}>{devis.notes}</p>}
      </div>

      {/* Zone signature */}
      <div className="devis-sign-area">
        <div className="devis-sign-block">
          <div className="conv-sign-label">Émetteur — {of.of_nom}</div>
          <div className="conv-sign-name">{of.of_signataire}</div>
          <div className="conv-sign-subtitle">{of.of_titre}</div>
          <div className="conv-sign-box" />
        </div>
        <div className="devis-sign-block">
          <div className="conv-sign-label">Client — Bon pour accord</div>
          <div className="conv-sign-name">{devis.client_nom}</div>
          <div className="conv-sign-subtitle">Cachet et signature</div>
          <div className="conv-sign-box" />
        </div>
      </div>

      {/* Footer */}
      <div className="doc-footer">
        <div className="doc-footer-left">
          <div>{of.of_nom} — SIRET {of.of_siret} — N° DA {of.of_da}</div>
          <div>TVA non applicable, article 261-4-4° du CGI (organisme de formation)</div>
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
