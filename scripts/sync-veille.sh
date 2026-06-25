#!/usr/bin/env bash
# sync-veille.sh — Synchronise les fichiers veille juridique de PLS vers veille-juridique
#
# Usage : bash scripts/sync-veille.sh
#
# Sens unique : PLS → veille-juridique
# Les noms de fonctions sont transformés (Veille suffix retiré)
# À lancer depuis la racine du repo pennylane-learning-suite

set -e

PLS_SRC="$(cd "$(dirname "$0")/.." && pwd)/frontend/src"
VJ="$HOME/veille-juridique/src"

if [ ! -d "$VJ" ]; then
  echo "Erreur : répertoire veille-juridique introuvable ($VJ)"
  exit 1
fi

echo "Synchronisation PLS → veille-juridique..."

# ── data/traitement.js ────────────────────────────────────────────────────────
# Identique dans les deux projets (même STORAGE_KEY, mêmes fonctions)
cp "$PLS_SRC/data/traitement.js" "$VJ/data/traitement.js"
echo "  ✓ data/traitement.js"

# ── data/veille.js ────────────────────────────────────────────────────────────
# Identique dans les deux projets
cp "$PLS_SRC/data/veille.js" "$VJ/data/veille.js"
echo "  ✓ data/veille.js"

# ── data/articles-store.js ───────────────────────────────────────────────────
# Identique (même BASE_URL relative, même STORAGE_KEY)
cp "$PLS_SRC/data/articles-store.js" "$VJ/data/articles-store.js"
echo "  ✓ data/articles-store.js"

# ── data/veille-formateurs.js → data/formateurs.js ──────────────────────────
# PLS utilise des noms avec suffix "Veille" et STORAGE_KEY "pls_formateurs_veille"
# veille-juridique utilise les noms courts et STORAGE_KEY "pls_formateurs"
sed \
  -e 's/pls_formateurs_veille/pls_formateurs/g' \
  -e 's/getFormateursVeille/getFormateurs/g' \
  -e 's/saveFormateursVeille/saveFormateurs/g' \
  -e 's/addFormateurVeille/addFormateur/g' \
  -e 's/updateFormateurVeille/updateFormateur/g' \
  -e 's/removeFormateurVeille/removeFormateur/g' \
  -e 's/`fv_\${Date.now()}`/`f_${Date.now()}`/g' \
  "$PLS_SRC/data/veille-formateurs.js" > "$VJ/data/formateurs.js"
echo "  ✓ data/veille-formateurs.js → data/formateurs.js"

# ── pages/TableauDeBord.jsx ──────────────────────────────────────────────────
# Même transformation : imports veille-formateurs → formateurs, noms de fonctions
sed \
  -e "s|from '../data/veille-formateurs'|from '../data/formateurs'|g" \
  -e 's/getFormateursVeille/getFormateurs/g' \
  -e 's/addFormateurVeille/addFormateur/g' \
  -e 's/updateFormateurVeille/updateFormateur/g' \
  -e 's/removeFormateurVeille/removeFormateur/g' \
  "$PLS_SRC/pages/TableauDeBord.jsx" > "$VJ/pages/TableauDeBord.jsx"
echo "  ✓ pages/TableauDeBord.jsx"

# ── pages/TableauDeBord.css ──────────────────────────────────────────────────
cp "$PLS_SRC/pages/TableauDeBord.css" "$VJ/pages/TableauDeBord.css"
echo "  ✓ pages/TableauDeBord.css"

# ── pages/VeilleFormateur.jsx + css ─────────────────────────────────────────
cp "$PLS_SRC/pages/VeilleFormateur.jsx" "$VJ/pages/VeilleFormateur.jsx"
cp "$PLS_SRC/pages/VeilleFormateur.css" "$VJ/pages/VeilleFormateur.css"
echo "  ✓ pages/VeilleFormateur.jsx + css"

# ── scripts/fetch-rss.mjs ────────────────────────────────────────────────────
# Remettre l'User-Agent veille-juridique
sed \
  -e "s|pennylane-learning-suite/|veille-juridique/|g" \
  "$(cd "$(dirname "$0")/.." && pwd)/scripts/fetch-rss.mjs" > "$HOME/veille-juridique/fetch-rss.mjs"
echo "  ✓ scripts/fetch-rss.mjs → fetch-rss.mjs"

echo ""
echo "Sync terminée. Vérifier et commiter dans veille-juridique :"
echo "  cd ~/veille-juridique && git diff"
