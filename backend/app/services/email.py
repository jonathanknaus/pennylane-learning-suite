"""Email sending via Resend API with template variable substitution."""
import resend
from app.config import RESEND_API_KEY, FROM_EMAIL, FRONTEND_URL, OF_NOM
from app.models.db import get_pool
import json
import logging
import uuid

logger = logging.getLogger(__name__)

resend.api_key = RESEND_API_KEY


def _as_uuid(value: str | None) -> str | None:
    """emails_log.session_id / stagiaire_id sont des UUID avec FK.
    Le frontend en mode démo envoie des IDs non-UUID (ex: s_demo_1) : on les
    neutralise pour ne pas casser l'insert ni violer la contrainte de clé."""
    if not value:
        return None
    try:
        uuid.UUID(str(value))
        return str(value)
    except (ValueError, AttributeError, TypeError):
        return None


def _render(template: str, variables: dict) -> str:
    for key, value in variables.items():
        template = template.replace("{{" + key + "}}", str(value) if value is not None else "")
    return template


async def _get_template(cle_sujet: str, cle_corps: str) -> tuple[str, str]:
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT cle, valeur FROM parametres WHERE cle = ANY($1)",
            [cle_sujet, cle_corps]
        )
    params = {r["cle"]: r["valeur"] for r in rows}
    return params.get(cle_sujet, ""), params.get(cle_corps, "")


async def _log_email(session_id: str | None, stagiaire_id: str | None, type_email: str,
                     destinataire: str, sujet: str, statut: str, resend_id: str | None = None):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """INSERT INTO emails_log (session_id, stagiaire_id, type, destinataire, sujet, statut, resend_id)
               VALUES ($1,$2,$3,$4,$5,$6,$7)""",
            session_id, stagiaire_id, type_email, destinataire, sujet, statut, resend_id
        )


async def send_convocation(session_id: str, stagiaire_id: str) -> bool:
    """Envoie la convocation à un stagiaire (15 min avant la session)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT se.code, se.titre, se.date_debut, se.date_fin, se.heure_debut, se.heure_fin,
               se.modalite, se.lieu, f.nom as formateur_nom, f.prenom as formateur_prenom,
               st.nom, st.prenom, st.email
               FROM sessions se
               LEFT JOIN formateurs f ON f.id = se.formateur_id
               JOIN inscriptions i ON i.session_id = se.id AND i.stagiaire_id=$2
               JOIN stagiaires st ON st.id = i.stagiaire_id
               WHERE se.id=$1""",
            session_id, stagiaire_id
        )
    if not row or not row["email"]:
        return False

    sujet_tpl, corps_tpl = await _get_template("tpl_convocation_sujet", "tpl_convocation_corps")
    variables = {
        "prenom": row["prenom"],
        "nom": row["nom"],
        "session_code": row["code"],
        "session_titre": row["titre"],
        "date_debut": str(row["date_debut"] or ""),
        "date_fin": str(row["date_fin"] or ""),
        "heure_debut": str(row["heure_debut"] or ""),
        "heure_fin": str(row["heure_fin"] or ""),
        "modalite": row["modalite"] or "",
        "lieu": row["lieu"] or "Visioconférence",
        "formateur": f"{row['formateur_prenom'] or ''} {row['formateur_nom'] or ''}".strip(),
        "of_nom": OF_NOM,
    }
    sujet = _render(sujet_tpl, variables)
    corps = _render(corps_tpl, variables)

    try:
        response = resend.Emails.send({
            "from": f"{OF_NOM} Formation <{FROM_EMAIL}>",
            "to": [row["email"]],
            "subject": sujet,
            "html": corps,
        })
        await _log_email(session_id, stagiaire_id, "convocation", row["email"], sujet, "envoyé", response.get("id"))
        return True
    except Exception as e:
        logger.error(f"Erreur envoi convocation {session_id}/{stagiaire_id}: {e}")
        await _log_email(session_id, stagiaire_id, "convocation", row["email"], sujet, "erreur")
        return False


async def send_enquete_chaud(session_id: str, stagiaire_id: str, token: str) -> bool:
    """Envoie l'enquête de satisfaction à chaud juste après la formation."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT se.titre, st.nom, st.prenom, st.email
               FROM sessions se
               JOIN inscriptions i ON i.session_id=se.id AND i.stagiaire_id=$2
               JOIN stagiaires st ON st.id=i.stagiaire_id
               WHERE se.id=$1""",
            session_id, stagiaire_id
        )
    if not row or not row["email"]:
        return False

    sujet_tpl, corps_tpl = await _get_template("tpl_enquete_chaud_sujet", "tpl_enquete_chaud_corps")
    variables = {
        "prenom": row["prenom"],
        "nom": row["nom"],
        "session_titre": row["titre"],
        "lien_enquete": f"{FRONTEND_URL}/enquete/{token}",
        "of_nom": OF_NOM,
    }
    sujet = _render(sujet_tpl, variables)
    corps = _render(corps_tpl, variables)

    try:
        response = resend.Emails.send({
            "from": f"{OF_NOM} Formation <{FROM_EMAIL}>",
            "to": [row["email"]],
            "subject": sujet,
            "html": corps,
        })
        await _log_email(session_id, stagiaire_id, "enquete_chaud", row["email"], sujet, "envoyé", response.get("id"))
        return True
    except Exception as e:
        logger.error(f"Erreur envoi enquête chaud {session_id}/{stagiaire_id}: {e}")
        await _log_email(session_id, stagiaire_id, "enquete_chaud", row["email"], sujet, "erreur")
        return False


async def send_enquete_froid(session_id: str, stagiaire_id: str, token: str) -> bool:
    """Envoie l'enquête à froid J+30."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT se.titre, st.nom, st.prenom, st.email
               FROM sessions se
               JOIN inscriptions i ON i.session_id=se.id AND i.stagiaire_id=$2
               JOIN stagiaires st ON st.id=i.stagiaire_id
               WHERE se.id=$1""",
            session_id, stagiaire_id
        )
    if not row or not row["email"]:
        return False

    sujet_tpl, corps_tpl = await _get_template("tpl_enquete_froid_sujet", "tpl_enquete_froid_corps")
    variables = {
        "prenom": row["prenom"],
        "nom": row["nom"],
        "session_titre": row["titre"],
        "lien_enquete": f"{FRONTEND_URL}/enquete/{token}",
        "of_nom": OF_NOM,
    }
    sujet = _render(sujet_tpl, variables)
    corps = _render(corps_tpl, variables)

    try:
        response = resend.Emails.send({
            "from": f"{OF_NOM} Formation <{FROM_EMAIL}>",
            "to": [row["email"]],
            "subject": sujet,
            "html": corps,
        })
        await _log_email(session_id, stagiaire_id, "enquete_froid", row["email"], sujet, "envoyé", response.get("id"))
        return True
    except Exception as e:
        logger.error(f"Erreur envoi enquête froid {session_id}/{stagiaire_id}: {e}")
        await _log_email(session_id, stagiaire_id, "enquete_froid", row["email"], sujet, "erreur")
        return False


async def send_rappel_enquete(session_id: str, stagiaire_id: str, type_enquete: str, token: str) -> bool:
    """Rappel si pas de réponse à une enquête."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT se.titre, st.nom, st.prenom, st.email
               FROM sessions se
               JOIN inscriptions i ON i.session_id=se.id AND i.stagiaire_id=$2
               JOIN stagiaires st ON st.id=i.stagiaire_id
               WHERE se.id=$1""",
            session_id, stagiaire_id
        )
    if not row or not row["email"]:
        return False

    sujet_tpl, corps_tpl = await _get_template("tpl_rappel_enquete_sujet", "tpl_rappel_enquete_corps")
    variables = {
        "prenom": row["prenom"],
        "nom": row["nom"],
        "session_titre": row["titre"],
        "lien_enquete": f"{FRONTEND_URL}/enquete/{token}",
        "of_nom": OF_NOM,
    }
    sujet = _render(sujet_tpl, variables)
    corps = _render(corps_tpl, variables)

    try:
        response = resend.Emails.send({
            "from": f"{OF_NOM} Formation <{FROM_EMAIL}>",
            "to": [row["email"]],
            "subject": sujet,
            "html": corps,
        })
        await _log_email(session_id, stagiaire_id, f"rappel_{type_enquete}", row["email"], sujet, "envoyé", response.get("id"))
        return True
    except Exception as e:
        logger.error(f"Erreur rappel enquête {session_id}/{stagiaire_id}: {e}")
        await _log_email(session_id, stagiaire_id, f"rappel_{type_enquete}", row["email"], sujet, "erreur")
        return False


async def _existing_fk(session_id: str | None, stagiaire_id: str | None) -> tuple[str | None, str | None]:
    """Ne conserve session_id / stagiaire_id pour emails_log que s'ils existent
    réellement en base (sinon la FK ferait échouer l'insert)."""
    sid = _as_uuid(session_id)
    stid = _as_uuid(stagiaire_id)
    if sid is None and stid is None:
        return None, None
    pool = await get_pool()
    async with pool.acquire() as conn:
        if sid is not None:
            if not await conn.fetchval("SELECT 1 FROM sessions WHERE id=$1", sid):
                sid = None
        if stid is not None:
            if not await conn.fetchval("SELECT 1 FROM stagiaires WHERE id=$1", stid):
                stid = None
    return sid, stid


_NOMS_FICHIER = {
    "convocation": "Convocation",
    "attestation": "Attestation",
    "emargement": "Emargement",
}


def _nom_pdf(type_doc: str) -> str:
    return f"{_NOMS_FICHIER.get(type_doc, 'Document')}.pdf"


async def send_document_email(type_doc: str, sujet: str, destinataire: str, html: str,
                              session_id: str | None = None, stagiaire_id: str | None = None,
                              joindre_pdf: bool = True) -> dict:
    """Envoi à la demande d'un document (convocation / attestation / émargement)
    dont le corps HTML est déjà rendu par le frontend. Réutilise Resend +
    emails_log. Si joindre_pdf, le même HTML est rendu en PDF et attaché (avec
    dégradation gracieuse si la génération PDF est indisponible).
    Renvoie {ok, resend_id?, pdf_joint, erreur?}."""
    sid, stid = await _existing_fk(session_id, stagiaire_id)

    payload = {
        "from": f"{OF_NOM} Formation <{FROM_EMAIL}>",
        "to": [destinataire],
        "subject": sujet,
        "html": html,
    }

    pdf_joint = False
    if joindre_pdf:
        from app.services.pdf import html_to_pdf
        pdf_bytes = html_to_pdf(html)
        if pdf_bytes:
            payload["attachments"] = [{
                "filename": _nom_pdf(type_doc),
                "content": list(pdf_bytes),
                "content_type": "application/pdf",
            }]
            pdf_joint = True

    try:
        response = resend.Emails.send(payload)
        resend_id = response.get("id") if isinstance(response, dict) else None
        await _log_email(sid, stid, type_doc, destinataire, sujet, "envoyé", resend_id)
        return {"ok": True, "resend_id": resend_id, "pdf_joint": pdf_joint}
    except Exception as e:
        logger.error(f"Erreur envoi {type_doc} à {destinataire}: {e}")
        await _log_email(sid, stid, type_doc, destinataire, sujet, "erreur")
        return {"ok": False, "pdf_joint": pdf_joint, "erreur": str(e)}
