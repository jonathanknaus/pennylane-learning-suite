from litestar import Router, get, post
from litestar.connection import Request
from litestar.exceptions import HTTPException
from app.models.db import get_pool
from app.models.types import EnqueteReponse
from app.services.auth import require_auth
import json


@post("/reponses")
async def save_reponse_enquete(data: EnqueteReponse, request: Request) -> dict:
    """Enregistre les réponses à une enquête. Endpoint public : l'enquête est
    identifiée par son token unique (lien email), pas par des IDs fournis par
    le client. La ligne enquetes a été créée en amont par le scheduler."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        existing = await conn.fetchrow(
            "SELECT id FROM enquetes WHERE token=$1", data.token
        )
        if not existing:
            raise HTTPException(status_code=404, detail="Enquête introuvable")
        row = await conn.fetchrow(
            "UPDATE enquetes SET reponses=$1, date_reponse=NOW() WHERE id=$2 RETURNING *",
            json.dumps(data.reponses), existing["id"]
        )
    return dict(row)


@get("/session/{session_id:str}")
async def get_enquetes_session(session_id: str, request: Request) -> list[dict]:
    require_auth(request)
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT e.*, s.nom, s.prenom FROM enquetes e
               JOIN stagiaires s ON s.id = e.stagiaire_id
               WHERE e.session_id=$1 ORDER BY e.type, s.nom""",
            session_id
        )
    return [dict(r) for r in rows]


@get("/token/{token:str}")
async def get_enquete_by_token(token: str) -> dict:
    """Endpoint public pour accéder à une enquête via son token unique (email)."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT e.*, s.nom, s.prenom, se.titre as session_titre, se.date_debut
               FROM enquetes e
               JOIN stagiaires s ON s.id = e.stagiaire_id
               JOIN sessions se ON se.id = e.session_id
               WHERE e.token=$1""",
            token
        )
        if not row:
            raise HTTPException(status_code=404, detail="Enquête introuvable")
    return dict(row)


enquetes_router = Router(path="/enquetes", route_handlers=[
    save_reponse_enquete, get_enquetes_session, get_enquete_by_token
])
