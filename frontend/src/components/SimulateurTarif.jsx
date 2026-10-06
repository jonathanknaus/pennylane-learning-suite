import { useMemo } from 'react'
import { getAllModules } from '../data/catalogue-afs'
import { estimer, resumerEstimation, MODALITES, plafondGrille } from '../data/tarification'
import { totaliserDurees, libelleDuree } from '../data/durees-modules'
import ModulesRetenus, {
  composerNiveaux, decomposerNiveaux, niveauxManquants, libelleNiveau, ampleursManquantes,
} from './ModulesRetenus'
import { FORMATS, format as formatParId } from '../data/durees-modules'
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
  // Niveau par module, sérialisé « id=niveau, id=niveau » (voir ModulesRetenus).
  niveaux: '',
  // Ampleur voulue par module, même format : « id=rappel, id=fondamentaux ».
  // Un sujet ne dure pas une durée fixe — voir FORMATS dans durees-modules.
  formats: '',
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
    simu_formats: v.formats || '',
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
  if (r.simu_formats) v.formats = r.simu_formats
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
  const ampleurs = decomposerNiveaux(v.formats, FORMATS.map(f => f.id))
  const cumul = totaliserDurees(retrouves, ampleurs)
  const estimation = cumul.complet
    ? estimer({
        dureeHeures: cumul.totalHeures,
        modalite: v.webinar ? 'visio' : v.modalite,
        participants: v.webinar ? 1 : v.participants,
        webinar: v.webinar,
      })
    : null
  return {
    retrouves, disparus, cumul, estimation,
    sansNiveau: niveauxManquants(v.niveaux, retrouves),
    sansAmpleur: ampleursManquantes(v.formats, retrouves, FORMATS.map(f => f.id)),
  }
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

/**
 * Au-delà de combien de participants CETTE demande passe-t-elle sur devis ?
 *
 * `plafondGrille()` donne le plafond des forfaits (25), mais le tarif HORAIRE a
 * le sien, plus bas (15) : annoncer « au-delà de 25 » à un cabinet qui demande
 * 2 h l'aurait laissé croire que 20 personnes sont tarifées, avant de lui
 * répondre « sur devis ». On interroge donc la grille plutôt que de deviner —
 * exact par construction, et cela suit toute modification de la grille.
 */
function seuilSurDevis({ dureeHeures, modalite }) {
  const plafond = plafondGrille() || 25
  if (!dureeHeures) return plafond
  let dernierOk = 0
  for (let n = 1; n <= plafond; n++) {
    const e = estimer({ dureeHeures, modalite, participants: n })
    if (e?.valide && !e.surDevis) dernierOk = n
  }
  return dernierOk || plafond
}

export default function SimulateurTarif({ valeur, onChange }) {
  const v = { ...SIMU_VIDE, ...valeur }

  const groupes = useMemo(() => {
    const parThematique = new Map()
    for (const m of getAllModules()) {
      if (!parThematique.has(m.thematique)) parThematique.set(m.thematique, [])
      parThematique.get(m.thematique).push(m)
    }
    return [...parThematique.entries()]
  }, [])

  const { retrouves, disparus, cumul, estimation, sansNiveau, sansAmpleur } = calculerEstimation(v)
  const plafond = seuilSurDevis({ dureeHeures: cumul.totalHeures, modalite: v.modalite })
  // Le présentiel n'est pas tarifé à l'heure : sous la demi-journée, la demande
  // partira forcément sur devis. Autant le dire avant que le cabinet attende un
  // montant qui n'arrivera pas.
  const presentielTropCourt = v.modalite === 'presentiel' && cumul.complet && cumul.totalHeures < 3.5

  function set(patch) { onChange({ ...v, ...patch }) }

  function basculerModule(id) {
    const apres = v.modules.includes(id) ? v.modules.filter(x => x !== id) : [...v.modules, id]
    const idsFormats = FORMATS.map(f => f.id)
    // Recomposer niveau ET ampleur sur la nouvelle sélection : un module décoché
    // ne doit rien laisser derrière lui.
    set({
      modules: apres,
      niveaux: composerNiveaux(decomposerNiveaux(v.niveaux), apres),
      formats: composerNiveaux(decomposerNiveaux(v.formats, idsFormats), apres, idsFormats),
    })
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
            Où en sont vos participants, et jusqu'où aller ?
            {sansNiveau.length > 0 && retrouves.length > sansNiveau.length && (
              <span className="st-compte">{retrouves.length - sansNiveau.length}/{retrouves.length} renseignés</span>
            )}
          </div>
          <p className="st-aide">
            Pour chaque module, dites où en sont vos participants — il est courant d’être à l’aise
            sur un sujet et débutant sur un autre — puis l’ampleur que vous souhaitez.
            <strong> Un même sujet se traite en une heure comme en une demi-journée</strong> : c’est
            vous qui décidez s’il s’agit d’un rappel ou d’une mise à niveau complète. Le niveau que
            vous indiquez propose l’ampleur correspondante, vous restez libre de la changer.
          </p>
          <ModulesRetenus
            modules={retrouves}
            valeur={v.niveaux}
            onChange={niveaux => set({ niveaux })}
            formats={v.formats}
            onChangeFormats={formats => set({ formats })}
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
              Au-delà de {plafond} apprenants pour cette durée, le tarif est établi sur devis —
              nous revenons vers vous avec une proposition.
            </p>
          )}
          {presentielTropCourt && (
            <p className="st-info">
              Le présentiel suppose au minimum une demi-journée. Pour {libelleDuree(cumul.totalHeures)},
              choisissez la visioconférence, ou passez les modules concernés en
              {' '}<strong>Fondamentaux</strong> — sinon votre demande partira sur devis.
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

        {cumul.complet && sansAmpleur.length > 0 && (
          <p className="st-a-confirmer">
            Ampleur non précisée pour {sansAmpleur.length} module{sansAmpleur.length > 1 ? 's' : ''} :
            {' '}{sansAmpleur.map(m => m.titre).join(', ')}. Le calcul retient
            {' '}{formatParId('approfondissement')?.label.toLowerCase()} par défaut — précisez-la pour
            une estimation juste.
          </p>
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
