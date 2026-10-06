// Synthèse imprimable d'une demande de formation : réponses au questionnaire,
// modules retenus, niveaux et estimation, en un document unique.
//
// Même mécanisme que `exportRegistrePDF` : on écrit du HTML dans une fenêtre et
// on laisse le navigateur produire le PDF. Aucune dépendance ajoutée — le projet
// n'embarque pas de librairie PDF, et une page imprimable reste lisible même si
// le rendu change.
//
// ⚠️ LA RÉPONSE SUR LE HANDICAP N'Y FIGURE PAS. On a fait le nécessaire pour
// qu'elle ne soit jamais écrite en base (QUESTIONS_EXCLUES) ; la laisser partir
// dans un PDF joint à un mail reviendrait à la conserver dans deux boîtes de
// messagerie — donc à recréer exactement ce qu'on a évité. Le document invite à
// en parler de vive voix.

import { QUESTIONS_EXCLUES } from './cabinets-firebase'
import { getAllModules } from './catalogue-afs'
import { libelleDuree, totaliserDurees, origineDuree } from './durees-modules'
import { decomposerNiveaux, libelleNiveau } from '../components/NiveauxModules'
import { MODALITES } from './tarification'
import { variablesOrganisme } from './modele-mail'

const VERT_FONCE = '#003D3D'
const VERT_VIF = '#00BD57'

function echap(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function sautsEnBr(s) {
  return echap(s).replace(/\n/g, '<br>')
}

export function libelleModalite(simu) {
  if (simu?.webinar) return 'Webinar (visioconférence, participants illimités)'
  return MODALITES.find(m => m.id === simu?.modalite)?.label || simu?.modalite || '—'
}

/**
 * Rassemble tout ce qui alimente le document ET le mail, pour qu'ils ne puissent
 * pas se contredire : un seul calcul, deux sorties.
 */
export function donneesSynthese({ cabinet, questions, reponses, simu, estimation }) {
  const parId = new Map(getAllModules().map(m => [m.id, m]))
  const retenus = (simu?.modules || []).map(id => parId.get(id)).filter(Boolean)
  const disparus = (simu?.modules || []).filter(id => !parId.has(id))
  const cumul = totaliserDurees(retenus)
  const niveaux = decomposerNiveaux(simu?.niveaux)

  const montant = !estimation?.valide
    ? 'à préciser'
    : estimation.surDevis
      ? 'sur devis'
      : `${estimation.prixHT.toLocaleString('fr-FR')} € HT`

  // Les questions exclues ne sortent pas d'ici : ni dans le PDF, ni dans le mail.
  const visibles = (questions || [])
    .filter(q => !QUESTIONS_EXCLUES.includes(q.id))
    .map(q => ({ ...q, reponse: (reponses || {})[q.id] || '' }))
    .filter(q => String(q.reponse).trim() !== '')

  return {
    cabinet: cabinet?.nom || cabinet?.email || '—',
    emailCabinet: cabinet?.email || '',
    date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
    questions: visibles,
    retenus,
    disparus,
    cumul,
    niveaux,
    montant,
    estimation,
    simu,
    // Variables du modèle de mail.
    variables: {
      cabinet: cabinet?.nom || cabinet?.email || '',
      date: new Date().toLocaleDateString('fr-FR'),
      modules: retenus.map(m => m.titre).join(', '),
      duree: cumul.complet ? libelleDuree(cumul.totalHeures) : '',
      participants: simu?.webinar ? 'illimités' : String(simu?.participants || ''),
      modalite: libelleModalite(simu),
      estimation: montant,
      niveaux: retenus.filter(m => niveaux[m.id])
        .map(m => `${m.titre} : ${libelleNiveau(niveaux[m.id])}`).join(' ; '),
      ...variablesOrganisme(),
    },
  }
}

export function genererSyntheseHTML(d) {
  const lignesQuestions = d.questions.map(q => `
    <tr>
      <th class="lbl">${echap(q.label || q.question)}</th>
      <td>${sautsEnBr(q.reponse)}</td>
    </tr>`).join('')

  const lignesModules = d.retenus.map(m => {
    const niveau = d.niveaux[m.id] ? libelleNiveau(d.niveaux[m.id]) : '<span class="gris">non précisé</span>'
    const origine = origineDuree(m)
    const duree = libelleDuree(m.duree || undefined) !== 'Non renseignée' && origine === 'catalogue'
      ? libelleDuree(m.duree)
      : null
    return `
    <tr>
      <td>${echap(m.titre)}</td>
      <td>${echap(m.thematique || '—')}</td>
      <td>${niveau}</td>
      <td class="num">${duree ? echap(duree) : '<span class="gris">à confirmer</span>'}</td>
    </tr>`
  }).join('')

  const alerteDisparus = d.disparus.length > 0 ? `
    <p class="alerte">${d.disparus.length} module(s) initialement retenu(s) ne figurent plus au
    catalogue et ne sont pas comptés dans l'estimation. Notre offre évolue : la sélection mérite
    d'être revue ensemble.</p>` : ''

  const alerteDurees = d.cumul.complet && !d.cumul.confirme ? `
    <p class="alerte">La durée de ${d.cumul.aConfirmer.length} module(s) reste à préciser
    (${echap(d.cumul.aConfirmer.map(m => m.titre).join(', '))}). Le montant peut évoluer en
    conséquence.</p>` : ''

  const mentionAdaptation = `
    <p class="rappel"><strong>Accessibilité.</strong> Si un participant a besoin d'un aménagement,
    quelle qu'en soit la raison, parlons-en directement : nous étudierons les adaptations possibles
    avec notre référent. Cette information n'est pas consignée dans ce document.</p>`

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Analyse du besoin de formation — ${echap(d.cabinet)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11.5px; color: #222; margin: 24px; line-height: 1.5; }
  h1 { font-size: 18px; color: ${VERT_FONCE}; margin: 0 0 4px; }
  h2 { font-size: 13px; color: ${VERT_FONCE}; margin: 22px 0 8px; padding-bottom: 4px; border-bottom: 2px solid ${VERT_VIF}; }
  .meta { font-size: 11px; color: #666; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; text-align: left; }
  th.lbl { width: 32%; background: #f7fafa; color: ${VERT_FONCE}; font-size: 11px; }
  thead th { background: ${VERT_FONCE}; color: #fff; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; }
  .num { text-align: right; white-space: nowrap; }
  .gris { color: #999; font-style: italic; }
  .estim { margin-top: 10px; padding: 12px 16px; background: #f0f7f5; border-left: 3px solid ${VERT_VIF}; }
  .estim .montant { font-size: 20px; font-weight: bold; color: ${VERT_FONCE}; }
  .estim ul { margin: 8px 0 0; padding-left: 18px; font-size: 11px; }
  .alerte { font-size: 11px; background: #FEF3C7; color: #92400E; padding: 8px 12px; border-radius: 4px; margin-top: 10px; }
  .rappel { font-size: 11px; background: #f0f7f5; border-left: 3px solid ${VERT_VIF}; padding: 8px 12px; margin-top: 12px; }
  .footer { margin-top: 26px; font-size: 10px; color: #888; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  @media print { body { margin: 12mm; } h2 { page-break-after: avoid; } tr { page-break-inside: avoid; } }
</style>
</head>
<body>
<h1>Analyse du besoin de formation</h1>
<p class="meta"><strong>${echap(d.cabinet)}</strong>${d.emailCabinet ? ` · ${echap(d.emailCabinet)}` : ''} · établie le ${echap(d.date)}</p>

<h2>Votre besoin</h2>
<table>${lignesQuestions || '<tr><td class="gris">Aucune réponse renseignée.</td></tr>'}</table>

<h2>Formation envisagée</h2>
${d.retenus.length > 0 ? `<table>
  <thead><tr><th>Module</th><th>Thématique</th><th>Niveau des participants</th><th class="num">Durée</th></tr></thead>
  <tbody>${lignesModules}</tbody>
</table>` : '<p class="gris">Aucun module sélectionné.</p>'}
${alerteDisparus}

<h2>Modalités et estimation</h2>
<table>
  <tr><th class="lbl">Format</th><td>${echap(libelleModalite(d.simu))}</td></tr>
  <tr><th class="lbl">Participants</th><td>${d.simu?.webinar ? 'Illimités' : echap(String(d.simu?.participants || '—'))}</td></tr>
  <tr><th class="lbl">Durée cumulée</th><td>${d.cumul.complet ? echap(libelleDuree(d.cumul.totalHeures)) : '<span class="gris">—</span>'}</td></tr>
</table>

<div class="estim">
  <div class="montant">${echap(d.montant)}</div>
  ${d.estimation?.valide && !d.estimation.surDevis ? `<ul>
    <li>${echap(d.estimation.formatLabel)} — ${echap(d.estimation.detail)}</li>
    ${d.estimation.formateurs > 1 ? `<li>${d.estimation.formateurs} formateurs mobilisés</li>` : ''}
    ${d.estimation.fraisDeplacementInclus ? '<li>Frais de déplacement inclus</li>' : ''}
  </ul>` : d.estimation?.surDevis ? `<ul><li>${echap(d.estimation.motifDevis || '')}</li></ul>` : ''}
  <p style="margin:8px 0 0;font-size:11px"><strong>Estimation indicative, hors remise éventuelle. Ne constitue pas un devis.</strong></p>
</div>
${alerteDurees}
${mentionAdaptation}

<p class="footer">Pennylane Learning Suite — AFS Training · document établi à partir de votre questionnaire de besoin</p>
</body>
</html>`
}

/** Ouvre la synthèse dans une fenêtre et lance l'impression (PDF via le navigateur). */
export function imprimerSynthese(donnees) {
  const html = genererSyntheseHTML(donnees)
  const win = window.open('', '_blank')
  if (!win) return false   // bloqueur de fenêtres : l'appelant doit le dire
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 500)
  return true
}
