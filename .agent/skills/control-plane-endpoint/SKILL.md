---
name: control-plane-endpoint
description: Workflow for adding or modifying FastAPI endpoints in the Mycelium OS control plane. Use when working in apps/control-plane/ or adding API routes.
---

# Control Plane Endpoint

Workflow for adding or modifying FastAPI endpoints in `apps/control-plane/`.

## When to Use

- Adding a new API endpoint
- Modifying an existing endpoint's request/response shape
- Adding a new router module

## Project Structure

```
apps/control-plane/
├── main.py              # FastAPI app, router registration
├── routers/
│   └── shrooms.py       # Shroom-related endpoints
├── core/
│   ├── models.py         # Pydantic models (source of truth for data shapes)
│   ├── manifest.py       # mycelium.yaml parser
│   ├── controller.py     # Business logic
│   ├── database.py       # DB connection, session factory
│   └── memory/
│       └── beads.py      # Beads episodic memory
├── alembic/              # DB migrations
├── tests/
│   ├── test_api.py
│   ├── test_manifest.py
│   └── test_beads.py
└── pyproject.toml
```

## Requirements

1. **Pydantic models for all request/response shapes** — define in `core/models.py`
2. **OpenAPI annotations** — FastAPI generates these from Pydantic models and route decorators. Use `response_model`, `summary`, `tags`.
3. **Router pattern** — new domain = new file in `routers/`. Register in `main.py`.
4. **Type hints everywhere** — no untyped function signatures
5. **Tests** — every new endpoint gets a test in `tests/`
6. **No direct DB access from frontend** — frontend talks to control plane API only

## Endpoint Pattern

```python
from fastapi import APIRouter, HTTPException
from core.models import ShroomResponse

router = APIRouter(prefix="/shrooms", tags=["shrooms"])

@router.get("/{shroom_id}", response_model=ShroomResponse, summary="Get shroom by ID")
async def get_shroom(shroom_id: str):
    ...
```

## Test Pattern

```python
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_get_shroom():
    response = client.get("/shrooms/sales-shroom")
    assert response.status_code == 200
```

## DB Migrations

If adding or changing a table:
1. Update the SQLAlchemy model
2. Generate migration: `alembic revision --autogenerate -m "description"`
3. Apply: `alembic upgrade head`

## References

- `apps/control-plane/core/models.py` — Pydantic models
- `apps/control-plane/main.py` — app entrypoint
- `docs/adrs/ADR-006-python-fastapi-control-plane.md` — architecture decision
