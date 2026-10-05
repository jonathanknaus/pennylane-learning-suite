import { useState } from 'react'
import {
  inventaireLocal, transfererCle, verifierTransfert, estPartageable, CLES_LOCALES,
} from '../data/store-firebase'
import { estAdminRacine } from '../data/firebase-auth'
import { getCurrentUser } from '../data/auth'
import './MigrationFirebase.css'

// Transfert initial du localStorage vers Firebase.
//
// Nécessaire parce que les données existantes vivent dans CE navigateur :
// personne d'autre, ni aucun script, ne peut y accéder. Le transfert doit donc
// être déclenché depuis le poste qui détient les données.
//
// Trois garde-fous :
//   - Mode simulation : on voit ce qui partirait avant que ça parte.
//   - Le localStorage n'est JAMAIS vidé. En cas de problème, la source est intacte.
//   - Par défaut, une collection déjà remplie côté Firebase n'est pas écrasée,
//     pour qu'un second passage ne détruise pas un travail déjà fait.

const LIBELLES = {
  pls_sessions: 'Sessions de formation',
  pls_stagiaires: 'Apprenants',
  pls_inscriptions: 'Inscriptions',
  pls_entreprises: 'Cabinets',
  pls_formateurs: 'Formateurs',
  pls_gestionnaires: 'Responsables administratifs',
  pls_financeurs: 'Financeurs',
  pls_devis: 'Devis',
  pls_factures: 'Factures',
  pls_emargements: 'Émargements',
  pls_bilan_session: 'Bilans de session',
  pls_satisfaction_chaud: 'Satisfaction à chaud',
  pls_satisfaction_froid: 'Satisfaction à froid',
  pls_reclamations: 'Réclamations et incidents',
  pls_workflows: 'Workflows',
  pls_questionnaire_besoin: 'Questionnaires de besoin',
  pls_reponses_questionnaires: 'Réponses aux QCM',
  pls_banque_questions: 'Banque de questions',
  pls_parametres: 'Paramètres de l\'organisme',
  pls_catalogue_custom: 'Catalogue personnalisé',
  pls_notifications: 'Notifications',
  pls_traitements: 'Traces de veille (déjà migrées)',
}

export default function MigrationFirebase() {
  const [inventaire, setInventaire] = useState(null)
  const [resultats, setResultats] = useState(null)
  const [verifs, setVerifs] = useState(null)
  const [ecraser, setEcraser] = useState(false)
  const [occupe, setOccupe] = useState(false)
  const [erreur, setErreur] = useState('')

  const moi = getCurrentUser()
  const peutMigrer = estAdminRacine(moi?.email)

  function simuler() {
    setResultats(null)
    setVerifs(null)
    setErreur('')
    setInventaire(inventaireLocal())
  }

  async function transferer() {
    const aTransferer = (inventaire || []).filter(l => l.partageable && l.elements !== 0)
    if (aTransferer.length === 0) { setErreur('Rien à transférer. Lance d\'abord la simulation.'); return }
    if (!confirm(
      `Transférer ${aTransferer.length} collection(s) vers Firebase ?\n\n`
      + 'Ton stockage local ne sera pas vidé : en cas de problème, les données restent ici.'
    )) return

    setOccupe(true)
    setErreur('')
    const sortie = []
    for (const ligne of aTransferer) {
      try {
        sortie.push(await transfererCle(ligne.cle, { ecraser }))
      } catch (err) {
        sortie.push({ cle: ligne.cle, statut: 'echec', message: err?.message || String(err) })
      }
      setResultats([...sortie])
    }
    setOccupe(false)
  }

  async function verifier() {
    const cles = (resultats || []).filter(r => r.statut === 'transferee' || r.statut === 'deja_presente').map(r => r.cle)
    if (cles.length === 0) { setErreur('Rien à vérifier.'); return }
    setOccupe(true)
    const sortie = []
    for (const cle of cles) {
      try { sortie.push(await verifierTransfert(cle)) } catch (err) {
        sortie.push({ cle, erreur: err?.message })
      }
      setVerifs([...sortie])
    }
    setOccupe(false)
  }

  const partageables = (inventaire || []).filter(l => l.partageable)
  const locales = (inventaire || []).filter(l => !l.partageable)

  return (
    <div className="param-section">
      <div className="param-section-header">
        <h2>Migration vers Firebase</h2>
        <p>Transfert des données de ce poste vers la base partagée</p>
      </div>

      <div className="mig-explique">
        <p>
          Les données de PLS vivent aujourd'hui dans <strong>ce navigateur</strong>. Aucun
          script ni aucune autre personne ne peut y accéder : le transfert doit donc être
          lancé depuis ce poste.
        </p>
        <p>
          <strong>Ton stockage local ne sera jamais vidé.</strong> Si quelque chose se
          passe mal, les données d'origine sont toujours là.
        </p>
      </div>

      {!peutMigrer && (
        <p className="acces-fb-lecture">
          Seuls les administrateurs racine peuvent lancer le transfert. Les règles
          l'appliquent aussi côté serveur.
        </p>
      )}

      {erreur && <p className="acces-erreur">{erreur}</p>}

      <div className="mig-actions">
        <button className="btn-secondary" onClick={simuler} disabled={occupe}>
          1. Simuler — voir ce qui partirait
        </button>
        <button className="btn-primary" onClick={transferer} disabled={occupe || !inventaire || !peutMigrer}>
          2. Transférer
        </button>
        <button className="btn-secondary" onClick={verifier} disabled={occupe || !resultats}>
          3. Vérifier
        </button>
      </div>

      <label className="acces-custom-toggle">
        <input type="checkbox" checked={ecraser} onChange={e => setEcraser(e.target.checked)} />
        Écraser les collections déjà présentes dans Firebase
      </label>
      <p className="acces-pwd-hint">
        Laisse décoché pour un premier transfert. Coché, une collection déjà remplie
        côté Firebase sera remplacée par celle de ce poste — à n'utiliser que si tu
        sais que ce poste détient la version de référence.
      </p>

      {inventaire && (
        <>
          <h3 className="mig-titre">À transférer ({partageables.length})</h3>
          <div className="acces-users-table-wrap">
            <table className="acces-table">
              <thead>
                <tr><th>Collection</th><th>Clé</th><th>Éléments</th><th>Taille</th><th>Résultat</th></tr>
              </thead>
              <tbody>
                {partageables.map(l => {
                  const r = (resultats || []).find(x => x.cle === l.cle)
                  const v = (verifs || []).find(x => x.cle === l.cle)
                  return (
                    <tr key={l.cle}>
                      <td>{LIBELLES[l.cle] || '—'}</td>
                      <td><code className="acces-identifiant">{l.cle}</code></td>
                      <td>{l.elements ?? '—'}</td>
                      <td>{(l.octets / 1024).toFixed(1)} Ko</td>
                      <td>
                        {!r && <span className="mig-attente">en attente</span>}
                        {r?.statut === 'transferee' && <span className="mig-ok">✓ transférée</span>}
                        {r?.statut === 'deja_presente' && <span className="mig-skip">déjà présente</span>}
                        {r?.statut === 'vide_en_local' && <span className="mig-skip">vide ici</span>}
                        {r?.statut === 'echec' && <span className="mig-echec" title={r.message}>⛔ échec</span>}
                        {v && (
                          <span className={v.identique ? 'mig-ok' : 'mig-echec'}>
                            {' · '}{v.local} ici / {v.distant} en base
                            {v.identique ? ' ✓' : ' ⚠️'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <h3 className="mig-titre">Volontairement laissées en local ({locales.length})</h3>
          <p className="acces-pwd-hint">
            Propres à ce navigateur ou à cette session, elles n'auraient aucun sens
            ailleurs : {CLES_LOCALES.length} clés sont exclues par conception.
          </p>
          <ul className="mig-locales">
            {locales.map(l => <li key={l.cle}><code>{l.cle}</code></li>)}
          </ul>
        </>
      )}
    </div>
  )
}
