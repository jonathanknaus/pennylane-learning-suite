// Agrège sessions, devis et factures par mois pour la vue "Indicateurs d'activité
// et financiers" — un pipeline filtrable par statut (brouillon, devis en attente,
// devis signé, à facturer, facturé...).

import { getSessions } from './sessions'
import { getDevis } from './devis'
import { getFactures } from './factures'
import { getFormateurs } from './formateurs'

function moisKey(dateStr) {
  if (!dateStr) return null
  return dateStr.slice(0, 7) // "2026-07"
}

function moisLabel(key) {
  const [year, month] = key.split('-')
  const d = new Date(parseInt(year), parseInt(month) - 1, 1)
  return d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
}

// Derniers N mois (clé "YYYY-MM"), ordonnés du plus ancien au plus récent.
export function derniersMois(n = 12) {
  const now = new Date()
  const keys = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return keys.map(key => ({ key, label: moisLabel(key) }))
}

export const PIPELINE_STATUTS = [
  { id: 'session_brouillon', label: 'Session brouillon', color: '#9CA3AF' },
  { id: 'session_confirmee', label: 'Session confirmée', color: '#3B82F6' },
  { id: 'devis_envoye', label: 'Devis en attente', color: '#F59E0B' },
  { id: 'devis_accepte', label: 'Devis signé', color: '#059669' },
  { id: 'a_facturer', label: 'À facturer', color: '#7C3AED' },
  { id: 'facture_payee', label: 'Facturé (payé)', color: '#00BD57' },
]

// Détermine le statut "pipeline" d'une session à partir de son statut propre et
// de l'état de ses devis/factures liés — une session peut cumuler plusieurs
// jalons (ex. confirmée + devis accepté) ; on retient le plus avancé.
function statutPipelineSession(session, devisSession, facturesSession) {
  const factureAvancee = facturesSession.find(f => f.statut === 'payee' || f.statut === 'partielle')
  if (factureAvancee) return 'facture_payee'
  if (facturesSession.some(f => f.statut === 'emise')) return 'a_facturer'
  const devisAccepte = devisSession.find(d => d.statut === 'accepte' || d.statut === 'converti')
  if (devisAccepte) return 'devis_accepte'
  if (devisSession.some(d => d.statut === 'envoye')) return 'devis_envoye'
  if (session.statut === 'confirme' || session.statut === 'en_cours' || session.statut === 'termine') return 'session_confirmee'
  return 'session_brouillon'
}

// Construit la matrice mois × statut (nombre de sessions), pour le graphique en
// barres empilées, et le détail des sessions par cellule pour le filtrage.
export function getPipelineParMois(nbMois = 12) {
  const mois = derniersMois(nbMois)
  const sessions = getSessions()
  const devis = getDevis()
  const factures = getFactures()

  const parMoisStatut = {}
  mois.forEach(m => { parMoisStatut[m.key] = {} })

  sessions.forEach(session => {
    const key = moisKey(session.date)
    if (!key || !parMoisStatut[key]) return
    const devisSession = devis.filter(d => d.session_id === session.id)
    const facturesSession = factures.filter(f => f.sessionId === session.id)
    const statut = statutPipelineSession(session, devisSession, facturesSession)
    if (!parMoisStatut[key][statut]) parMoisStatut[key][statut] = []
    parMoisStatut[key][statut].push(session)
  })

  return mois.map(m => ({
    ...m,
    parStatut: parMoisStatut[m.key],
    total: Object.values(parMoisStatut[m.key]).reduce((sum, arr) => sum + arr.length, 0),
  }))
}

// CA (HT) par mois, basé sur la date d'émission des factures — pour le second
// graphique (montants), toujours sur un axe séparé du décompte de sessions.
export function getCAParMois(nbMois = 12) {
  const mois = derniersMois(nbMois)
  const factures = getFactures()
  const parMois = {}
  mois.forEach(m => { parMois[m.key] = { emis: 0, encaisse: 0 } })

  factures.forEach(f => {
    const key = moisKey(f.date_emission)
    if (!key || !parMois[key]) return
    const ht = parseFloat(f.montant_ht) || 0
    if (f.statut === 'annulee') return
    parMois[key].emis += ht
    if (f.statut === 'payee') parMois[key].encaisse += ht
  })

  return mois.map(m => ({ ...m, ...parMois[m.key] }))
}

// Répartition de l'activité par formateur sur la période : nombre de sessions
// animées (en tant que responsable ou en appui), CA facturé généré, et
// satisfaction moyenne — pour comparer la charge et la performance de l'équipe.
export function getPipelineParFormateur(nbMois = 12) {
  const mois = derniersMois(nbMois)
  const moisKeys = new Set(mois.map(m => m.key))
  const formateurs = getFormateurs().filter(f => f.actif)
  const sessions = getSessions().filter(s => moisKeys.has(moisKey(s.date)))
  const devis = getDevis()
  const factures = getFactures()

  return formateurs.map(f => {
    const sessionsResponsable = sessions.filter(s => s.formateurId === f.id)
    const sessionsAppui = sessions.filter(s => s.formateurAppuiId === f.id && s.formateurId !== f.id)
    const sessionsTotal = [...sessionsResponsable, ...sessionsAppui]
    const sessionIds = new Set(sessionsTotal.map(s => s.id))

    const caFacture = factures
      .filter(fa => sessionIds.has(fa.sessionId) && fa.statut !== 'annulee')
      .reduce((sum, fa) => sum + (parseFloat(fa.montant_ht) || 0), 0)

    return {
      formateur: f,
      nbSessionsResponsable: sessionsResponsable.length,
      nbSessionsAppui: sessionsAppui.length,
      nbSessionsTotal: sessionsTotal.length,
      caFacture,
    }
  }).sort((a, b) => b.nbSessionsTotal - a.nbSessionsTotal)
}
