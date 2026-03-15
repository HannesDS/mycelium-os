"""Tests for the /knowledge endpoints."""

from __future__ import annotations

import uuid
from io import BytesIO
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import core.models  # noqa: F401 — register models
from core.controller import ShroomController
from core.database import Base
from core.models import KnowledgeDocument


@pytest.fixture()
def db_session_factory():
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
def client(db_session_factory):
    from main import app

    app.state.controller = ShroomController()
    app.state.db_session_factory = db_session_factory
    nats_bus = MagicMock()
    nats_bus.publish_event = AsyncMock()
    app.state.nats_bus = nats_bus
    return TestClient(app, raise_server_exceptions=False, headers={"X-API-Key": "test-key"})


# ── List ─────────────────────────────────────────────────────────────────────


def test_list_knowledge_empty(client):
    resp = client.get("/knowledge")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_knowledge_returns_active_docs(client, db_session_factory):
    db = db_session_factory()
    try:
        doc = KnowledgeDocument(
            title="Test Doc",
            source_type="text",
            content_type="text",
            content_preview="hello world",
            is_active=True,
        )
        db.add(doc)
        db.commit()
    finally:
        db.close()

    resp = client.get("/knowledge")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["title"] == "Test Doc"


def test_list_knowledge_excludes_inactive(client, db_session_factory):
    db = db_session_factory()
    try:
        doc = KnowledgeDocument(
            title="Deleted Doc",
            source_type="text",
            content_type="text",
            content_preview="deleted",
            is_active=False,
        )
        db.add(doc)
        db.commit()
    finally:
        db.close()

    resp = client.get("/knowledge")
    assert resp.status_code == 200
    assert resp.json() == []


# ── Ingest text ───────────────────────────────────────────────────────────────


def test_ingest_text_creates_document(client):
    with patch("routers.knowledge.embed_text", return_value=None):
        resp = client.post(
            "/knowledge",
            data={
                "source_type": "text",
                "title": "My Policy",
                "text_content": "All data must be encrypted at rest.",
            },
        )
    assert resp.status_code == 201
    body = resp.json()
    assert body["title"] == "My Policy"
    assert body["source_type"] == "text"
    assert body["content_type"] == "text"
    assert body["content_preview"] == "All data must be encrypted at rest."


def test_ingest_text_missing_content_returns_422(client):
    resp = client.post("/knowledge", data={"source_type": "text", "title": "Oops"})
    assert resp.status_code == 422


def test_ingest_text_uses_default_title_when_omitted(client):
    with patch("routers.knowledge.embed_text", return_value=None):
        resp = client.post(
            "/knowledge",
            data={"source_type": "text", "text_content": "Some content here."},
        )
    assert resp.status_code == 201
    assert resp.json()["title"] == "Untitled document"


# ── Ingest file ───────────────────────────────────────────────────────────────


def test_ingest_markdown_file(client):
    md_content = b"# Hello\n\nThis is a markdown document."
    with patch("routers.knowledge.embed_text", return_value=None), \
         patch("routers.knowledge.upload_file", return_value="key/doc.md"):
        resp = client.post(
            "/knowledge",
            data={"source_type": "file"},
            files={"file": ("readme.md", BytesIO(md_content), "text/markdown")},
        )
    assert resp.status_code == 201
    body = resp.json()
    assert body["source_type"] == "file"
    assert body["content_type"] == "markdown"
    assert body["original_filename"] == "readme.md"


def test_ingest_pdf_file(client):
    with patch("routers.knowledge.embed_text", return_value=None), \
         patch("routers.knowledge.upload_file", return_value="key/doc.pdf"):
        resp = client.post(
            "/knowledge",
            data={"source_type": "file"},
            files={"file": ("handbook.pdf", BytesIO(b"%PDF-1.4..."), "application/pdf")},
        )
    assert resp.status_code == 201
    body = resp.json()
    assert body["content_type"] == "pdf"
    assert body["original_filename"] == "handbook.pdf"


def test_ingest_file_missing_file_returns_422(client):
    resp = client.post("/knowledge", data={"source_type": "file"})
    assert resp.status_code == 422


# ── Ingest URL ────────────────────────────────────────────────────────────────


def test_ingest_url_missing_url_returns_422(client):
    resp = client.post("/knowledge", data={"source_type": "url"})
    assert resp.status_code == 422


def test_ingest_url_fetches_and_stores(client):
    content = b"Pricing: Enterprise \xe2\x82\xac2,400/month"

    async def _aiter_bytes(chunk_size=8192):
        yield content

    with patch("routers.knowledge.embed_text", return_value=None), \
         patch("httpx.AsyncClient") as mock_client_cls:
        mock_resp = MagicMock()
        mock_resp.is_redirect = False
        mock_resp.raise_for_status = MagicMock()
        mock_resp.aiter_bytes = _aiter_bytes
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=MagicMock(
            get=AsyncMock(return_value=mock_resp)
        ))
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        resp = client.post(
            "/knowledge",
            data={
                "source_type": "url",
                "source_url": "https://example.com/pricing",
                "title": "Pricing page",
            },
        )
    assert resp.status_code == 201
    body = resp.json()
    assert body["source_type"] == "url"
    assert body["source_url"] == "https://example.com/pricing"


def test_ingest_unknown_source_type_returns_422(client):
    resp = client.post("/knowledge", data={"source_type": "spreadsheet"})
    assert resp.status_code == 422


# ── Delete ────────────────────────────────────────────────────────────────────


def test_delete_marks_inactive(client, db_session_factory):
    db = db_session_factory()
    try:
        doc = KnowledgeDocument(
            title="To Delete",
            source_type="text",
            content_type="text",
            content_preview="bye",
            is_active=True,
        )
        db.add(doc)
        db.commit()
        doc_id = str(doc.id)
    finally:
        db.close()

    resp = client.delete(f"/knowledge/{doc_id}")
    assert resp.status_code == 204

    list_resp = client.get("/knowledge")
    assert all(d["id"] != doc_id for d in list_resp.json())


def test_delete_nonexistent_returns_404(client):
    resp = client.delete(f"/knowledge/{uuid.uuid4()}")
    assert resp.status_code == 404


# ── Download ──────────────────────────────────────────────────────────────────


def test_download_text_doc_returns_content(client, db_session_factory):
    db = db_session_factory()
    try:
        doc = KnowledgeDocument(
            title="My Text",
            source_type="text",
            content_type="text",
            content_preview="Some important policy text.",
            is_active=True,
            minio_key=None,
        )
        db.add(doc)
        db.commit()
        doc_id = str(doc.id)
    finally:
        db.close()

    resp = client.get(f"/knowledge/{doc_id}/download")
    assert resp.status_code == 200
    assert b"Some important policy text." in resp.content


def test_download_file_doc_returns_minio_content(client, db_session_factory):
    db = db_session_factory()
    try:
        doc = KnowledgeDocument(
            title="My PDF",
            source_type="file",
            content_type="pdf",
            content_preview="[PDF] handbook.pdf",
            is_active=True,
            minio_key="key/handbook.pdf",
            original_filename="handbook.pdf",
        )
        db.add(doc)
        db.commit()
        doc_id = str(doc.id)
    finally:
        db.close()

    with patch("routers.knowledge.download_file", return_value=(b"%PDF content", "application/pdf")):
        resp = client.get(f"/knowledge/{doc_id}/download")

    assert resp.status_code == 200
    assert resp.content == b"%PDF content"
    assert "handbook.pdf" in resp.headers.get("content-disposition", "")


def test_download_nonexistent_returns_404(client):
    resp = client.get(f"/knowledge/{uuid.uuid4()}/download")
    assert resp.status_code == 404
