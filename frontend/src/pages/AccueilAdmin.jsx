import { useState, useEffect } from 'react'
import { getActionsAFaire } from '../data/actions-a-faire'
import { getNotificationsGestionnaireGlobal, markAsRead } from '../data/notifications'
import { getGestionnaires, getGestionnaireDefaut } from '../data/gestionnaires'
import { getCurrentUser } from '../data/auth'
import { formatDateLong } from '../data/sessions'
import './AccueilAdmin.css'

const TYPE_ICONS = {
  info_gestionnaire: '🔔',
  rappel_48h: '⏰',
  rappel_48h_supervision: '👁️',
  tache: '📋',
}

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

export default function AccueilAdmin({ onOpenSession }) {
  const [actions, setActions] = useState([])
  const [notifs, setNotifs] = useState([])
  const user = getCurrentUser()

  const gestionnaireCourant = getGestionnaires().find(g => g.email?.toLowerCase() === user?.email?.toLowerCase())
    || getGestionnaireDefaut()

  useEffect(() => {
    setActions(getActionsAFaire())
    if (gestionnaireCourant) setNotifs(getNotificationsGestionnaireGlobal(gestionnaireCourant.id))
  }, [])

  const bloquees = actions.filter(a => a.status === 'blocked')
  const aValider = actions.filter(a => a.status === 'ready_to_validate')
  const nonLues = notifs.filter(n => !n.lu)

  function handleClickNotif(n) {
    if (!n.lu) { markAsRead(n.id); setNotifs(getNotificationsGestionnaireGlobal(gestionnaireCourant.id)) }
    if (n.sessionId && onOpenSession) onOpenSession(n.sessionId)
  }

  const prenom = user?.prenom || gestionnaireCourant?.prenom || ''

  return (
    <div className="accueil-admin">
      <div className="accueil-admin-header">
        <h1 className="accueil-admin-title">Bonjour{prenom ? ` ${prenom}` : ''} 👋</h1>
        <p className="accueil-admin-sub">
          {actions.length === 0 && nonLues.length === 0
            ? 'Aucune action en attente — tout est à jour.'
            : `${actions.length} dossier${actions.length > 1 ? 's' : ''} nécessitent une action · ${nonLues.length} notification${nonLues.length > 1 ? 's' : ''} non lue${nonLues.length > 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="accueil-admin-grid">
        <div className="accueil-admin-col">
          <div className="accueil-admin-section">
            <h2 className="accueil-admin-section-title">🔴 Dossiers bloqués ({bloquees.length})</h2>
            {bloquees.length === 0 ? (
              <p className="accueil-admin-empty">Aucun dossier bloqué.</p>
            ) : (
              <div className="accueil-admin-list">
                {bloquees.map((a, i) => (
                  <button key={i} className="accueil-action-row blocked" onClick={() => onOpenSession?.(a.sessionId)}>
                    <div className="accueil-action-main">
                      <span className="accueil-action-titre">{a.sessionTitre}</span>
                      <span className="accueil-action-meta">{a.client}{a.date ? ` · ${formatDateLong(a.date)}` : ''}</span>
                    </div>
                    <span className="accueil-action-phase">{a.phaseLabel}</span>
                    {a.responsableNom && <span className="accueil-action-resp">{a.responsableNom}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="accueil-admin-section">
            <h2 className="accueil-admin-section-title">✅ Phases prêtes à valider ({aValider.length})</h2>
            {aValider.length === 0 ? (
              <p className="accueil-admin-empty">Aucune phase en attente de validation.</p>
            ) : (
              <div className="accueil-admin-list">
                {aValider.map((a, i) => (
                  <button key={i} className="accueil-action-row" onClick={() => onOpenSession?.(a.sessionId)}>
                    <div className="accueil-action-main">
                      <span className="accueil-action-titre">{a.sessionTitre}</span>
                      <span className="accueil-action-meta">{a.client}{a.date ? ` · ${formatDateLong(a.date)}` : ''}</span>
                    </div>
                    <span className="accueil-action-phase">{a.phaseLabel}</span>
                    {a.responsableNom && <span className="accueil-action-resp">{a.responsableNom}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="accueil-admin-col">
          <div className="accueil-admin-section">
            <h2 className="accueil-admin-section-title">🔔 Notifications récentes</h2>
            {notifs.length === 0 ? (
              <p className="accueil-admin-empty">Aucune notification.</p>
            ) : (
              <div className="accueil-admin-list">
                {notifs.slice(0, 15).map(n => (
                  <button key={n.id} className={`accueil-notif-row ${n.lu ? '' : 'unread'}`} onClick={() => handleClickNotif(n)}>
                    <span className="accueil-notif-icon">{TYPE_ICONS[n.type] || '🔔'}</span>
                    <div className="accueil-notif-body">
                      <div className="accueil-notif-titre">{n.titre}</div>
                      <div className="accueil-notif-msg">{n.message}</div>
                      <div className="accueil-notif-date">{timeAgo(n.createdAt)}</div>
                    </div>
                    {!n.lu && <span className="accueil-notif-dot" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
