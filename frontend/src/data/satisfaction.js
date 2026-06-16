// Enquête de satisfaction à chaud (fin de session, Qualiopi indicateur 13)
// 13 questions, échelle 0-10

const KEY_CHAUD = 'pls_satisfaction_chaud'
const KEY_FROID = 'pls_satisfaction_froid'

export const QUESTIONS_CHAUD = [
  { id: 'q1',  categorie: 'Contenu',        enonce: 'Le contenu de la formation a correspondu à mes attentes initiales.' },
  { id: 'q2',  categorie: 'Contenu',        enonce: 'Les objectifs pédagogiques ont été clairement expliqués et atteints.' },
  { id: 'q3',  categorie: 'Contenu',        enonce: 'Les exemples et cas pratiques étaient pertinents pour mon activité.' },
  { id: 'q4',  categorie: 'Pédagogie',      enonce: 'La pédagogie du formateur était claire et accessible.' },
  { id: 'q5',  categorie: 'Pédagogie',      enonce: 'Le rythme de la formation était adapté.' },
  { id: 'q6',  categorie: 'Pédagogie',      enonce: 'J\'ai eu la possibilité de poser mes questions et d\'y obtenir des réponses satisfaisantes.' },
  { id: 'q7',  categorie: 'Organisation',   enonce: 'L\'organisation logistique de la session (convocation, accès, horaires) était satisfaisante.' },
  { id: 'q8',  categorie: 'Organisation',   enonce: 'Les supports et ressources mis à disposition étaient utiles.' },
  { id: 'q9',  categorie: 'Applicabilité',  enonce: 'Je suis en mesure d\'appliquer immédiatement ce que j\'ai appris dans mon travail quotidien.' },
  { id: 'q10', categorie: 'Applicabilité',  enonce: 'Cette formation m\'a apporté une valeur ajoutée concrète pour mes dossiers clients Pennylane.' },
  { id: 'q11', categorie: 'Formateur',      enonce: 'Le formateur maîtrisait bien son sujet.' },
  { id: 'q12', categorie: 'Formateur',      enonce: 'Le formateur a su s\'adapter au niveau et aux besoins du groupe.' },
  { id: 'q13', categorie: 'Global',         enonce: 'Dans l\'ensemble, je suis satisfait(e) de cette formation.' },
]

export const QUESTIONS_FROID = [
  { id: 'f1', enonce: 'Les compétences acquises en formation sont pleinement intégrées à ma pratique professionnelle.' },
  { id: 'f2', enonce: 'La formation a eu un impact positif mesurable sur mon efficacité au travail.' },
  { id: 'f3', enonce: 'J\'ai partagé les apprentissages de cette formation avec mon équipe ou mes collègues.' },
  { id: 'f4', enonce: 'Je recommanderais cette formation à un collègue ou partenaire.' },
  { id: 'f5', enonce: 'Je souhaiterais approfondir mes compétences sur d\'autres modules Pennylane.' },
]

const LABELS_ECHELLE = { 0: 'Pas du tout', 5: 'Moyennement', 10: 'Tout à fait' }

export { LABELS_ECHELLE }

function getAll(key) {
  try { return JSON.parse(localStorage.getItem(key) || '[]') }
  catch { return [] }
}

export function getReponsesChaud(sessionId, stagiaireId) {
  return getAll(KEY_CHAUD).find(r => r.sessionId === sessionId && r.stagiaireId === stagiaireId) || null
}

export function getReponsesFroid(sessionId, stagiaireId) {
  return getAll(KEY_FROID).find(r => r.sessionId === sessionId && r.stagiaireId === stagiaireId) || null
}

export function saveReponsesChaud(sessionId, stagiaireId, reponses) {
  const list = getAll(KEY_CHAUD).filter(r => !(r.sessionId === sessionId && r.stagiaireId === stagiaireId))
  const scores = Object.values(reponses).filter(v => v !== null && v !== undefined)
  const moyenne = scores.length ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10 : null
  const entry = { sessionId, stagiaireId, reponses, moyenne, completedAt: new Date().toISOString() }
  list.push(entry)
  localStorage.setItem(KEY_CHAUD, JSON.stringify(list))
  return entry
}

export function saveReponsesFroid(sessionId, stagiaireId, reponses) {
  const list = getAll(KEY_FROID).filter(r => !(r.sessionId === sessionId && r.stagiaireId === stagiaireId))
  const scores = Object.values(reponses).filter(v => v !== null && v !== undefined)
  const moyenne = scores.length ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10 : null
  const entry = { sessionId, stagiaireId, reponses, moyenne, completedAt: new Date().toISOString() }
  list.push(entry)
  localStorage.setItem(KEY_FROID, JSON.stringify(list))
  return entry
}

export function getAllReponsesChaudBySession(sessionId) {
  return getAll(KEY_CHAUD).filter(r => r.sessionId === sessionId)
}

export function getAllReponsesFroidBySession(sessionId) {
  return getAll(KEY_FROID).filter(r => r.sessionId === sessionId)
}

export function getMoyenneSession(sessionId) {
  const reponses = getAllReponsesChaudBySession(sessionId)
  if (!reponses.length) return null
  const moyennes = reponses.map(r => r.moyenne).filter(m => m !== null)
  if (!moyennes.length) return null
  return Math.round((moyennes.reduce((s, m) => s + m, 0) / moyennes.length) * 10) / 10
}
