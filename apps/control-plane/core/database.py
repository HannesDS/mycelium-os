from __future__ import annotations

import os

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root@localhost:3306/mycelium",
)


class Base(DeclarativeBase):
    pass


_engine: Engine | None = None
_SessionLocal: sessionmaker[Session] | None = None


def init_db(url: str | None = None) -> sessionmaker[Session]:
    global _engine, _SessionLocal
    _engine = create_engine(url or DATABASE_URL)
    _SessionLocal = sessionmaker(bind=_engine)
    return _SessionLocal


def get_engine() -> Engine:
    if _engine is None:
        init_db()
    return _engine  # type: ignore[return-value]


def get_session_factory() -> sessionmaker[Session]:
    if _SessionLocal is None:
        init_db()
    return _SessionLocal  # type: ignore[return-value]
