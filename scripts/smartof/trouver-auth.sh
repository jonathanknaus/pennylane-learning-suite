#!/usr/bin/env bash
# Trouve COMMENT l'API SmartOF veut qu'on s'authentifie.
#
# L'API renvoie un "Unauthorized" laconique qui n'indique pas le schéma attendu.
# Ce script essaie les quatre schémas courants, un par un, avec ta clé, et dit
# lequel passe. Il ne fait que des GET et n'affiche JAMAIS ta clé.
#
#   usage :  ./trouver-auth.sh
#
# Rien à configurer : la clé est demandée au clavier, en saisie masquée.
# Elle ne touche ni le disque ni l'historique du shell.
# (Un .env contenant SMARTOF_CLE=... est utilisé s'il existe.)

set -uo pipefail

cd "$(dirname "$0")"

# Si un .env existe, on s'en sert. Sinon on demande la clé au clavier :
# la saisie est masquée, et la clé ne touche ni le disque ni l'historique du shell.
if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a; source .env; set +a
fi

if [[ -z "${SMARTOF_CLE:-}" ]]; then
  echo "Colle ta clé SmartOF puis appuie sur Entrée."
  echo "(rien ne s'affichera pendant que tu colles, c'est normal)"
  printf "Clé : "
  read -rs SMARTOF_CLE
  echo
  echo
fi

if [[ -z "${SMARTOF_CLE:-}" ]]; then
  echo "✗ Aucune clé saisie." >&2
  exit 1
fi

URL="${SMARTOF_BASE_URL:-https://europe-west3-afs-pennylane-mobileo.cloudfunctions.net/external}/"
IDENT="${SMARTOF_IDENTIFIANT:?identifiant SmartOF absent — exporte SMARTOF_IDENTIFIANT ou enregistre-le au trousseau}"
BASIC=$(printf '%s:%s' "$IDENT" "$SMARTOF_CLE" | base64)

echo "→ Cible : ${URL}"
echo "→ 4 essais, un par seconde et demie. La clé n'est jamais affichée."
echo

essai() {
  local libelle="$1" entete="$2"
  local corps code
  corps=$(mktemp)

  code=$(curl -s -X GET \
    -H "Accept: application/json" \
    -H "$entete" \
    -o "$corps" \
    -w "%{http_code}" \
    --max-time 30 \
    "$URL" 2>/dev/null)

  printf "  %-28s → HTTP %s" "$libelle" "$code"

  case "$code" in
    200|201|204)
      printf "   ✅ ÇA MARCHE\n"
      echo "     (corps non affiché : il peut contenir des données personnelles)"
      echo "     taille de la réponse : $(wc -c < "$corps") octets"
      ;;
    401|403)
      printf "   ✗ refusé\n"
      ;;
    404)
      printf "   ⓘ authentifié, mais ce chemin n'existe pas\n"
      ;;
    *)
      printf "   ? à regarder : %s\n" "$(head -c 100 "$corps" | tr -d '\n')"
      ;;
  esac

  rm -f "$corps"
  sleep 1.5
}

essai "Authorization: Bearer"  "Authorization: Bearer ${SMARTOF_CLE}"
essai "x-api-key"              "x-api-key: ${SMARTOF_CLE}"
essai "Authorization (brute)"  "Authorization: ${SMARTOF_CLE}"
essai "Authorization: Basic"   "Authorization: Basic ${BASIC}"

cat <<'MSG'

Lecture du résultat :
  ✅ 200  → c'est le bon schéma.
  ⓘ 404  → le schéma est bon aussi ! L'API t'a accepté, mais la racine "/"
           n'est pas un chemin valide. Il faut la liste des chemins (doc éditeur).
  ✗ 401/403 partout → soit la clé n'est pas celle de l'API, soit le schéma est
           un en-tête maison : il faut demander la doc à SmartOF.
MSG
