import { useState, useMemo } from 'react'
import { getPipelineParMois, getCAParMois, getPipelineParFormateur, PIPELINE_STATUTS } from '../data/pipeline'
import { formatDateLong } from '../data/sessions'
import './Pipeline.css'

const NB_MOIS_OPTIONS = [
  { id: 6, label: '6 mois' },
  { id: 12, label: '12 mois' },
  { id: 24, label: '24 mois' },
]

function StackedBarChart({ data, statuts, actifs, onToggleStatut, onHoverCell, hovered }) {
  const width = 900
  const height = 280
  const padding = { top: 10, right: 10, bottom: 30, left: 40 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom
  const maxTotal = Math.max(1, ...data.map(d => statuts.filter(s => actifs.has(s.id)).reduce((sum, s) => sum + (d.parStatut[s.id]?.length || 0), 0)))
  const barW = chartW / data.length * 0.6
  const gap = chartW / data.length

  return (
    <div className="pipeline-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="pipeline-chart-svg" role="img" aria-label="Sessions par mois et par statut">
        {/* Grille horizontale légère */}
        {[0, 0.25, 0.5, 0.75, 1].map(f => (
          <line
            key={f}
            x1={padding.left} x2={width - padding.right}
            y1={padding.top + chartH * (1 - f)} y2={padding.top + chartH * (1 - f)}
            className="pipeline-grid-line"
          />
        ))}
        {/* Axe Y labels */}
        {[0, 0.5, 1].map(f => (
          <text key={f} x={padding.left - 8} y={padding.top + chartH * (1 - f) + 4} className="pipeline-axis-label" textAnchor="end">
            {Math.round(maxTotal * f)}
          </text>
        ))}
        {/* Barres empilées */}
        {data.map((d, i) => {
          const x = padding.left + gap * i + (gap - barW) / 2
          let yCursor = padding.top + chartH
          return (
            <g key={d.key}>
              {statuts.filter(s => actifs.has(s.id)).map(s => {
                const count = d.parStatut[s.id]?.length || 0
                if (count === 0) return null
                const h = (count / maxTotal) * chartH
                yCursor -= h
                const isHovered = hovered && hovered.moisKey === d.key && hovered.statutId === s.id
                return (
                  <rect
                    key={s.id}
                    x={x} y={yCursor} width={barW} height={Math.max(h - 2, 0)}
                    fill={s.color}
                    opacity={isHovered ? 1 : 0.88}
                    rx={2}
                    onMouseEnter={() => onHoverCell({ moisKey: d.key, statutId: s.id, count, sessions: d.parStatut[s.id] })}
                    onMouseLeave={() => onHoverCell(null)}
                    style={{ cursor: 'pointer' }}
                  />
                )
              })}
              <text x={x + barW / 2} y={height - padding.bottom + 16} className="pipeline-axis-label" textAnchor="middle">
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>
      {hovered && (
        <div className="pipeline-tooltip">
          <strong>{statuts.find(s => s.id === hovered.statutId)?.label}</strong> — {hovered.count} session{hovered.count > 1 ? 's' : ''}
          <div className="pipeline-tooltip-list">
            {hovered.sessions.slice(0, 5).map(s => (
              <div key={s.id}>{s.titre || s.client || 'Session sans titre'}</div>
            ))}
            {hovered.sessions.length > 5 && <div>+ {hovered.sessions.length - 5} autre(s)</div>}
          </div>
        </div>
      )}
    </div>
  )
}

function CALineChart({ data }) {
  const width = 900
  const height = 220
  const padding = { top: 10, right: 10, bottom: 30, left: 60 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom
  const maxVal = Math.max(1, ...data.map(d => d.emis))
  const stepX = chartW / Math.max(data.length - 1, 1)

  function pointsFor(field) {
    return data.map((d, i) => {
      const x = padding.left + stepX * i
      const y = padding.top + chartH * (1 - (d[field] / maxVal))
      return `${x},${y}`
    }).join(' ')
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="pipeline-chart-svg" role="img" aria-label="Chiffre d'affaires par mois">
      {[0, 0.5, 1].map(f => (
        <line key={f} x1={padding.left} x2={width - padding.right} y1={padding.top + chartH * (1 - f)} y2={padding.top + chartH * (1 - f)} className="pipeline-grid-line" />
      ))}
      {[0, 0.5, 1].map(f => (
        <text key={f} x={padding.left - 8} y={padding.top + chartH * (1 - f) + 4} className="pipeline-axis-label" textAnchor="end">
          {Math.round(maxVal * f).toLocaleString('fr-FR')} €
        </text>
      ))}
      <polyline points={pointsFor('emis')} className="pipeline-line pipeline-line-emis" />
      <polyline points={pointsFor('encaisse')} className="pipeline-line pipeline-line-encaisse" />
      {data.map((d, i) => {
        const x = padding.left + stepX * i
        return (
          <g key={d.key}>
            <circle cx={x} cy={padding.top + chartH * (1 - (d.emis / maxVal))} r={3.5} className="pipeline-dot pipeline-dot-emis" />
            <circle cx={x} cy={padding.top + chartH * (1 - (d.encaisse / maxVal))} r={3.5} className="pipeline-dot pipeline-dot-encaisse" />
            <text x={x} y={height - padding.bottom + 16} className="pipeline-axis-label" textAnchor="middle">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}

function FormateurBars({ data }) {
  const maxSessions = Math.max(1, ...data.map(d => d.nbSessionsTotal))

  if (data.length === 0) {
    return <p className="pipeline-empty-msg">Aucun formateur actif.</p>
  }

  return (
    <div className="pipeline-formateur-list">
      {data.map(d => (
        <div key={d.formateur.id} className="pipeline-formateur-row">
          <div className="pipeline-formateur-nom">{d.formateur.prenom} {d.formateur.nom}</div>
          <div className="pipeline-formateur-bar-track">
            <div
              className="pipeline-formateur-bar-fill pipeline-formateur-bar-responsable"
              style={{ width: `${(d.nbSessionsResponsable / maxSessions) * 100}%` }}
            />
            <div
              className="pipeline-formateur-bar-fill pipeline-formateur-bar-appui"
              style={{ width: `${(d.nbSessionsAppui / maxSessions) * 100}%` }}
            />
          </div>
          <div className="pipeline-formateur-meta">
            <span>{d.nbSessionsTotal} session{d.nbSessionsTotal > 1 ? 's' : ''}</span>
            <span className="pipeline-formateur-ca">{d.caFacture.toLocaleString('fr-FR')} € HT</span>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Pipeline() {
  const [nbMois, setNbMois] = useState(12)
  const [actifs, setActifs] = useState(() => new Set(PIPELINE_STATUTS.map(s => s.id)))
  const [hovered, setHovered] = useState(null)

  const dataPipeline = useMemo(() => getPipelineParMois(nbMois), [nbMois])
  const dataCA = useMemo(() => getCAParMois(nbMois), [nbMois])
  const dataFormateurs = useMemo(() => getPipelineParFormateur(nbMois), [nbMois])

  const totaux = useMemo(() => {
    const acc = {}
    PIPELINE_STATUTS.forEach(s => { acc[s.id] = 0 })
    dataPipeline.forEach(d => {
      PIPELINE_STATUTS.forEach(s => { acc[s.id] += d.parStatut[s.id]?.length || 0 })
    })
    return acc
  }, [dataPipeline])

  const caTotalPeriode = dataCA.reduce((s, d) => s + d.emis, 0)
  const caEncaissePeriode = dataCA.reduce((s, d) => s + d.encaisse, 0)

  function toggleStatut(id) {
    setActifs(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  return (
    <div className="pipeline-page">
      <div className="pipeline-topbar">
        <div>
          <h1 className="pipeline-title">Indicateurs d'activité et financiers</h1>
          <p className="pipeline-sub">Pipeline mensuel des sessions et suivi du chiffre d'affaires</p>
        </div>
        <div className="pipeline-periode-select">
          {NB_MOIS_OPTIONS.map(o => (
            <button key={o.id} className={`pipeline-periode-btn ${nbMois === o.id ? 'active' : ''}`} onClick={() => setNbMois(o.id)}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pipeline-kpis">
        <div className="pipeline-kpi">
          <div className="pipeline-kpi-val">{Object.values(totaux).reduce((a, b) => a + b, 0)}</div>
          <div className="pipeline-kpi-label">Sessions sur la période</div>
        </div>
        <div className="pipeline-kpi">
          <div className="pipeline-kpi-val">{caTotalPeriode.toLocaleString('fr-FR')} €</div>
          <div className="pipeline-kpi-label">CA facturé HT</div>
        </div>
        <div className="pipeline-kpi">
          <div className="pipeline-kpi-val" style={{ color: '#059669' }}>{caEncaissePeriode.toLocaleString('fr-FR')} €</div>
          <div className="pipeline-kpi-label">CA encaissé HT</div>
        </div>
        <div className="pipeline-kpi">
          <div className="pipeline-kpi-val" style={{ color: totaux.a_facturer > 0 ? '#7C3AED' : undefined }}>{totaux.a_facturer}</div>
          <div className="pipeline-kpi-label">Sessions à facturer</div>
        </div>
      </div>

      <div className="pipeline-section">
        <h2 className="pipeline-section-title">Sessions par mois et par statut</h2>
        <div className="pipeline-legend">
          {PIPELINE_STATUTS.map(s => (
            <button
              key={s.id}
              className={`pipeline-legend-item ${actifs.has(s.id) ? '' : 'off'}`}
              onClick={() => toggleStatut(s.id)}
            >
              <span className="pipeline-legend-dot" style={{ background: s.color }} />
              {s.label}
              <span className="pipeline-legend-count">{totaux[s.id]}</span>
            </button>
          ))}
        </div>
        <StackedBarChart
          data={dataPipeline}
          statuts={PIPELINE_STATUTS}
          actifs={actifs}
          hovered={hovered}
          onHoverCell={setHovered}
        />
      </div>

      <div className="pipeline-section">
        <h2 className="pipeline-section-title">Chiffre d'affaires par mois (HT)</h2>
        <div className="pipeline-legend">
          <span className="pipeline-legend-item static">
            <span className="pipeline-legend-dot" style={{ background: '#7C3AED' }} />
            Facturé
          </span>
          <span className="pipeline-legend-item static">
            <span className="pipeline-legend-dot" style={{ background: '#059669' }} />
            Encaissé
          </span>
        </div>
        <CALineChart data={dataCA} />
      </div>

      <div className="pipeline-section">
        <h2 className="pipeline-section-title">Répartition par formateur</h2>
        <div className="pipeline-legend">
          <span className="pipeline-legend-item static">
            <span className="pipeline-legend-dot" style={{ background: '#3B82F6' }} />
            Responsable
          </span>
          <span className="pipeline-legend-item static">
            <span className="pipeline-legend-dot" style={{ background: '#93C5FD' }} />
            En appui
          </span>
        </div>
        <FormateurBars data={dataFormateurs} />
      </div>
    </div>
  )
}
