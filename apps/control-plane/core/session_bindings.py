from __future__ import annotations

from sqlalchemy.orm import Session

from core.models import SessionBinding


def upsert_binding(db: Session, principal_id: str, shroom_id: str, session_id: str) -> None:
    row = db.query(SessionBinding).filter(
        SessionBinding.principal_id == principal_id,
        SessionBinding.shroom_id == shroom_id,
    ).first()
    if row:
        row.session_id = session_id
    else:
        db.add(SessionBinding(principal_id=principal_id, shroom_id=shroom_id, session_id=session_id))
    db.commit()


def get_binding(db: Session, principal_id: str, shroom_id: str) -> str | None:
    row = db.query(SessionBinding).filter(
        SessionBinding.principal_id == principal_id,
        SessionBinding.shroom_id == shroom_id,
    ).first()
    return row.session_id if row else None


def get_session_bindings_for_principal(db: Session, principal_id: str) -> set[str]:
    rows = db.query(SessionBinding).filter(SessionBinding.principal_id == principal_id).all()
    return {r.session_id for r in rows}
