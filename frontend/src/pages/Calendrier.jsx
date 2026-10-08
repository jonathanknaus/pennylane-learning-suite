import { useState, useEffect } from 'react'
import { getSessions, seedDemoSessions, STATUTS } from '../data/sessions'
import { getFormateurs } from '../data/formateurs'
import {
  ecouterIndisponibilites, indexerParJour, estIndisponible, plagesDuJour, etatCouverture, ORIGINES, jour,
} from '../data/indisponibilites'
import { connecterAgenda, synchroniserAgendas, agendaConnecte, deconnecterAgenda } from '../data/agenda-google'
import './Calendrier.css'

const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MOIS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const COLORS = [
  { bg: '#DAFBF2', border: '#00F872', text: '#003D3D' },
  { bg: '#EFF6FF', border: '#2563EB', text: '#1D4ED8' },
  { bg: '#FDF4FF', border: '#9333EA', text: '#7E22CE' },
  { bg: '#FFF7ED', border: '#F97316', text: '#C2410C' },
  { bg: '#F0FDF4', border: '#22C55E', text: '#15803D' },
  { bg: '#FEF2F2', border: '#EF4444', text: '#B91C1C' },
]

function getMonthDays(year, month) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  // Start grid on Monday
  let startDow = firstDay.getDay()
  startDow = startDow === 0 ? 6 : startDow - 1
  const days = []
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, 1 - startDow + i)
    days.push({ date: d, currentMonth: false })
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ date: new Date(year, month, d), currentMonth: true })
  }
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1].date
    const next = new Date(last)
    next.setDate(next.getDate() + 1)
    days.push({ date: next, currentMonth: false })
  }
  return days
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function Calendrier() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [sessions, setSessions] = useState([])
  const [formateurs, setFormateurs] = useState([])
  const [filterFormateur, setFilterFormateur] = useState('')
  const [selectedSession, setSelectedSession] = useState(null)

  // Indisponibilités : brut pour l'affichage détaillé, index pour les tests par
  // jour (appelés une fois par formateur et par case du calendrier).
  const [indispoBrut, setIndispoBrut] = useState({})
  const [indexIndispo, setIndexIndispo] = useState(null)
  const [connecte, setConnecte] = useState(agendaConnecte())
  const [synchro, setSynchro] = useState(null)
  const [erreurAgenda, setErreurAgenda] = useState('')
  const [enCours, setEnCours] = useState(false)

  useEffect(() => {
    seedDemoSessions()
    setSessions(getSessions())
    setFormateurs(getFormateurs())
  }, [])

  useEffect(() => {
    const stop = ecouterIndisponibilites(
      brut => { setIndispoBrut(brut); setIndexIndispo(indexerParJour(brut)) },
      err => setErreurAgenda(err.message),
    )
    return () => { if (typeof stop === 'function') stop() }
  }, [])

  async function connecter() {
    setErreurAgenda('')
    setEnCours(true)
    try {
      const email = await connecterAgenda()
      setConnecte(true)
      setSynchro({ message: `Agenda de ${email || 'votre compte'} connecté.` })
    } catch (err) {
      setErreurAgenda(err?.message || 'Connexion à l’agenda impossible.')
    }
    setEnCours(false)
  }

  // Le mois affiché, pas « les 12 prochains mois » : on n'interroge que ce que
  // l'utilisateur regarde, et une resynchronisation ne touche que cette fenêtre.
  async function synchroniser() {
    setErreurAgenda('')
    setEnCours(true)
    try {
      const debut = new Date(year, month, 1)
      const fin = new Date(year, month + 1, 1)
      const r = await synchroniserAgendas(formateurs, debut, fin)
      setSynchro(r)
    } catch (err) {
      setErreurAgenda(err?.message || 'Lecture des agendas impossible.')
      setConnecte(agendaConnecte())
    }
    setEnCours(false)
  }

  function deconnecter() {
    deconnecterAgenda()
    setConnecte(false)
    setSynchro(null)
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }

  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }

  const days = getMonthDays(year, month)

  // Assign a color per formateur — use all formateurs, not just those with sessions
  const formateursNoms = formateurs.length > 0
    ? formateurs.map(f => `${f.prenom} ${f.nom}`.trim())
    : [...new Set(sessions.map(s => s.formateur).filter(Boolean))]
  const formateursUniques = formateursNoms.length > 0
    ? formateursNoms
    : [...new Set(sessions.map(s => s.formateur).filter(Boolean))]
  const colorMap = {}
  formateursUniques.forEach((nom, i) => { colorMap[nom] = COLORS[i % COLORS.length] })

  const filteredSessions = sessions.filter(s => {
    if (!filterFormateur) return true
    return s.formateur === filterFormateur
  })

  function getSessionsForDay(date) {
    return filteredSessions.filter(s => {
      if (!s.date) return false
      const d = new Date(s.date + 'T12:00:00')
      return isSameDay(d, date)
    })
  }

  const statut = (s) => STATUTS.find(st => st.id === s.statut)
  const couverture = etatCouverture(indispoBrut, formateurs)

  // Formateurs indisponibles un jour donné, en respectant le filtre courant.
  function indisposDuJour(date) {
    if (!indexIndispo) return []
    const d = jour(date)
    return formateurs.filter(f => {
      if (filterFormateur && `${f.prenom} ${f.nom}`.trim() !== filterFormateur) return false
      return estIndisponible(indexIndispo, f.id, d)
    })
  }

  return (
    <div className="calendrier">
      <div className="cal-topbar">
        <div>
          <h1 className="cal-title">Calendrier des formateurs</h1>
          <p className="cal-sub">
            {sessions.length} session{sessions.length > 1 ? 's' : ''} planifiée{sessions.length > 1 ? 's' : ''}
            {couverture.couverts > 0 && ` · ${couverture.couverts}/${couverture.total} agenda${couverture.couverts > 1 ? 's' : ''} relevé${couverture.couverts > 1 ? 's' : ''}`}
          </p>
        </div>
        <div className="cal-agenda-actions">
          {!connecte ? (
            <button className="cal-btn-agenda" onClick={connecter} disabled={enCours}>
              {enCours ? 'Connexion…' : '🔗 Connecter mon agenda'}
            </button>
          ) : (
            <>
              <button className="cal-btn-agenda" onClick={synchroniser} disabled={enCours}>
                {enCours ? 'Lecture…' : `↻ Relever les agendas — ${MOIS[month]} ${year}`}
              </button>
              <button className="cal-btn-agenda-sec" onClick={deconnecter} disabled={enCours}>
                Déconnecter
              </button>
            </>
          )}
        </div>
      </div>

      <p className="cal-agenda-note">
        Nous ne lisons que les <strong>plages occupées</strong> des agendas — jamais les titres, ni
        les participants, ni les lieux. L’autorisation Google vaut pour l’onglet en cours : elle n’est
        pas conservée.
      </p>

      {erreurAgenda && <div className="cal-agenda-erreur">{erreurAgenda}</div>}

      {synchro && (
        <div className="cal-agenda-bilan">
          {synchro.message || (
            <>
              {synchro.synchronises} agenda{synchro.synchronises > 1 ? 's' : ''} relevé{synchro.synchronises > 1 ? 's' : ''},
              {' '}{synchro.plages} plage{synchro.plages > 1 ? 's' : ''} occupée{synchro.plages > 1 ? 's' : ''} sur {MOIS[month]} {year}.
            </>
          )}
          {synchro.refuses?.length > 0 && (
            <div className="cal-agenda-refus">
              ⚠️ {synchro.refuses.length} agenda{synchro.refuses.length > 1 ? 's' : ''} non consultable{synchro.refuses.length > 1 ? 's' : ''} :
              {' '}{synchro.refuses.map(r => r.email).join(', ')}. Ces formateurs resteront affichés
              comme disponibles — demande-leur de partager leur agenda avec toi.
            </div>
          )}
          {synchro.sansEmail > 0 && (
            <div className="cal-agenda-refus">
              {synchro.sansEmail} formateur{synchro.sansEmail > 1 ? 's' : ''} sans adresse email : aucun
              agenda à relever.
            </div>
          )}
        </div>
      )}

      {/* Filtres formateurs */}
      {formateursUniques.length > 1 && (
        <div className="cal-formateur-strip">
          <button
            className={`cal-fmt-chip ${!filterFormateur ? 'active' : ''}`}
            onClick={() => setFilterFormateur('')}
          >
            Tous les formateurs
          </button>
          {formateursUniques.map(nom => {
            const c = colorMap[nom] || COLORS[0]
            return (
              <button
                key={nom}
                className={`cal-fmt-chip ${filterFormateur === nom ? 'active' : ''}`}
                style={filterFormateur === nom ? { background: c.bg, borderColor: c.border, color: c.text } : {}}
                onClick={() => setFilterFormateur(filterFormateur === nom ? '' : nom)}
              >
                <span className="cal-fmt-dot" style={{ background: c.border }} />
                {nom}
              </button>
            )
          })}
        </div>
      )}

      {/* Navigation mois */}
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevMonth}>‹</button>
        <div className="cal-month-label">
          <span className="cal-month">{MOIS[month]}</span>
          <span className="cal-year">{year}</span>
        </div>
        <button className="cal-nav-btn" onClick={nextMonth}>›</button>
        <button className="cal-today-btn" onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()) }}>
          Aujourd'hui
        </button>
      </div>

      {/* Grille calendrier */}
      <div className="cal-grid-wrap">
        <div className="cal-header-row">
          {JOURS.map(j => <div key={j} className="cal-header-cell">{j}</div>)}
        </div>
        <div className="cal-body">
          {days.map((day, idx) => {
            const daySessions = getSessionsForDay(day.date)
            const isToday = isSameDay(day.date, today)
            return (
              <div
                key={idx}
                className={`cal-cell ${!day.currentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
              >
                <div className={`cal-day-num ${isToday ? 'today-num' : ''}`}>{day.date.getDate()}</div>
                <div className="cal-day-events">
                  {daySessions.map(s => {
                    const c = colorMap[s.formateur] || COLORS[0]
                    return (
                      <button
                        key={s.id}
                        className="cal-event"
                        style={{ background: c.bg, borderLeft: `3px solid ${c.border}`, color: c.text }}
                        onClick={() => setSelectedSession(s)}
                        title={s.titre}
                      >
                        {s.heure && <span className="cal-event-time">{s.heure}</span>}
                        <span className="cal-event-titre">{s.titre}</span>
                      </button>
                    )
                  })}

                  {/* Indisponibilités : sous les sessions, visuellement en retrait.
                      Ce ne sont pas des événements à ouvrir, mais des créneaux à
                      éviter — et seules les PLAGES sont connues, pas leur objet. */}
                  {indisposDuJour(day.date).map(f => {
                    const plages = plagesDuJour(indispoBrut, f.id, jour(day.date))
                    const origines = [...new Set(plages.map(p => p.origine))]
                      .map(o => ORIGINES[o]?.label || o).join(', ')
                    return (
                      <div
                        key={`indispo_${f.id}`}
                        className="cal-indispo"
                        title={`${f.prenom} ${f.nom} — indisponible (${origines || 'origine inconnue'})`}
                      >
                        <span className="cal-indispo-point" />
                        <span className="cal-indispo-nom">{f.prenom} {f.nom.charAt(0)}.</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Légende */}
      {formateursUniques.length > 0 && (
        <div className="cal-legend">
          {formateursUniques.map(nom => {
            const c = colorMap[nom] || COLORS[0]
            return (
              <span key={nom} className="cal-legend-item">
                <span className="cal-legend-dot" style={{ background: c.border }} />
                {nom}
              </span>
            )
          })}
        </div>
      )}

      {/* Popup session */}
      {selectedSession && (
        <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
          <div className="modal cal-session-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedSession.titre}</h2>
              <button className="modal-close" onClick={() => setSelectedSession(null)}>×</button>
            </div>
            <div className="cal-session-details">
              {selectedSession.date && (
                <div className="cal-detail-row">
                  <span>📅 Date</span>
                  <strong>{new Date(selectedSession.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                </div>
              )}
              {selectedSession.heure && (
                <div className="cal-detail-row">
                  <span>🕐 Heure</span>
                  <strong>{selectedSession.heure}</strong>
                </div>
              )}
              {selectedSession.formateur && (
                <div className="cal-detail-row">
                  <span>👨‍🏫 Formateur</span>
                  <strong>{selectedSession.formateur}</strong>
                </div>
              )}
              {selectedSession.modalite && (
                <div className="cal-detail-row">
                  <span>📍 Modalité</span>
                  <strong>{selectedSession.modalite === 'visio' ? 'Visioconférence' : 'Présentiel'}</strong>
                </div>
              )}
              {selectedSession.client && (
                <div className="cal-detail-row">
                  <span>🏢 Client</span>
                  <strong>{selectedSession.client}</strong>
                </div>
              )}
              {selectedSession.statut && (
                <div className="cal-detail-row">
                  <span>Statut</span>
                  <span className="cal-statut-badge" style={{ color: statut(selectedSession)?.color }}>
                    {statut(selectedSession)?.label}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
