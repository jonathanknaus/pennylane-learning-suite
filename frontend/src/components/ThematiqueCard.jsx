import { useState } from 'react'
import './ThematiqueCard.css'

export default function ThematiqueCard({ thematique, selectedModules, onToggle, onDetail }) {
  const [expanded, setExpanded] = useState(true)
  const selectedCount = thematique.modules.filter(m => selectedModules.includes(m.id)).length

  return (
    <div className="thematique-card">
      <button className="thematique-header" onClick={() => setExpanded(e => !e)}>
        <div className="thematique-title">
          <span className="thematique-emoji">{thematique.emoji}</span>
          <span className="thematique-name">{thematique.titre}</span>
        </div>
        <div className="thematique-meta">
          {selectedCount > 0 && (
            <span className="selected-badge">{selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}</span>
          )}
          <span className="expand-icon">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {expanded && (
        <div className="thematique-modules">
          {thematique.modules.map(module => {
            const isSelected = selectedModules.includes(module.id)
            return (
              <div key={module.id} className={`module-item ${isSelected ? 'selected' : ''}`}>
                <button
                  className="module-select-area"
                  onClick={() => onToggle(module.id)}
                >
                  <div className="module-check">
                    {isSelected ? '✓' : ''}
                  </div>
                  <div className="module-content">
                    <div className="module-titre">
                      {module.titre}
                      {onDetail && (
                        <button
                          className="module-titre-link"
                          onClick={e => { e.stopPropagation(); onDetail(module, thematique) }}
                          title="Voir le détail"
                        >
                          Détail →
                        </button>
                      )}
                    </div>
                    <div className="module-desc">{module.description}</div>
                    {module.format_special && (
                      <div className="module-format">{module.format_special}</div>
                    )}
                  </div>
                </button>
                {onDetail && (
                  <button
                    className="module-detail-btn"
                    onClick={e => { e.stopPropagation(); onDetail(module, thematique) }}
                    title="Voir le détail"
                  >
                    ℹ
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
