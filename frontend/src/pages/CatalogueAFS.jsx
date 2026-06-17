import { useState } from 'react'
import { THEMATIQUES, TARIFS, WEBINAIRES_EMBARQUEMENT } from '../data/catalogue-afs'
import { getBanqueModule } from '../data/questionnaires'
import { getModuleConfig, saveModuleConfig, BPF_SPECIALITES, BPF_ITEMS } from '../data/catalogue-config'
import ThematiqueCard from '../components/ThematiqueCard'
import TarifsTable from '../components/TarifsTable'
import './CatalogueAFS.css'

const ALL_MODULES = THEMATIQUES.flatMap(t => t.modules.map(m => ({ ...m, thematique: t })))

export default function CatalogueAFS() {
  const [selectedModules, setSelectedModules] = useState([])
  const [detailModule, setDetailModule] = useState(null)
  const [detailTab, setDetailTab] = useState('description')

  function toggleModule(moduleId) {
    setSelectedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    )
  }

  function openDetail(module, thematique) {
    setDetailModule({ module, thematique })
    setDetailTab('description')
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
      {detailModule && (
        <DetailModal
          module={detailModule.module}
          thematique={detailModule.thematique}
          isSelected={selectedModules.includes(detailModule.module.id)}
          onToggle={() => toggleModule(detailModule.module.id)}
          onClose={() => setDetailModule(null)}
          tab={detailTab}
          onTabChange={setDetailTab}
        />
      )}

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
              onDetail={(module, them) => openDetail(module, them)}
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
          <div className="aside-sticky">
            <TarifsTable tarifs={TARIFS} />

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
          </div>
        </aside>
      </div>
    </div>
  )
}

function DetailModal({ module, thematique, isSelected, onToggle, onClose, tab, onTabChange }) {
  const questions = getBanqueModule(module.id)
  const [config, setConfig] = useState(() => getModuleConfig(module.id))

  function updateConfig(patch) {
    const next = { ...config, ...patch }
    setConfig(next)
    saveModuleConfig(module.id, next)
  }

  function toggleBpf(id) {
    const next = { ...config, bpf: { ...config.bpf, [id]: !config.bpf[id] } }
    setConfig(next)
    saveModuleConfig(module.id, next)
  }

  const bpfCount = BPF_ITEMS.filter(i => config.bpf[i.id]).length

  return (
    <div className="modal-overlay catalogue-detail-overlay" onClick={onClose}>
      <div className="modal catalogue-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="catalogue-detail-theme">{thematique.emoji} {thematique.titre}</div>
            <h2>{module.titre}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label className="mise-en-ligne-toggle" title="Formation mise en ligne">
              <input
                type="checkbox"
                checked={!!config.mise_en_ligne}
                onChange={e => updateConfig({ mise_en_ligne: e.target.checked })}
              />
              <span className={`mel-label ${config.mise_en_ligne ? 'mel-active' : ''}`}>
                {config.mise_en_ligne ? '🟢 En ligne' : '⚪ Hors ligne'}
              </span>
            </label>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
        </div>

        {/* Onglets */}
        <div className="detail-modal-tabs">
          {[
            { id: 'description', label: 'Description' },
            { id: 'objectifs', label: 'Objectifs' },
            { id: 'questionnaire', label: `Questionnaire (${questions.length})` },
            { id: 'bpf', label: `BPF ${bpfCount > 0 ? `(${bpfCount}/6)` : ''}` },
          ].map(t => (
            <button
              key={t.id}
              className={`detail-modal-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => onTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="catalogue-detail-body">
          {/* Description */}
          {tab === 'description' && (
            <>
              <p className="catalogue-detail-desc">{module.description}</p>
              {module.format_special && (
                <div className="catalogue-detail-format">{module.format_special}</div>
              )}
              <div className="catalogue-detail-section">
                <div className="catalogue-detail-section-title">Format recommandé</div>
                <div className="catalogue-detail-formats">
                  <div className="catalogue-detail-format-item">
                    <span className="fmt-label">Session 1h</span>
                    <span className="fmt-info">1-2 modules · Visio · <strong>200€ HT</strong></span>
                  </div>
                  <div className="catalogue-detail-format-item">
                    <span className="fmt-label">Session 2h</span>
                    <span className="fmt-info">3-4 modules · Visio · <strong>400€ HT</strong></span>
                  </div>
                  <div className="catalogue-detail-format-item">
                    <span className="fmt-label">½ Journée</span>
                    <span className="fmt-info">5+ modules · Visio 600€ · Présentiel 1 000€ HT</span>
                  </div>
                </div>
              </div>
              <div className="catalogue-detail-actions">
                <button className="btn-primary" onClick={onToggle}>
                  {isSelected ? '✓ Sélectionné' : '+ Ajouter à ma sélection'}
                </button>
                <a href="mailto:afs@pennylane.com?subject=Demande%20de%20devis%20—%20Formation%20Pennylane" className="btn-secondary catalogue-devis-link">
                  Demander un devis
                </a>
              </div>
            </>
          )}

          {/* Objectifs */}
          {tab === 'objectifs' && (
            <div className="catalogue-detail-section">
              <div className="catalogue-detail-section-title">À l'issue de cette formation, les apprenants seront capables de :</div>
              {module.objectifs?.length > 0 ? (
                <ul className="catalogue-detail-objectives">
                  {module.objectifs.map((obj, i) => <li key={i}>{obj}</li>)}
                </ul>
              ) : (
                <p style={{ color: '#9CA3AF', fontSize: 13 }}>Objectifs à renseigner.</p>
              )}
            </div>
          )}

          {/* Questionnaire */}
          {tab === 'questionnaire' && (
            <div className="detail-questionnaire">
              {questions.length === 0 ? (
                <div className="detail-q-empty">
                  <p>Aucune question dans la banque pour ce module.</p>
                  <p style={{ fontSize: 12, color: '#9CA3AF' }}>Rendez-vous dans <strong>Banque de questions</strong> pour en ajouter.</p>
                </div>
              ) : (
                <>
                  <div className="detail-q-header">
                    <span>{questions.length} question{questions.length > 1 ? 's' : ''} · QCM · 4 options</span>
                    <span className="detail-q-badge">Utilisées en pré/post formation</span>
                  </div>
                  <div className="detail-q-list">
                    {questions.map((q, i) => (
                      <div key={q.id} className="detail-q-item">
                        <div className="detail-q-num">{i + 1}</div>
                        <div className="detail-q-body">
                          <div className="detail-q-enonce">{q.enonce}</div>
                          <div className="detail-q-options">
                            {q.options.map((opt, j) => {
                              const lettre = ['A', 'B', 'C', 'D'][j]
                              return (
                                <div key={j} className={`detail-q-opt ${q.reponse === lettre ? 'correct' : ''}`}>
                                  <span className="detail-q-lettre">{lettre}</span>
                                  <span>{opt}</span>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* BPF */}
          {tab === 'bpf' && (
            <div className="detail-bpf">
              <div className="detail-bpf-row">
                <label className="detail-bpf-label">Spécialité BPF</label>
                <select
                  className="detail-bpf-select"
                  value={config.specialite || ''}
                  onChange={e => updateConfig({ specialite: e.target.value })}
                >
                  <option value="">— Choisir une spécialité —</option>
                  {BPF_SPECIALITES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="detail-bpf-section-title">
                Éléments du dossier BPF
                <span className="detail-bpf-count">{bpfCount} / {BPF_ITEMS.length} éléments validés</span>
              </div>
              <div className="detail-bpf-items">
                {BPF_ITEMS.map(item => (
                  <label key={item.id} className={`detail-bpf-item ${config.bpf[item.id] ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={!!config.bpf[item.id]}
                      onChange={() => toggleBpf(item.id)}
                    />
                    <div>
                      <div className="detail-bpf-item-label">{item.label}</div>
                      <div className="detail-bpf-item-desc">{item.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              {bpfCount === BPF_ITEMS.length && (
                <div className="detail-bpf-complete">
                  ✓ Dossier BPF complet pour ce module
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
