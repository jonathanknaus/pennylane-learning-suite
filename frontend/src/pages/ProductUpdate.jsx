import { useState } from 'react'
import './ProductUpdate.css'

const STORAGE_KEY = 'pls_product_updates'

const CATEGORIES = [
  { id: 'feature', label: 'Nouvelle fonctionnalité', color: '#059669', bg: '#D1FAE5' },
  { id: 'amelioration', label: 'Amélioration', color: '#2563EB', bg: '#DBEAFE' },
  { id: 'correction', label: 'Correction', color: '#DC2626', bg: '#FEE2E2' },
  { id: 'contenu', label: 'Contenu pédagogique', color: '#7C3AED', bg: '#EDE9FE' },
]

const UPDATES_INITIALES = [
  {
    id: 'upd_001',
    date: '2025-06-01',
    titre: 'Lancement PLS v1.0',
    description: 'Première version de la Pennylane Learning Suite : catalogue AFS, sessions, apprenants, évaluations pré/post Qualiopi.',
    categorie: 'feature',
    vu: false,
  },
  {
    id: 'upd_002',
    date: '2025-06-05',
    titre: 'Modalité Mixte & champ Qualiopi',
    description: 'Ajout de la modalité "Mixte" dans les sessions. Nouveau champ Qualiopi avec 3 options : Non / Qualiopi / Subrogation.',
    categorie: 'feature',
    vu: false,
  },
  {
    id: 'upd_003',
    date: '2025-06-08',
    titre: 'Catalogue enrichi : objectifs, questionnaire, BPF',
    description: 'Chaque module du catalogue dispose maintenant d\'objectifs pédagogiques, d\'un questionnaire QCM et d\'une fiche BPF (F.3.a–F.3.f) configurable.',
    categorie: 'feature',
    vu: false,
  },
  {
    id: 'upd_004',
    date: '2025-06-10',
    titre: 'Onglet Workflows dans les sessions',
    description: 'Nouveau 4ème onglet "Workflows" dans le détail de session. 10 étapes de workflow client / apprenants avec indicateurs de progression.',
    categorie: 'feature',
    vu: false,
  },
  {
    id: 'upd_005',
    date: '2025-06-12',
    titre: 'Quizz pré/post partageables',
    description: 'Les quizz pré et post-formation sont maintenant accessibles via lien direct (sans connexion). Gestion depuis l\'onglet Workflows.',
    categorie: 'feature',
    vu: false,
  },
  {
    id: 'upd_006',
    date: '2025-06-15',
    titre: 'Modèles email dans les workflows',
    description: 'Chaque étape workflow dispose d\'un modèle email pré-rempli (objet + corps) à copier-coller. Le contenu est adapté aux données de la session.',
    categorie: 'feature',
    vu: false,
  },
]

function getUpdates() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(UPDATES_INITIALES))
      return UPDATES_INITIALES
    }
    return stored
  } catch {
    return UPDATES_INITIALES
  }
}

function saveUpdates(updates) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updates)) } catch {}
}

export default function ProductUpdate() {
  const [updates, setUpdates] = useState(getUpdates)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ titre: '', description: '', categorie: 'feature', date: new Date().toISOString().split('T')[0] })

  function marquerVu(id) {
    const next = updates.map(u => u.id === id ? { ...u, vu: true } : u)
    setUpdates(next)
    saveUpdates(next)
  }

  function marquerTousVus() {
    const next = updates.map(u => ({ ...u, vu: true }))
    setUpdates(next)
    saveUpdates(next)
  }

  function ajouterUpdate() {
    if (!form.titre.trim()) return
    const newU = {
      id: `upd_${Date.now()}`,
      ...form,
      vu: false,
    }
    const next = [newU, ...updates]
    setUpdates(next)
    saveUpdates(next)
    setShowForm(false)
    setForm({ titre: '', description: '', categorie: 'feature', date: new Date().toISOString().split('T')[0] })
  }

  const nonVus = updates.filter(u => !u.vu).length

  return (
    <div className="product-update">
      <div className="pu-header">
        <div>
          <h1 className="pu-title">Mises à jour produit</h1>
          <p className="pu-subtitle">Suivi des évolutions de la Pennylane Learning Suite</p>
        </div>
        <div className="pu-header-actions">
          {nonVus > 0 && (
            <button className="pu-btn-secondary" onClick={marquerTousVus}>
              ✓ Tout marquer comme lu ({nonVus})
            </button>
          )}
          <button className="pu-btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? '— Annuler' : '+ Nouvelle mise à jour'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="pu-form-card">
          <h3 className="pu-form-title">Ajouter une mise à jour</h3>
          <div className="pu-form-row">
            <div className="pu-form-group">
              <label>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="pu-form-group">
              <label>Catégorie</label>
              <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value }))}>
                {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="pu-form-group">
            <label>Titre *</label>
            <input
              type="text"
              value={form.titre}
              onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
              placeholder="Ex : Ajout de la signature électronique"
            />
          </div>
          <div className="pu-form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              placeholder="Détail des changements…"
            />
          </div>
          <div className="pu-form-actions">
            <button className="pu-btn-primary" onClick={ajouterUpdate}>Ajouter</button>
            <button className="pu-btn-secondary" onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      <div className="pu-stats">
        {CATEGORIES.map(cat => {
          const count = updates.filter(u => u.categorie === cat.id).length
          return (
            <div key={cat.id} className="pu-stat-card" style={{ borderColor: cat.color }}>
              <span className="pu-stat-val" style={{ color: cat.color }}>{count}</span>
              <span className="pu-stat-label">{cat.label}</span>
            </div>
          )
        })}
      </div>

      <div className="pu-list">
        {updates.map(update => {
          const cat = CATEGORIES.find(c => c.id === update.categorie)
          const dateStr = update.date
            ? new Date(update.date + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
            : ''
          return (
            <div key={update.id} className={`pu-card ${update.vu ? 'vu' : 'nouveau'}`}>
              {!update.vu && <div className="pu-new-dot" title="Non lu" />}
              <div className="pu-card-header">
                <div className="pu-card-meta">
                  <span className="pu-badge" style={{ color: cat?.color, background: cat?.bg }}>{cat?.label}</span>
                  <span className="pu-date">{dateStr}</span>
                </div>
                {!update.vu && (
                  <button className="pu-btn-vu" onClick={() => marquerVu(update.id)}>Marquer comme lu</button>
                )}
              </div>
              <h3 className="pu-card-titre">{update.titre}</h3>
              {update.description && <p className="pu-card-desc">{update.description}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
