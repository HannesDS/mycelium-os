from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.controller import ShroomController
from core.database import init_db
from core.manifest import load_all_shroom_manifests
from core.models import Approval
from core.nats_client import NatsEventBus
from routers.approvals import router as approvals_router
from routers.constitution import router as constitution_router
from routers.demo import router as demo_router
from routers.event_log import router as event_log_router
from routers.events import router as events_router, start_relay, stop_relay
from routers.knowledge import router as knowledge_router
from routers.sessions import router as sessions_router
from routers.org import router as org_router
from routers.shrooms import router as shrooms_router
from routers.skills_catalog import router as skills_catalog_router

logger = logging.getLogger(__name__)

MYCELIUM_CONFIG = os.getenv("MYCELIUM_CONFIG", "mycelium.yaml")

SEED_APPROVALS = [
    {
        "shroom_id": "sales-shroom",
        "event_type": "escalation_raised",
        "summary": "Send proposal email to Acme Corp lead",
        "payload": {
            "lead": "Acme Corp",
            "action": "send_email",
            "template": "enterprise_proposal_v2",
        },
    },
    {
        "shroom_id": "billing-shroom",
        "event_type": "escalation_raised",
        "summary": "Send overdue invoice reminder to client X",
        "payload": {
            "client": "Client X",
            "invoice_id": "INV-2026-0042",
            "days_overdue": 14,
        },
    },
    {
        "shroom_id": "compliance-shroom",
        "event_type": "escalation_raised",
        "summary": "Flag contract renewal for Acme Corp",
        "payload": {
            "client": "Acme Corp",
            "contract_end": "2026-04-15",
            "action": "flag_renewal",
        },
    },
]


def _ensure_tables() -> None:
    from core.database import Base, get_engine
    Base.metadata.create_all(get_engine())
    logger.info("Ensured all tables exist")


def _seed_approvals(session_factory) -> None:
    session = session_factory()
    try:
        count = session.query(Approval).count()
        if count == 0:
            for seed in SEED_APPROVALS:
                session.add(Approval(**seed))
            session.commit()
            logger.info("Seeded %d demo approvals", len(SEED_APPROVALS))
        else:
            logger.info("Approvals table already has %d rows, skipping seed", count)
    except Exception as e:
        session.rollback()
        logger.error("Failed to seed approvals: %s", e)
        raise
    finally:
        session.close()


def _resolve_config_path() -> Path:
    candidates = [
        Path(MYCELIUM_CONFIG),
        Path("/app") / MYCELIUM_CONFIG,
        Path(__file__).resolve().parent.parent.parent / MYCELIUM_CONFIG,
    ]
    for p in candidates:
        if p.exists():
            return p
    raise FileNotFoundError(
        f"mycelium.yaml not found. Tried: {[str(c) for c in candidates]}"
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    config_path = _resolve_config_path()
    manifests = load_all_shroom_manifests(config_path)

    from core.manifest import load_mycelium_config
    app.state.mycelium_config = load_mycelium_config(config_path)

    controller = ShroomController()
    for manifest in manifests.values():
        controller.register(manifest)

    app.state.controller = controller
    session_factory = init_db()
    app.state.db_session_factory = session_factory

    _ensure_tables()
    _seed_approvals(session_factory)

    nats_bus = NatsEventBus()
    await nats_bus.connect()
    app.state.nats_bus = nats_bus
    await start_relay(nats_bus)

    yield

    await stop_relay()
    await nats_bus.close()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Mycelium OS — Control Plane",
        description="Constitution engine, shroom orchestration, and Agno runtime",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(shrooms_router)
    app.include_router(sessions_router)
    app.include_router(constitution_router)
    app.include_router(event_log_router)
    app.include_router(events_router)
    app.include_router(approvals_router)
    app.include_router(demo_router)
    app.include_router(org_router)
    app.include_router(skills_catalog_router)
    app.include_router(knowledge_router)

    @app.get("/")
    def root() -> dict[str, str]:
        return {
            "service": "Mycelium OS Control Plane",
            "docs": "/docs",
            "health": "/health",
        }

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
