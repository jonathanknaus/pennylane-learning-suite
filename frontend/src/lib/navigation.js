// Navigation admin synchronisée avec l'historique du navigateur (History API).
// Chaque écran (page sidebar, session ouverte, onglet de session) est représenté
// par un objet d'état poussé dans history.state, afin que le bouton retour du
// navigateur — et le bouton "← Retour" in-app — ramènent à l'écran précédent exact
// plutôt qu'à l'accueil.

const HISTORY_KEY = '__pls_nav__'

export function getInitialNavState(defaults) {
  return (window.history.state && window.history.state[HISTORY_KEY]) || defaults
}

export function pushNavState(state) {
  window.history.pushState({ [HISTORY_KEY]: state }, '')
}

export function replaceNavState(state) {
  window.history.replaceState({ [HISTORY_KEY]: state }, '')
}

export function readNavState(event) {
  return event.state?.[HISTORY_KEY] || null
}
