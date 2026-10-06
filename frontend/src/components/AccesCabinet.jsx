import { useState, useEffect } from 'react'
import {
  cleCabinet, ecouterCabinetParCle, accorderAcces, basculerActif, revoquerAcces,
} from '../data/cabinets-firebase'
import { estAdminRacine } from '../data/firebase-auth'
import { getCurrentUser } from '../data/auth'
import { getQuestionsQB } from '../data/questionnaire-besoin'
import { simuDepuisReponses, reponsesSansSimu, calculerEstimation } from './SimulateurTarif'
import { donneesSynthese, imprimerSynthese } from '../data/synthese-besoin'
import { getModeleSynthese, lienMailto } from '../data/modele-mail'

// Ouverture et suivi de l'accès au portail d'un cabinet, depuis la fiche session.
//
// Remplace l'ancien code à 6 caractères, qui était stocké en localStorage : il
// n'existait que dans le navigateur où il avait été généré, donc jamais chez le
// cabinet. L'accès repose désormais sur une autorisation enregistrée dans la
// base partagée, et le cabinet se connecte par lien email.
export default function AccesCabinet({ contactEmail, lienPortail }) {
  const [cabinet, setCabinet] = useState(null)
  const [erreur, setErreur] = useState('')
  const [occupe, setOccupe] = useState(false)
  const [lienCopie, setLienCopie] = useState(false)

  const [erreurSynthese, setErreurSynthese] = useState('')

  const moi = getCurrentUser()
  const peutGerer = estAdminRacine(moi?.email)

  // Reconstitue la demande telle que le cabinet l'a envoyée. Les conversions
  // viennent du simulateur : deux lectures différentes du même stockage
  // finiraient par afficher deux prix pour une seule demande.
  function demandeDuCabinet() {
    const reponsesBrutes = cabinet?.besoins?.general?.reponses || {}
    const simu = simuDepuisReponses(reponsesBrutes)
    const { estimation } = calculerEstimation(simu)
    return donneesSynthese({
      cabinet: { ...cabinet, email: contactEmail },
      questions: getQuestionsQB(),
      reponses: reponsesSansSimu(reponsesBrutes),
      simu,
      estimation,
    })
  }

  function ouvrirSynthese() {
    setErreurSynthese('')
    if (!imprimerSynthese(demandeDuCabinet())) {
      setErreurSynthese('Le navigateur a bloqué l\'ouverture. Autorisez les fenêtres pour ce site.')
    }
  }

  function preparerMail() {
    setErreurSynthese('')
    const d = demandeDuCabinet()
    // Nouvelle fenêtre plutôt que location.href : garder la fiche session
    // ouverte, le PDF restant à produire et à joindre.
    window.open(lienMailto({
      destinataire: contactEmail,
      modele: getModeleSynthese(),
      variables: d.variables,
    }), '_blank')
  }

  useEffect(() => {
    if (!contactEmail) return
    let stop = null
    let annule = false
    cleCabinet(contactEmail).then(id => {
      if (annule) return
      stop = ecouterCabinetParCle(id, setCabinet, err => setErreur(err.message))
    })
    return () => { annule = true; if (typeof stop === 'function') stop() }
  }, [contactEmail])

  const ouvert = cabinet && !cabinet.absent
  const actif = ouvert && cabinet.actif !== false
  const apprenants = (ouvert && cabinet.apprenants) || []
  const besoinSoumis = ouvert && cabinet.besoins?.general?.soumisLe

  async function action(fn) {
    setOccupe(true)
    setErreur('')
    try { await fn() } catch (err) { setErreur(err?.message || 'Opération refusée.') }
    setOccupe(false)
  }

  function copierLien() {
    navigator.clipboard.writeText(lienPortail).then(() => {
      setLienCopie(true)
      setTimeout(() => setLienCopie(false), 2000)
    })
  }

  return (
    <div className="besoin-portail-section">
      <h3 className="besoin-section-title">Accès portail cabinet</h3>
      <p className="besoin-lien-desc">
        Le commanditaire se connecte avec son adresse email : il reçoit un lien de
        connexion, sans code ni mot de passe. Il peut alors décrire son besoin de
        formation et déclarer ses apprenants.
      </p>

      <div className="besoin-portail-row">
        <div className="besoin-portail-email">
          <span className="besoin-portail-label">Email</span>{contactEmail}
        </div>
        <div className="besoin-portail-code-block">
          <span className="besoin-portail-label">État de l'accès</span>
          <div className="besoin-portail-code-row">
            {!cabinet ? (
              <span className="acces-cab-etat">Vérification…</span>
            ) : actif ? (
              <span className="acces-cab-etat acces-cab-ok">✓ Accès ouvert</span>
            ) : ouvert ? (
              <span className="acces-cab-etat acces-cab-susp">Accès suspendu</span>
            ) : (
              <span className="acces-cab-etat acces-cab-non">Pas encore ouvert</span>
            )}
          </div>
        </div>
      </div>

      <div className="besoin-lien-row" style={{ marginTop: 8 }}>
        <div className="besoin-lien-url">{lienPortail}</div>
        <button className={`besoin-copy-btn ${lienCopie ? 'copied' : ''}`} onClick={copierLien}>
          {lienCopie ? '✓ Copié !' : '🔗 Copier'}
        </button>
        <a href={lienPortail} target="_blank" rel="noopener noreferrer" className="besoin-open-btn">↗ Ouvrir</a>
      </div>

      {erreur && <p className="acces-erreur">{erreur}</p>}

      {!peutGerer && (
        <p className="acces-cab-lecture">
          Seuls les administrateurs peuvent ouvrir ou suspendre un accès cabinet.
        </p>
      )}

      {peutGerer && (
        <div className="besoin-portail-footer">
          {!ouvert && (
            <button
              className="besoin-btn-send-acces"
              disabled={occupe}
              onClick={() => action(() => accorderAcces({ email: contactEmail }, moi?.email))}
            >
              Ouvrir l'accès
            </button>
          )}
          {ouvert && (
            <>
              <button
                className="besoin-regen-btn"
                disabled={occupe}
                onClick={() => action(() => basculerActif(cabinet.id, !actif))}
              >
                {actif ? 'Suspendre l\'accès' : 'Réactiver l\'accès'}
              </button>
              <button
                className="besoin-regen-btn"
                disabled={occupe}
                onClick={() => {
                  if (!confirm(`Révoquer l'accès de ${contactEmail} ? Les apprenants déclarés seront également supprimés.`)) return
                  action(() => revoquerAcces(cabinet.id))
                }}
              >
                Révoquer définitivement
              </button>
            </>
          )}
        </div>
      )}

      {ouvert && (
        <div className="acces-cab-retours">
          <div className="acces-cab-retours-titre">
            Ce que le cabinet a renseigné
          </div>
          <p className="acces-cab-retour-ligne">
            <strong>Besoin de formation :</strong>{' '}
            {besoinSoumis
              ? `renseigné le ${new Date(besoinSoumis).toLocaleDateString('fr-FR')}`
              : 'pas encore renseigné'}
          </p>
          {besoinSoumis && (
            <div className="acces-cab-synthese">
              <button className="btn-secondaire-sm" onClick={ouvrirSynthese}>
                ⬇ Synthèse de la demande (PDF)
              </button>
              <button className="btn-secondaire-sm" onClick={preparerMail}>
                ✉ Préparer le mail au cabinet
              </button>
              <p className="acces-pwd-hint" style={{ margin: 0, flexBasis: '100%' }}>
                Le mail s'ouvre pré-rempli dans votre messagerie, avec
                {' '}{getModeleSynthese().copie || 'la boîte AFS'} en copie. <strong>Joignez le PDF
                avant d'envoyer</strong> : un lien mailto ne peut pas porter de pièce jointe.
              </p>
              {erreurSynthese && <p className="acces-error" style={{ flexBasis: '100%' }}>{erreurSynthese}</p>}
            </div>
          )}

          <p className="acces-cab-retour-ligne">
            <strong>Apprenants déclarés :</strong> {apprenants.length}
          </p>
          {apprenants.length > 0 && (
            <table className="acces-table" style={{ minWidth: 0, marginTop: 8 }}>
              <thead>
                <tr><th>Nom</th><th>Prénom</th><th>Email</th><th>Fonction</th></tr>
              </thead>
              <tbody>
                {apprenants.map(a => (
                  <tr key={a.id}>
                    <td>{a.nom}</td>
                    <td>{a.prenom}</td>
                    <td className="acces-cell-email">{a.email || '—'}</td>
                    <td>{a.fonction || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
