import { useState, useEffect } from 'react'
import { getQuestionsQB } from '../data/questionnaire-besoin'
import {
  surChangementAuth, deconnexionGoogle, envoyerLienConnexion,
  arriveParLienConnexion, terminerConnexionParLien,
} from '../data/firebase-auth'
import {
  lireMonCabinet, ecouterApprenants, enregistrerApprenant, supprimerApprenant,
  enregistrerBesoin, lireBesoin, QUESTIONS_EXCLUES,
} from '../data/cabinets-firebase'
import ChoixMultiple from '../components/ChoixMultiple'
import SimulateurTarif, { SIMU_VIDE, resumerDemande, calculerEstimation } from '../components/SimulateurTarif'
import './PortailCabinet.css'

// Espace cabinet.
//
// Connexion par lien email : le cabinet saisit son adresse, reçoit un lien,
// clique. Aucun mot de passe, aucun code à retenir, et aucun secret dans le
// code de l'application. Remplace l'ancien code à 6 caractères, qui ne pouvait
// fonctionner que dans le navigateur où il avait été généré — donc jamais chez
// le cabinet.
//
// Le cabinet peut : décrire son besoin de formation, et déclarer ses apprenants.
// Ses sessions ne sont pas listées : elles vivent encore sur le poste de
// l'équipe AFS et ne sont pas partagées.

// ── Demande du lien ──────────────────────────────────────────────────────────
function DemandeLien() {
  const [email, setEmail] = useState('')
  const [envoye, setEnvoye] = useState(false)
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function demander(e) {
    e.preventDefault()
    setEnCours(true)
    setErreur('')
    try {
      await envoyerLienConnexion(email)
      setEnvoye(true)
    } catch (err) {
      setErreur(err?.message || 'Envoi impossible. Vérifiez l\'adresse saisie.')
    } finally {
      setEnCours(false)
    }
  }

  if (envoye) {
    return (
      <div className="pc-login-wrap">
        <div className="pc-login-card">
          <div className="pc-login-icon">📬</div>
          <h2 className="pc-login-title">Vérifiez votre boîte mail</h2>
          <p className="pc-login-sub">
            Un lien de connexion vient d'être envoyé à <strong>{email}</strong>.
            Cliquez dessus pour accéder à votre espace. Le lien est valable une heure
            et ne fonctionne qu'une fois.
          </p>
          <button className="pc-login-btn" onClick={() => setEnvoye(false)}>
            Utiliser une autre adresse
          </button>
          <div className="pc-login-footer">Espace cabinet · Pennylane Learning Suite</div>
        </div>
      </div>
    )
  }

  return (
    <div className="pc-login-wrap">
      <div className="pc-login-card">
        <div className="pc-login-icon">🏢</div>
        <h2 className="pc-login-title">Espace cabinet</h2>
        <p className="pc-login-sub">
          Saisissez l'adresse email communiquée à l'équipe AFS. Vous recevrez un
          lien de connexion, sans mot de passe à créer.
        </p>
        <form onSubmit={demander} className="pc-login-form">
          <div className="pc-login-field">
            <label htmlFor="pc-email">Votre adresse email</label>
            <input
              id="pc-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="contact@cabinet.fr"
              autoComplete="email"
              required
            />
          </div>
          {erreur && <div className="pc-login-error">{erreur}</div>}
          <button type="submit" className="pc-login-btn" disabled={!email || enCours}>
            {enCours ? 'Envoi…' : 'Recevoir mon lien de connexion →'}
          </button>
        </form>
        <div className="pc-login-footer">Espace cabinet · Pennylane Learning Suite</div>
      </div>
    </div>
  )
}

// ── Questionnaire de besoin ──────────────────────────────────────────────────
function Besoin({ cabinet }) {
  const questions = getQuestionsQB()
  const [reponses, setReponses] = useState({})
  const [simu, setSimu] = useState(SIMU_VIDE)
  const [enregistre, setEnregistre] = useState(null)
  const [erreur, setErreur] = useState('')
  const [envoiEnCours, setEnvoiEnCours] = useState(false)

  // Relecture d'une demande déjà envoyée : on restaure aussi les paramètres du
  // simulateur, pour que le cabinet retrouve sa simulation et puisse l'ajuster.
  useEffect(() => {
    lireBesoin(cabinet.id, 'general')
      .then(v => {
        if (!v?.reponses) return
        const r = { ...v.reponses }
        const restaure = { ...SIMU_VIDE }
        if (r.simu_public) restaure.publicCible = r.simu_public
        if (r.simu_webinar) restaure.webinar = r.simu_webinar === 'oui'
        if (r.simu_modalite) restaure.modalite = r.simu_modalite
        if (r.simu_participants) restaure.participants = parseInt(r.simu_participants, 10) || 8
        if (r.simu_modules) restaure.modules = r.simu_modules.split(',').filter(Boolean)
        setSimu(restaure)
        // Les champs techniques du simulateur ne s'affichent pas comme réponses.
        Object.keys(r).forEach(k => { if (k.startsWith('simu_') || k === 'estimation') delete r[k] })
        setReponses(r)
        if (v.soumisLe) setEnregistre(v.soumisLe)
      })
      .catch(() => {})
  }, [cabinet.id])

  async function soumettre() {
    setErreur('')
    setEnvoiEnCours(true)
    try {
      // Les paramètres du simulateur partent AVEC les réponses, en une seule
      // demande. Stockés comme chaînes : les règles de la base n'acceptent que
      // des chaînes sous `reponses`, et ça permet de recalculer l'estimation à
      // l'identique plus tard, même si la grille a changé entre-temps.
      const { estimation } = calculerEstimation(simu)
      const charge = {
        ...reponses,
        simu_public: simu.publicCible,
        simu_webinar: simu.webinar ? 'oui' : 'non',
        simu_modalite: simu.modalite,
        simu_participants: String(simu.participants),
        simu_modules: simu.modules.join(','),
      }
      if (estimation?.valide) charge.estimation = resumerDemande(simu)
      await enregistrerBesoin(cabinet.id, 'general', charge)
      setEnregistre(new Date().toISOString())
    } catch (err) {
      setErreur(err?.message || 'Envoi impossible.')
    }
    setEnvoiEnCours(false)
  }

  const { estimation } = calculerEstimation(simu)

  return (
    <div className="pc-section">
      <div className="pc-section-title">Votre demande de formation</div>
      <p className="pc-note">
        Décrivez votre besoin et composez votre formation : l’estimation se met à jour au fur et à
        mesure. Tout part en une seule demande, et vous pourrez revenir la compléter à tout moment.
      </p>
      {enregistre && (
        <p className="pc-note">
          Dernier envoi le {new Date(enregistre).toLocaleString('fr-FR')}.
        </p>
      )}

      {/* Le besoin exprimé */}
      {questions.map(q => (
        <div key={q.id} className="pc-field">
          <label htmlFor={`q-${q.id}`}>
            {q.question}
            {QUESTIONS_EXCLUES.includes(q.id) && (
              <span className="pc-field-hint">
                {' '}— à évoquer directement avec votre interlocuteur AFS, cette réponse n’est pas
                conservée ici.
              </span>
            )}
          </label>
          {q.aide && <p className="pc-aide">{q.aide}</p>}
          {QUESTIONS_EXCLUES.includes(q.id) ? (
            <p className="pc-exclu">
              Pour toute adaptation liée à un prérequis ou à une situation de handicap, contactez
              votre interlocuteur AFS. Nous ne collectons pas cette information par ce formulaire.
            </p>
          ) : q.type === 'checkbox' ? (
            <ChoixMultiple
              id={`q-${q.id}`}
              options={q.options}
              valeur={reponses[q.id] || ''}
              onChange={v => setReponses(r => ({ ...r, [q.id]: v }))}
              classe="pc-choix"
            />
          ) : q.type === 'radio' ? (
            <select
              id={`q-${q.id}`}
              value={reponses[q.id] || ''}
              onChange={e => setReponses(r => ({ ...r, [q.id]: e.target.value }))}
            >
              <option value="">—</option>
              {(q.options || []).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <textarea
              id={`q-${q.id}`}
              rows={3}
              placeholder={q.placeholder || ''}
              value={reponses[q.id] || ''}
              onChange={e => setReponses(r => ({ ...r, [q.id]: e.target.value }))}
            />
          )}
        </div>
      ))}

      {/* Le simulateur, dans le même formulaire */}
      <div className="pc-separateur">Votre formation et son coût estimé</div>
      <SimulateurTarif valeur={simu} onChange={setSimu} />

      {erreur && <div className="pc-login-error">{erreur}</div>}

      <button className="pc-login-btn" onClick={soumettre} disabled={envoiEnCours}>
        {envoiEnCours
          ? 'Envoi…'
          : enregistre
            ? 'Mettre à jour ma demande'
            : estimation?.valide
              ? 'Envoyer ma demande avec l’estimation'
              : 'Envoyer ma demande'}
      </button>
    </div>
  )
}

// ── Apprenants ───────────────────────────────────────────────────────────────
const APPRENANT_VIDE = { nom: '', prenom: '', email: '', fonction: '' }

function Apprenants({ cabinet }) {
  const [liste, setListe] = useState([])
  const [form, setForm] = useState(APPRENANT_VIDE)
  const [erreur, setErreur] = useState('')

  useEffect(() => {
    const stop = ecouterApprenants(cabinet.id, setListe, err => setErreur(err.message))
    return () => { if (typeof stop === 'function') stop() }
  }, [cabinet.id])

  async function ajouter() {
    setErreur('')
    try {
      await enregistrerApprenant(cabinet.id, form)
      setForm(APPRENANT_VIDE)
    } catch (err) {
      setErreur(err?.message || 'Enregistrement impossible.')
    }
  }

  async function retirer(id) {
    if (!confirm('Retirer cet apprenant de la liste ?')) return
    try { await supprimerApprenant(cabinet.id, id) } catch (err) { setErreur(err.message) }
  }

  return (
    <div className="pc-section">
      <div className="pc-section-title">Vos apprenants ({liste.length})</div>
      <p className="pc-note">
        Déclarez les personnes à former. L'équipe AFS les reprendra pour organiser
        les sessions et établir les documents.
      </p>

      {liste.length > 0 && (
        <table className="pc-table">
          <thead>
            <tr><th>Nom</th><th>Prénom</th><th>Email</th><th>Fonction</th><th></th></tr>
          </thead>
          <tbody>
            {liste.map(a => (
              <tr key={a.id}>
                <td>{a.nom}</td>
                <td>{a.prenom}</td>
                <td>{a.email || '—'}</td>
                <td>{a.fonction || '—'}</td>
                <td>
                  <button className="pc-suppr" onClick={() => retirer(a.id)} title="Retirer">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div className="pc-form-row">
        <input placeholder="Nom *" value={form.nom}
          onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} />
        <input placeholder="Prénom *" value={form.prenom}
          onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} />
        <input type="email" placeholder="Email" value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        <input placeholder="Fonction" value={form.fonction}
          onChange={e => setForm(f => ({ ...f, fonction: e.target.value }))} />
        <button className="pc-add" onClick={ajouter} disabled={!form.nom || !form.prenom}>
          Ajouter
        </button>
      </div>
      {erreur && <div className="pc-login-error">{erreur}</div>}
    </div>
  )
}

// ── Confirmation d'adresse (lien ouvert sur un autre appareil) ───────────────
//
// Cas courant : le cabinet demande le lien sur son ordinateur et le clique depuis
// l'application mail de son téléphone. L'adresse mémorisée n'est pas sur cet
// appareil ; Firebase exige alors de la confirmer. Inutile de lui faire tout
// recommencer, il suffit de la redemander.
function ConfirmerAdresse({ onConfirme }) {
  const [email, setEmail] = useState('')
  const [erreur, setErreur] = useState('')
  const [enCours, setEnCours] = useState(false)

  async function valider(e) {
    e.preventDefault()
    setEnCours(true)
    setErreur('')
    try {
      await onConfirme(email)
    } catch (err) {
      setErreur(err?.message || 'Adresse incorrecte, ou lien expiré.')
      setEnCours(false)
    }
  }

  return (
    <div className="pc-login-wrap">
      <div className="pc-login-card">
        <div className="pc-login-icon">✉️</div>
        <h2 className="pc-login-title">Confirmez votre adresse</h2>
        <p className="pc-login-sub">
          Vous ouvrez ce lien depuis un autre appareil que celui de la demande.
          Rappelez-nous l'adresse à laquelle vous l'avez reçu.
        </p>
        <form onSubmit={valider} className="pc-login-form">
          <div className="pc-login-field">
            <label htmlFor="pc-confirm">Votre adresse email</label>
            <input id="pc-confirm" type="email" value={email} required
              onChange={e => setEmail(e.target.value)} placeholder="contact@cabinet.fr" />
          </div>
          {erreur && <div className="pc-login-error">{erreur}</div>}
          <button type="submit" className="pc-login-btn" disabled={!email || enCours}>
            {enCours ? 'Vérification…' : 'Continuer →'}
          </button>
        </form>
        <div className="pc-login-footer">Espace cabinet · Pennylane Learning Suite</div>
      </div>
    </div>
  )
}

// ── Portail ──────────────────────────────────────────────────────────────────
export default function PortailCabinet() {
  const [etat, setEtat] = useState('chargement') // chargement | anonyme | refuse | pret
  const [cabinet, setCabinet] = useState(null)
  const [emailConnecte, setEmailConnecte] = useState('')
  const [erreur, setErreur] = useState('')

  // Retour du lien : on termine la connexion avant tout.
  useEffect(() => {
    if (!arriveParLienConnexion()) return
    terminerConnexionParLien().catch(err => {
      if (err?.emailRequis) { setEtat('confirmer'); return }
      setErreur(err?.message || 'Ce lien n\'est plus valable. Demandez-en un nouveau.')
    })
  }, [])

  useEffect(() => {
    return surChangementAuth(async utilisateur => {
      if (!utilisateur?.email) {
        // Ne pas court-circuiter l'écran de confirmation en cours.
        setEtat(e => (e === 'confirmer' ? e : 'anonyme'))
        return
      }
      setEmailConnecte(utilisateur.email)
      try {
        const fiche = await lireMonCabinet(utilisateur.email)
        if (!fiche) { setEtat('refuse'); return }
        setCabinet(fiche)
        setEtat('pret')
      } catch {
        // Lecture refusée par les règles : aucun accès n'a été accordé.
        setEtat('refuse')
      }
    })
  }, [])

  async function deconnecter() {
    await deconnexionGoogle().catch(() => {})
    setCabinet(null)
    setEtat('anonyme')
  }

  if (etat === 'chargement') {
    return <div className="pc-login-wrap"><div className="pc-login-card">Chargement…</div></div>
  }

  if (etat === 'confirmer') {
    return (
      <ConfirmerAdresse
        onConfirme={async email => { await terminerConnexionParLien(email) }}
      />
    )
  }

  if (etat === 'anonyme') {
    return (
      <>
        {erreur && <div className="pc-banniere-erreur">{erreur}</div>}
        <DemandeLien />
      </>
    )
  }

  if (etat === 'refuse') {
    return (
      <div className="pc-login-wrap">
        <div className="pc-login-card">
          <div className="pc-login-icon">🔒</div>
          <h2 className="pc-login-title">Accès non ouvert</h2>
          <p className="pc-login-sub">
            L'adresse <strong>{emailConnecte}</strong> n'a pas d'espace cabinet actif.
            Contactez votre interlocuteur AFS pour qu'il vous en ouvre un.
          </p>
          <button className="pc-login-btn" onClick={deconnecter}>Changer d'adresse</button>
        </div>
      </div>
    )
  }

  return (
    <div className="pc-wrap">
      <div className="pc-header">
        <div className="pc-identity">
          <div className="pc-avatar">🏢</div>
          <div>
            <div className="pc-name">{cabinet.nom || 'Votre cabinet'}</div>
            <div className="pc-email">{cabinet.email}</div>
          </div>
        </div>
        <button className="pc-logout-btn" onClick={deconnecter}>Déconnexion</button>
      </div>

      <Besoin cabinet={cabinet} />
      <Apprenants cabinet={cabinet} />

      <div className="pc-footer">
        Espace cabinet · Pennylane Learning Suite · Accès personnel et confidentiel
      </div>
    </div>
  )
}
