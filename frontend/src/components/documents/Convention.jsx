import { getParametres } from '../../data/parametres'
import './print.css'

const CLAUSES = [
  {
    num: 1,
    titre: 'Objet de la convention',
    corps: (d) => `La présente convention est conclue conformément aux dispositions des articles L.6353-1 et suivants du Code du travail. Elle a pour objet la réalisation de la formation intitulée « ${d.session.titre} » organisée par ${d.of.of_nom}, organisme de formation enregistré sous le numéro de déclaration d'activité ${d.of.of_da}.`,
  },
  {
    num: 2,
    titre: 'Programme et objectifs pédagogiques',
    corps: (d) => `La formation porte sur les modules suivants : ${d.modules.map(m => m.titre).join(', ')}. À l'issue de la formation, les participants seront en mesure de maîtriser les fonctionnalités Pennylane abordées et de les appliquer directement sur leurs dossiers clients.`,
  },
  {
    num: 3,
    titre: 'Modalités pédagogiques',
    corps: (d) => `La formation se déroule sous forme de ${d.session.modalite === 'visio' ? 'formation à distance par visioconférence' : 'formation en présentiel'}. Elle est animée par ${d.session.formateur || d.of.of_signataire}, ${d.of.of_titre}. La méthode pédagogique est active et participative : apports théoriques, démonstrations en direct sur la plateforme Pennylane et échanges sur des cas pratiques.`,
  },
  {
    num: 4,
    titre: 'Durée, dates et horaires',
    corps: (d) => `La formation d'une durée de ${d.format?.duree || '—'} se déroulera le ${d.dateFormatee}${d.session.heure ? ` à ${d.session.heure}` : ''}. Toute modification de date fera l'objet d'un avenant à la présente convention.`,
  },
  {
    num: 5,
    titre: 'Participants',
    corps: (d) => `La formation accueille ${d.participants.length} participant${d.participants.length > 1 ? 's' : ''} désigné${d.participants.length > 1 ? 's' : ''} par le client. La liste nominative figure en annexe de la présente convention. Le nombre maximum de participants est fixé à ${d.session.participants_max || 15}.`,
  },
  {
    num: 6,
    titre: 'Prix et modalités de règlement',
    corps: (d) => `Le coût total de la formation s'élève à ${d.prix ? `${d.prix} € HT (${(d.prix * 1.2).toFixed(2)} € TTC, TVA 20%)` : '— € HT'}. Le règlement est exigible à réception de la facture, sauf accord préalable. Tout retard de paiement entraîne l'application de pénalités de retard au taux légal en vigueur.`,
  },
  {
    num: 7,
    titre: 'Financement — OPCO / subrogation',
    corps: () => `Si le client bénéficie d'une prise en charge par un OPCO, il lui appartient de vérifier les conditions d'éligibilité et d'effectuer les démarches nécessaires avant la formation. En cas de subrogation de paiement, le client en informe l'organisme de formation au plus tard 7 jours avant le début de la formation, en précisant les coordonnées de l'OPCO et le numéro de dossier.`,
  },
  {
    num: 8,
    titre: 'Conditions d\'annulation et de report',
    corps: () => `Toute annulation par le client doit être notifiée par écrit. En cas d'annulation plus de 14 jours avant la session, aucune pénalité n'est due. En cas d'annulation entre 7 et 14 jours, 30 % du prix total sera facturé. En cas d'annulation moins de 7 jours avant la session, 100 % du prix total sera dû. L'organisme de formation se réserve le droit d'annuler ou de reporter une session pour des raisons indépendantes de sa volonté, sans pénalité.`,
  },
  {
    num: 9,
    titre: 'Accessibilité et handicap',
    corps: (d) => `${d.of.of_nom} s'engage à prendre en compte les besoins spécifiques des personnes en situation de handicap. Pour tout besoin d'adaptation, merci de contacter notre référent handicap à l'adresse ${d.of.of_email} au minimum 10 jours avant la formation.`,
  },
  {
    num: 10,
    titre: 'Litiges et droit applicable',
    corps: () => `La présente convention est soumise au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire. À défaut, le tribunal compétent sera celui du lieu du siège social de l'organisme de formation.`,
  },
]

export default function Convention({ data }) {
  const { session, participants, modules, format, dateFormatee, prix } = data
  const of = getParametres()
  const ctx = { session, participants, modules, format, dateFormatee, prix, of }

  return (
    <div className="doc-page convention">
      {/* En-tête */}
      <div className="doc-header">
        <div className="doc-logo-area">
          <div className="doc-logo">◎ pennylane</div>
          <div className="doc-logo-sub">Learning Suite — AFS</div>
        </div>
        <div className="doc-header-right">
          <div className="doc-type-label">CONVENTION DE FORMATION</div>
          <div className="doc-ref">Réf. {session.id?.slice(-6).toUpperCase()}</div>
        </div>
      </div>

      <div className="doc-qualiopi-banner">
        <span className="qualiopi-badge">Qualiopi</span>
        <span>Convention établie conformément à l'article L.6353-1 du Code du travail</span>
      </div>

      {/* Parties à la convention */}
      <div className="conv-parties">
        <div className="conv-partie">
          <div className="conv-partie-label">ORGANISME DE FORMATION</div>
          <div className="conv-partie-nom">{of.of_nom}</div>
          <div className="conv-partie-detail">SIRET {of.of_siret}</div>
          <div className="conv-partie-detail">N° DA : {of.of_da}</div>
          <div className="conv-partie-detail">{of.of_adresse}</div>
          <div className="conv-partie-detail">{of.of_email}</div>
        </div>
        <div className="conv-et">et</div>
        <div className="conv-partie">
          <div className="conv-partie-label">CLIENT COMMANDITAIRE</div>
          <div className="conv-partie-nom">{session.client || '—'}</div>
          <div className="conv-partie-detail">Représenté par le contact désigné ci-après</div>
        </div>
      </div>

      {/* Clauses */}
      <div className="conv-clauses">
        {CLAUSES.map(c => (
          <div key={c.num} className="conv-clause">
            <div className="conv-clause-title">Article {c.num} — {c.titre}</div>
            <p className="conv-clause-body">{c.corps(ctx)}</p>
          </div>
        ))}
      </div>

      {/* Tableau participants */}
      <div className="doc-section">
        <h2 className="doc-section-title">Annexe — Liste des participants</h2>
        {participants.length === 0 ? (
          <p className="doc-text">Aucun participant inscrit à ce jour.</p>
        ) : (
          <table className="conv-participants-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nom / Prénom</th>
                <th>Fonction</th>
                <th>Cabinet</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p, i) => (
                <tr key={p.stagiaire.id} className={i % 2 === 0 ? 'row-even' : 'row-odd'}>
                  <td className="col-num">{i + 1}</td>
                  <td><strong>{p.stagiaire.prenom} {p.stagiaire.nom}</strong></td>
                  <td>{p.stagiaire.fonction || '—'}</td>
                  <td>{p.stagiaire.cabinet || '—'}</td>
                  <td>{p.stagiaire.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Tableau récapitulatif financier */}
      <div className="doc-section">
        <h2 className="doc-section-title">Récapitulatif financier</h2>
        <table className="conv-tarif-table">
          <thead>
            <tr>
              <th>Désignation</th>
              <th>Durée</th>
              <th>Participants</th>
              <th>Montant HT</th>
              <th>TVA (20%)</th>
              <th>Montant TTC</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{session.titre}</td>
              <td>{format?.duree || '—'}</td>
              <td>{participants.length}</td>
              <td>{prix ? `${prix} €` : '—'}</td>
              <td>{prix ? `${(prix * 0.2).toFixed(2)} €` : '—'}</td>
              <td><strong>{prix ? `${(prix * 1.2).toFixed(2)} €` : '—'}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Signatures */}
      <div className="conv-signatures">
        <div className="conv-sign-block">
          <div className="conv-sign-label">Pour le client commanditaire</div>
          <div className="conv-sign-subtitle">Nom, qualité et signature précédés de la mention "Lu et approuvé"</div>
          <div className="conv-sign-box" />
        </div>
        <div className="conv-sign-block">
          <div className="conv-sign-label">Pour l'organisme de formation</div>
          <div className="conv-sign-name">{of.of_signataire}</div>
          <div className="conv-sign-subtitle">{of.of_titre}</div>
          <div className="conv-sign-box" />
        </div>
      </div>

      <div className="doc-footer">
        <div className="doc-footer-left">
          <div>{of.of_nom} — {of.of_adresse}</div>
          <div>{of.of_email}{of.of_tel ? ` · ${of.of_tel}` : ''}</div>
        </div>
        <div className="doc-footer-right">
          <div className="doc-footer-qualiopi">
            <span className="qualiopi-badge small">Qualiopi</span>
            <span>Actions de formation</span>
          </div>
        </div>
      </div>
    </div>
  )
}
