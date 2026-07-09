import { useState, useEffect } from 'react'
import { getNotificationsFor, getNotificationsGestionnaireGlobal, markAsRead, markAllAsRead } from '../data/notifications'
import './CentreNotifications.css'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'à l’instant'
  if (min < 60) return `il y a ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `il y a ${h}h`
  const j = Math.floor(h / 24)
  return `il y a ${j}j`
}

const TYPE_ICONS = {
  info_gestionnaire: '🔔',
  rappel_48h: '⏰',
  rappel_48h_supervision: '👁️',
  tache: '📋',
}

export default function CentreNotifications({ destinataireType, destinataireId, vueGlobale = false, onNavigateSession }) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])

  function refresh() {
    setNotifs(vueGlobale && destinataireType === 'gestionnaire'
      ? getNotificationsGestionnaireGlobal(destinataireId)
      : getNotificationsFor(destinataireType, destinataireId))
  }

  useEffect(() => { refresh() }, [destinataireType, destinataireId])

  // Le centre reste monté en permanence dans la topbar : on repasse périodiquement
  // en revue le stockage pour capter les notifications créées ailleurs dans la session
  // (ex. bouton "Informer" cliqué sur une session, sans navigation ni remount).
  useEffect(() => {
    const interval = setInterval(refresh, 5000)
    return () => clearInterval(interval)
  }, [destinataireType, destinataireId])

  const unread = notifs.filter(n => !n.lu).length

  function handleOpen() {
    setOpen(v => {
      if (!v) refresh()
      return !v
    })
  }

  function handleClickNotif(n) {
    if (!n.lu) { markAsRead(n.id); refresh() }
    if (onNavigateSession && n.sessionId) onNavigateSession(n.sessionId)
  }

  return (
    <div className="cn-wrap">
      <button className="cn-bell" onClick={handleOpen} title="Notifications">
        🔔
        {unread > 0 && <span className="cn-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="cn-panel">
          <div className="cn-panel-header">
            <span>Notifications</span>
            {unread > 0 && (
              <button className="cn-mark-all" onClick={() => { markAllAsRead(destinataireType, destinataireId); refresh() }}>
                Tout marquer lu
              </button>
            )}
          </div>
          <div className="cn-list">
            {notifs.length === 0 ? (
              <div className="cn-empty">Aucune notification.</div>
            ) : (
              notifs.slice(0, 30).map(n => (
                <button key={n.id} className={`cn-item ${n.lu ? '' : 'unread'}`} onClick={() => handleClickNotif(n)}>
                  <span className="cn-item-icon">{TYPE_ICONS[n.type] || '🔔'}</span>
                  <div className="cn-item-body">
                    <div className="cn-item-titre">{n.titre}</div>
                    <div className="cn-item-msg">{n.message}</div>
                    <div className="cn-item-date">{timeAgo(n.createdAt)}</div>
                  </div>
                  {!n.lu && <span className="cn-item-dot" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
