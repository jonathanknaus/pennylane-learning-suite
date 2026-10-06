// Édition de la grille tarifaire — onglet Paramètres, administrateurs seulement.
//
// Ce que l'écran permet : changer un prix, déplacer un plafond de participants,
// mobiliser 2, 3 ou 4 formateurs sur un palier, ajouter un palier (« jusqu'à 40
// participants »), en supprimer un, et publier une nouvelle grille à une date
// d'effet future.
//
// Ce qu'il ne permet pas, volontairement : modifier une grille du socle en place
// (on en enregistre une copie à la même date, réversible), ni toucher aux règles
// de bascule entre formats (2h → demi-journée, 7h → journée), qui ne sont pas
// des tarifs.

import { useMemo, useState } from 'react'
import {
  toutesLesGrilles, grilleEditable, enregistrerGrille, supprimerGrille,
  validerGrilleEditable, peutModifierGrille, palierVierge, resumerEstimation,
  LIGNES_AFFICHAGE, MENTIONS_MODULES_DEFAUT,
} from '../data/tarification'
import { getSessions, estimationSession } from '../data/sessions'
import { imprimerGrille } from '../data/grille-pdf'
import './GrilleTarifaire.css'

const MODALITE_LABEL = { visio: 'Visio', presentiel: 'Présentiel' }

export default function GrilleTarifaire() {
  const autorise = peutModifierGrille()
  const [grilles, setGrilles] = useState(() => toutesLesGrilles())
  const [vue, setVue] = useState(null)
  const [erreurs, setErreurs] = useState([])
  const [message, setMessage] = useState(null)
  const [confirmSuppression, setConfirmSuppression] = useState(null)

  function rafraichir() {
    setGrilles(toutesLesGrilles())
  }

  function ouvrir(dateEffet) {
    setVue(grilleEditable(dateEffet))
    setErreurs([])
    setMessage(null)
  }

  function nouvelle() {
    const depart = grilleEditable(null)
    setVue({ ...depart, libelle: '', dateEffet: '' })
    setErreurs([])
    setMessage(null)
  }

  function majFormat(formatId, modif) {
    setVue(v => ({
      ...v,
      formats: v.formats.map(f => (f.id === formatId ? modif(f) : f)),
    }))
  }

  function majPalier(formatId, cle, patch) {
    majFormat(formatId, f => ({
      ...f,
      paliers: f.paliers.map(p => (p.cle === cle ? { ...p, ...patch } : p)),
    }))
  }

  function ajouterPalier(formatId) {
    majFormat(formatId, f => ({ ...f, paliers: [...f.paliers, palierVierge(f)] }))
  }

  function supprimerPalier(formatId, cle) {
    majFormat(formatId, f => ({ ...f, paliers: f.paliers.filter(p => p.cle !== cle) }))
  }

  function enregistrer() {
    const resultat = enregistrerGrille(vue)
    if (!resultat.ok) {
      setErreurs(resultat.erreurs)
      setMessage(null)
      return
    }
    rafraichir()
    setErreurs([])
    setMessage(`Grille « ${vue.libelle} » enregistrée, applicable à partir du ${vue.dateEffet}.`)
    setVue(grilleEditable(vue.dateEffet))
  }

  function telecharger(dateEffet) {
    // Le PDF passe par une fenêtre d'impression : si le navigateur la bloque, le
    // clic reste sans effet visible. On le dit plutôt que de laisser croire à un bug.
    if (!imprimerGrille(dateEffet)) {
      setErreurs(['La fenêtre d’impression a été bloquée par le navigateur. Autorise les fenêtres surgissantes pour ce site, puis réessaie.'])
      return
    }
    setErreurs([])
  }

  function supprimer(dateEffet) {
    const resultat = supprimerGrille(dateEffet)
    setConfirmSuppression(null)
    if (!resultat.ok) { setErreurs(resultat.erreurs); return }
    rafraichir()
    setVue(null)
    setErreurs([])
    setMessage(resultat.baseRetablie
      ? 'Grille supprimée : la version d’origine est rétablie.'
      : 'Grille supprimée.')
  }

  if (!autorise) {
    return (
      <div className="param-section">
        <div className="param-section-header">
          <h2>Grille tarifaire</h2>
        </div>
        <p className="gt-refus">
          Ton profil n’a pas le droit d’écriture sur la grille tarifaire. Il se donne dans
          Paramètres → Accès utilisateurs, colonne Écriture du module « Grille tarifaire ».
          La grille reste consultable sur la fiche du catalogue.
        </p>
      </div>
    )
  }

  return (
    <div className="param-section">
      <div className="param-section-header">
        <h2>Grille tarifaire</h2>
        <button className="btn-primary" onClick={nouvelle}>+ Nouvelle grille</button>
      </div>

      <p className="gt-intro">
        Les grilles sont datées : le tarif d’une demande est figé à <strong>la date de cette
        demande</strong>. Modifier une grille déjà en vigueur recalcule les devis qui s’y
        rattachent — pour une hausse, créer plutôt une nouvelle grille à une date d’effet future.
      </p>

      {message && <div className="gt-succes">{message}</div>}
      {erreurs.length > 0 && (
        <div className="gt-erreurs">
          <strong>À corriger avant d’enregistrer :</strong>
          <ul>{erreurs.map(e => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      <ListeGrilles
        grilles={grilles}
        dateOuverte={vue?.dateEffet}
        onOuvrir={ouvrir}
        onSupprimer={setConfirmSuppression}
        onTelecharger={telecharger}
      />

      {confirmSuppression && (
        <div className="gt-confirm">
          Supprimer la grille du {confirmSuppression} ?
          {' '}
          <button className="btn-danger" onClick={() => supprimer(confirmSuppression)}>Supprimer</button>
          {' '}
          <button className="btn-secondary" onClick={() => setConfirmSuppression(null)}>Annuler</button>
        </div>
      )}

      {vue && (
        <Editeur
          vue={vue}
          onChangeEntete={patch => setVue(v => ({ ...v, ...patch }))}
          onMajPalier={majPalier}
          onAjouterPalier={ajouterPalier}
          onSupprimerPalier={supprimerPalier}
          onEnregistrer={enregistrer}
          onAnnuler={() => { setVue(null); setErreurs([]) }}
        />
      )}
    </div>
  )
}

function ListeGrilles({ grilles, dateOuverte, onOuvrir, onSupprimer, onTelecharger }) {
  const aujourdHui = new Date().toISOString().slice(0, 10)
  const enVigueur = grilles.find(g => g.dateEffet <= aujourdHui)

  return (
    <div className="gt-liste">
      {grilles.map(g => (
        <div key={g.dateEffet} className={`gt-ligne ${dateOuverte === g.dateEffet ? 'active' : ''}`}>
          <div className="gt-ligne-info">
            <div className="gt-ligne-titre">
              {g.libelle}
              {g === enVigueur && <span className="gt-badge vigueur">en vigueur</span>}
              {g.dateEffet > aujourdHui && <span className="gt-badge future">à venir</span>}
              {g.origine === 'base' && <span className="gt-badge base">socle</span>}
              {g.origine === 'personnalisee' && <span className="gt-badge perso">modifiée dans l’app</span>}
            </div>
            <div className="gt-ligne-meta">
              Effet au {g.dateEffet}
              {g.modifiePar && ` · dernière modification par ${g.modifiePar}`}
            </div>
          </div>
          <div className="gt-ligne-actions">
            <button className="btn-secondary" onClick={() => onOuvrir(g.dateEffet)}>
              {g.origine === 'base' ? 'Modifier (copie)' : 'Modifier'}
            </button>
            {/* Chaque grille a son propre document : on télécharge celle de la
                ligne, à sa date d'effet, et non la grille du jour. */}
            <button className="btn-secondary" onClick={() => onTelecharger(g.dateEffet)}>
              PDF
            </button>
            {g.origine === 'personnalisee' && (
              <button className="btn-link-danger" onClick={() => onSupprimer(g.dateEffet)}>
                Supprimer
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function Editeur({ vue, onChangeEntete, onMajPalier, onAjouterPalier, onSupprimerPalier, onEnregistrer, onAnnuler }) {
  const aujourdHui = new Date().toISOString().slice(0, 10)
  const erreursVives = validerGrilleEditable(vue)
  const dejaEnVigueur = vue.dateEffet && vue.dateEffet <= aujourdHui

  return (
    <div className="gt-editeur">
      <h3>
        {vue.origine === 'nouvelle'
          ? `Nouvelle grille, reprise de celle du ${vue.reprisDe}`
          : vue.origine === 'base'
            ? 'Copie de la grille du socle'
            : 'Modification de la grille'}
      </h3>

      {vue.origine === 'base' && (
        <p className="gt-note">
          Cette grille est codée dans l’application. L’enregistrement en crée une copie à la même
          date d’effet, qui la masque — la supprimer rétablit l’originale.
        </p>
      )}

      <div className="gt-entete">
        <label className="gt-champ">
          <span>Date d’effet</span>
          <input
            type="date"
            value={vue.dateEffet}
            onChange={e => onChangeEntete({ dateEffet: e.target.value })}
          />
        </label>
        <label className="gt-champ gt-champ-large">
          <span>Libellé (visible sur les devis)</span>
          <input
            type="text"
            value={vue.libelle}
            placeholder="Ex. Grille du 1er janvier 2027"
            onChange={e => onChangeEntete({ libelle: e.target.value })}
          />
        </label>
      </div>

      {dejaEnVigueur && <ImpactSessions vue={vue} />}

      {vue.formats.map(format => (
        <FormatEditeur
          key={format.id}
          format={format}
          mentions={vue.mentions}
          onMajMention={(ligneId, texte) => onChangeEntete({ mentions: { ...vue.mentions, [ligneId]: texte } })}
          onMajPalier={(cle, patch) => onMajPalier(format.id, cle, patch)}
          onAjouter={() => onAjouterPalier(format.id)}
          onSupprimer={cle => onSupprimerPalier(format.id, cle)}
        />
      ))}

      <div className="gt-actions">
        <button className="btn-primary" onClick={onEnregistrer} disabled={erreursVives.length > 0}>
          Enregistrer la grille
        </button>
        <button className="btn-secondary" onClick={onAnnuler}>Fermer</button>
        {erreursVives.length > 0 && (
          <span className="gt-bloque">{erreursVives.length} point(s) à corriger</span>
        )}
      </div>
    </div>
  )
}

function FormatEditeur({ format, mentions, onMajMention, onMajPalier, onAjouter, onSupprimer }) {
  const avecPresentiel = format.modalites.includes('presentiel')
  const lignes = LIGNES_AFFICHAGE.filter(l => format.lignes.includes(l.id))

  return (
    <div className="gt-format">
      <div className="gt-format-head">
        <div>
          <h4>{format.label}</h4>
          <p className="gt-aide">{format.aide}</p>
        </div>
        <button className="btn-secondary" onClick={onAjouter}>+ Ajouter un palier</button>
      </div>

      {/* Le nombre de modules annoncé sous le titre de la ligne, dans la carte
          du catalogue. Le format horaire en porte deux : 1h et 2h. */}
      <div className="gt-mentions">
        {lignes.map(ligne => (
          <label className="gt-champ gt-champ-large" key={ligne.id}>
            <span>Modules annoncés — {ligne.label}</span>
            <input
              type="text"
              value={mentions[ligne.id] ?? ''}
              placeholder={MENTIONS_MODULES_DEFAUT[ligne.id]}
              onChange={e => onMajMention(ligne.id, e.target.value)}
            />
          </label>
        ))}
      </div>

      {format.paliers.length === 0 ? (
        <p className="gt-vide">Aucun palier : ce format passera sur devis.</p>
      ) : (
        <table className="gt-table">
          <thead>
            <tr>
              <th>Participants</th>
              <th>Prix {MODALITE_LABEL.visio} (€ HT)</th>
              {avecPresentiel && <th>Prix {MODALITE_LABEL.presentiel} (€ HT)</th>}
              <th>Formateurs</th>
              {avecPresentiel && <th>Frais de déplacement</th>}
              <th />
            </tr>
          </thead>
          <tbody>
            {format.paliers.map(p => (
              <tr key={p.cle}>
                <td>
                  <div className="gt-participants">
                    <input
                      type="number" min="1" step="1"
                      value={p.illimite ? '' : (p.participantsMax ?? '')}
                      disabled={p.illimite}
                      placeholder="illimité"
                      onChange={e => onMajPalier(p.cle, { participantsMax: e.target.value === '' ? null : parseInt(e.target.value, 10) })}
                    />
                    <label className="gt-illimite">
                      <input
                        type="checkbox"
                        checked={p.illimite}
                        onChange={e => onMajPalier(p.cle, { illimite: e.target.checked })}
                      />
                      illimité
                    </label>
                  </div>
                </td>
                <td>
                  <input
                    type="number" min="0" step="10"
                    value={p.visio ?? ''}
                    placeholder="—"
                    onChange={e => onMajPalier(p.cle, { visio: e.target.value === '' ? null : Number(e.target.value) })}
                  />
                </td>
                {avecPresentiel && (
                  <td>
                    <input
                      type="number" min="0" step="10"
                      value={p.presentiel ?? ''}
                      placeholder="—"
                      onChange={e => onMajPalier(p.cle, { presentiel: e.target.value === '' ? null : Number(e.target.value) })}
                    />
                  </td>
                )}
                <td>
                  <input
                    className="gt-formateurs"
                    type="number" min="1" max="10" step="1"
                    value={p.formateurs}
                    onChange={e => onMajPalier(p.cle, { formateurs: parseInt(e.target.value, 10) || 1 })}
                  />
                </td>
                {avecPresentiel && (
                  <td>
                    <input
                      type="checkbox"
                      checked={p.fraisDeplacementInclus}
                      onChange={e => onMajPalier(p.cle, { fraisDeplacementInclus: e.target.checked })}
                    />
                  </td>
                )}
                <td>
                  <button className="btn-link-danger" onClick={() => onSupprimer(p.cle)}>Retirer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

// Modifier une grille déjà en vigueur change le prix de ce qui s'y rattache.
// Plutôt que d'avertir dans le vide, on compte et on chiffre.
function ImpactSessions({ vue }) {
  const impact = useMemo(() => {
    const sessions = getSessions().filter(s => {
      const e = estimationSession(s)
      return e && e.grilleDateEffet === vue.dateEffet
    })
    return { nombre: sessions.length, sessions: sessions.slice(0, 5) }
  }, [vue.dateEffet])

  if (impact.nombre === 0) return null

  return (
    <div className="gt-impact">
      <strong>{impact.nombre} session(s)</strong> sont tarifées par cette grille : leur prix
      changera, devis et factures déjà saisis exceptés (leur montant est enregistré).
      <ul>
        {impact.sessions.map(s => (
          <li key={s.id}>{s.titre} — {resumerEstimation(estimationSession(s))}</li>
        ))}
        {impact.nombre > impact.sessions.length && <li>…</li>}
      </ul>
    </div>
  )
}

