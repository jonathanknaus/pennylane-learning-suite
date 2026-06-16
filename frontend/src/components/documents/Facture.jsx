import { calculerFacture, STATUTS_FACTURE, TYPES_FACTURE } from '../../data/factures'
import './print.css'

export default function Facture({ facture, of }) {
  const f = facture
  const { ht, tva, ttc, acompte_ht, acompte_ttc } = calculerFacture(f)
  const statut = STATUTS_FACTURE.find(s => s.id === f.statut)
  const type = TYPES_FACTURE.find(t => t.id === f.type)

  const dateEmission = f.date_emission
    ? new Date(f.date_emission + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'
  const dateEcheance = f.date_echeance
    ? new Date(f.date_echeance + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '30 jours à réception'

  return (
    <div className="doc-page facture-page">
      {/* En-tête */}
      <div className="doc-header">
        <div className="doc-logo-area">
          <div className="doc-logo">◎ pennylane</div>
          <div className="doc-logo-sub">Learning Suite — AFS</div>
        </div>
        <div className="doc-header-right">
          <div className="doc-type-label">{type?.label?.toUpperCase() || 'FACTURE'}</div>
          <div className="doc-ref">{f.numero || '—'}</div>
          {statut && (
            <div className="facture-statut" style={{ color: statut.color, background: statut.bg }}>
              {statut.label}
            </div>
          )}
        </div>
      </div>

      {/* Dates */}
      <div className="facture-dates">
        <div className="facture-date-row"><span>Date d'émission :</span><strong>{dateEmission}</strong></div>
        <div className="facture-date-row"><span>Date d'échéance :</span><strong>{dateEcheance}</strong></div>
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
          {of.of_tel && <div className="conv-partie-detail">{of.of_tel}</div>}
        </div>
        <div className="conv-et">▶</div>
        <div className="conv-partie">
          <div className="conv-partie-label">CLIENT</div>
          <div className="conv-partie-nom">{f.client_nom || '—'}</div>
          {f.client_siret && <div className="conv-partie-detail">SIRET {f.client_siret}</div>}
          {f.client_adresse && <div className="conv-partie-detail">{f.client_adresse}</div>}
          {f.financeur_nom && f.financeur_nom !== '__autre__' && (
            <div className="conv-partie-detail facture-opco">
              Financeur OPCO : <strong>{f.financeur_nom}</strong>
              {f.financeur_dossier && ` — Dossier ${f.financeur_dossier}`}
            </div>
          )}
        </div>
      </div>

      {/* Tableau prestations */}
      <div className="doc-section">
        <table className="conv-tarif-table">
          <thead>
            <tr>
              <th style={{ width: '50%' }}>Désignation</th>
              <th>Qté</th>
              <th>P.U. HT</th>
              <th>TVA</th>
              <th>Montant HT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>{f.objet}</strong>
                {f.format_duree && <div style={{ fontSize: '8pt', color: '#6B7280', marginTop: '2px' }}>Durée : {f.format_duree}</div>}
                {f.formateur && <div style={{ fontSize: '8pt', color: '#6B7280' }}>Formateur : {f.formateur}</div>}
                {f.financeur_nom && f.financeur_nom !== '__autre__' && (
                  <div style={{ fontSize: '8pt', color: '#6B7280' }}>Financement OPCO : {f.financeur_nom}{f.financeur_dossier ? ` (${f.financeur_dossier})` : ''}</div>
                )}
              </td>
              <td style={{ textAlign: 'center' }}>1</td>
              <td style={{ textAlign: 'right' }}>{ht.toFixed(2)} €</td>
              <td style={{ textAlign: 'center' }}>{f.tva_taux}%</td>
              <td style={{ textAlign: 'right' }}><strong>{ht.toFixed(2)} €</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Totaux */}
      <div className="facture-totaux">
        <div className="facture-total-row"><span>Total HT</span><strong>{ht.toFixed(2)} €</strong></div>
        <div className="facture-total-row"><span>TVA ({f.tva_taux}%)</span><strong>{tva.toFixed(2)} €</strong></div>
        <div className="facture-total-row facture-total-ttc"><span>Total TTC</span><strong>{ttc.toFixed(2)} €</strong></div>
        {f.acompte_pct > 0 && (
          <>
            <div className="facture-total-row facture-total-acompte">
              <span>Acompte versé ({f.acompte_pct}%) TTC</span>
              <strong>- {acompte_ttc.toFixed(2)} €</strong>
            </div>
            <div className="facture-total-row facture-total-solde">
              <span>Net à payer (solde)</span>
              <strong>{(ttc - acompte_ttc).toFixed(2)} €</strong>
            </div>
          </>
        )}
      </div>

      {/* Conditions de règlement */}
      <div className="facture-conditions">
        <div className="facture-cond-title">Conditions de règlement</div>
        <p>
          Règlement par virement bancaire à {dateEcheance}.
          En cas de retard de paiement, des pénalités au taux légal en vigueur seront appliquées.
          Pas d'escompte pour paiement anticipé.
        </p>
        {f.financeur_nom && f.financeur_nom !== '__autre__' && (
          <p>
            <strong>Subrogation de paiement :</strong> Le règlement est à effectuer directement par {f.financeur_nom}
            {f.financeur_dossier ? ` (dossier n° ${f.financeur_dossier})` : ''}.
          </p>
        )}
      </div>

      {/* Mentions légales */}
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
