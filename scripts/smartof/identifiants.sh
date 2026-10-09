#!/usr/bin/env bash
# Gestion des identifiants SmartOF dans le trousseau d'accès macOS.
#
#   ./identifiants.sh enregistrer   → saisit et range les secrets dans le trousseau
#   ./identifiants.sh verifier      → dit ce qui est présent, sans rien afficher
#   ./identifiants.sh supprimer     → retire les secrets du trousseau
#
# Les valeurs ne sont jamais affichées, ni écrites dans un fichier, ni dans
# l'historique du shell. Le trousseau est chiffré et lié à ta session macOS.
#
# ⚠️ LE TROUSSEAU N'EST QU'UN CACHE LOCAL. La source de vérité est **1Password**,
# désigné par le validateur sécurité le 2026-10-06 au titre du SPD-1148 : « I guess
# it's possible to store the credentials in 1password and use them from here? »
#
# Deux conséquences, tant que la bascule n'est pas faite :
#   · ces secrets n'existent que sur ce poste — un autre poste ne peut pas s'en
#     servir, et ils disparaissent avec la session ;
#   · le mot de passe actuel est à RENOUVELER : il est arrivé en clair par mail le
#     11 juin 2026, ce que le SPD refuse. Le nouveau doit transiter par 1Password,
#     et non par un ticket IT — explicitement écarté en revue.
# Voir `~/smartof-spd/smartof-api.md` §9 — hors dépôt, celui-ci étant public.

set -uo pipefail
cd "$(dirname "$0")"
# shellcheck disable=SC1091
source ./_secrets.sh

ranger() {
  local service="$1" libelle="$2" valeur="$3"
  if [[ -z "$valeur" ]]; then
    echo "  — ${libelle} : ignoré (rien saisi)"
    return
  fi
  # -U met à jour si l'entrée existe déjà.
  security add-generic-password -U \
    -a "$USER" -s "$service" \
    -l "SmartOF — ${libelle}" \
    -w "$valeur" 2>/dev/null \
    && echo "  ✅ ${libelle} enregistré" \
    || echo "  ✗ ${libelle} : échec d'enregistrement"
}

case "${1:-}" in
  enregistrer)
    echo "Enregistrement des identifiants SmartOF dans le trousseau macOS."
    echo "Les saisies sont masquées : rien ne s'affiche pendant que tu colles."
    echo

    printf "Clé API web (AIza…) : "
    read -rs v_cle; echo
    printf "Identifiant du compte API : "
    read -r v_ident
    printf "Mot de passe : "
    read -rs v_mdp; echo
    echo

    ranger "$SERVICE_CLE"   "clé API web"   "$v_cle"
    ranger "$SERVICE_IDENT" "identifiant"   "$v_ident"
    ranger "$SERVICE_MDP"   "mot de passe"  "$v_mdp"

    unset v_cle v_mdp v_ident
    echo
    echo "Terminé. Les scripts ne te demanderont plus rien."
    echo "macOS pourra te demander d'autoriser l'accès au trousseau la première fois."
    ;;

  verifier)
    echo "Contenu du trousseau pour SmartOF (valeurs jamais affichées) :"
    echo
    for couple in "$SERVICE_CLE:clé API web" "$SERVICE_IDENT:identifiant" "$SERVICE_MDP:mot de passe"; do
      s="${couple%%:*}"; l="${couple#*:}"
      if security find-generic-password -a "$USER" -s "$s" >/dev/null 2>&1; then
        echo "  ✅ ${l} : présent"
      else
        echo "  — ${l} : absent"
      fi
    done
    echo
    echo "Note : l'identifiant n'est pas un secret, mais il est rangé là pour éviter de le retaper."
    ;;

  supprimer)
    echo "Suppression des identifiants SmartOF du trousseau :"
    echo
    for couple in "$SERVICE_CLE:clé API web" "$SERVICE_IDENT:identifiant" "$SERVICE_MDP:mot de passe"; do
      s="${couple%%:*}"; l="${couple#*:}"
      if security delete-generic-password -a "$USER" -s "$s" >/dev/null 2>&1; then
        echo "  ✅ ${l} supprimé"
      else
        echo "  — ${l} : rien à supprimer"
      fi
    done
    ;;

  *)
    cat <<'MSG'
usage : ./identifiants.sh <commande>

  enregistrer   saisit la clé API web, l'identifiant et le mot de passe,
                puis les range dans le trousseau d'accès macOS (chiffré)
  verifier      indique ce qui est présent, sans afficher aucune valeur
  supprimer     retire les secrets du trousseau

Une fois « enregistrer » fait, lecture-seule.sh et obtenir-jeton.sh ne demandent
plus rien.
MSG
    exit 1
    ;;
esac
