import { useState } from 'react'
import { THEMATIQUES, TARIFS, WEBINAIRES_EMBARQUEMENT } from '../data/catalogue-afs'
import ThematiqueCard from '../components/ThematiqueCard'
import TarifsTable from '../components/TarifsTable'
import './CatalogueAFS.css'

export default function CatalogueAFS() {
  const [selectedModules, setSelectedModules] = useState([])

  function toggleModule(moduleId) {
    setSelectedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    )
  }

  function getTarifRecommande() {
    const n = selectedModules.length
    if (n === 0) return null
    if (n <= 2) return TARIFS.session_1h
    if (n <= 4) return TARIFS.session_2h
    return TARIFS.demi_journee
  }

  const tarifRecommande = getTarifRecommande()

  return (
    <div className="catalogue">
      <div className="catalogue-hero">
        <div className="hero-badge">Qualiopi certifié</div>
        <h1 className="hero-title">Catalogue AFS — Formations Premium</h1>
        <p className="hero-sub">
          Formations personnalisées pour maîtriser tous les aspects de la gestion et comptabilité sur Pennylane.
          <br />Max 15 participants · Visio ou présentiel · <strong>afs@pennylane.com</strong>
        </p>
      </div>

      <div className="catalogue-layout">
        <div className="catalogue-modules">
          <div className="section-header">
            <h2>Modules disponibles</h2>
            <p>Sélectionnez les modules pour construire votre programme</p>
          </div>

          {THEMATIQUES.map(thematique => (
            <ThematiqueCard
              key={thematique.id}
              thematique={thematique}
              selectedModules={selectedModules}
              onToggle={toggleModule}
            />
          ))}

          <div className="webinaires-section">
            <h3>Embarquement clients — Webinaires</h3>
            <div className="webinaires-grid">
              {WEBINAIRES_EMBARQUEMENT.map(w => (
                <div key={w.id} className={`webinaire-card ${w.prix === 'Offert' ? 'offert' : 'sur-devis'}`}>
                  <div className="webinaire-header">
                    <span className="webinaire-titre">{w.titre}</span>
                    <span className={`webinaire-prix ${w.prix === 'Offert' ? 'prix-offert' : 'prix-devis'}`}>{w.prix}</span>
                  </div>
                  <div className="webinaire-meta">{w.duree} · {w.apprenants} apprenants</div>
                  <ul className="webinaire-contenu">
                    {w.contenu.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                  {w.url && (
                    <a
                      href={w.url}
                      target={w.url.startsWith('mailto') ? '_self' : '_blank'}
                      rel="noopener noreferrer"
                      className={`webinaire-inscrire ${w.prix === 'Sur devis' ? 'inscrire-devis' : ''}`}
                    >
                      {w.prix === 'Sur devis' ? 'Demander un devis →' : 'S\'inscrire gratuitement →'}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="catalogue-aside">
          <div className="aside-stack">
            {selectedModules.length > 0 && (
              <div className="devis-panel">
                <h3>Ma sélection</h3>
                <div className="devis-modules">
                  {selectedModules.map(id => {
                    const module = THEMATIQUES.flatMap(t => t.modules).find(m => m.id === id)
                    return module ? (
                      <div key={id} className="devis-module-tag">
                        {module.titre}
                        <button onClick={() => toggleModule(id)} className="tag-remove">×</button>
                      </div>
                    ) : null
                  })}
                </div>
                {tarifRecommande && (
                  <div className="devis-tarif">
                    <div className="tarif-label">Format recommandé</div>
                    <div className="tarif-value">{tarifRecommande.label} — {tarifRecommande.modules}</div>
                    <div className="tarif-prix">
                      {tarifRecommande.visio && <span>Visio : <strong>{tarifRecommande.visio}€ HT</strong></span>}
                      {tarifRecommande.presentiel && <span>Présentiel : <strong>{tarifRecommande.presentiel}€ HT</strong></span>}
                    </div>
                  </div>
                )}
                <a href="mailto:afs@pennylane.com" className="devis-cta">
                  Demander un devis
                </a>
                <button className="devis-reset" onClick={() => setSelectedModules([])}>
                  Réinitialiser la sélection
                </button>
              </div>
            )}

            <TarifsTable tarifs={TARIFS} />
          </div>
        </aside>
      </div>
    </div>
  )
}
