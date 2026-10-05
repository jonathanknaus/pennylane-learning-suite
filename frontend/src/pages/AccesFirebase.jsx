import { useState, useEffect } from 'react'
import {
  ecouterAcces, enregistrerAcces, supprimerAcces, estAdminRacine, PROFILS, ADMINS_RACINE,
} from '../data/firebase-auth'
import { getCurrentUser } from '../data/auth'

const VIDE = { email: '', nom: '', prenom: '', profil: 'formateur_interne', actif: true }

// Écran de gestion des accès, branché en temps réel sur la base Firebase.
// La liste est partagée avec l'outil de veille : un accès accordé ici y vaut aussi.
export default function AccesFirebase() {
  const [liste, setListe] = useState([])
  const [chargement, setChargement] = useState(true)
  const [erreur, setErreur] = useState('')
  const [edition, setEdition] = useState(null)
  const [aSupprimer, setASupprimer] = useState(null)

  const moi = getCurrentUser()
  // Miroir des règles côté serveur : seuls les administrateurs racine écrivent.
  const peutEcrire = estAdminRacine(moi?.email)

  useEffect(() => {
    const stop = ecouterAcces(
      entrees => {
        setListe(entrees.sort((a, b) => (a.nom || a.email).localeCompare(b.nom || b.email)))
        setChargement(false)
        setErreur('')
      },
      err => {
        setChargement(false)
        setErreur(`Lecture impossible : ${err.message}`)
      },
    )
    return () => { if (typeof stop === 'function') stop() }
  }, [])

  async function sauvegarder(entree) {
    try {
      await enregistrerAcces(entree, moi?.email)
      setEdition(null)
      setErreur('')
    } catch (err) {
      setErreur(`Enregistrement refusé : ${err.message}`)
    }
  }

  async function supprimer(entree) {
    try {
      await supprimerAcces(entree.id)
      setASupprimer(null)
    } catch (err) {
      setASupprimer(null)
      setErreur(`Suppression refusée : ${err.message}`)
    }
  }

  return (
    <div>
      <div className="acces-fb-bandeau">
        <div>
          <strong>{liste.length}</strong> accès · synchronisé en direct avec l'outil de veille
        </div>
        {peutEcrire && (
          <button className="btn-primary" onClick={() => setEdition({ ...VIDE })}>
            + Nouvel accès
          </button>
        )}
      </div>

      {!peutEcrire && (
        <p className="acces-fb-lecture">
          Tu consultes cette liste en lecture seule. Seuls {ADMINS_RACINE.length} administrateurs
          peuvent la modifier, et cette restriction est appliquée côté serveur.
        </p>
      )}

      {erreur && <p className="acces-erreur">{erreur}</p>}

      {chargement ? (
        <p className="acces-empty">Chargement…</p>
      ) : liste.length === 0 ? (
        <p className="acces-empty">
          Aucun accès enregistré. Les administrateurs racine peuvent se connecter malgré tout,
          ce qui permet de créer la première entrée.
        </p>
      ) : (
        <div className="acces-users-table-wrap">
          <table className="acces-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Profil</th>
                <th>Statut</th>
                {peutEcrire && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {liste.map(e => {
                const protege = estAdminRacine(e.email)
                return (
                  <tr key={e.id} className={e.actif === false ? 'acces-fb-inactif' : ''}>
                    <td>
                      <div className="acces-user-name">
                        {[e.prenom, e.nom].filter(Boolean).join(' ') || '—'}
                        {protege && <span className="acces-badge-protected" title="Administrateur racine : non modifiable ici"> 🔒</span>}
                      </div>
                    </td>
                    <td className="acces-cell-email">{e.email}</td>
                    <td>
                      <span className={`acces-profil-badge acces-profil-${e.profil}`}>
                        {PROFILS[e.profil]?.label || e.profil}
                      </span>
                    </td>
                    <td>
                      {e.actif === false
                        ? <span className="acces-badge-warn">Désactivé</span>
                        : <span className="acces-badge-builtin">Actif</span>}
                    </td>
                    {peutEcrire && (
                      <td className="acces-cell-actions">
                        {protege ? (
                          <span className="acces-protected-hint">Protégé</span>
                        ) : (
                          <>
                            <button className="btn-icon-sm" title="Modifier" onClick={() => setEdition(e)}>✏️</button>
                            <button className="btn-icon-sm" title="Supprimer" onClick={() => setASupprimer(e)}>🗑</button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {edition && (
        <ModalAcces
          entree={edition}
          onClose={() => setEdition(null)}
          onSave={sauvegarder}
        />
      )}

      {aSupprimer && (
        <div className="acces-modal-overlay" onClick={() => setASupprimer(null)}>
          <div className="acces-confirm" onClick={ev => ev.stopPropagation()}>
            <p>Retirer l'accès de <strong>{aSupprimer.email}</strong> ?</p>
            <p className="acces-confirm-warn">
              La personne ne pourra plus se connecter aux deux outils. Effet immédiat.
            </p>
            <div className="acces-confirm-actions">
              <button className="btn-secondary" onClick={() => setASupprimer(null)}>Annuler</button>
              <button className="btn-danger" onClick={() => supprimer(aSupprimer)}>Retirer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ModalAcces({ entree, onClose, onSave }) {
  const [form, setForm] = useState({ ...VIDE, ...entree })
  const [erreur, setErreur] = useState('')
  const nouveau = !entree.id

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function valider() {
    const email = form.email.trim().toLowerCase()
    if (!email.includes('@')) return setErreur('Adresse email invalide.')
    if (!email.endsWith('@pennylane.com') && !email.endsWith('@pennylane-partners.com')) {
      return setErreur('Seuls les domaines @pennylane.com et @pennylane-partners.com sont autorisés par les règles.')
    }
    if (!form.nom.trim() && !form.prenom.trim()) return setErreur('Renseigne au moins un nom ou un prénom.')
    setErreur('')
    onSave({ ...form, email })
  }

  return (
    <div className="acces-modal-overlay" onClick={onClose}>
      <div className="acces-modal" onClick={e => e.stopPropagation()}>
        <div className="acces-modal-header">
          <h2>{nouveau ? 'Nouvel accès' : 'Modifier l\'accès'}</h2>
          <button className="acces-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="acces-modal-body">
          <div className="acces-form-section">
            <div className="acces-form-section-title">Identité</div>
            <div className="acces-id-row">
              <div style={{ flex: 1 }}>
                <label className="acces-form-section-title" htmlFor="fb-nom">Nom</label>
                <input id="fb-nom" className="modale-input" value={form.nom}
                  onChange={e => set('nom', e.target.value)} placeholder="MARTIN" />
              </div>
              <div style={{ flex: 1 }}>
                <label className="acces-form-section-title" htmlFor="fb-prenom">Prénom</label>
                <input id="fb-prenom" className="modale-input" value={form.prenom}
                  onChange={e => set('prenom', e.target.value)} placeholder="Sophie" />
              </div>
            </div>
            <label className="acces-form-section-title" htmlFor="fb-email">
              Email du compte Google
            </label>
            <input id="fb-email" className="modale-input" type="email" value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="prenom.nom@pennylane.com" />
            <p className="acces-pwd-hint">
              C'est l'adresse du compte Google utilisé pour se connecter. Aucun mot de passe
              à créer ni à transmettre.
            </p>
          </div>

          <div className="acces-form-section">
            <div className="acces-form-section-title">Profil</div>
            <select className="modale-input" value={form.profil} onChange={e => set('profil', e.target.value)}>
              {Object.entries(PROFILS).map(([id, p]) => (
                <option key={id} value={id}>{p.label}</option>
              ))}
            </select>
            <p className="acces-profil-desc">{PROFILS[form.profil]?.description}</p>

            <label className="acces-custom-toggle">
              <input type="checkbox" checked={form.actif !== false}
                onChange={e => set('actif', e.target.checked)} />
              Accès actif
            </label>
            <p className="acces-pwd-hint">
              Désactiver conserve la fiche mais bloque la connexion. Utile pour une absence.
            </p>
          </div>

          {erreur && <p className="acces-erreur">{erreur}</p>}
        </div>

        <div className="acces-modal-footer">
          <button className="btn-secondary" onClick={onClose}>Annuler</button>
          <button className="btn-primary" onClick={valider}>
            {nouveau ? 'Créer l\'accès' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
