from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from core.controller import ShroomController

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/shrooms", tags=["shrooms"])


def get_controller(request: Request) -> ShroomController:
    controller = getattr(request.app.state, "controller", None)
    if controller is None:
        raise HTTPException(status_code=503, detail="Control plane not initialized")
    return controller


class MessageRequest(BaseModel):
    message: str


class MessageResponse(BaseModel):
    shroom_id: str
    response: str


@router.get("")
def list_shrooms(controller: ShroomController = Depends(get_controller)):
    return controller.list_shrooms()


@router.get("/{shroom_id}")
def get_shroom(shroom_id: str, controller: ShroomController = Depends(get_controller)):
    shroom = controller.get_shroom(shroom_id)
    if not shroom:
        raise HTTPException(status_code=404, detail=f"Shroom '{shroom_id}' not found")
    return shroom


@router.post("/{shroom_id}/message", response_model=MessageResponse)
def send_message(shroom_id: str, req: MessageRequest, controller: ShroomController = Depends(get_controller)):
    agent = controller.get_agent(shroom_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Shroom '{shroom_id}' not found")
    try:
        run_response = agent.run(req.message)
        content = run_response.content if run_response.content else "No response generated."
    except Exception:
        logger.exception("Agent error for shroom '%s'", shroom_id)
        raise HTTPException(status_code=502, detail="Agent processing failed")
    return MessageResponse(shroom_id=shroom_id, response=content)
