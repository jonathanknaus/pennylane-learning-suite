from litestar import Litestar
from litestar.config.cors import CORSConfig
from litestar.middleware.logging import LoggingMiddlewareConfig
from contextlib import asynccontextmanager
from app.models.db import get_pool, close_pool, init_schema
from app.services.scheduler import get_scheduler
from app.routers.auth import auth_router
from app.routers.entreprises import entreprises_router
from app.routers.stagiaires import stagiaires_router
from app.routers.formateurs import formateurs_router
from app.routers.sessions import sessions_router
from app.routers.questionnaires import questionnaires_router
from app.routers.enquetes import enquetes_router
from app.routers.parametres import parametres_router
from app.routers.emails import emails_router
from app.config import FRONTEND_URL
import logging

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: Litestar):
    await init_schema()
    scheduler = get_scheduler()
    scheduler.start()
    yield
    scheduler.shutdown()
    await close_pool()


cors_config = CORSConfig(
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app = Litestar(
    route_handlers=[
        auth_router,
        entreprises_router,
        stagiaires_router,
        formateurs_router,
        sessions_router,
        questionnaires_router,
        enquetes_router,
        parametres_router,
        emails_router,
    ],
    cors_config=cors_config,
    lifespan=[lifespan],
)
