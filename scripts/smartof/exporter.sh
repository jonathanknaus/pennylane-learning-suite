#!/usr/bin/env bash
# Export brut d'une ressource SmartOF vers un fichier JSON local.
#
# Contrairement à lecture-seule.sh, qui masque toutes les valeurs, ce script
# écrit la réponse complète sur disque — c'est nécessaire pour construire l'import
# vers PLS.
#
# Pour cette raison, il n'accepte QUE les ressources SANS données personnelles :
#   produit   — catalogue des formations (43 produits)
#   session   — sessions de formation (37 sessions)
#
# Les apprenants, contacts clients, formateurs et factures sont volontairement
# exclus : ils contiennent des données nominatives, et leur export relève du SPD
# en cours. Utilise lecture-seule.sh pour ceux-là.
#
#   usage :  ./exporter.sh produit
#            ./exporter.sh session
#
# Les fichiers sont écrits dans export/ (ignoré par git).

set -uo pipefail

cd "$(dirname "$0")"
# shellcheck disable=SC1091
source ./_secrets.sh

API="${SMARTOF_BASE_URL:-https://europe-west3-afs-pennylane-mobileo.cloudfunctions.net/external}"

# Ressources exportables : aucune donnée personnelle.
case "${1:-}" in
  produit) ROUTE="produit/list";  CLE="produits" ;;
  session) ROUTE="session/list";  CLE="sessions" ;;
  *)
    cat <<'MSG'
usage : ./exporter.sh <ressource>

  produit   catalogue des formations — programmes, durées, effectifs, tarifs
  session   sessions de formation — noms, dates, statuts

Seules ces deux ressources sont exportables sur disque : elles ne contiennent
aucune donnée personnelle.

Apprenants, contacts, formateurs et factures en sont exclus (données
nominatives). Pour les explorer sans les écrire, utilise :
  ./lecture-seule.sh apprenant/list
MSG
    exit 1
    ;;
esac

charger_secrets || exit 1
obtenir_jeton   || exit 1

mkdir -p export
SORTIE="export/${1}.json"

echo "→ POST ${API}/api/${ROUTE}"

CODE=$(printf '{}' | curl -s -X POST \
  -H "Authorization: Bearer ${JETON}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  --data-binary @- \
  -o "$SORTIE.tmp" -w "%{http_code}" --max-time 90 \
  "${API}/api/${ROUTE}")

if [[ "$CODE" != "200" ]]; then
  echo "✗ HTTP ${CODE}" >&2
  head -c 300 "$SORTIE.tmp" >&2; echo >&2
  rm -f "$SORTIE.tmp"
  exit 1
fi

# Réécriture indentée, pour que le fichier soit lisible et comparable d'un export
# à l'autre (diff utile si le catalogue change côté SmartOF).
python3 - "$SORTIE.tmp" "$SORTIE" "$CLE" <<'PY'
import json, sys
src, dst, cle = sys.argv[1], sys.argv[2], sys.argv[3]
data = json.load(open(src, encoding="utf-8"))
with open(dst, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2, sort_keys=True)
n = len(data.get(cle, [])) if isinstance(data, dict) else len(data)
print(f"✅ {n} enregistrement(s) écrit(s) dans {dst}")
PY

rm -f "$SORTIE.tmp"
echo "   taille : $(wc -c < "$SORTIE") octets"
