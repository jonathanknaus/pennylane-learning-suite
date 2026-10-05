import { useState, useEffect } from 'react'
import {
  ecouterProfils, enregistrerProfil, initialiserProfils, profilsInitialises,
  estAdminRacine, PROFILS_IDS, PROFILS_DEFAUT, normaliserPerms,
} from '../data/firebase-auth'
import { getCurrentUser } from '../data/auth'
import PermMatrix, { ResumePerms } from '../components/PermMatrix'

// Édition des droits standards des quatre profils type.
// Les profils vivent dans Firebase : toute modification est immédiate dans les
// deux outils, sans déploiement.
export default function ProfilsFirebase() {
  const [profils, setProfils] = useState(PROFILS_DEFAUT)
  const [amorce, setAmorce] = useState(true)
  const [ouvert, setOuvert] = useState(null)
  const [brouillon, setBrouillon] = useState(null)
  const [erreur, setErreur] = useState('')
  const [info, setInfo] = useState('')

  const moi = getCurrentUser()
  const peutEcrire = estAdminRacine(moi?.email)

  useEffect(() => {
    profilsInitialises().then(setAmorce).catch(() => setAmorce(true))
    const stop = ecouterProfils(
      p => { setProfils(p); setErreur('') },
      err => setErreur(`Lecture impossible : ${err.message}`),
    )
    return () => { if (typeof stop === 'function') stop() }
  }, [])

  async function initialiser() {
    try {
      await initialiserProfils(moi?.email)
      setAmorce(true)
      setInfo('Les quatre profils type ont été créés avec les droits standards.')
    } catch (err) {
      setErreur(`Initialisation refusée : ${err.message}`)
    }
  }

  function ouvrir(id) {
    setOuvert(id)
    const p = profils[id] || PROFILS_DEFAUT[id]
    setBrouillon({
      label: p.label || '',
      description: p.description || '',
      role: p.role || 'formateur',
      ordre: p.ordre ?? PROFILS_DEFAUT[id]?.ordre ?? 9,
      perms: normaliserPerms(p.perms),
    })
    setInfo('')
  }

  async function sauvegarder() {
    try {
      await enregistrerProfil(ouvert, brouillon, moi?.email)
      setInfo(`Profil « ${brouillon.label} » enregistré. Effet immédiat sur les deux outils.`)
      setOuvert(null)
      setBrouillon(null)
    } catch (err) {
      setErreur(`Enregistrement refusé : ${err.message}`)
    }
  }

  function reinitialiser() {
    const d = PROFILS_DEFAUT[ouvert]
    setBrouillon(b => ({ ...b, perms: normaliserPerms(d.perms) }))
  }

  return (
    <div>
      {!amorce && (
        <div className="acces-fb-amorce">
          <div>
            <strong>Les profils ne sont pas encore dans la base.</strong>
            <p>
              En attendant, les droits standards définis dans le code font foi.
              Crée-les pour pouvoir les ajuster depuis cet écran.
            </p>
          </div>
          {peutEcrire && (
            <button className="btn-primary" onClick={initialiser}>
              Initialiser les 4 profils type
            </button>
          )}
        </div>
      )}

      {!peutEcrire && (
        <p className="acces-fb-lecture">
          Consultation seule : seuls les administrateurs racine peuvent modifier
          les profils, et cette restriction est appliquée côté serveur.
        </p>
      )}

      {erreur && <p className="acces-erreur">{erreur}</p>}
      {info && <p className="acces-fb-info">{info}</p>}

      <div className="acces-profils-grid">
        {PROFILS_IDS.map(id => {
          const p = profils[id] || PROFILS_DEFAUT[id]
          return (
            <div key={id} className="acces-profil-card">
              <div className="acces-profil-card-head">
                <div>
                  <div className="acces-profil-card-label">{p.label}</div>
                  <span className={`acces-profil-badge acces-profil-${id}`}>
                    {p.role === 'admin' ? 'Rôle admin' : 'Rôle formateur'}
                  </span>
                </div>
              </div>
              <p className="acces-profil-card-desc">{p.description}</p>
              <ResumePerms perms={p.perms} />
              <div className="acces-profil-card-actions">
                <button className="btn-secondary" onClick={() => ouvrir(id)}>
                  {peutEcrire ? 'Modifier les droits' : 'Voir les droits'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {ouvert && brouillon && (
        <div className="acces-modal-overlay" onClick={() => setOuvert(null)}>
          <div className="acces-modal acces-modal-large" onClick={e => e.stopPropagation()}>
            <div className="acces-modal-header">
              <h2>{peutEcrire ? 'Modifier' : 'Droits de'} — {brouillon.label}</h2>
              <button className="acces-modal-close" onClick={() => setOuvert(null)}>✕</button>
            </div>

            <div className="acces-modal-body">
              {peutEcrire && (
                <div className="acces-form-section">
                  <div className="acces-form-section-title">Libellé</div>
                  <input className="modale-input" value={brouillon.label}
                    onChange={e => setBrouillon(b => ({ ...b, label: e.target.value }))} />
                  <div className="acces-form-section-title">Description</div>
                  <input className="modale-input" value={brouillon.description}
                    onChange={e => setBrouillon(b => ({ ...b, description: e.target.value }))} />
                </div>
              )}

              <div className="acces-form-section">
                <div className="acces-form-section-title">Droits par module</div>
                <PermMatrix
                  perms={brouillon.perms}
                  readOnly={!peutEcrire}
                  onChange={(moduleId, perm) =>
                    setBrouillon(b => ({ ...b, perms: { ...b.perms, [moduleId]: perm } }))}
                />
                <p className="acces-pwd-hint">
                  Ces droits pilotent l'affichage : ce qui est visible et modifiable à
                  l'écran. Ils ne remplacent pas un contrôle serveur, qui viendra avec
                  le backend.
                </p>
              </div>
            </div>

            <div className="acces-modal-footer">
              {peutEcrire && (
                <button className="btn-secondary" onClick={reinitialiser}>
                  Revenir aux droits standards
                </button>
              )}
              <button className="btn-secondary" onClick={() => setOuvert(null)}>
                {peutEcrire ? 'Annuler' : 'Fermer'}
              </button>
              {peutEcrire && (
                <button className="btn-primary" onClick={sauvegarder}>Enregistrer</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
