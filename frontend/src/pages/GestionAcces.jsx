import { useState } from 'react'
import AccesFirebase from './AccesFirebase'
import ProfilsFirebase from './ProfilsFirebase'
import './GestionAcces.css'

// Gestion des accès — coquille qui délègue aux deux écrans Firebase.
//
// L'ancienne implémentation stockait utilisateurs, profils et permissions en
// localStorage, avec des identifiants NOM_PLS et des mots de passe provisoires.
// Elle a été retirée le 2026-10-05 : chaque poste avait sa propre liste, et
// n'importe qui pouvait s'attribuer le profil administrateur en éditant son
// navigateur. Les accès vivent désormais dans la Realtime Database, arbitrés
// par database.rules.json.
export default function GestionAcces() {
  const [subOnglet, setSubOnglet] = useState('utilisateurs')

  return (
    <div className="param-section">
      <div className="param-section-header">
        <h2>Gestion des accès</h2>
        <p>Utilisateurs, profils type et droits par module</p>
      </div>

      <div className="acces-sub-tabs">
        <button
          className={`acces-sub-tab ${subOnglet === 'utilisateurs' ? 'active' : ''}`}
          onClick={() => setSubOnglet('utilisateurs')}
        >
          Utilisateurs
        </button>
        <button
          className={`acces-sub-tab ${subOnglet === 'profils' ? 'active' : ''}`}
          onClick={() => setSubOnglet('profils')}
        >
          Profils type
        </button>
      </div>

      {/* Liste des accès : temps réel, partagée avec l'outil de veille */}
      {subOnglet === 'utilisateurs' && <AccesFirebase />}

      {/* Droits standards des quatre profils, modifiables sans déploiement */}
      {subOnglet === 'profils' && <ProfilsFirebase />}
    </div>
  )
}
