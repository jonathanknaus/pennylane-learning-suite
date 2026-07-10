import { useState } from 'react'
import {
  getUsers, saveUser, deleteUser, genererIdentifiant, genererMotDePasse,
  getAllProfils, getProfilsCustom, saveProfil, deleteProfil,
  MODULES_ACCES, PROFILS_DEFAUT, emptyPerms, emptyPerm,
} from '../data/acces'
import './GestionAcces.css'

// ── Matrice de permissions ────────────────────────────────────────────────────

function PermMatrix({ perms, onChange, readOnly }) {
  function toggle(moduleId, champ) {
    if (readOnly) return
    const cur = perms[moduleId] || emptyPerm()
    let next = { ...cur, [champ]: !cur[champ] }
    // Cohérence : accès requis pour lecture/écriture ; écriture implique lecture
    if (champ === 'acces' && !next.acces) next = { acces: false, lecture: false, ecriture: false }
    if (champ === 'lecture' && next.lecture && !next.acces) next.acces = true
    if (champ === 'ecriture' && next.ecriture) { next.acces = true; next.lecture = true }
    if (champ === 'lecture' && !next.lecture) next.ecriture = false
    onChange(moduleId, next)
  }

  return (
    <div className="perm-matrix">
      <div className="perm-matrix-head">
        <div className="perm-col-module">Module</div>
        <div className="perm-col-check">Accès</div>
        <div className="perm-col-check">Lecture</div>
        <div className="perm-col-check">Écriture</div>
      </div>
      {MODULES_ACCES.map(group => (
        <div key={group.group} className="perm-group">
          <div className="perm-group-label">{group.group}</div>
          {group.items.map(item => {
            const p = perms[item.id] || emptyPerm()
            return (
              <div key={item.id} className={`perm-row ${p.acces ? 'perm-row-on' : ''}`}>
                <div className="perm-col-module">{item.label}</div>
                {['acces', 'lecture', 'ecriture'].map(champ => (
                  <div key={champ} className="perm-col-check">
                    <input
                      type="checkbox"
                      checked={!!p[champ]}
                      onChange={() => toggle(item.id, champ)}
                      disabled={readOnly}
                      className="perm-checkbox"
                    />
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ── Modale utilisateur ────────────────────────────────────────────────────────

const EMPTY_USER = {
  nom: '', prenom: '', email: '', telephone: '',
  identifiant: '', password: '',
  profilId: 'administrateur',
  permsPersonnalisees: false,
  perms: null,
}

function ModalUser({ user, onClose, onSave }) {
  const isNew = !user?.id
  const [form, setForm] = useState(() => user
    ? { ...EMPTY_USER, ...user }
    : { ...EMPTY_USER, password: genererMotDePasse() }
  )
  const [showPwd, setShowPwd] = useState(false)
  const [erreur, setErreur] = useState('')
  const profils = getAllProfils()

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleNomBlur() {
    if (isNew && form.nom && !form.identifiant) {
      set('identifiant', genererIdentifiant(form.nom))
    }
  }

  function handleProfilChange(profilId) {
    set('profilId', profilId)
    if (!form.permsPersonnalisees) set('perms', null)
  }

  function handleToggleCustom(v) {
    set('permsPersonnalisees', v)
    if (v && !form.perms) {
      const profil = profils.find(p => p.id === form.profilId)
      set('perms', profil ? { ...profil.perms } : emptyPerms())
    }
    if (!v) set('perms', null)
  }

  function handlePermChange(moduleId, perm) {
    set('perms', { ...(form.perms || emptyPerms()), [moduleId]: perm })
  }

  function handleSave(e) {
    e.preventDefault()
    if (!form.nom.trim()) { setErreur('Le nom est requis.'); return }
    if (!form.prenom.trim()) { setErreur('Le prénom est requis.'); return }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setErreur('Email invalide.'); return }
    if (!form.identifiant.trim()) { setErreur("L'identifiant est requis."); return }
    if (!form.password.trim()) { setErreur('Le mot de passe est requis.'); return }
    setErreur('')
    onSave(form)
    onClose()
  }

  const permsEffectives = form.permsPersonnalisees
    ? (form.perms || emptyPerms())
    : (profils.find(p => p.id === form.profilId)?.perms || emptyPerms())

  return (
    <div className="acces-modal-overlay" onClick={onClose}>
      <div className="acces-modal" onClick={e => e.stopPropagation()}>
        <div className="acces-modal-header">
          <h2>{isNew ? 'Nouvel utilisateur' : `Modifier — ${user.prenom} ${user.nom}`}</h2>
          <button className="acces-modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSave} className="acces-modal-body">
          <div className="acces-form-section">
            <div className="acces-form-section-title">Identité</div>
            <div className="form-row">
              <div className="form-group">
                <label>Nom *</label>
                <input value={form.nom} onChange={e => set('nom', e.target.value)} onBlur={handleNomBlur} placeholder="MARTIN" />
              </div>
              <div className="form-group">
                <label>Prénom *</label>
                <input value={form.prenom} onChange={e => set('prenom', e.target.value)} placeholder="Sophie" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="sophie.martin@…" />
              </div>
              <div className="form-group">
                <label>Téléphone</label>
                <input type="tel" value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="06 …" />
              </div>
            </div>
          </div>

          <div className="acces-form-section">
            <div className="acces-form-section-title">Identifiants de connexion</div>
            <div className="form-row">
              <div className="form-group">
                <label>Identifiant (généré auto)</label>
                <div className="acces-id-row">
                  <input value={form.identifiant} onChange={e => set('identifiant', e.target.value)} placeholder="NOM_PLS" className="acces-id-input" />
                  <button type="button" className="btn-regen" onClick={() => set('identifiant', genererIdentifiant(form.nom))} title="Regénérer">↺</button>
                </div>
              </div>
              <div className="form-group">
                <label>Mot de passe provisoire</label>
                <div className="acces-id-row">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    className="acces-id-input"
                  />
                  <button type="button" className="btn-regen" onClick={() => setShowPwd(v => !v)} title={showPwd ? 'Masquer' : 'Afficher'}>{showPwd ? '🙈' : '👁'}</button>
                  <button type="button" className="btn-regen" onClick={() => set('password', genererMotDePasse())} title="Regénérer">↺</button>
                </div>
                <div className="acces-pwd-hint">L'utilisateur devra le changer à sa première connexion.</div>
              </div>
            </div>
          </div>

          <div className="acces-form-section">
            <div className="acces-form-section-title">Profil et permissions</div>
            <div className="form-row">
              <div className="form-group">
                <label>Profil de base</label>
                <select value={form.profilId} onChange={e => handleProfilChange(e.target.value)}>
                  {profils.map(p => (
                    <option key={p.id} value={p.id}>{p.label}{p.builtin ? '' : ' (personnalisé)'}</option>
                  ))}
                </select>
                {profils.find(p => p.id === form.profilId)?.description && (
                  <div className="acces-profil-desc">{profils.find(p => p.id === form.profilId).description}</div>
                )}
              </div>
            </div>

            <label className="acces-custom-toggle">
              <input
                type="checkbox"
                checked={form.permsPersonnalisees}
                onChange={e => handleToggleCustom(e.target.checked)}
              />
              Personnaliser les permissions pour cet utilisateur
            </label>

            <PermMatrix
              perms={permsEffectives}
              onChange={handlePermChange}
              readOnly={!form.permsPersonnalisees}
            />
          </div>

          {erreur && <p className="acces-erreur">{erreur}</p>}

          <div className="acces-modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary">{isNew ? 'Créer l\'utilisateur' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modale profil personnalisé ────────────────────────────────────────────────

function ModalProfil({ profil, onClose, onSave }) {
  const isNew = !profil?.id
  const [form, setForm] = useState(() => profil
    ? { ...profil }
    : { id: '', label: '', description: '', perms: emptyPerms(), builtin: false }
  )
  const [erreur, setErreur] = useState('')

  function handlePermChange(moduleId, perm) {
    setForm(f => ({ ...f, perms: { ...f.perms, [moduleId]: perm } }))
  }

  function handleSave(e) {
    e.preventDefault()
    if (!form.label.trim()) { setErreur('Le nom du profil est requis.'); return }
    const id = form.id || `profil_${form.label.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`
    onSave({ ...form, id })
    onClose()
  }

  function handleCopierProfil(profilId) {
    const src = getAllProfils().find(p => p.id === profilId)
    if (src) setForm(f => ({ ...f, perms: { ...src.perms } }))
  }

  return (
    <div className="acces-modal-overlay" onClick={onClose}>
      <div className="acces-modal acces-modal-large" onClick={e => e.stopPropagation()}>
        <div className="acces-modal-header">
          <h2>{isNew ? 'Nouveau profil personnalisé' : `Modifier le profil — ${profil.label}`}</h2>
          <button className="acces-modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSave} className="acces-modal-body">
          <div className="acces-form-section">
            <div className="form-row">
              <div className="form-group">
                <label>Nom du profil *</label>
                <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Ex : Formateur externe" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Courte description…" />
              </div>
            </div>
            <div className="form-group">
              <label>Copier depuis un profil existant</label>
              <select defaultValue="" onChange={e => e.target.value && handleCopierProfil(e.target.value)}>
                <option value="">— choisir —</option>
                {getAllProfils().filter(p => p.id !== form.id).map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="acces-form-section">
            <div className="acces-form-section-title">Matrice de permissions</div>
            <PermMatrix perms={form.perms} onChange={handlePermChange} readOnly={false} />
          </div>

          {erreur && <p className="acces-erreur">{erreur}</p>}

          <div className="acces-modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn-primary">{isNew ? 'Créer le profil' : 'Enregistrer'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function GestionAcces() {
  const [subOnglet, setSubOnglet] = useState('utilisateurs')
  const [users, setUsers] = useState(getUsers)
  const [profils, setProfils] = useState(getAllProfils)
  const [modalUser, setModalUser] = useState(null)   // null | user | { _new: true }
  const [modalProfil, setModalProfil] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  function refreshUsers() { setUsers(getUsers()) }
  function refreshProfils() { setProfils(getAllProfils()) }

  function handleSaveUser(form) {
    saveUser(form)
    refreshUsers()
  }

  function handleDeleteUser(id) {
    deleteUser(id)
    refreshUsers()
    setConfirmDel(null)
  }

  function handleSaveProfil(profil) {
    saveProfil(profil)
    refreshProfils()
  }

  function handleDeleteProfil(id) {
    deleteProfil(id)
    refreshProfils()
    setConfirmDel(null)
  }

  return (
    <div className="param-section">
      <div className="param-section-header">
        <h2>Gestion des accès</h2>
        <p>Utilisateurs, profils et permissions par module</p>
      </div>

      <div className="acces-sub-tabs">
        <button className={`acces-sub-tab ${subOnglet === 'utilisateurs' ? 'active' : ''}`} onClick={() => setSubOnglet('utilisateurs')}>
          Utilisateurs ({users.length})
        </button>
        <button className={`acces-sub-tab ${subOnglet === 'profils' ? 'active' : ''}`} onClick={() => setSubOnglet('profils')}>
          Profils
        </button>
      </div>

      {/* ── Onglet Utilisateurs ── */}
      {subOnglet === 'utilisateurs' && (
        <div>
          <div className="acces-toolbar">
            <button className="btn-primary" onClick={() => setModalUser({ _new: true })}>+ Nouvel utilisateur</button>
          </div>

          {users.length === 0 ? (
            <div className="acces-empty">Aucun utilisateur configuré. Créez le premier compte.</div>
          ) : (
            <div className="acces-users-table-wrap">
              <table className="acces-table">
                <thead>
                  <tr>
                    <th>Nom / Prénom</th>
                    <th>Email</th>
                    <th>Identifiant</th>
                    <th>Profil</th>
                    <th>Permissions</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const profil = getAllProfils().find(p => p.id === u.profilId)
                    return (
                      <tr key={u.id}>
                        <td>
                          <div className="acces-user-name">{u.prenom} {u.nom}</div>
                          {u.telephone && <div className="acces-user-tel">{u.telephone}</div>}
                        </td>
                        <td className="acces-cell-email">{u.email}</td>
                        <td>
                          <code className="acces-identifiant">{u.identifiant}</code>
                          {u.mustChangePassword && (
                            <span className="acces-badge-warn">pwd à changer</span>
                          )}
                        </td>
                        <td>
                          <span className={`acces-profil-badge acces-profil-${u.profilId}`}>
                            {profil?.label || u.profilId}
                          </span>
                          {u.permsPersonnalisees && (
                            <span className="acces-badge-custom">personnalisé</span>
                          )}
                        </td>
                        <td>
                          <PermSummary perms={u.permsPersonnalisees ? u.perms : profil?.perms} />
                        </td>
                        <td className="acces-cell-actions">
                          <button className="btn-icon-sm" onClick={() => setModalUser(u)} title="Modifier">✏️</button>
                          <button className="btn-icon-sm danger" onClick={() => setConfirmDel({ type: 'user', id: u.id, label: `${u.prenom} ${u.nom}` })} title="Supprimer">✕</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Onglet Profils ── */}
      {subOnglet === 'profils' && (
        <div>
          <div className="acces-toolbar">
            <button className="btn-primary" onClick={() => setModalProfil({ _new: true })}>+ Nouveau profil</button>
          </div>

          <div className="acces-profils-grid">
            {getAllProfils().map(p => (
              <div key={p.id} className={`acces-profil-card ${p.builtin ? 'builtin' : ''}`}>
                <div className="acces-profil-card-head">
                  <div>
                    <div className="acces-profil-card-label">{p.label}</div>
                    {p.builtin && <span className="acces-badge-builtin">Profil type</span>}
                  </div>
                  {!p.builtin && (
                    <div className="acces-profil-card-actions">
                      <button className="btn-icon-sm" onClick={() => setModalProfil(p)} title="Modifier">✏️</button>
                      <button className="btn-icon-sm danger" onClick={() => setConfirmDel({ type: 'profil', id: p.id, label: p.label })} title="Supprimer">✕</button>
                    </div>
                  )}
                </div>
                {p.description && <p className="acces-profil-card-desc">{p.description}</p>}
                <PermSummaryCompact perms={p.perms} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modales ── */}
      {modalUser && (
        <ModalUser
          user={modalUser._new ? null : modalUser}
          onClose={() => setModalUser(null)}
          onSave={handleSaveUser}
        />
      )}

      {modalProfil && (
        <ModalProfil
          profil={modalProfil._new ? null : modalProfil}
          onClose={() => setModalProfil(null)}
          onSave={handleSaveProfil}
        />
      )}

      {confirmDel && (
        <div className="acces-modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="acces-confirm" onClick={e => e.stopPropagation()}>
            <p>Supprimer <strong>{confirmDel.label}</strong> ?</p>
            <div className="acces-confirm-actions">
              <button className="btn-secondary" onClick={() => setConfirmDel(null)}>Annuler</button>
              <button className="btn-danger" onClick={() => confirmDel.type === 'user' ? handleDeleteUser(confirmDel.id) : handleDeleteProfil(confirmDel.id)}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sous-composants d'affichage rapide ────────────────────────────────────────

function PermSummary({ perms }) {
  if (!perms) return <span className="acces-perm-na">—</span>
  const all = MODULES_ACCES.flatMap(g => g.items)
  const actifs = all.filter(i => perms[i.id]?.acces)
  const ecriture = all.filter(i => perms[i.id]?.ecriture)
  return (
    <span className="acces-perm-summary">
      {actifs.length}/{all.length} modules · {ecriture.length} en écriture
    </span>
  )
}

function PermSummaryCompact({ perms }) {
  if (!perms) return null
  const groups = MODULES_ACCES.map(g => ({
    group: g.group,
    items: g.items.map(i => ({ ...i, p: perms[i.id] || emptyPerm() })),
  }))
  return (
    <div className="acces-perm-compact">
      {groups.map(g => (
        <div key={g.group} className="acces-perm-compact-group">
          <div className="acces-perm-compact-glabel">{g.group}</div>
          <div className="acces-perm-compact-items">
            {g.items.map(i => (
              <span
                key={i.id}
                className={`acces-perm-dot ${i.p.ecriture ? 'dot-rw' : i.p.lecture ? 'dot-ro' : i.p.acces ? 'dot-access' : 'dot-none'}`}
                title={`${i.label} : ${i.p.ecriture ? 'lecture + écriture' : i.p.lecture ? 'lecture' : i.p.acces ? 'accès seul' : 'aucun accès'}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
