from __future__ import annotations

import json
import logging
import os

import nats
from nats.aio.client import Client as NatsClient

from core.events import ShroomEvent

logger = logging.getLogger(__name__)

NATS_URL = os.getenv("NATS_URL", "nats://localhost:4222")


class NatsEventBus:
    def __init__(self) -> None:
        self._nc: NatsClient | None = None

    async def connect(self) -> None:
        try:
            self._nc = await nats.connect(
                NATS_URL,
                reconnect_time_wait=2,
                max_reconnect_attempts=-1,
            )
            logger.info("Connected to NATS at %s", NATS_URL)
        except Exception:
            logger.exception("Failed to connect to NATS at %s", NATS_URL)
            self._nc = None

    async def close(self) -> None:
        if self._nc and not self._nc.is_closed:
            await self._nc.drain()
            logger.info("NATS connection closed")

    @property
    def is_connected(self) -> bool:
        return self._nc is not None and not self._nc.is_closed

    async def publish_event(self, event: ShroomEvent) -> None:
        if not self.is_connected:
            logger.warning("NATS not connected — dropping event %s", event.shroom_id)
            return

        shroom_subject = f"shroom.{event.shroom_id}.events"
        fanout_subject = "mycelium.events"

        try:
            payload = json.dumps(event.model_dump(), default=str).encode()
            await self._nc.publish(shroom_subject, payload)
            await self._nc.publish(fanout_subject, payload)
            logger.debug("Published event to %s and %s", shroom_subject, fanout_subject)
        except Exception:
            logger.exception(
                "Failed to publish event for %s to %s",
                event.shroom_id,
                shroom_subject,
            )

    async def subscribe(self, subject: str, callback):
        if not self.is_connected:
            logger.warning("NATS not connected — cannot subscribe to %s", subject)
            return None
        return await self._nc.subscribe(subject, cb=callback)
