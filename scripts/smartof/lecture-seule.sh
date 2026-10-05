#!/usr/bin/env bash
# Lecture de l'API SmartOF — LISTE BLANCHE STRICTE.
#
# L'API SmartOF est de style RPC : TOUTES les routes sont en POST, y compris les
# lectures. On ne peut donc pas se protéger en n'autorisant que les GET.
# La seule garantie sérieuse est une liste blanche : ce script n'accepte QUE les
# 16 routes de consultation (/list et /get) documentées dans le Swagger officiel.
# Toute route contenant create, update ou delete est refusée par construction.
#
#   usage :  ./lecture-seule.sh                       → liste les routes autorisées
#            ./lecture-seule.sh session/list
#            ./lecture-seule.sh apprenant/get '{"apprenantUid":"..."}'
#
# Les valeurs des champs ne sont JAMAIS affichées : seuls les noms, les types et
# les volumes. Aucun secret n'est écrit sur disque.

set -uo pipefail

cd "$(dirname "$0")"
# shellcheck disable=SC1091
source ./_secrets.sh

API="${SMARTOF_BASE_URL:-https://europe-west3-afs-pennylane-mobileo.cloudfunctions.net/external}"

# --- Liste blanche : routes de consultation uniquement -----------------------
ROUTES_AUTORISEES=(
  "apprenant/list"               "apprenant/get"
  "contact-client/list"          "contact-client/get"
  "formateur/list"               "formateur/get"
  "entreprise/list"              "entreprise/get"
  "opportunite-commerciale/list" "opportunite-commerciale/get"
  "produit/list"                 "produit/get"
  "factures/list"
  "session/list"
  "demande-inscription/list"
  "sessions-ouvertes/list"
)

afficher_routes() {
  echo "Routes de consultation autorisées par ce script :"
  echo
  for r in "${ROUTES_AUTORISEES[@]}"; do
    printf "  %s\n" "$r"
  done
  cat <<'MSG'

Exemples :
  ./lecture-seule.sh session/list
  ./lecture-seule.sh produit/list
  ./lecture-seule.sh apprenant/get '{"apprenantUid":"..."}'

Note : session, factures, demande-inscription et sessions-ouvertes n'ont pas de
"get" unitaire — seul "list" existe pour ces ressources.

Les routes create / update / delete existent dans l'API mais sont VOLONTAIREMENT
absentes ici : SmartOF est en lecture seule.
MSG
}

# Option --uid : affiche le premier identifiant technique de la réponse, afin de
# pouvoir enchaîner sur une route "get". N'affiche aucun nom, email ni donnée
# personnelle — uniquement des identifiants opaques.
MONTRER_UID=0
ARGS=()
for a in "$@"; do
  if [[ "$a" == "--uid" ]]; then MONTRER_UID=1; else ARGS+=("$a"); fi
done
set -- "${ARGS[@]+${ARGS[@]}}"

ROUTE="${1:-}"
if [[ -z "$ROUTE" ]]; then
  afficher_routes
  exit 0
fi

ROUTE="${ROUTE#/}"; ROUTE="${ROUTE#api/}"

# Refus explicite de tout verbe d'écriture, avant même la liste blanche.
if [[ "$ROUTE" == *create* || "$ROUTE" == *update* || "$ROUTE" == *delete* ]]; then
  echo "⛔ REFUSÉ : « ${ROUTE} » est une route d'écriture." >&2
  echo "   SmartOF est en lecture seule, API comprise. Ce script ne l'appellera pas." >&2
  exit 1
fi

AUTORISEE=0
for r in "${ROUTES_AUTORISEES[@]}"; do
  [[ "$r" == "$ROUTE" ]] && AUTORISEE=1 && break
done

if [[ "$AUTORISEE" -eq 0 ]]; then
  echo "⛔ REFUSÉ : « ${ROUTE} » n'est pas dans la liste blanche." >&2
  echo >&2
  afficher_routes >&2
  exit 1
fi

# Corps de la requête. Écrit sans expansion acrobatique : une accolade mal
# échappée produirait du JSON invalide, et Express répondrait "Bad Request".
if [[ $# -ge 2 ]]; then
  CORPS_ENVOI="$2"
else
  CORPS_ENVOI='{}'
fi

# Validation avant envoi : on ne sort pas une requête qu'on sait malformée.
if ! printf '%s' "$CORPS_ENVOI" | python3 -c 'import json,sys; json.load(sys.stdin)' 2>/dev/null; then
  echo "✗ Le corps fourni n'est pas du JSON valide :" >&2
  printf '   %s\n' "$CORPS_ENVOI" >&2
  echo "   Pense aux apostrophes simples autour, par ex. '{\"limit\":1}'" >&2
  exit 1
fi

# --- Identifiants : trousseau macOS, repli sur saisie clavier ----------------
charger_secrets || exit 1
obtenir_jeton   || exit 1

REP_API=$(mktemp)
trap 'rm -f "$REP_API"' EXIT
echo "→ POST ${API}/api/${ROUTE}"
echo "  corps envoyé : ${CORPS_ENVOI}"
echo

CODE_API=$(printf '%s' "$CORPS_ENVOI" | curl -s -X POST \
  -H "Authorization: Bearer ${JETON}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  --data-binary @- \
  -o "$REP_API" -w "%{http_code}" --max-time 60 \
  "${API}/api/${ROUTE}")

echo "Code HTTP : ${CODE_API}"
echo "Taille    : $(wc -c < "$REP_API") octets"
echo

if [[ "$CODE_API" != "200" && "$CODE_API" != "201" ]]; then
  echo "Réponse (300 premiers caractères) :"
  head -c 300 "$REP_API"; echo
  case "$CODE_API" in
    400) echo; echo "ⓘ 400 : il manque probablement un paramètre dans le corps de la requête."
         echo "  Déplie la route dans le Swagger pour voir les champs attendus." ;;
    401|403) echo; echo "ⓘ Le compte n'a pas les droits sur cette ressource." ;;
    429) echo; echo "⚠ Quota atteint. Arrête les appels et attends." ;;
  esac
  exit 1
fi

# --- Structure uniquement, jamais les valeurs -------------------------------
MONTRER_UID="$MONTRER_UID" python3 - "$REP_API" <<'PY'
import json, sys

def structure(obj, prefixe="", vus=None, profondeur=0):
    if vus is None:
        vus = []
    # 12 niveaux : certaines ressources imbriquent profondément (la tarification
    # des produits vit à 7 niveaux, une limite trop basse la masquait).
    if profondeur > 12:
        vus.append((f"{prefixe} …", "(profondeur max atteinte)"))
        return vus
    if isinstance(obj, dict):
        for cle, val in obj.items():
            p = f"{prefixe}.{cle}" if prefixe else cle
            if isinstance(val, (dict, list)):
                vus.append((p, type(val).__name__))
                structure(val, p, vus, profondeur + 1)
            else:
                vus.append((p, type(val).__name__))
    elif isinstance(obj, list):
        vus.append((f"{prefixe}[]", f"{len(obj)} élément(s)"))
        if obj:
            structure(obj[0], f"{prefixe}[]", vus, profondeur + 1)
    return vus

brut = open(sys.argv[1], encoding="utf-8", errors="replace").read()
try:
    data = json.loads(brut)
except Exception:
    print("Réponse non-JSON (300 premiers caractères) :")
    print(brut[:300])
    sys.exit(0)

if isinstance(data, list):
    print(f"✅ {len(data)} enregistrement(s) renvoyé(s).")
elif isinstance(data, dict):
    for cle in ("total", "count", "totalCount", "nombre"):
        if cle in data:
            print(f"✅ {cle} = {data[cle]}")
            break

print()
print("Structure (champs et types — AUCUNE valeur affichée) :")
for p, t in structure(data):
    print(f"  {p:<58} {t}")

# Option --uid : uniquement des identifiants techniques opaques, pour pouvoir
# enchaîner sur une route "get". Jamais de nom, email ou autre donnée en clair.
import os
if os.environ.get("MONTRER_UID") == "1":
    premier = None
    if isinstance(data, dict):
        for val in data.values():
            if isinstance(val, list) and val and isinstance(val[0], dict):
                premier = val[0]
                break
    elif isinstance(data, list) and data and isinstance(data[0], dict):
        premier = data[0]

    print()
    if not premier:
        print("--uid : aucun enregistrement exploitable dans la réponse.")
    else:
        trouves = [
            (c, v) for c, v in premier.items()
            if isinstance(v, str) and (c.lower().endswith("uid") or c == "id")
        ]
        if trouves:
            print("Identifiants techniques du PREMIER enregistrement :")
            for c, v in trouves:
                print(f"  {c:<30} {v}")
            print()
            print("Utilisable tel quel, par exemple :")
            c, v = trouves[0]
            print(f"  ./lecture-seule.sh <ressource>/get '{{\"{c}\":\"{v}\"}}'")
        else:
            print("--uid : aucun champ identifiant trouvé.")
PY
