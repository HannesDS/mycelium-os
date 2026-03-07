from __future__ import annotations

import asyncio
import logging
import os

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status

from core.nats_client import NatsEventBus

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_WS_CONNECTIONS = 100
RELAY_QUEUE_MAX = 4096
WS_AUTH_TOKEN = os.getenv("WS_AUTH_TOKEN")


class ConnectionManager:
    def __init__(self, max_connections: int = MAX_WS_CONNECTIONS) -> None:
        self._connections: list[WebSocket] = []
        self._max_connections = max_connections

    @property
    def count(self) -> int:
        return len(self._connections)

    async def accept(self, ws: WebSocket) -> bool:
        if len(self._connections) >= self._max_connections:
            await ws.close(code=1013, reason="Max connections reached")
            return False
        await ws.accept()
        self._connections.append(ws)
        return True

    def disconnect(self, ws: WebSocket) -> None:
        try:
            self._connections.remove(ws)
        except ValueError:
            pass

    async def broadcast(self, data: str) -> None:
        stale: list[WebSocket] = []
        for ws in self._connections:
            try:
                await ws.send_text(data)
            except Exception:
                stale.append(ws)
        for ws in stale:
            try:
                self._connections.remove(ws)
            except ValueError:
                pass


manager = ConnectionManager()
_relay_task: asyncio.Task | None = None
_nats_bus_ref: NatsEventBus | None = None


async def _nats_relay(nats_bus: NatsEventBus) -> None:
    if not nats_bus.is_connected:
        logger.warning("NATS not connected — WebSocket bridge inactive")
        return

    queue: asyncio.Queue = asyncio.Queue(maxsize=RELAY_QUEUE_MAX)

    async def _on_msg(msg) -> None:
        try:
            queue.put_nowait(msg.data.decode())
        except asyncio.QueueFull:
            logger.warning("Relay queue full — dropping event")

    sub = await nats_bus.subscribe("mycelium.events", _on_msg)
    if not sub:
        return

    logger.info("WebSocket bridge subscribed to mycelium.events")

    try:
        while True:
            data = await queue.get()
            await manager.broadcast(data)
    except asyncio.CancelledError:
        await sub.unsubscribe()


async def start_relay(nats_bus: NatsEventBus) -> None:
    global _relay_task, _nats_bus_ref
    _nats_bus_ref = nats_bus
    if _relay_task is None or _relay_task.done():
        _relay_task = asyncio.create_task(_nats_relay(nats_bus))


async def stop_relay() -> None:
    global _relay_task
    if _relay_task and not _relay_task.done():
        _relay_task.cancel()
        try:
            await _relay_task
        except asyncio.CancelledError:
            pass
        _relay_task = None


def _check_ws_token(ws: WebSocket) -> bool:
    if not WS_AUTH_TOKEN:
        return True
    token = ws.query_params.get("token")
    return token == WS_AUTH_TOKEN


@router.websocket("/ws/events")
async def ws_events(ws: WebSocket) -> None:
    if not _check_ws_token(ws):
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    accepted = await manager.accept(ws)
    if not accepted:
        logger.warning("Rejected WebSocket client — max connections reached")
        return
    logger.info("WebSocket client connected (%d total)", manager.count)
    try:
        while True:
            await ws.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        manager.disconnect(ws)
        logger.info("WebSocket client disconnected (%d total)", manager.count)
