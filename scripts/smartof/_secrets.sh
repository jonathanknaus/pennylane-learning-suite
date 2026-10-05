#!/usr/bin/env bash
# Chargement des identifiants SmartOF depuis le trousseau d'accès macOS.
#
# Fichier destiné à être sourcé par les autres scripts, pas lancé directement.
#
# Le trousseau est le coffre chiffré du système : les secrets n'existent nulle
# part en clair, ils sont déverrouillés par ta session macOS. C'est ce qui
# satisfait l'exigence « API keys must be stored in a secure way » du SPD.
# La source de vérité reste le coffre d'entreprise ; ceci n'est qu'un cache local.
#
# Pour enregistrer les secrets une fois pour toutes : ./identifiants.sh enregistrer

SERVICE_CLE="smartof-cle-api-web"
SERVICE_MDP="smartof-mot-de-passe"
SERVICE_IDENT="smartof-identifiant"

_lire_trousseau() {
  security find-generic-password -a "$USER" -s "$1" -w 2>/dev/null
}

# Renseigne CLE_WEB, IDENT et MOTDEPASSE depuis le trousseau, avec repli clavier.
charger_secrets() {
  CLE_WEB="$(_lire_trousseau "$SERVICE_CLE")"
  MOTDEPASSE="$(_lire_trousseau "$SERVICE_MDP")"
  IDENT="$(_lire_trousseau "$SERVICE_IDENT")"
  IDENT="${IDENT:-api-afs-pennylane@smartof.tech}"

  if [[ -n "$CLE_WEB" && -n "$MOTDEPASSE" ]]; then
    echo "🔐 Identifiants lus depuis le trousseau macOS (aucune saisie nécessaire)."
    echo
    return 0
  fi

  echo "ℹ Identifiants absents du trousseau — saisie manuelle."
  echo "  Pour ne plus les retaper : ./identifiants.sh enregistrer"
  echo

  if [[ -z "$CLE_WEB" ]]; then
    printf "Clé API web (AIza…) : "
    read -rs CLE_WEB; echo
  fi
  if [[ -z "$MOTDEPASSE" ]]; then
    printf "Mot de passe : "
    read -rs MOTDEPASSE; echo
  fi
  echo

  if [[ -z "$CLE_WEB" || -z "$MOTDEPASSE" ]]; then
    echo "✗ Clé API web et mot de passe sont requis." >&2
    return 1
  fi
}

# Échange les identifiants contre un idToken. Renseigne JETON.
obtenir_jeton() {
  local rep code
  rep=$(mktemp)

  code=$(
    IDENT="$IDENT" MOTDEPASSE="$MOTDEPASSE" python3 -c \
      'import json,os,sys; sys.stdout.write(json.dumps({"email":os.environ["IDENT"],"password":os.environ["MOTDEPASSE"],"returnSecureToken":True}))' \
    | curl -s -X POST -H "Content-Type: application/json" --data-binary @- \
        -o "$rep" -w "%{http_code}" --max-time 30 \
        "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${CLE_WEB}"
  )

  if [[ "$code" != "200" ]]; then
    echo "✗ Authentification échouée (HTTP ${code}) :" >&2
    python3 -c 'import json,sys; print("   ", json.load(open(sys.argv[1])).get("error",{}).get("message","?"))' "$rep" 2>/dev/null
    echo "   Si le mot de passe a changé : ./identifiants.sh enregistrer" >&2
    rm -f "$rep"
    return 1
  fi

  JETON=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("idToken",""))' "$rep")
  rm -f "$rep"

  [[ -z "$JETON" ]] && { echo "✗ Pas d'idToken reçu." >&2; return 1; }

  echo "✅ Authentifié (jeton non affiché, valable 1 h)."
  echo
}
