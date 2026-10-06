// Grille tarifaire imprimable, à remettre à un cabinet.
//
// Même mécanisme que `imprimerSynthese` : on écrit du HTML autonome dans une
// fenêtre et on laisse le navigateur produire le PDF. Aucune dépendance ajoutée
// — le projet n'embarque pas de librairie PDF, et une page imprimable reste
// lisible même si le rendu change.
//
// Le document est produit depuis `grillePourAffichage()`, la même fonction que
// la carte du catalogue : le PDF ne peut pas annoncer d'autres tarifs que ceux
// affichés à l'écran.

import { grillePourAffichage } from './tarification'
import { variablesOrganisme } from './modele-mail'

const VERT_FONCE = '#003D3D'
const VERT_VIF = '#00BD57'

function echap(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const euros = (n) => `${Number(n).toLocaleString('fr-FR')} €`

function dateLongue(iso) {
  if (!iso) return ''
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function lignesTableau(grille) {
  // Une seule colonne « Présentiel » n'est utile que si au moins un format en a
  // un : sans cela, le tableau afficherait une colonne vide pour un cabinet qui
  // ne se forme qu'en visio.
  const avecPresentiel = grille.lignes.some(l => l.paliers.some(p => p.presentiel != null))

  const lignes = grille.lignes.map(l => {
    const paliers = l.paliers.map((p, i) => `
      <tr>
        ${i === 0
          ? `<th rowspan="${l.paliers.length}" class="format">
               ${echap(l.label)}<span class="modules">${echap(l.hint)}</span>
             </th>`
          : ''}
        <td class="palier">${echap(p.label)}</td>
        <td class="prix">${p.visio != null ? euros(p.visio) : '—'}</td>
        ${avecPresentiel ? `<td class="prix">${p.presentiel != null ? euros(p.presentiel) : '—'}</td>` : ''}
        <td class="formateurs">${p.formateurs > 1 ? `${p.formateurs} formateurs` : '1 formateur'}</td>
      </tr>`).join('')
    return paliers
  }).join('')

  return `
    <table>
      <thead>
        <tr>
          <th>Format</th>
          <th>Participants</th>
          <th>Visio</th>
          ${avecPresentiel ? '<th>Présentiel</th>' : ''}
          <th>Encadrement</th>
        </tr>
      </thead>
      <tbody>${lignes}</tbody>
    </table>`
}

export function genererGrilleHTML(date = null) {
  const grille = grillePourAffichage(date)
  const of = variablesOrganisme()
  const edite = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Grille tarifaire AFS — ${echap(grille.libelle)}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 11.5px; color: #222; margin: 24px; line-height: 1.5; }
  h1 { font-size: 18px; color: ${VERT_FONCE}; margin: 0 0 4px; }
  .sous-titre { color: #555; margin: 0 0 18px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
  thead th {
    background: ${VERT_FONCE}; color: #fff; font-size: 10.5px; text-align: left;
    padding: 6px 8px; font-weight: 600;
  }
  tbody td, tbody th { border-bottom: 1px solid #E5E7EB; padding: 6px 8px; vertical-align: top; }
  tbody th.format { text-align: left; width: 28%; font-weight: 700; color: ${VERT_FONCE}; }
  .modules { display: block; font-weight: 400; font-style: italic; color: #6B7280; font-size: 10.5px; }
  .palier { font-weight: 600; white-space: nowrap; }
  .prix { font-weight: 700; color: ${VERT_FONCE}; white-space: nowrap; }
  .formateurs { color: #6B7280; white-space: nowrap; }
  .regles { background: #F3F4F6; border-radius: 6px; padding: 10px 12px 10px 26px; margin-bottom: 16px; }
  .regles li { margin-bottom: 3px; }
  .contact { border-top: 2px solid ${VERT_VIF}; padding-top: 10px; }
  .footer { color: #6B7280; font-size: 10px; margin-top: 18px; }
  @media print { body { margin: 12mm; } }
</style>
</head>
<body>

<h1>Grille tarifaire — Formations AFS</h1>
<p class="sous-titre">
  ${echap(grille.libelle)}${grille.dateEffet ? ` · en vigueur depuis le ${dateLongue(grille.dateEffet)}` : ''}
  · montants en euros <strong>hors taxes</strong>
</p>

${lignesTableau(grille)}

<ul class="regles">
  ${grille.notes.map(n => `<li>${echap(n)}</li>`).join('')}
</ul>

<p class="contact">
  <strong>${echap(of.of_nom || 'Pennylane')}</strong> — formations Accounting Firm Services<br>
  ${echap(of.of_email || 'afs-training@pennylane.com')}
</p>

<p class="footer">
  Document édité le ${edite} à titre indicatif. Le tarif applicable à une demande est celui de la
  grille en vigueur à la date de cette demande ; un devis validé conserve le tarif qui y figure.
</p>

</body>
</html>`
}

/**
 * Ouvre la grille dans une fenêtre et lance l'impression (PDF via le navigateur).
 * Rend false si le bloqueur de fenêtres a refusé l'ouverture : l'appelant doit
 * le signaler, sinon le clic reste sans effet visible.
 */
export function imprimerGrille(date = null) {
  const win = window.open('', '_blank')
  if (!win) return false
  win.document.write(genererGrilleHTML(date))
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 500)
  return true
}
