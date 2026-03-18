"""Agno lifecycle hooks for ShroomEvent emission.

Hooks use a ContextVar to receive per-request state (db session, NATS bus,
shroom_id, session_id) so a single set of hook functions can be registered on
every agent at construction time without coupling them to request context.

Usage in the request handler:
    token = set_run_context(HookContext(db=db, nats_bus=nats_bus,
                                        shroom_id=shroom_id, session_id=session_id))
    try:
        run_response = await agent.arun(message, session_id=session_id)
    finally:
        reset_run_context(token)
"""
from __future__ import annotations

import logging
from contextvars import ContextVar
from dataclasses import dataclass
from typing import Any

from core.events import ShroomEvent, ShroomEventType

logger = logging.getLogger(__name__)


@dataclass
class HookContext:
    db: Any  # SQLAlchemy Session
    nats_bus: Any  # NatsEventBus
    shroom_id: str
    session_id: str | None = None


_run_ctx: ContextVar[HookContext | None] = ContextVar("_run_ctx", default=None)


def set_run_context(ctx: HookContext):
    """Bind per-request context for the current async task. Returns a reset token."""
    return _run_ctx.set(ctx)


def reset_run_context(token) -> None:
    """Remove per-request context after the run completes."""
    _run_ctx.reset(token)


async def on_run_start(agent: Any = None, run_input: Any = None, **kwargs: Any) -> None:
    """Agno pre_hook: fires when the agent begins processing. Emits TASK_STARTED."""
    ctx = _run_ctx.get()
    if ctx is None:
        return
    from core.event_service import emit_event

    summary = str(run_input)[:80] if run_input is not None else "starting"
    try:
        await emit_event(
            ctx.db,
            ctx.nats_bus,
            ShroomEvent(
                shroom_id=ctx.shroom_id,
                event=ShroomEventType.TASK_STARTED,
                topic="run",
                payload_summary=f"Task started: {summary}",
            ),
            session_id=ctx.session_id,
        )
    except Exception:
        logger.warning("on_run_start hook failed to emit event for %s", ctx.shroom_id, exc_info=True)


async def on_run_end(agent: Any = None, run_output: Any = None, **kwargs: Any) -> None:
    """Agno post_hook: fires when the agent finishes processing. Emits TASK_COMPLETED."""
    ctx = _run_ctx.get()
    if ctx is None:
        return
    from core.event_service import emit_event

    summary = ""
    if run_output is not None:
        summary = str(getattr(run_output, "content", "") or "")[:80]
    try:
        await emit_event(
            ctx.db,
            ctx.nats_bus,
            ShroomEvent(
                shroom_id=ctx.shroom_id,
                event=ShroomEventType.TASK_COMPLETED,
                topic="run",
                payload_summary=f"Task completed: {summary}",
            ),
            session_id=ctx.session_id,
        )
    except Exception:
        logger.warning("on_run_end hook failed to emit event for %s", ctx.shroom_id, exc_info=True)
