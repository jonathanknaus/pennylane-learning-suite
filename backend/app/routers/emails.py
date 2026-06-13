from litestar import Router, get, post
from litestar.connection import Request
from litestar.exceptions import HTTPException
from app.models.db import get_pool
from app.models.types import EmailEnvoi
from app.services.auth import require_auth
from app.services.email import send_document_email
from app.config import RESEND_API_KEY
import re


TYPES_AUTORISES = {"convocation", "attestation", "emargement"}

# Validation pragmatique d'adresse email (pas de RFC complète, juste anti-garbage)
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

# Garde-fou taille : un document HTML email reste largement sous cette limite.
MAX_HTML_BYTES = 500_000


@post("/send")
async def send_emails(data: EmailEnvoi, request: Request) -> dict:
    """Envoie un document (convocation / attestation / émargement) par email à
    une liste de destinataires. Le corps HTML est rendu par le frontend, un par
    destinataire. Renvoie le détail par destinataire."""
    require_auth(request)

    if data.type not in TYPES_AUTORISES:
        raise HTTPException(status_code=400, detail=f"Type invalide. Valeurs: {sorted(TYPES_AUTORISES)}")
    if not data.destinataires:
        raise HTTPException(status_code=400, detail="Aucun destinataire")
    if not RESEND_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Envoi d'emails non configuré (RESEND_API_KEY manquante côté serveur)."
        )

    # Garde-fou taille avant tout envoi (évite un timeout Resend / un log qui gonfle).
    total_html = sum(len(d.html or "") for d in data.destinataires)
    if total_html > MAX_HTML_BYTES:
        raise HTTPException(status_code=413, detail="Contenu HTML trop volumineux.")

    resultats = []
    for dest in data.destinataires:
        if not dest.email or not EMAIL_RE.match(dest.email.strip()):
            resultats.append({"email": dest.email, "nom": dest.nom, "ok": False, "erreur": "Email invalide ou manquant"})
            continue
        res = await send_document_email(
            type_doc=data.type,
            sujet=data.sujet,
            destinataire=dest.email,
            html=dest.html,
            session_id=data.session_id,
            stagiaire_id=dest.stagiaire_id,
            joindre_pdf=data.joindre_pdf,
        )
        resultats.append({"email": dest.email, "nom": dest.nom, **res})

    envoyes = sum(1 for r in resultats if r.get("ok"))
    avec_pdf = sum(1 for r in resultats if r.get("ok") and r.get("pdf_joint"))
    return {
        "envoyes": envoyes,
        "total": len(resultats),
        "echecs": len(resultats) - envoyes,
        "avec_pdf": avec_pdf,
        "resultats": resultats,
    }


@get("/log")
async def list_emails_log(request: Request) -> list[dict]:
    """Historique des emails envoyés (200 derniers)."""
    require_auth(request)
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT type, destinataire, sujet, statut, resend_id, created_at
               FROM emails_log ORDER BY created_at DESC LIMIT 200"""
        )
    return [dict(r) for r in rows]


emails_router = Router(path="/emails", route_handlers=[send_emails, list_emails_log])
