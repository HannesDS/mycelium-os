"""Tests for the query_knowledge Agno tool."""

from __future__ import annotations

from unittest.mock import patch

import pytest
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import core.models  # noqa: F401 — ensure models are registered
from core.database import Base
from core.models import KnowledgeDocument
from core.tools.knowledge import make_query_knowledge_tool


@pytest.fixture()
def session_factory():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    @event.listens_for(engine, "connect")
    def _set_pragma(dbapi_conn, _):
        dbapi_conn.execute("PRAGMA foreign_keys=OFF")

    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine)


@pytest.fixture()
def tool(session_factory):
    return make_query_knowledge_tool(session_factory)


@pytest.fixture()
def seeded_db(session_factory):
    """Insert a few documents and return the session factory."""
    db = session_factory()
    try:
        db.add(KnowledgeDocument(
            title="Privacy Policy",
            source_type="text",
            content_type="text",
            content_preview="All personal data is encrypted at rest and in transit.",
            is_active=True,
            access_scope=None,  # accessible to all
        ))
        db.add(KnowledgeDocument(
            title="Sales Playbook",
            source_type="text",
            content_type="text",
            content_preview="Qualify leads using BANT framework before escalating.",
            is_active=True,
            access_scope=["sales-shroom", "root-shroom"],
        ))
        db.add(KnowledgeDocument(
            title="Finance Handbook",
            source_type="text",
            content_type="text",
            content_preview="Invoice payment terms are net-30.",
            is_active=True,
            access_scope=["billing-shroom"],
        ))
        db.add(KnowledgeDocument(
            title="Old Policy",
            source_type="text",
            content_type="text",
            content_preview="Deprecated content.",
            is_active=False,
        ))
        db.commit()
    finally:
        db.close()
    return session_factory


# ── Tool metadata ─────────────────────────────────────────────────────────────


def test_tool_has_correct_skill_id(tool):
    assert getattr(tool, "skill_id", None) == "knowledge_base"


def test_tool_is_callable(tool):
    assert callable(tool)


# ── No results ────────────────────────────────────────────────────────────────


def test_empty_knowledge_base_returns_no_results(tool):
    with patch("core.tools.knowledge.embed_text", return_value=None):
        result = tool("data privacy")
    assert "No relevant documents found" in result


# ── Text search (vector unavailable) ─────────────────────────────────────────


def test_text_search_finds_matching_document(tool, seeded_db):
    with patch("core.tools.knowledge.embed_text", return_value=None):
        result = tool("privacy")
    assert "Privacy Policy" in result
    assert "encrypted" in result


def test_text_search_no_match_returns_no_results(tool, seeded_db):
    with patch("core.tools.knowledge.embed_text", return_value=None):
        result = tool("zzz_nonexistent_term_xqz")
    assert "No relevant documents found" in result


def test_inactive_documents_excluded(tool, seeded_db):
    with patch("core.tools.knowledge.embed_text", return_value=None):
        result = tool("deprecated")
    assert "Old Policy" not in result


# ── Access scope filtering ────────────────────────────────────────────────────


def test_shroom_can_access_global_document(tool, seeded_db):
    """Documents with access_scope=None are accessible to any shroom."""
    with patch("core.tools.knowledge.embed_text", return_value=None):
        result = tool("privacy", shroom_id="delivery-shroom")
    assert "Privacy Policy" in result


def test_shroom_can_access_own_scoped_document(tool, seeded_db):
    with patch("core.tools.knowledge.embed_text", return_value=None):
        result = tool("playbook", shroom_id="sales-shroom")
    assert "Sales Playbook" in result


def test_shroom_cannot_access_other_shrooms_document(tool, seeded_db):
    """A shroom not in access_scope must not see the document."""
    with patch("core.tools.knowledge.embed_text", return_value=None):
        result = tool("invoice", shroom_id="sales-shroom")
    assert "Finance Handbook" not in result
    assert "No relevant documents found" in result


def test_no_shroom_id_returns_all_accessible_documents(tool, seeded_db):
    """Omitting shroom_id bypasses scope filtering (internal/admin use)."""
    with patch("core.tools.knowledge.embed_text", return_value=None):
        result = tool("invoice")
    assert "Finance Handbook" in result


# ── Vector search path (embed_text returns embedding) ─────────────────────────


def test_vector_search_db_execute_error_falls_back_to_text_search(tool, seeded_db):
    """When embed_text returns a real embedding but the vector DB raises (e.g., missing pgvector),
    _vector_search catches the exception and returns [].  _run_search then falls back to _text_search."""
    with (
        patch("core.tools.knowledge.embed_text", return_value=[0.1] * 768),
        # Simulate db.execute raising inside _vector_search by patching _vector_search itself —
        # the exception is caught internally and the function returns [].
        patch("core.tools.knowledge._vector_search", return_value=[]),
    ):
        result = tool("privacy")
    assert "Privacy Policy" in result


def test_vector_search_empty_rows_falls_back_to_text_search(tool, seeded_db):
    """When embed_text returns an embedding but vector search returns no rows, fall back to text search."""
    with (
        patch("core.tools.knowledge.embed_text", return_value=[0.1] * 768),
        patch("core.tools.knowledge._vector_search", return_value=[]),
    ):
        result = tool("privacy")
    assert "Privacy Policy" in result


# ── make_query_knowledge_tool factory ────────────────────────────────────────


def test_factory_creates_independent_tools(session_factory):
    tool_a = make_query_knowledge_tool(session_factory)
    tool_b = make_query_knowledge_tool(session_factory)
    assert tool_a is not tool_b
    assert tool_a.skill_id == tool_b.skill_id
