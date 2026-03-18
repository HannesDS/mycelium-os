from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session

from core.embeddings import embed_text
from core.models import KnowledgeDocument

logger = logging.getLogger(__name__)

_TOP_K = 5


def make_query_knowledge_tool(session_factory: Any) -> Any:
    """Return a query_knowledge callable bound to the given SQLAlchemy session factory."""

    def query_knowledge(query: str, shroom_id: str | None = None) -> str:
        """
        Search the knowledge base for documents relevant to the query.
        Returns up to 5 document titles and content previews.
        Use this to find company policies, procedures, and reference documents.
        """
        db: Session = session_factory()
        try:
            return _run_search(db, query=query, shroom_id=shroom_id)
        finally:
            db.close()

    query_knowledge.skill_id = "knowledge_base"
    return query_knowledge


def _run_search(db: Session, *, query: str, shroom_id: str | None) -> str:
    docs = _vector_search(db, query=query)
    if not docs:
        docs = _text_search(db, query=query)

    # Enforce access-scope filtering in Python (works across DBs)
    if shroom_id is not None:
        docs = [d for d in docs if d.access_scope is None or shroom_id in d.access_scope]

    if not docs:
        return "No relevant documents found in the knowledge base."

    parts = [f"Found {len(docs)} relevant document(s):"]
    for doc in docs:
        parts.append(f"- **{doc.title}**: {doc.content_preview}")
    return "\n".join(parts)


def _vector_search(db: Session, *, query: str) -> list[KnowledgeDocument]:
    embedding = embed_text(query)
    if embedding is None:
        return []
    try:
        rows = db.execute(
            text(
                "SELECT id FROM knowledge_documents "
                "WHERE is_active = true AND embedding IS NOT NULL "
                "ORDER BY embedding <=> CAST(:emb AS vector) "
                f"LIMIT {_TOP_K}"
            ),
            {"emb": str(embedding)},
        ).fetchall()
    except Exception:
        logger.debug("Vector search unavailable, falling back to text search", exc_info=True)
        return []

    ids = [row[0] for row in rows]
    if not ids:
        return []

    docs = (
        db.query(KnowledgeDocument)
        .filter(KnowledgeDocument.id.in_(ids), KnowledgeDocument.is_active.is_(True))
        .all()
    )
    doc_map = {doc.id: doc for doc in docs}
    return [doc_map[i] for i in ids if i in doc_map]


def _text_search(db: Session, *, query: str) -> list[KnowledgeDocument]:
    return (
        db.query(KnowledgeDocument)
        .filter(
            KnowledgeDocument.is_active.is_(True),
            KnowledgeDocument.title.ilike(f"%{query}%")
            | KnowledgeDocument.content_preview.ilike(f"%{query}%"),
        )
        .order_by(KnowledgeDocument.ingested_at.desc())
        .limit(_TOP_K)
        .all()
    )
