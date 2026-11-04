import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
SECRET_KEY   = os.environ.get("SECRET_KEY", "dev-secret-change-me")
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
FROM_EMAIL   = os.environ.get("FROM_EMAIL", "afs-training@pennylane.com")
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3001")

# Pennylane OF identity
OF_NOM        = "PENNYLANE"
OF_SIRET      = "88026592100044"
OF_ADRESSE    = "2 RUE JULES LEFEBVRE 75009 PARIS"
OF_DA         = "28 50 01542 50"
OF_SIGNATAIRE = "Jonathan Knaus"
OF_TITRE      = "Team Lead External Consulting"
