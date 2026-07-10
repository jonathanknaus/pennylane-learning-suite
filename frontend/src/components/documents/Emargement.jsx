import './print.css'

export default function Emargement({ data }) {
  const { session, participants, modules, format, dateFormatee } = data

  // Découper en demi-journées si journée complète
  const isJournee = format?.id === 'journee' || format?.id === 'journee_sur_mesure'
  const periodes = isJournee
    ? ['Matin', 'Après-midi']
    : [format?.label || 'Session']

  return (
    <div className="doc-page emargement">
      <div className="doc-header">
        <div className="doc-logo-area">
          <div className="doc-logo">◎ pennylane</div>
          <div className="doc-logo-sub">Learning Suite — AFS</div>
        </div>
        <div className="doc-header-right">
          <div className="doc-type-label">FEUILLE D'ÉMARGEMENT</div>
          <div className="doc-ref">Réf. {session.id?.slice(-6).toUpperCase()}</div>
        </div>
      </div>

      <div className="doc-qualiopi-banner">
        <span className="qualiopi-badge">Qualiopi</span>
        <span>Document obligatoire — Preuve de réalisation de la formation · Indicateur 6 du référentiel national</span>
      </div>

      <div className="emargement-session-info">
        <div className="ema-info-col">
          <div className="ema-info-row"><span>Formation</span><strong>{session.titre}</strong></div>
          <div className="ema-info-row"><span>Date</span><strong>{dateFormatee}</strong></div>
          {session.heure && <div className="ema-info-row"><span>Heure</span><strong>{session.heure}</strong></div>}
        </div>
        <div className="ema-info-col">
          <div className="ema-info-row"><span>Modalité</span><strong>{session.modalite === 'visio' ? 'Visioconférence' : 'Présentiel'}</strong></div>
          <div className="ema-info-row"><span>Durée</span><strong>{format?.duree || '—'}</strong></div>
          <div className="ema-info-row"><span>Formateur</span><strong>{session.formateur || 'Équipe AFS Pennylane'}</strong></div>
        </div>
      </div>

      {modules.length > 0 && (
        <div className="ema-modules">
          <strong>Modules :</strong> {modules.map(m => m.titre).join(' · ')}
        </div>
      )}

      <table className="emargement-table">
        <thead>
          <tr>
            <th className="col-num">N°</th>
            <th className="col-nom">Nom & Prénom</th>
            <th className="col-fonction">Fonction</th>
            <th className="col-cabinet">Cabinet</th>
            {periodes.map(p => (
              <th key={p} className="col-signature">
                <div className="sig-header">
                  <div className="sig-periode">{p}</div>
                  <div className="sig-label">Signature</div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {participants.map((p, i) => (
            <tr key={p.stagiaire.id} className={i % 2 === 0 ? 'row-even' : 'row-odd'}>
              <td className="col-num">{i + 1}</td>
              <td className="col-nom"><strong>{p.stagiaire.prenom} {p.stagiaire.nom}</strong></td>
              <td className="col-fonction">{p.stagiaire.fonction || '—'}</td>
              <td className="col-cabinet">{p.stagiaire.cabinet || '—'}</td>
              {periodes.map(per => (
                <td key={per} className="col-signature">
                  <div className="sig-box" />
                </td>
              ))}
            </tr>
          ))}
          {/* Lignes vides pour éventuels participants supplémentaires */}
          {Array.from({ length: Math.max(0, 3 - participants.length) }).map((_, i) => (
            <tr key={`empty-${i}`} className={((participants.length + i) % 2 === 0) ? 'row-even' : 'row-odd'}>
              <td className="col-num">{participants.length + i + 1}</td>
              <td className="col-nom" />
              <td className="col-fonction" />
              <td className="col-cabinet" />
              {periodes.map(per => (
                <td key={per} className="col-signature"><div className="sig-box" /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="emargement-signatures">
        <div className="sig-zone">
          <div className="sig-zone-label">Signature du formateur</div>
          <div className="sig-zone-name">{session.formateur || 'Équipe AFS Pennylane'}</div>
          <div className="sig-zone-box" />
        </div>
        <div className="sig-zone">
          <div className="sig-zone-label">Cachet et signature de l'organisme</div>
          <div className="sig-zone-name">Pennylane</div>
          <div className="sig-zone-box" />
        </div>
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
