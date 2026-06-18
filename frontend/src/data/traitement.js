// Trace de traitement des articles de veille — preuve Qualiopi
const STORAGE_KEY = 'pls_traitements'

export const DECISIONS = {
  diffuser:  { label: 'Diffusé à l\'équipe', icon: '📢', color: '#276749' },
  archiver:  { label: 'Archivé',             icon: '📁', color: '#4A5568' },
  noter:     { label: 'Note interne',        icon: '📝', color: '#2B6CB0' },
}

export function getTraitements() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function getTraitement(articleId) {
  return getTraitements().find(t => t.articleId === articleId) || null
}

export function enregistrerTraitement({ articleId, articleTitre, articleSource, articleThematique, articleDate, decision, commentaire, destinataires }) {
  const traitements = getTraitements().filter(t => t.articleId !== articleId)
  const trace = {
    id: `t_${Date.now()}`,
    articleId,
    articleTitre,
    articleSource,
    articleThematique,
    articleDate,
    decision,
    commentaire: commentaire || '',
    destinataires: destinataires || [],
    traitePar: 'sarah.briden@pennylane-partners.com',
    traiteAt: new Date().toISOString(),
  }
  const updated = [...traitements, trace]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return trace
}

// Échappe une cellule CSV : neutralise l'injection de formules (CSV injection)
// et encadre de guillemets dès qu'un caractère spécial est présent.
function csvCell(value) {
  let s = value == null ? '' : String(value)
  // Une cellule qui commence par = + - @ (ou tab/CR) est interprétée comme
  // une formule par Excel/Sheets → on la préfixe d'une apostrophe.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  // Guillemets doublés + encadrement si séparateur, guillemet ou saut de ligne.
  if (/[";\n\r]/.test(s)) s = `"${s.replace(/"/g, '""')}"`
  return s
}

export function exportRegistreCSV(traitements) {
  const header = ['ID', 'Date traitement', 'Titre', 'Source', 'Thématique', 'Date article', 'Décision', 'Traité par', 'Commentaire', 'Destinataires']
  const rows = traitements.map(t => [
    t.id,
    new Date(t.traiteAt).toLocaleString('fr-FR'),
    t.articleTitre,
    t.articleSource,
    t.articleThematique,
    t.articleDate,
    DECISIONS[t.decision]?.label || t.decision,
    t.traitePar,
    t.commentaire || '',
    (t.destinataires || []).join(' | '),
  ].map(csvCell))
  return [header.map(csvCell), ...rows].map(r => r.join(';')).join('\n')
}
