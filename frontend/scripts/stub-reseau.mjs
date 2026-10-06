// Remplace Firebase et l'API HTTP pendant les vérifications hors navigateur.
//
// Les modules de données importent firebase/database et firebase-auth.js, qui
// tentent une connexion réseau et lisent `import.meta.env` — indisponible sous
// node. Ce stub coupe les deux : la logique testée (calcul des tarifs, droits,
// sérialisation) n'a besoin que du localStorage, lui-même simulé par le script
// de vérification.
//
// `pousser()` est de toute façon tolérant aux échecs dans l'application réelle,
// donc rendre des no-op ici ne masque aucun comportement.

export const baseDeDonnees = () => ({})
export const authPrete = () => Promise.resolve()
export const ref = () => ({})
export const get = () => Promise.resolve({ exists: () => false, val: () => null })
export const set = () => Promise.resolve()
export const onValue = () => () => {}
export const connexionGoogle = () => Promise.resolve(null)
export const deconnexionGoogle = () => Promise.resolve()
export const lireAcces = () => Promise.resolve({})
export const lireProfils = () => Promise.resolve({})
export const resoudreProfil = () => ({ profil: 'administrateur' })
export const PROFILS = {}
export const auth = {}
