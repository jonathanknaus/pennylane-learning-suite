import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

# SECRET_KEY signe les JWT : aucune valeur par défaut. Un secret prévisible
# permettrait de forger un token admin. On échoue au démarrage s'il manque
# ou s'il a été laissé à une valeur d'exemple non sûre.
_INSECURE_SECRETS = {"", "dev-secret-change-me", "changeme-generate-with-openssl-rand-hex-32"}
SECRET_KEY = os.environ.get("SECRET_KEY", "")
if SECRET_KEY in _INSECURE_SECRETS:
    raise RuntimeError(
        "SECRET_KEY manquant ou non sûr. Définissez une valeur aléatoire, "
        "p.ex. : export SECRET_KEY=$(openssl rand -hex 32)"
    )
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL   = os.environ.get("FROM_EMAIL", "afs-training@pennylane.com")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3001")

# Pennylane OF identity
OF_NOM        = "PENNYLANE"
OF_SIRET      = "88026592100044"
OF_ADRESSE    = "2 RUE JULES LEFEBVRE 75009 PARIS"
OF_DA         = "28 50 01542 50"
OF_SIGNATAIRE = "Jonathan Knaus"
OF_TITRE      = "Team Lead Accounting Firm Services"
