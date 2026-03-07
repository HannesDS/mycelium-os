from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.controller import ShroomController

router = APIRouter(prefix="/shrooms", tags=["shrooms"])

_controller: ShroomController | None = None


def init_router(controller: ShroomController) -> None:
    global _controller
    _controller = controller


class MessageRequest(BaseModel):
    message: str


class MessageResponse(BaseModel):
    shroom_id: str
    response: str


@router.get("")
def list_shrooms():
    return _controller.list_shrooms()


@router.get("/{shroom_id}")
def get_shroom(shroom_id: str):
    shroom = _controller.get_shroom(shroom_id)
    if not shroom:
        raise HTTPException(status_code=404, detail=f"Shroom '{shroom_id}' not found")
    return shroom


@router.post("/{shroom_id}/message", response_model=MessageResponse)
def send_message(shroom_id: str, req: MessageRequest):
    agent = _controller.get_agent(shroom_id)
    if not agent:
        raise HTTPException(status_code=404, detail=f"Shroom '{shroom_id}' not found")
    try:
        run_response = agent.run(req.message)
        content = run_response.content if run_response.content else "No response generated."
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Agent error: {e}")
    return MessageResponse(shroom_id=shroom_id, response=content)
