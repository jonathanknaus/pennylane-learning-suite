import './TarifsTable.css'

export default function TarifsTable({ tarifs }) {
  const items = [
    tarifs.session_1h,
    tarifs.session_2h,
    tarifs.demi_journee,
    tarifs.journee,
  ]

  return (
    <div className="tarifs-table">
      <h3>Grille tarifaire</h3>
      <p className="tarifs-note">Max 15 participants · +300€ HT/formateur supplémentaire (présentiel)</p>
      <div className="tarifs-list">
        {items.map(t => (
          <div key={t.label} className="tarif-row">
            <div className="tarif-info">
              <div className="tarif-name">{t.label}</div>
              <div className="tarif-modules-hint">{t.modules}</div>
            </div>
            <div className="tarif-prices">
              {t.visio && <div className="price-chip visio">{t.visio}€ <span>visio</span></div>}
              {t.presentiel && <div className="price-chip pres">{t.presentiel}€ <span>présentiel</span></div>}
            </div>
          </div>
        ))}
      </div>
      <div className="tarifs-contact">
        <a href="mailto:afs-training@pennylane.com" className="contact-btn">
          Contacter l'équipe AFS
        </a>
      </div>
    </div>
  )
}
