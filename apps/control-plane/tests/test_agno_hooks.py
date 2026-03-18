"""Tests for Agno lifecycle hooks that emit ShroomEvents to NATS."""
from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from core.agno_hooks import (
    HookContext,
    on_run_end,
    on_run_start,
    reset_run_context,
    set_run_context,
)
from core.events import ShroomEventType


@pytest.fixture()
def mock_nats():
    bus = MagicMock()
    bus.is_connected = True
    bus.publish_event = AsyncMock()
    return bus


@pytest.fixture()
def mock_db():
    db = MagicMock()
    db.add = MagicMock()
    db.commit = MagicMock()
    return db


@pytest.mark.asyncio
async def test_on_run_start_emits_task_started(mock_db, mock_nats):
    ctx = HookContext(db=mock_db, nats_bus=mock_nats, shroom_id="sales-shroom", session_id="sess-1")
    token = set_run_context(ctx)
    try:
        with patch("core.event_service.ShroomEventRecord"):
            await on_run_start(agent=MagicMock(), run_input="process this lead")
    finally:
        reset_run_context(token)

    mock_nats.publish_event.assert_called_once()
    event = mock_nats.publish_event.call_args[0][0]
    assert event.shroom_id == "sales-shroom"
    assert event.event == ShroomEventType.TASK_STARTED
    assert event.topic == "run"
    assert "process this lead" in event.payload_summary


@pytest.mark.asyncio
async def test_on_run_end_emits_task_completed(mock_db, mock_nats):
    ctx = HookContext(db=mock_db, nats_bus=mock_nats, shroom_id="sales-shroom", session_id="sess-1")
    token = set_run_context(ctx)
    run_output = SimpleNamespace(content="Lead qualified — booking demo")
    try:
        with patch("core.event_service.ShroomEventRecord"):
            await on_run_end(agent=MagicMock(), run_output=run_output)
    finally:
        reset_run_context(token)

    mock_nats.publish_event.assert_called_once()
    event = mock_nats.publish_event.call_args[0][0]
    assert event.shroom_id == "sales-shroom"
    assert event.event == ShroomEventType.TASK_COMPLETED
    assert event.topic == "run"
    assert "Lead qualified" in event.payload_summary


@pytest.mark.asyncio
async def test_hooks_no_op_without_context(mock_db, mock_nats):
    """Hooks must be silent no-ops when no context is set (e.g. in tests)."""
    await on_run_start(agent=MagicMock(), run_input="hello")
    await on_run_end(agent=MagicMock(), run_output=SimpleNamespace(content="hi"))
    mock_nats.publish_event.assert_not_called()


@pytest.mark.asyncio
async def test_context_reset_clears_between_requests(mock_db, mock_nats):
    ctx = HookContext(db=mock_db, nats_bus=mock_nats, shroom_id="billing-shroom", session_id="s")
    token = set_run_context(ctx)
    reset_run_context(token)

    # After reset, hooks should be silent
    await on_run_start(agent=MagicMock(), run_input="invoice check")
    mock_nats.publish_event.assert_not_called()


@pytest.mark.asyncio
async def test_on_run_start_tolerates_none_run_input(mock_db, mock_nats):
    ctx = HookContext(db=mock_db, nats_bus=mock_nats, shroom_id="root-shroom")
    token = set_run_context(ctx)
    try:
        with patch("core.event_service.ShroomEventRecord"):
            await on_run_start(agent=MagicMock(), run_input=None)
    finally:
        reset_run_context(token)

    mock_nats.publish_event.assert_called_once()
    event = mock_nats.publish_event.call_args[0][0]
    assert event.event == ShroomEventType.TASK_STARTED


@pytest.mark.asyncio
async def test_on_run_end_tolerates_none_run_output(mock_db, mock_nats):
    ctx = HookContext(db=mock_db, nats_bus=mock_nats, shroom_id="root-shroom")
    token = set_run_context(ctx)
    try:
        with patch("core.event_service.ShroomEventRecord"):
            await on_run_end(agent=MagicMock(), run_output=None)
    finally:
        reset_run_context(token)

    mock_nats.publish_event.assert_called_once()
    event = mock_nats.publish_event.call_args[0][0]
    assert event.event == ShroomEventType.TASK_COMPLETED


@pytest.mark.asyncio
async def test_hook_swallows_emit_errors(mock_db, mock_nats):
    """Hook failures must not propagate to the caller."""
    mock_nats.publish_event.side_effect = RuntimeError("NATS offline")
    ctx = HookContext(db=mock_db, nats_bus=mock_nats, shroom_id="delivery-shroom")
    token = set_run_context(ctx)
    try:
        with patch("core.event_service.ShroomEventRecord"):
            # Should not raise even though NATS publish fails
            await on_run_start(agent=MagicMock(), run_input="check delivery")
    finally:
        reset_run_context(token)
