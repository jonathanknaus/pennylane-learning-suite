import { useState, useMemo } from 'react'
import { getAllModules } from '../data/catalogue-afs'
import { estimer, resumerEstimation, MODALITES, SEUIL_SUR_DEVIS } from '../data/tarification'
import { totaliserDurees, libelleDuree } from '../data/durees-modules'
import './SimulateurTarif.css'

// Simulateur de tarif, à destination des cabinets.
//
// Il compose : les modules choisis → leur durée cumulée → la grille → un prix.
// Toute la logique de prix vit dans tarification.js : ici, on ne calcule rien,
// on interroge et on restitue honnêtement.
//
// Deux règles commerciales, décidées le 2026-10-06 :
//
//  1. On affiche TOUJOURS le tarif de la GRILLE, jamais un tarif négocié. Un
//     prix négocié se décide avec un cabinet donné ; l'exposer dans un outil en
//     libre-service en ferait un dû.
//  2. Le format webinar n'est proposé que pour former les CLIENTS ENTREPRISES du
//     cabinet — c'est ce qui justifie les participants illimités. Pour les
//     collaborateurs du cabinet, ce sont les formats classiques et leurs paliers.
//
// ⚠️ Et c'est une ESTIMATION, jamais un devis : la mention reste visible à
// l'écran, y compris quand le prix s'affiche.

const TVA = 0.20

const PUBLICS = [
  {
    id: 'collaborateurs',
    label: 'Les collaborateurs du cabinet',
    aide: 'Formats à l’heure, demi-journée ou journée, selon les modules retenus.',
  },
  {
    id: 'clients',
    label: 'Les clients entreprises du cabinet',
    aide: 'Donne aussi accès au format webinar, en participants illimités.',
  },
]

export default function SimulateurTarif({ onJoindreAuBesoin }) {
  const [publicCible, setPublicCible] = useState('collaborateurs')
  const [webinar, setWebinar] = useState(false)
  const [choisis, setChoisis] = useState([])
  const [modalite, setModalite] = useState('visio')
  const [participants, setParticipants] = useState(8)
  const [joint, setJoint] = useState(false)

  const groupes = useMemo(() => {
    const parThematique = new Map()
    for (const m of getAllModules()) {
      if (!parThematique.has(m.thematique)) parThematique.set(m.thematique, [])
      parThematique.get(m.thematique).push(m)
    }
    return [...parThematique.entries()]
  }, [])

  const tousModules = useMemo(() => getAllModules(), [])
  const selection = tousModules.filter(m => choisis.includes(m.id))
  const cumul = totaliserDurees(selection)

  // Le webinar n'existe que pour les clients entreprises : changer de public le
  // désactive, sinon on garderait un format devenu indisponible.
  function changerPublic(id) {
    setPublicCible(id)
    if (id !== 'clients') setWebinar(false)
    setJoint(false)
  }

  function basculer(id) {
    setChoisis(c => (c.includes(id) ? c.filter(x => x !== id) : [...c, id]))
    setJoint(false)
  }

  const estimation = cumul.complet
    ? estimer({
        dureeHeures: cumul.totalHeures,
        modalite: webinar ? 'visio' : modalite,
        participants: webinar ? 1 : participants,
        webinar,
      })
    : null

  function joindre() {
    if (!estimation?.valide || !onJoindreAuBesoin) return
    const lignes = [
      `Modules souhaités (${selection.length}) : ${selection.map(m => m.titre).join(', ')}`,
      `Public : ${PUBLICS.find(p => p.id === publicCible).label.toLowerCase()}`,
      resumerEstimation(estimation),
      cumul.confirme ? null : 'Durées de certains modules à confirmer avec l’équipe AFS.',
      'Estimation indicative — ne constitue pas un devis.',
    ].filter(Boolean)
    onJoindreAuBesoin(lignes.join('\n'))
    setJoint(true)
  }

  return (
    <div className="pc-section">
      <div className="pc-section-title">Estimer le coût d’une formation</div>
      <p className="pc-note">
        Composez votre besoin pour obtenir un ordre de prix immédiat. C’est une
        <strong> estimation indicative</strong>, pas un devis : le tarif définitif est établi
        avec l’équipe AFS.
      </p>

      {/* 1 — Qui est à former */}
      <div className="st-bloc">
        <div className="st-bloc-titre">1. Qui est à former ?</div>
        <div className="st-publics">
          {PUBLICS.map(p => (
            <button
              key={p.id}
              type="button"
              className={`st-public ${publicCible === p.id ? 'actif' : ''}`}
              onClick={() => changerPublic(p.id)}
            >
              <span className="st-public-label">{p.label}</span>
              <span className="st-public-aide">{p.aide}</span>
            </button>
          ))}
        </div>

        {publicCible === 'clients' && (
          <label className="st-webinar">
            <input type="checkbox" checked={webinar} onChange={e => { setWebinar(e.target.checked); setJoint(false) }} />
            <span>
              <strong>Format webinar</strong> — 1 heure en visioconférence, <strong>participants
              illimités</strong>. Adapté pour convier votre clientèle.
            </span>
          </label>
        )}
      </div>

      {/* 2 — Modules */}
      <div className="st-bloc">
        <div className="st-bloc-titre">
          2. Quels modules ? {selection.length > 0 && <span className="st-compte">{selection.length} sélectionné{selection.length > 1 ? 's' : ''}</span>}
        </div>
        <div className="st-modules">
          {groupes.map(([thematique, mods]) => (
            <div key={thematique} className="st-groupe">
              <div className="st-groupe-titre">{thematique}</div>
              {mods.map(m => (
                <label key={m.id} className={`st-module ${choisis.includes(m.id) ? 'actif' : ''}`}>
                  <input type="checkbox" checked={choisis.includes(m.id)} onChange={() => basculer(m.id)} />
                  <span className="st-module-titre">{m.titre}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 3 — Modalité et effectif, sans objet pour un webinar */}
      {!webinar && (
        <div className="st-bloc">
          <div className="st-bloc-titre">3. Comment, et pour combien de personnes ?</div>
          <div className="st-reglages">
            <label className="st-champ">
              <span>Modalité</span>
              <select value={modalite} onChange={e => { setModalite(e.target.value); setJoint(false) }}>
                {MODALITES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </label>
            <label className="st-champ">
              <span>Nombre d’apprenants</span>
              <input
                type="number" min="1" max="200" value={participants}
                onChange={e => { setParticipants(parseInt(e.target.value, 10) || 1); setJoint(false) }}
              />
            </label>
          </div>
          {participants > SEUIL_SUR_DEVIS && (
            <p className="st-info">
              Au-delà de {SEUIL_SUR_DEVIS} apprenants, le tarif est établi sur devis — nous
              revenons vers vous avec une proposition.
            </p>
          )}
        </div>
      )}

      {/* Résultat */}
      <div className="st-resultat">
        {!cumul.complet ? (
          <p className="st-vide">Sélectionnez au moins un module pour obtenir une estimation.</p>
        ) : !estimation?.valide ? (
          <p className="st-vide">{estimation?.erreur || 'Estimation indisponible.'}</p>
        ) : estimation.surDevis ? (
          <>
            <div className="st-prix st-prix-devis">Sur devis</div>
            <p className="st-motif">{estimation.motifDevis}</p>
          </>
        ) : (
          <>
            <div className="st-prix">
              {estimation.prixHT.toLocaleString('fr-FR')} € <span className="st-ht">HT</span>
            </div>
            <div className="st-ttc">
              soit {(estimation.prixHT * (1 + TVA)).toLocaleString('fr-FR')} € TTC (TVA {TVA * 100} %)
            </div>
            <ul className="st-detail">
              <li><strong>{estimation.formatLabel}</strong> — {estimation.detail}</li>
              {!webinar && <li>{libelleDuree(cumul.totalHeures)} de formation pour {selection.length} module{selection.length > 1 ? 's' : ''}</li>}
              {estimation.formateurs > 1 && <li>{estimation.formateurs} formateurs mobilisés</li>}
              {estimation.fraisDeplacementInclus && <li>Frais de déplacement inclus</li>}
              {webinar && <li>Participants illimités</li>}
            </ul>
          </>
        )}

        {estimation?.alertes?.length > 0 && (
          <ul className="st-alertes">
            {estimation.alertes.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        )}

        {cumul.complet && !cumul.confirme && (
          <p className="st-a-confirmer">
            La durée {cumul.aConfirmer.length > 1 ? `de ${cumul.aConfirmer.length} modules` : 'd’un module'} reste
            à confirmer avec l’équipe AFS : {cumul.aConfirmer.map(m => m.titre).join(', ')}. Le montant
            peut évoluer en conséquence.
          </p>
        )}

        {estimation?.valide && !estimation.surDevis && onJoindreAuBesoin && (
          <button type="button" className="st-joindre" onClick={joindre} disabled={joint}>
            {joint ? '✓ Ajouté à votre demande' : 'Joindre cette estimation à ma demande'}
          </button>
        )}

        <p className="st-mention">
          Estimation indicative, hors remise éventuelle. <strong>Ne constitue pas un devis.</strong>
        </p>
      </div>
    </div>
  )
}
