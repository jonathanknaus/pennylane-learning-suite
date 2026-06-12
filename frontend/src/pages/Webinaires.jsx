import { useState } from 'react'
import './Webinaires.css'

const WEBINAIRES = [
  {
    id: 1,
    titre: 'Webinar de formation sur le plan collaboratif + comptabilité',
    description: 'Découvrez comment Pennylane permet à votre cabinet et à vos clients PME de collaborer en temps réel sur la comptabilité, les transactions et la trésorerie — depuis une seule et même plateforme.',
    tags: ['Collaboration', 'Comptabilité', 'PME'],
    duree: '45 min',
    url: 'https://app.livestorm.co/pennylane-8/introduction-a-la-compta-light-sur-pennylane',
  },
  {
    id: 2,
    titre: 'Découverte de votre nouvelle plateforme collaborative',
    description: "Une présentation complète de l'interface Pennylane : gestion des accès, tableau de bord partagé, communication cabinet-client et prise en main des fonctionnalités clés pour bien démarrer.",
    tags: ['Prise en main', 'Onboarding', 'Cabinet'],
    duree: '30 min',
    url: 'https://app.livestorm.co/pennylane-8/decouverte-de-votre-nouvelle-plateforme-collaborative',
  },
  {
    id: 3,
    titre: 'Aborder sereinement la Réforme de la Facture Électronique',
    description: 'Tout ce que les PME et les cabinets doivent savoir sur la dématérialisation obligatoire des factures. Conformité, calendrier, intégration Chorus Pro et accompagnement Pennylane.',
    tags: ['Facture électronique', 'Conformité', 'Réforme'],
    duree: '45 min',
    url: 'https://app.livestorm.co/pennylane-8/aborder-sereinement-la-reforme-de-la-facture-electronique?s=8063cf61-acd5-4546-9ed9-4bd1d65b31cc',
  },
]

const THEMATIQUES = [
  'Collaboration cabinet-client',
  'Prise en main de Pennylane',
  'Facture électronique & conformité',
  'Gestion de trésorerie',
  'Rapprochement bancaire',
  'Pilotage financier',
  'Autre (précisez dans le message)',
]

function CarteWebinaire({ w }) {
  return (
    <div className="webinaire-card">
      <div className="webinaire-card-header">
        <div className="webinaire-tags">
          {w.tags.map(t => <span key={t} className="webinaire-tag">{t}</span>)}
        </div>
        <span className="webinaire-duree">⏱ {w.duree}</span>
      </div>
      <h2 className="webinaire-titre">{w.titre}</h2>
      <p className="webinaire-desc">{w.description}</p>
      <a
        href={w.url}
        target="_blank"
        rel="noopener noreferrer"
        className="webinaire-btn"
      >
        S'inscrire gratuitement →
      </a>
    </div>
  )
}

function FormulaireDemandeCollectif() {
  const [form, setForm] = useState({
    cabinet: '',
    contact: '',
    email: '',
    telephone: '',
    thematique: '',
    nbParticipants: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [errors, setErrors] = useState({})

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
    setErrors(e => ({ ...e, [field]: '' }))
  }

  function validate() {
    const e = {}
    if (!form.cabinet.trim()) e.cabinet = 'Requis'
    if (!form.contact.trim()) e.contact = 'Requis'
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Email invalide'
    if (!form.thematique) e.thematique = 'Choisissez une thématique'
    return e
  }

  function handleSubmit(ev) {
    ev.preventDefault()
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }

    const subject = encodeURIComponent(`Demande webinar collectif – ${form.cabinet}`)
    const body = encodeURIComponent(
      `Cabinet : ${form.cabinet}\n` +
      `Contact : ${form.contact}\n` +
      `Email : ${form.email}\n` +
      `Téléphone : ${form.telephone || 'non renseigné'}\n` +
      `Thématique souhaitée : ${form.thematique}\n` +
      `Nombre de participants estimé : ${form.nbParticipants || 'non renseigné'}\n\n` +
      `Message :\n${form.message || '–'}`
    )
    window.open(`mailto:sarah.briden@pennylane-partners.com?cc=jonathan.knaus@pennylane.com&subject=${subject}&body=${body}`)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="demande-success">
        <div className="demande-success-icon">✓</div>
        <h3>Demande envoyée !</h3>
        <p>Votre client de messagerie s'est ouvert avec le message pré-rempli. Envoyez l'email pour finaliser votre demande — nous vous répondrons sous 48 h ouvrées.</p>
        <button className="demande-reset" onClick={() => { setSubmitted(false); setForm({ cabinet: '', contact: '', email: '', telephone: '', thematique: '', nbParticipants: '', message: '' }) }}>
          Nouvelle demande
        </button>
      </div>
    )
  }

  return (
    <form className="demande-form" onSubmit={handleSubmit} noValidate>
      <div className="demande-grid">
        <div className={`demande-field ${errors.cabinet ? 'error' : ''}`}>
          <label>Nom du cabinet *</label>
          <input value={form.cabinet} onChange={e => set('cabinet', e.target.value)} placeholder="AFS Expertise" />
          {errors.cabinet && <span className="demande-error">{errors.cabinet}</span>}
        </div>
        <div className={`demande-field ${errors.contact ? 'error' : ''}`}>
          <label>Votre nom *</label>
          <input value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="Prénom Nom" />
          {errors.contact && <span className="demande-error">{errors.contact}</span>}
        </div>
        <div className={`demande-field ${errors.email ? 'error' : ''}`}>
          <label>Email professionnel *</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="vous@cabinet.com" />
          {errors.email && <span className="demande-error">{errors.email}</span>}
        </div>
        <div className="demande-field">
          <label>Téléphone</label>
          <input value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="06 xx xx xx xx" />
        </div>
        <div className={`demande-field demande-field--full ${errors.thematique ? 'error' : ''}`}>
          <label>Thématique souhaitée *</label>
          <select value={form.thematique} onChange={e => set('thematique', e.target.value)}>
            <option value="">Choisissez une thématique</option>
            {THEMATIQUES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.thematique && <span className="demande-error">{errors.thematique}</span>}
        </div>
        <div className="demande-field">
          <label>Nombre de participants estimé</label>
          <input type="number" min="2" max="500" value={form.nbParticipants} onChange={e => set('nbParticipants', e.target.value)} placeholder="ex: 15" />
        </div>
        <div className="demande-field demande-field--full">
          <label>Message complémentaire</label>
          <textarea rows={4} value={form.message} onChange={e => set('message', e.target.value)} placeholder="Décrivez le profil de vos clients, leur niveau de maîtrise de Pennylane, vos disponibilités ou toute demande particulière…" />
        </div>
      </div>
      <button type="submit" className="demande-submit">
        Envoyer la demande →
      </button>
      <p className="demande-note">* Champs obligatoires. Cette demande sera transmise à l'équipe AFS.</p>
    </form>
  )
}

export default function Webinaires() {
  return (
    <div className="webinaires-page">
      <section className="webinaires-hero">
        <div className="webinaires-hero-badge">Démonstrations Pennylane</div>
        <h1>Webinaires en ligne</h1>
        <p>Des sessions gratuites pour prendre en main Pennylane et accompagner vos clients dans leur transition numérique. Inscriptions libres, sans prérequis.</p>
      </section>

      <section className="webinaires-section">
        <div className="webinaires-grid">
          {WEBINAIRES.map(w => <CarteWebinaire key={w.id} w={w} />)}
        </div>
      </section>

      <section className="webinaires-section webinaires-demande-section">
        <div className="demande-header">
          <div className="demande-badge">Réservé aux cabinets</div>
          <h2>Demander un webinar collectif pour vos clients</h2>
          <p>Vous souhaitez organiser une session de démonstration Pennylane dédiée aux clients de votre cabinet ? Remplissez ce formulaire — nous construirons ensemble un programme adapté à leurs besoins.</p>
        </div>
        <FormulaireDemandeCollectif />
      </section>
    </div>
  )
}
