from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request

from core.controller import ShroomController
from core.skills import MCP_CATALOG, SKILLS_CATALOG

router = APIRouter(prefix="/skills", tags=["skills"])


def get_controller(request: Request) -> ShroomController:
    controller = getattr(request.app.state, "controller", None)
    if controller is None:
        raise HTTPException(status_code=503, detail="Control plane not initialized")
    return controller


@router.get("/mcps")
def list_mcps(controller: ShroomController = Depends(get_controller)):
    all_mcp_ids: set[str] = set(MCP_CATALOG)
    for m in controller.manifests.values():
        all_mcp_ids.update(m.spec.mcps)
    catalog = [
        {
            "id": mcp_id,
            "name": MCP_CATALOG.get(mcp_id, {}).get("name", mcp_id),
            "description": MCP_CATALOG.get(mcp_id, {}).get("description", ""),
            "shrooms": [
                m.metadata.id
                for m in controller.manifests.values()
                if mcp_id in m.spec.mcps
            ],
        }
        for mcp_id in sorted(all_mcp_ids)
    ]
    return {"mcps": catalog}


@router.get("")
def list_skills(controller: ShroomController = Depends(get_controller)):
    all_skill_ids: set[str] = set(SKILLS_CATALOG)
    for m in controller.manifests.values():
        all_skill_ids.update(m.spec.skills)
    catalog = [
        {
            "id": skill_id,
            "name": SKILLS_CATALOG.get(skill_id, {}).get("name", skill_id),
            "description": SKILLS_CATALOG.get(skill_id, {}).get("description", ""),
            "shrooms": [
                m.metadata.id
                for m in controller.manifests.values()
                if skill_id in m.spec.skills
            ],
        }
        for skill_id in sorted(all_skill_ids)
    ]
    return {"skills": catalog}
