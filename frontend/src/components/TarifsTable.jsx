import { useState } from 'react'
import { grillePourAffichage } from '../data/tarification'
import { imprimerGrille } from '../data/grille-pdf'
import './TarifsTable.css'

// `date` permet d'afficher la grille qui s'appliquait à une demande ancienne
// (le tarif est figé à la date de la demande). Par défaut : la grille en vigueur.
export default function TarifsTable({ date = null }) {
  const grille = grillePourAffichage(date)
  const [bloque, setBloque] = useState(false)

  function telecharger() {
    // Le PDF passe par une fenêtre d'impression : si elle est bloquée, le clic
    // n'a aucun effet visible. On le dit plutôt que de laisser croire à un bug.
    setBloque(!imprimerGrille(date))
  }

  return (
    <div className="tarifs-table">
      <h3>Grille tarifaire</h3>
      <p className="tarifs-note">
        Tarifs HT · {grille.libelle}
      </p>
      <div className="tarifs-list">
        {grille.lignes.map(ligne => (
          <div key={ligne.id} className="tarif-row">
            <div className="tarif-info">
              <div className="tarif-name">{ligne.label}</div>
              <div className="tarif-modules-hint">{ligne.hint}</div>
            </div>
            <div className="tarif-paliers">
              {ligne.paliers.map(p => (
                <div key={p.participantsMax} className="tarif-palier">
                  <div className="palier-label">
                    {p.label}
                    {p.formateurs > 1 && <span className="palier-formateurs">{p.formateurs} formateurs</span>}
                  </div>
                  <div className="tarif-prices">
                    {p.visio != null && <div className="price-chip visio">{p.visio}€ <span>visio</span></div>}
                    {p.presentiel != null && <div className="price-chip pres">{p.presentiel}€ <span>présentiel</span></div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <ul className="tarifs-regles">
        {grille.notes.map(note => <li key={note}>{note}</li>)}
      </ul>
      <div className="tarifs-contact">
        <a href="mailto:afs-training@pennylane.com" className="contact-btn">
          Contacter l'équipe AFS
        </a>
        <button type="button" className="telecharger-btn" onClick={telecharger}>
          Télécharger la grille (PDF)
        </button>
        {bloque && (
          <p className="telecharger-bloque">
            La fenêtre d’impression a été bloquée par le navigateur. Autorise les fenêtres
            surgissantes pour ce site, puis réessaie.
          </p>
        )}
      </div>
    </div>
  )
}
