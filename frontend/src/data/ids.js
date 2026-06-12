// Génération d'identifiants locaux uniques.
//
// `Date.now()` seul provoque des collisions dès que deux entités sont créées
// dans la même milliseconde (saisie rapide, seed, imports). On s'appuie sur
// crypto.randomUUID() quand il est disponible, avec repli sur un suffixe
// horodaté + aléatoire.
export function uid(prefix) {
  let rand
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    rand = crypto.randomUUID()
  } else {
    rand = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }
  return prefix ? `${prefix}_${rand}` : rand
}
