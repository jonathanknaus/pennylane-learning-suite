#!/usr/bin/env bash
# Authentification SmartOF en deux temps, puis UNE lecture.
#
#   1. échange email + mot de passe contre un idToken, via Google Identity Platform
#      (accounts:signInWithPassword) ;
#   2. appelle l'API SmartOF avec cet idToken en "Authorization: Bearer".
#
# LECTURE SEULE : l'appel à SmartOF est un GET, rien d'autre n'est possible ici.
# Aucun secret n'est écrit sur disque, ni affiché, ni mis dans l'historique du shell.
# Le jeton obtenu n'est jamais affiché non plus.
#
#   usage :  ./obtenir-jeton.sh [chemin]
#   ex.   :  ./obtenir-jeton.sh /sessions
#
# Il te faudra la CLÉ API WEB du projet SmartOF (paramètre "key" de l'API Google).
# À demander à l'éditeur : voir docs/mail-smartof-demande-api.md.

set -uo pipefail

cd "$(dirname "$0")"

API_SMARTOF="${SMARTOF_BASE_URL:-https://europe-west3-afs-pennylane-mobileo.cloudfunctions.net/external}"
CHEMIN="${1:-/}"

echo "=== 1. Obtention du jeton ==========================================="
echo

printf "Clé API web du projet SmartOF : "
read -rs CLE_WEB
echo
if [[ -z "${CLE_WEB:-}" ]]; then
  echo "✗ Clé API web non fournie — elle est obligatoire pour l'API Google." >&2
  echo "  À demander à l'éditeur (voir docs/mail-smartof-demande-api.md)." >&2
  exit 1
fi

printf "Identifiant [api-afs-pennylane@smartof.tech] : "
read -r IDENT
IDENT="${IDENT:-api-afs-pennylane@smartof.tech}"

printf "Mot de passe du compte : "
read -rs MOTDEPASSE
echo
if [[ -z "${MOTDEPASSE:-}" ]]; then
  echo "✗ Mot de passe non fourni." >&2
  exit 1
fi
echo

REP_AUTH=$(mktemp)
REP_API=$(mktemp)
trap 'rm -f "$REP_AUTH" "$REP_API"' EXIT

# Corps JSON construit par python : échappe correctement guillemets, antislashs
# et accents éventuels du mot de passe. Transmis à curl par l'entrée standard,
# donc jamais visible dans la liste des processus (ps).
CODE_AUTH=$(
  IDENT="$IDENT" MOTDEPASSE="$MOTDEPASSE" python3 -c \
    'import json,os,sys; sys.stdout.write(json.dumps({"email":os.environ["IDENT"],"password":os.environ["MOTDEPASSE"],"returnSecureToken":True}))' \
  | curl -s -X POST \
      -H "Content-Type: application/json" \
      --data-binary @- \
      -o "$REP_AUTH" \
      -w "%{http_code}" \
      --max-time 30 \
      "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${CLE_WEB}"
)

echo "Google Identity Platform → HTTP ${CODE_AUTH}"

if [[ "$CODE_AUTH" != "200" ]]; then
  echo
  echo "✗ L'échange a échoué. Message renvoyé (sans secret) :"
  python3 - "$REP_AUTH" <<'PY'
import json, sys
try:
    d = json.load(open(sys.argv[1]))
    err = d.get("error", {})
    print("   ", err.get("message", "(pas de message)"))
    print("    code :", err.get("code", "?"))
except Exception:
    print("    (réponse illisible)")
PY
  cat <<'MSG'

Messages courants :
  API_KEY_INVALID / inexistant    → la clé API web n'est pas la bonne
  EMAIL_NOT_FOUND                 → ce compte n'existe pas sur ce projet
  INVALID_LOGIN_CREDENTIALS       → mot de passe incorrect, ou ce n'est pas
                                    un compte Identity Platform
  PASSWORD_LOGIN_DISABLED         → l'éditeur n'autorise pas ce mode de connexion
MSG
  exit 1
fi

# Jeton gardé en mémoire uniquement, jamais affiché.
JETON=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("idToken",""))' "$REP_AUTH")
VALIDITE=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("expiresIn","?"))' "$REP_AUTH")

if [[ -z "$JETON" ]]; then
  echo "✗ Pas d'idToken dans la réponse." >&2
  exit 1
fi

echo "✅ Jeton obtenu (non affiché). Validité : ${VALIDITE} secondes."
echo
echo "=== 2. Lecture de l'API SmartOF ====================================="
echo
URL="${API_SMARTOF%/}${CHEMIN}"
echo "→ GET ${URL}"
echo

CODE_API=$(curl -s -X GET \
  -H "Authorization: Bearer ${JETON}" \
  -H "Accept: application/json" \
  -o "$REP_API" \
  -w "%{http_code}" \
  --max-time 30 \
  "$URL")

echo "Code HTTP : ${CODE_API}"
echo "Taille    : $(wc -c < "$REP_API") octets"
echo

case "$CODE_API" in
  200|201)
    echo "✅ L'API répond. Structure de la réponse (champs et types, SANS les valeurs) :"
    echo
    python3 - "$REP_API" <<'PY'
import json, sys

def chemins(obj, prefixe="", vus=None):
    if vus is None:
        vus = []
    if isinstance(obj, dict):
        for cle, val in obj.items():
            p = f"{prefixe}.{cle}" if prefixe else cle
            vus.append((p, type(val).__name__))
            chemins(val, p, vus)
    elif isinstance(obj, list):
        vus.append((f"{prefixe}[]", f"list({len(obj)})"))
        if obj:
            chemins(obj[0], f"{prefixe}[]", vus)
    return vus

brut = open(sys.argv[1], encoding="utf-8", errors="replace").read()
try:
    data = json.loads(brut)
except Exception:
    print("  Réponse non-JSON, 300 premiers caractères :")
    print(" ", brut[:300])
    sys.exit(0)

for p, t in chemins(data):
    print(f"  {p:<55} {t}")
PY
    ;;
  404)
    echo "ⓘ Authentifié, mais ce chemin n'existe pas."
    echo "  Le jeton est donc le bon. Il manque la liste des chemins (doc éditeur)."
    head -c 300 "$REP_API"; echo
    ;;
  401|403)
    echo "✗ Jeton accepté par Google mais refusé par SmartOF."
    echo "  Le compte n'a probablement pas les droits sur cette API."
    head -c 300 "$REP_API"; echo
    ;;
  *)
    echo "? Réponse inattendue :"
    head -c 300 "$REP_API"; echo
    ;;
esac
