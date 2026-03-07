from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from core.nats_client import nats_bus

logger = logging.getLogger(__name__)

router = APIRouter()


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: list[WebSocket] = []

    async def accept(self, ws: WebSocket) -> None:
        await ws.accept()
        self._connections.append(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self._connections.remove(ws)

    async def broadcast(self, data: str) -> None:
        stale: list[WebSocket] = []
        for ws in self._connections:
            try:
                await ws.send_text(data)
            except Exception:
                stale.append(ws)
        for ws in stale:
            self._connections.remove(ws)


manager = ConnectionManager()
_subscription = None
_relay_task: asyncio.Task | None = None


async def _nats_relay() -> None:
    if not nats_bus.is_connected:
        logger.warning("NATS not connected — WebSocket bridge inactive")
        return

    queue: asyncio.Queue = asyncio.Queue()

    async def _on_msg(msg) -> None:
        await queue.put(msg.data.decode())

    sub = await nats_bus.subscribe("mycelium.events", _on_msg)
    if not sub:
        return

    global _subscription
    _subscription = sub
    logger.info("WebSocket bridge subscribed to mycelium.events")

    try:
        while True:
            data = await queue.get()
            await manager.broadcast(data)
    except asyncio.CancelledError:
        await sub.unsubscribe()


async def start_relay() -> None:
    global _relay_task
    if _relay_task is None or _relay_task.done():
        _relay_task = asyncio.create_task(_nats_relay())


async def stop_relay() -> None:
    global _relay_task
    if _relay_task and not _relay_task.done():
        _relay_task.cancel()
        try:
            await _relay_task
        except asyncio.CancelledError:
            pass
        _relay_task = None


@router.websocket("/ws/events")
async def ws_events(ws: WebSocket) -> None:
    await manager.accept(ws)
    logger.info("WebSocket client connected")
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(ws)
        logger.info("WebSocket client disconnected")
