from __future__ import annotations

import uuid

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from core.database import Base
from core.memory.beads import append_bead, format_beads_for_context, get_recent_beads
from core.models import ShroomBead


@pytest.fixture()
def db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _set_sqlite_pragma(dbapi_conn, _):
        dbapi_conn.execute("PRAGMA foreign_keys=OFF")

    Base.metadata.create_all(engine)
    session = sessionmaker(bind=engine)()
    yield session
    session.close()


def test_append_bead_creates_first_bead(db: Session):
    bead = append_bead(db, "sales-shroom", "message_received", "Got a lead")
    assert bead.id is not None
    assert bead.shroom_id == "sales-shroom"
    assert bead.event_type == "message_received"
    assert bead.summary == "Got a lead"
    assert bead.prev_bead_id is None


def test_append_bead_links_to_previous(db: Session):
    b1 = append_bead(db, "sales-shroom", "message_received", "First")
    b2 = append_bead(db, "sales-shroom", "task_completed", "Second")
    assert b2.prev_bead_id == b1.id


def test_append_bead_links_only_same_shroom(db: Session):
    append_bead(db, "sales-shroom", "message_received", "Sales msg")
    b2 = append_bead(db, "root-shroom", "message_received", "CEO msg")
    assert b2.prev_bead_id is None


def test_append_bead_with_payload(db: Session):
    bead = append_bead(
        db, "sales-shroom", "task_completed", "Done",
        payload={"tokens": 42},
    )
    assert bead.payload == {"tokens": 42}


def test_get_recent_beads_returns_ordered(db: Session):
    for i in range(5):
        append_bead(db, "sales-shroom", "message_received", f"msg-{i}")
    beads = get_recent_beads(db, "sales-shroom", n=5)
    assert len(beads) == 5
    assert beads[0].summary == "msg-4"
    assert beads[-1].summary == "msg-0"


def test_get_recent_beads_limits_results(db: Session):
    for i in range(10):
        append_bead(db, "sales-shroom", "message_received", f"msg-{i}")
    beads = get_recent_beads(db, "sales-shroom", n=3)
    assert len(beads) == 3


def test_get_recent_beads_filters_by_shroom(db: Session):
    append_bead(db, "sales-shroom", "message_received", "sales")
    append_bead(db, "root-shroom", "message_received", "root")
    beads = get_recent_beads(db, "sales-shroom", n=10)
    assert len(beads) == 1
    assert beads[0].summary == "sales"


def test_retention_deletes_oldest(db: Session):
    for i in range(5):
        append_bead(db, "sales-shroom", "message_received", f"msg-{i}", max_beads=3)
    beads = get_recent_beads(db, "sales-shroom", n=10)
    assert len(beads) == 3
    summaries = [b.summary for b in beads]
    assert "msg-0" not in summaries
    assert "msg-1" not in summaries
    assert "msg-4" in summaries


def test_retention_prev_bead_links_are_consistent(db: Session):
    created_ids = []
    for i in range(5):
        bead = append_bead(
            db, "sales-shroom", "message_received", f"msg-{i}", max_beads=3,
        )
        created_ids.append(bead.id)

    deleted_ids = set(created_ids[:2])
    beads = get_recent_beads(db, "sales-shroom", n=10)
    assert len(beads) == 3

    remaining_ids = {b.id for b in beads}
    assert not (remaining_ids & deleted_ids)

    for bead in beads:
        if bead.prev_bead_id is not None:
            assert bead.prev_bead_id in remaining_ids

    assert beads[0].prev_bead_id == beads[1].id


def test_retention_per_shroom(db: Session):
    for i in range(4):
        append_bead(db, "sales-shroom", "message_received", f"sales-{i}", max_beads=2)
    for i in range(3):
        append_bead(db, "root-shroom", "message_received", f"root-{i}", max_beads=2)
    assert len(get_recent_beads(db, "sales-shroom", n=10)) == 2
    assert len(get_recent_beads(db, "root-shroom", n=10)) == 2


def test_format_beads_for_context_empty():
    assert format_beads_for_context([]) == ""


def test_format_beads_for_context(db: Session):
    append_bead(db, "sales-shroom", "message_received", "Hello")
    append_bead(db, "sales-shroom", "task_completed", "Replied")
    beads = get_recent_beads(db, "sales-shroom", n=10)
    ctx = format_beads_for_context(beads)
    assert "UNTRUSTED CONTEXT" in ctx
    assert "END UNTRUSTED CONTEXT" in ctx
    assert "[task_completed] Replied" in ctx
    assert "[message_received] Hello" in ctx


def test_sanitize_strips_control_chars(db: Session):
    bead = append_bead(db, "sales-shroom", "message_received", "clean\x00\x07\x1ftext")
    assert bead.summary == "cleantext"


def test_sanitize_truncates_long_summary(db: Session):
    bead = append_bead(db, "sales-shroom", "message_received", "a" * 300)
    assert len(bead.summary) == 200
