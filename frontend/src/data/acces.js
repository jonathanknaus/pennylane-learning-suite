// Gestion des accès utilisateurs PLS
// Identifiants au format NOM_PLS, mot de passe à changer à la première connexion.

const KEY_USERS = 'pls_acces_users'
const KEY_PROFILS = 'pls_acces_profils'

// ── Modules de la sidebar (doit rester en phase avec NAV_ADMIN dans App.jsx) ──
export const MODULES_ACCES = [
  {
    group: 'Formation',
    items: [
      { id: 'accueil',      label: 'Accueil' },
      { id: 'catalogue',    label: 'Catalogue AFS' },
      { id: 'sessions',     label: 'Sessions' },
      { id: 'calendrier',   label: 'Calendrier' },
    ],
  },
  {
    group: 'Participants',
    items: [
      { id: 'stagiaires',   label: 'Apprenants' },
      { id: 'entreprises',  label: 'Cabinets' },
    ],
  },
  {
    group: 'Équipe',
    items: [
      { id: 'formateurs',   label: 'Formateurs' },
      { id: 'gestionnaires', label: 'Resp. admin. & réglementaire' },
      { id: 'financeurs',   label: 'Financeurs' },
    ],
  },
  {
    group: 'Gestion',
    items: [
      { id: 'pipeline',     label: 'Indicateurs' },
      { id: 'devis',        label: 'Devis' },
      { id: 'facturation',  label: 'Facturation' },
      { id: 'bilan',        label: 'Bilan annuel' },
      { id: 'reclamations', label: 'Réclamations' },
      { id: 'documents',    label: 'Documents Qualiopi' },
      { id: 'presentation', label: 'Présentation dossier' },
    ],
  },
  {
    group: 'Ressources',
    items: [
      { id: 'veille',        label: 'Veille juridique' },
      { id: 'webinaires',    label: 'Webinaires' },
      { id: 'product-update', label: 'Product Update' },
    ],
  },
  {
    group: 'Configuration',
    items: [
      { id: 'parametres',   label: 'Paramètres' },
    ],
  },
]

// Valeur par défaut d'une permission : aucun accès
export function emptyPerm() {
  return { acces: false, lecture: false, ecriture: false }
}

// Génère un objet permissions complet (toutes clés à false)
export function emptyPerms() {
  const perms = {}
  MODULES_ACCES.forEach(g => g.items.forEach(i => { perms[i.id] = emptyPerm() }))
  return perms
}

// ── Profils types ─────────────────────────────────────────────────────────────

function fullPerm()    { return { acces: true, lecture: true, ecriture: true } }
function readPerm()    { return { acces: true, lecture: true, ecriture: false } }
function noPerm()      { return { acces: false, lecture: false, ecriture: false } }

export const PROFILS_DEFAUT = {
  administrateur: {
    id: 'administrateur',
    label: 'Administrateur',
    description: 'Accès complet à tous les modules',
    builtin: true,
    perms: (() => {
      const p = {}
      MODULES_ACCES.forEach(g => g.items.forEach(i => { p[i.id] = fullPerm() }))
      return p
    })(),
  },
  formateur_interne: {
    id: 'formateur_interne',
    label: 'Formateur interne',
    description: 'Accès en lecture/écriture à ses sessions, lecture sur le reste',
    builtin: true,
    perms: (() => {
      const p = emptyPerms()
      ;['accueil', 'catalogue', 'sessions', 'calendrier', 'stagiaires'].forEach(id => { p[id] = fullPerm() })
      ;['entreprises', 'veille', 'webinaires', 'product-update', 'documents', 'bilan'].forEach(id => { p[id] = readPerm() })
      ;['formateurs', 'gestionnaires', 'financeurs', 'pipeline', 'devis', 'facturation', 'reclamations', 'presentation', 'parametres'].forEach(id => { p[id] = noPerm() })
      return p
    })(),
  },
  consultatif: {
    id: 'consultatif',
    label: 'Consultatif',
    description: 'Lecture seule sur les modules essentiels',
    builtin: true,
    perms: (() => {
      const p = emptyPerms()
      ;['accueil', 'catalogue', 'sessions', 'calendrier', 'stagiaires', 'entreprises', 'bilan', 'documents', 'veille', 'webinaires'].forEach(id => { p[id] = readPerm() })
      return p
    })(),
  },
}

// ── Persistance profils ────────────────────────────────────────────────────────
// Les profils custom peuvent surcharger un profil builtin (même id).
// Les profils builtin supprimés sont mémorisés dans KEY_PROFILS_DELETED.

const KEY_PROFILS_DELETED = 'pls_acces_profils_deleted'

function getProfilsDeleted() {
  try { return new Set(JSON.parse(localStorage.getItem(KEY_PROFILS_DELETED) || '[]')) } catch { return new Set() }
}

export function getProfilsCustom() {
  try { return JSON.parse(localStorage.getItem(KEY_PROFILS) || '[]') } catch { return [] }
}

export function getAllProfils() {
  const customs = getProfilsCustom()
  const customIds = new Set(customs.map(p => p.id))
  const deleted = getProfilsDeleted()
  // Builtin non supprimés et non surchargés par un custom
  const builtins = Object.values(PROFILS_DEFAUT).filter(p => !customIds.has(p.id) && !deleted.has(p.id))
  return [...builtins, ...customs]
}

export function saveProfil(profil) {
  const list = getProfilsCustom()
  const idx = list.findIndex(p => p.id === profil.id)
  const entry = { ...profil, builtin: false }
  if (idx >= 0) list[idx] = entry
  else list.push({ ...entry, id: profil.id || `profil_${Date.now()}` })
  localStorage.setItem(KEY_PROFILS, JSON.stringify(list))
}

export function deleteProfil(id) {
  // Supprime du store custom
  const list = getProfilsCustom().filter(p => p.id !== id)
  localStorage.setItem(KEY_PROFILS, JSON.stringify(list))
  // Si c'était un builtin, le marquer comme supprimé
  if (PROFILS_DEFAUT[id]) {
    const deleted = getProfilsDeleted()
    deleted.add(id)
    localStorage.setItem(KEY_PROFILS_DELETED, JSON.stringify([...deleted]))
  }
}

// ── Persistance utilisateurs ──────────────────────────────────────────────────

const COMPTE_KNAUS = {
  id: 'usr_knaus_jk',
  nom: 'KNAUS',
  prenom: 'Jonathan',
  email: 'jonathan.knaus@pennylane.com',
  telephone: '',
  identifiant: 'KNAUS_PLS',
  password: '••••••••••',
  profilId: 'administrateur',
  permsPersonnalisees: false,
  perms: null,
  mustChangePassword: false,
  protected: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export function getUsers() {
  try {
    const stored = JSON.parse(localStorage.getItem(KEY_USERS) || '[]')
    // Injecter le compte protégé s'il n'est pas déjà dans le store
    if (!stored.find(u => u.id === COMPTE_KNAUS.id)) {
      return [COMPTE_KNAUS, ...stored]
    }
    return stored
  } catch { return [COMPTE_KNAUS] }
}

export function saveUser(user) {
  const list = getUsers()
  const idx = list.findIndex(u => u.id === user.id)
  const now = new Date().toISOString()
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...user, updatedAt: now }
  } else {
    list.push({
      ...user,
      id: user.id || `usr_${Date.now()}`,
      createdAt: now,
      updatedAt: now,
      mustChangePassword: true,
    })
  }
  localStorage.setItem(KEY_USERS, JSON.stringify(list))
  return list
}

export function deleteUser(id) {
  const list = getUsers().filter(u => u.id !== id)
  localStorage.setItem(KEY_USERS, JSON.stringify(list))
}

// Génère un identifiant au format NOM_PLS (ex: MARTIN_PLS)
export function genererIdentifiant(nom) {
  const base = nom
    .toUpperCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 16)
  const suffix = '_PLS'
  let identifiant = base + suffix
  const existing = getUsers().map(u => u.identifiant)
  let i = 2
  while (existing.includes(identifiant)) {
    identifiant = base + i + suffix
    i++
  }
  return identifiant
}

// Génère un mot de passe aléatoire 10 caractères (à changer à la 1ère connexion)
export function genererMotDePasse() {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$'
  let pwd = ''
  for (let i = 0; i < 10; i++) pwd += chars[Math.floor(Math.random() * chars.length)]
  return pwd
}
