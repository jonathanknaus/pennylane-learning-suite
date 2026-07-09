const KEY = 'pls_notifications'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

function save(list) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function getNotifications() {
  return load().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getNotificationsFor(destinataireType, destinataireId) {
  return getNotifications().filter(n => n.destinataireType === destinataireType && n.destinataireId === destinataireId)
}

export function getUnreadCount(destinataireType, destinataireId) {
  return getNotificationsFor(destinataireType, destinataireId).filter(n => !n.lu).length
}

export function getUnreadCountTotal() {
  return getNotifications().filter(n => !n.lu).length
}

export function addNotification({ destinataireType, destinataireId, type, sessionId, titre, message, lien, dedupeKey }) {
  const list = load()
  const notif = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    destinataireType, // 'gestionnaire' | 'formateur'
    destinataireId,
    type, // 'info_gestionnaire' | 'rappel_48h' | 'tache'
    sessionId,
    titre,
    message,
    lien: lien || null,
    dedupeKey: dedupeKey || null,
    lu: false,
    createdAt: new Date().toISOString(),
  }
  list.push(notif)
  save(list)
  return notif
}

export function hasNotification({ destinataireType, destinataireId, type, sessionId, dedupeKey }) {
  return load().some(n =>
    n.destinataireType === destinataireType &&
    n.destinataireId === destinataireId &&
    n.type === type &&
    n.sessionId === sessionId &&
    (!dedupeKey || n.dedupeKey === dedupeKey)
  )
}

// Évite les doublons pour les rappels générés automatiquement (recalculés à chaque chargement de page).
export function addNotificationOnce(params) {
  if (hasNotification(params)) return null
  return addNotification(params)
}

export function markAsRead(id) {
  const list = load().map(n => n.id === id ? { ...n, lu: true } : n)
  save(list)
}

export function markAllAsRead(destinataireType, destinataireId) {
  const list = load().map(n =>
    (n.destinataireType === destinataireType && n.destinataireId === destinataireId) ? { ...n, lu: true } : n
  )
  save(list)
}

export function deleteNotification(id) {
  save(load().filter(n => n.id !== id))
}

export function deleteReadNotifications(destinataireType, destinataireId) {
  save(load().filter(n =>
    !(n.destinataireType === destinataireType && n.destinataireId === destinataireId && n.lu)
  ))
}

// Vue élargie d'un gestionnaire : ses propres notifications + tous les rappels 48h envoyés
// aux formateurs (pour pouvoir relancer un formateur qui n'a pas réagi à temps).
export function getNotificationsGestionnaireGlobal(gestionnaireId) {
  return getNotifications().filter(n =>
    (n.destinataireType === 'gestionnaire' && n.destinataireId === gestionnaireId) ||
    (n.destinataireType === 'formateur' && n.type === 'rappel_48h')
  )
}
