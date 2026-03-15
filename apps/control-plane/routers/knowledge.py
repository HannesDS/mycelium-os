from __future__ import annotations

import logging
import uuid
from datetime import datetime
from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel, ConfigDict
from sqlalchemy import text
from sqlalchemy.orm import Session

from core.embeddings import embed_text
from core.models import KnowledgeDocument
from core.storage import delete_file, download_file, upload_file

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/knowledge", tags=["knowledge"])


# ── DB dependency ─────────────────────────────────────────────────────────────

def get_db(request: Request) -> Session:
    factory = getattr(request.app.state, "db_session_factory", None)
    if factory is None:
        raise HTTPException(status_code=503, detail="Database not initialized")
    session = factory()
    try:
        yield session
    finally:
        session.close()


# ── Response schema ───────────────────────────────────────────────────────────

class KnowledgeDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    source_type: str
    content_type: str
    source_url: str | None
    original_filename: str | None
    content_preview: str
    access_scope: list[str] | None
    is_active: bool
    ingested_at: datetime


# ── Helpers ───────────────────────────────────────────────────────────────────

def _to_response(doc: KnowledgeDocument) -> KnowledgeDocumentResponse:
    return KnowledgeDocumentResponse(
        id=doc.id,
        title=doc.title,
        source_type=doc.source_type,
        content_type=doc.content_type,
        source_url=doc.source_url,
        original_filename=doc.original_filename,
        content_preview=doc.content_preview,
        access_scope=doc.access_scope,
        is_active=doc.is_active,
        ingested_at=doc.ingested_at,
    )


def _ingest_document(
    db: Session,
    *,
    title: str,
    source_type: str,
    content_type: str,
    text_content: str,
    source_url: str | None = None,
    original_filename: str | None = None,
    file_bytes: bytes | None = None,
    file_mime: str | None = None,
    access_scope: list[str] | None = None,
) -> KnowledgeDocument:
    minio_key: str | None = None
    if file_bytes is not None and original_filename is not None:
        minio_key = upload_file(file_bytes, file_mime or "application/octet-stream", original_filename)

    embedding = embed_text(text_content)
    preview = text_content[:200]

    doc = KnowledgeDocument(
        title=title,
        source_type=source_type,
        content_type=content_type,
        source_url=source_url,
        original_filename=original_filename,
        content_preview=preview,
        minio_key=minio_key,
        access_scope=access_scope,
        embedding=embedding,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    logger.info("Ingested knowledge document %s: %s", doc.id, title)
    return doc


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("", response_model=list[KnowledgeDocumentResponse], summary="List or search knowledge documents")
def list_knowledge(
    q: str | None = Query(default=None, description="Semantic search query"),
    db: Session = Depends(get_db),
) -> list[KnowledgeDocumentResponse]:
    if q:
        embedding = embed_text(q)
        if embedding is not None:
            # Cosine similarity search via pgvector
            rows = db.execute(
                text(
                    "SELECT id FROM knowledge_documents "
                    "WHERE is_active = true AND embedding IS NOT NULL "
                    "ORDER BY embedding <=> CAST(:emb AS vector) "
                    "LIMIT 20"
                ),
                {"emb": str(embedding)},
            ).fetchall()
            ids = [row[0] for row in rows]
            if ids:
                docs = (
                    db.query(KnowledgeDocument)
                    .filter(KnowledgeDocument.id.in_(ids), KnowledgeDocument.is_active == True)  # noqa: E712
                    .all()
                )
                # Preserve ranking order from vector search
                doc_map = {doc.id: doc for doc in docs}
                return [_to_response(doc_map[i]) for i in ids if i in doc_map]
            return []
        # Fallback: plain text search on title/preview when embedding fails
        docs = (
            db.query(KnowledgeDocument)
            .filter(
                KnowledgeDocument.is_active == True,  # noqa: E712
                KnowledgeDocument.title.ilike(f"%{q}%")
                | KnowledgeDocument.content_preview.ilike(f"%{q}%"),
            )
            .order_by(KnowledgeDocument.ingested_at.desc())
            .all()
        )
    else:
        docs = (
            db.query(KnowledgeDocument)
            .filter(KnowledgeDocument.is_active == True)  # noqa: E712
            .order_by(KnowledgeDocument.ingested_at.desc())
            .all()
        )
    return [_to_response(d) for d in docs]


@router.post("", response_model=KnowledgeDocumentResponse, status_code=201, summary="Ingest a new document")
async def ingest_document(
    source_type: Annotated[str, Form(description="text | file | url")],
    title: Annotated[str | None, Form()] = None,
    text_content: Annotated[str | None, Form(description="Paste content (text/markdown source)")] = None,
    source_url: Annotated[str | None, Form(description="URL to fetch and ingest")] = None,
    access_scope: Annotated[str | None, Form(description='JSON array of shroom IDs or "all"')] = None,
    file: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
) -> KnowledgeDocumentResponse:
    import json as _json

    scope: list[str] | None = None
    if access_scope and access_scope != "all":
        try:
            scope = _json.loads(access_scope)
        except _json.JSONDecodeError:
            scope = [access_scope]

    if source_type == "text":
        if not text_content:
            raise HTTPException(status_code=422, detail="text_content required for text source")
        doc = _ingest_document(
            db,
            title=title or "Untitled document",
            source_type="text",
            content_type="text",
            text_content=text_content,
            access_scope=scope,
        )

    elif source_type == "file":
        if file is None:
            raise HTTPException(status_code=422, detail="file required for file source")
        file_bytes = await file.read()
        filename = file.filename or "upload"
        mime = file.content_type or "application/octet-stream"

        # Determine content_type from extension
        lower = filename.lower()
        if lower.endswith(".pdf"):
            content_type = "pdf"
            # For PDF: use filename as preview placeholder; full text extraction is out of scope
            extracted = f"[PDF] {filename}"
        elif lower.endswith(".md"):
            content_type = "markdown"
            extracted = file_bytes.decode("utf-8", errors="replace")
        else:
            content_type = "text"
            extracted = file_bytes.decode("utf-8", errors="replace")

        doc = _ingest_document(
            db,
            title=title or filename,
            source_type="file",
            content_type=content_type,
            text_content=extracted,
            original_filename=filename,
            file_bytes=file_bytes,
            file_mime=mime,
            access_scope=scope,
        )

    elif source_type == "url":
        if not source_url:
            raise HTTPException(status_code=422, detail="source_url required for url source")
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
                resp = await client.get(source_url)
                resp.raise_for_status()
                fetched = resp.text
        except httpx.HTTPError as e:
            raise HTTPException(status_code=422, detail=f"Failed to fetch URL: {e}") from e

        doc = _ingest_document(
            db,
            title=title or source_url,
            source_type="url",
            content_type="url",
            text_content=fetched,
            source_url=source_url,
            access_scope=scope,
        )

    else:
        raise HTTPException(status_code=422, detail=f"Unknown source_type: {source_type}")

    return _to_response(doc)


@router.get("/{doc_id}/download", summary="Download original file or content")
def download_document(doc_id: uuid.UUID, db: Session = Depends(get_db)) -> Response:
    doc = db.query(KnowledgeDocument).filter(
        KnowledgeDocument.id == doc_id,
        KnowledgeDocument.is_active == True,  # noqa: E712
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    if doc.minio_key:
        content, content_type = download_file(doc.minio_key)
        filename = doc.original_filename or "download"
        return Response(
            content=content,
            media_type=content_type,
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )

    # For text/url documents without a stored file, return the preview
    return Response(
        content=(doc.content_preview or "").encode(),
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{doc.title}.txt"'},
    )


@router.delete("/{doc_id}", status_code=204, summary="Soft-delete a document")
def delete_document(doc_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    doc = db.query(KnowledgeDocument).filter(
        KnowledgeDocument.id == doc_id,
        KnowledgeDocument.is_active == True,  # noqa: E712
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    doc.is_active = False
    db.commit()
    logger.info("Soft-deleted knowledge document %s", doc_id)
