import { useMemo } from 'react'
import { getAllModules } from '../data/catalogue-afs'
import { estimer, resumerEstimation, MODALITES, plafondGrille } from '../data/tarification'
import { totaliserDurees, libelleDuree } from '../data/durees-modules'
import NiveauxModules, {
  composerNiveaux, decomposerNiveaux, niveauxManquants, libelleNiveau,
} from './NiveauxModules'
import './SimulateurTarif.css'

// Simulateur de tarif — composant CONTRÔLÉ, intégré au questionnaire de besoin.
//
// Il ne possède pas son état : le questionnaire le détient et l'envoie avec le
// reste. Simulateur et questionnaire ne font qu'un, c'est une exigence de
// Jonathan — un cabinet ne doit pas avoir l'impression de remplir deux
// formulaires pour une seule demande.
//
// Toute la logique de prix vit dans tarification.js : ici on interroge et on
// restitue, on ne calcule rien.
//
// Deux règles commerciales (2026-10-06) :
//  1. On affiche TOUJOURS le tarif de la GRILLE, jamais un tarif négocié. Un
//     prix négocié se décide avec un cabinet donné ; l'exposer en libre-service
//     en ferait un dû.
//  2. Le webinar est réservé aux CLIENTS du cabinet. Le public habituel, ce sont
//     les collaborateurs et dirigeants du cabinet, qui relèvent des formats
//     classiques et de leurs paliers.
//
// ⚠️ Catalogue mouvant : les modules sont encore en construction. Un module
// sélectionné puis supprimé du catalogue est SIGNALÉ, jamais retiré en silence —
// sinon le prix changerait sans que personne comprenne pourquoi.

const TVA = 0.20

export const PUBLICS = [
  {
    id: 'collaborateurs',
    label: 'Les collaborateurs du cabinet',
    aide: 'Collaborateurs ou dirigeants. Formats à l’heure, demi-journée ou journée, selon les modules retenus.',
  },
  {
    id: 'clients',
    label: 'Mes clients',
    aide: 'Les entreprises que vous accompagnez. Seul cas où le format webinar est proposé, en participants illimités.',
  },
]

export const SIMU_VIDE = {
  publicCible: 'collaborateurs',
  webinar: false,
  modules: [],
  // Niveau par module, sérialisé « id=niveau, id=niveau » (voir NiveauxModules).
  niveaux: '',
  modalite: 'visio',
  participants: 8,
}

// Conversions entre l'état du simulateur et les réponses stockées.
//
// Factorisées ici parce que DEUX écrans en ont besoin — le portail cabinet pour
// relire une demande, la fiche session pour en produire la synthèse — et que
// deux lectures divergentes du même stockage finiraient par donner deux prix
// différents pour la même demande.
//
// Tout est en CHAÎNES : les règles de la base n'acceptent que ça sous
// `reponses`, et cela permet de recalculer l'estimation à l'identique plus tard.
export const PREFIXE_SIMU = 'simu_'

export function reponsesSimu(simu) {
  const v = { ...SIMU_VIDE, ...simu }
  return {
    simu_public: v.publicCible,
    simu_webinar: v.webinar ? 'oui' : 'non',
    simu_modalite: v.modalite,
    simu_participants: String(v.participants),
    simu_modules: (v.modules || []).join(','),
    simu_niveaux: v.niveaux || '',
  }
}

export function simuDepuisReponses(reponses) {
  const r = reponses || {}
  const v = { ...SIMU_VIDE }
  if (r.simu_public) v.publicCible = r.simu_public
  if (r.simu_webinar) v.webinar = r.simu_webinar === 'oui'
  if (r.simu_modalite) v.modalite = r.simu_modalite
  if (r.simu_participants) v.participants = parseInt(r.simu_participants, 10) || SIMU_VIDE.participants
  if (r.simu_modules) v.modules = r.simu_modules.split(',').map(x => x.trim()).filter(Boolean)
  if (r.simu_niveaux) v.niveaux = r.simu_niveaux
  return v
}

/** Réponses débarrassées des champs techniques, pour affichage. */
export function reponsesSansSimu(reponses) {
  const net = { ...(reponses || {}) }
  for (const cle of Object.keys(net)) {
    if (cle.startsWith(PREFIXE_SIMU) || cle === 'estimation') delete net[cle]
  }
  return net
}

// Calcule l'estimation à partir de l'état du simulateur. Exporté pour que le
// questionnaire puisse composer son envoi sans dupliquer cette logique.
export function calculerEstimation(v) {
  const tous = getAllModules()
  const parId = new Map(tous.map(m => [m.id, m]))
  const retrouves = (v.modules || []).map(id => parId.get(id)).filter(Boolean)
  const disparus = (v.modules || []).filter(id => !parId.has(id))
  const cumul = totaliserDurees(retrouves)
  const estimation = cumul.complet
    ? estimer({
        dureeHeures: cumul.totalHeures,
        modalite: v.webinar ? 'visio' : v.modalite,
        participants: v.webinar ? 1 : v.participants,
        webinar: v.webinar,
      })
    : null
  return { retrouves, disparus, cumul, estimation, sansNiveau: niveauxManquants(v.niveaux, retrouves) }
}

// Résumé textuel versé dans la demande, à côté des paramètres bruts.
export function resumerDemande(v) {
  const { retrouves, cumul, estimation } = calculerEstimation(v)
  if (!estimation?.valide) return ''
  const lignes = [
    `Public : ${PUBLICS.find(p => p.id === v.publicCible)?.label || v.publicCible}`,
    `Modules (${retrouves.length}) : ${retrouves.map(m => m.titre).join(', ')}`,
    v.webinar ? 'Format : webinar (1 h, participants illimités)' : `Durée cumulée : ${libelleDuree(cumul.totalHeures)}`,
    resumerEstimation(estimation),
  ]
  const table = decomposerNiveaux(v.niveaux)
  const avecNiveau = retrouves.filter(m => table[m.id])
  if (avecNiveau.length > 0) {
    lignes.push(`Niveau des participants : ${avecNiveau.map(m => `${m.titre} — ${libelleNiveau(table[m.id])}`).join(' ; ')}`)
  }
  if (!cumul.confirme) {
    lignes.push(`Durées à confirmer pour : ${cumul.aConfirmer.map(m => m.titre).join(', ')}`)
  }
  lignes.push('Estimation indicative — ne constitue pas un devis.')
  return lignes.join('\n')
}

// Choix du public, et webinar qui en dépend.
//
// SÉPARÉ du reste du simulateur et placé en TÊTE du questionnaire : c'est la
// première chose qu'un cabinet a à dire, et c'est elle qui ouvre ou ferme le
// format webinar. Tant qu'elle vivait au milieu du simulateur, en bas de page,
// un cabinet venu former ses clients ne trouvait pas où le déclarer et ne voyait
// donc jamais le webinar — signalé par Jonathan le 2026-10-06.
export function ChoixPublic({ valeur, onChange }) {
  const v = { ...SIMU_VIDE, ...valeur }

  function changerPublic(id) {
    // Le webinar n'existe que pour les clients : changer de public le désactive,
    // sinon on garderait un format devenu indisponible.
    onChange({ ...v, publicCible: id, webinar: id === 'clients' ? v.webinar : false })
  }

  return (
    <div className="st-bloc">
      <div className="st-bloc-titre">Qui est à former ?</div>
      <div className="st-publics">
        {PUBLICS.map(p => (
          <button
            key={p.id}
            type="button"
            className={`st-public ${v.publicCible === p.id ? 'actif' : ''}`}
            onClick={() => changerPublic(p.id)}
          >
            <span className="st-public-label">{p.label}</span>
            <span className="st-public-aide">{p.aide}</span>
          </button>
        ))}
      </div>

      {v.publicCible === 'clients' && (
        <label className="st-webinar">
          <input
            type="checkbox"
            checked={v.webinar}
            onChange={e => onChange({ ...v, webinar: e.target.checked })}
          />
          <span>
            <strong>Format webinar</strong> — 1 heure en visioconférence, <strong>participants
            illimités</strong>. Adapté pour convier votre clientèle.
          </span>
        </label>
      )}
    </div>
  )
}

export default function SimulateurTarif({ valeur, onChange }) {
  const v = { ...SIMU_VIDE, ...valeur }
  // Dérivé de la grille en vigueur, et non d'un seuil en dur : si un
  // administrateur ajoute un palier « jusqu'à 40 », le message suit.
  const plafond = plafondGrille()

  const groupes = useMemo(() => {
    const parThematique = new Map()
    for (const m of getAllModules()) {
      if (!parThematique.has(m.thematique)) parThematique.set(m.thematique, [])
      parThematique.get(m.thematique).push(m)
    }
    return [...parThematique.entries()]
  }, [])

  const { retrouves, disparus, cumul, estimation, sansNiveau } = calculerEstimation(v)

  function set(patch) { onChange({ ...v, ...patch }) }

  function basculerModule(id) {
    const apres = v.modules.includes(id) ? v.modules.filter(x => x !== id) : [...v.modules, id]
    // Recomposer les niveaux sur la nouvelle sélection : un module décoché ne
    // doit pas laisser son niveau derrière lui.
    set({ modules: apres, niveaux: composerNiveaux(decomposerNiveaux(v.niveaux), apres) })
  }

  return (
    <>
      <div className="st-bloc">
        <div className="st-bloc-titre">
          Quels modules vous intéressent ?
          {retrouves.length > 0 && (
            <span className="st-compte">{retrouves.length} sélectionné{retrouves.length > 1 ? 's' : ''}</span>
          )}
        </div>

        {disparus.length > 0 && (
          <p className="st-disparus">
            ⚠️ {disparus.length} module{disparus.length > 1 ? 's' : ''} que vous aviez choisi
            {disparus.length > 1 ? 's' : ''} ne figure{disparus.length > 1 ? 'nt' : ''} plus au
            catalogue et n’{disparus.length > 1 ? 'est' : 'est'} plus compté
            {disparus.length > 1 ? 's' : ''} dans l’estimation. Notre offre évolue — n’hésitez pas à
            refaire votre sélection.
          </p>
        )}

        <div className="st-modules">
          {groupes.map(([thematique, mods]) => (
            <div key={thematique} className="st-groupe">
              <div className="st-groupe-titre">{thematique}</div>
              {mods.map(m => (
                <label key={m.id} className={`st-module ${v.modules.includes(m.id) ? 'actif' : ''}`}>
                  <input type="checkbox" checked={v.modules.includes(m.id)} onChange={() => basculerModule(m.id)} />
                  <span className="st-module-titre">{m.titre}</span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </div>

      {retrouves.length > 0 && (
        <div className="st-bloc">
          <div className="st-bloc-titre">
            Où en sont vos participants sur ces sujets ?
            {sansNiveau.length > 0 && retrouves.length > sansNiveau.length && (
              <span className="st-compte">{retrouves.length - sansNiveau.length}/{retrouves.length} renseignés</span>
            )}
          </div>
          <p className="st-aide">
            Un niveau par module : il est courant d’être à l’aise sur un sujet et débutant sur un
            autre. Le formateur ajuste son rythme en conséquence — cela ne change pas le tarif.
          </p>
          <NiveauxModules
            modules={retrouves}
            valeur={v.niveaux}
            onChange={niveaux => set({ niveaux })}
            classe="st-niveaux"
          />
        </div>
      )}

      {!v.webinar && (
        <div className="st-bloc">
          <div className="st-bloc-titre">Combien de personnes, et sous quelle forme ?</div>
          <div className="st-reglages">
            <label className="st-champ">
              <span>Modalité</span>
              <select value={v.modalite} onChange={e => set({ modalite: e.target.value })}>
                {MODALITES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </label>
            <label className="st-champ">
              <span>Nombre d’apprenants</span>
              <input
                type="number" min="1" max="200" value={v.participants}
                onChange={e => set({ participants: parseInt(e.target.value, 10) || 1 })}
              />
            </label>
          </div>
          {v.participants > plafond && (
            <p className="st-info">
              Au-delà de {plafond} apprenants, le tarif est établi sur devis — nous revenons
              vers vous avec une proposition.
            </p>
          )}
        </div>
      )}

      <div className="st-resultat">
        {!cumul.complet ? (
          <p className="st-vide">Sélectionnez au moins un module pour voir une estimation.</p>
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
              {!v.webinar && (
                <li>
                  {libelleDuree(cumul.totalHeures)} pour {retrouves.length} module{retrouves.length > 1 ? 's' : ''}
                </li>
              )}
              {estimation.formateurs > 1 && <li>{estimation.formateurs} formateurs mobilisés</li>}
              {estimation.fraisDeplacementInclus && <li>Frais de déplacement inclus</li>}
              {v.webinar && <li>Participants illimités</li>}
            </ul>
          </>
        )}

        {estimation?.alertes?.length > 0 && (
          <ul className="st-alertes">
            {estimation.alertes.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        )}

        {cumul.complet && sansNiveau.length > 0 && (
          <p className="st-a-confirmer">
            Niveau non précisé pour {sansNiveau.length} module{sansNiveau.length > 1 ? 's' : ''} :
            {' '}{sansNiveau.map(m => m.titre).join(', ')}. Ce n’est pas bloquant, mais c’est ce qui
            nous permet d’adapter le contenu.
          </p>
        )}

        {cumul.complet && !cumul.confirme && (
          <p className="st-a-confirmer">
            La durée {cumul.aConfirmer.length > 1 ? `de ${cumul.aConfirmer.length} modules` : 'd’un module'} reste
            à préciser avec l’équipe AFS : {cumul.aConfirmer.map(m => m.titre).join(', ')}. Le montant
            peut évoluer en conséquence.
          </p>
        )}

        <p className="st-mention">
          Estimation indicative, hors remise éventuelle. <strong>Ne constitue pas un devis.</strong>
        </p>
      </div>
    </>
  )
}
