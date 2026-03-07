from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI

from core.controller import ShroomController
from core.database import init_db
from core.manifest import load_all_shroom_manifests
from core.nats_client import nats_bus
from routers.events import router as events_router, start_relay, stop_relay
from routers.shrooms import router as shrooms_router

MYCELIUM_CONFIG = os.getenv("MYCELIUM_CONFIG", "mycelium.yaml")


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

    controller = ShroomController()
    for manifest in manifests.values():
        controller.register(manifest)

    app.state.controller = controller
    app.state.db_session_factory = init_db()

    await nats_bus.connect()
    app.state.nats_bus = nats_bus
    await start_relay()

    yield

    await stop_relay()
    await nats_bus.close()


app = FastAPI(
    title="Mycelium OS — Control Plane",
    description="Constitution engine, shroom orchestration, and Agno runtime",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(shrooms_router)
app.include_router(events_router)


@app.get("/health")
def health():
    return {"status": "ok"}
