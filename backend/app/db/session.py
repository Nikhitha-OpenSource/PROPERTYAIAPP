from __future__ import annotations

from contextlib import contextmanager
import importlib.util
import logging
from typing import Iterator
from urllib.parse import parse_qs, unquote, urlparse

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

logger = logging.getLogger(__name__)
_using_fallback_sqlite = False


def _fallback_sqlite_url() -> str:
    return "sqlite:///./propiq.db"


def _normalize_database_url(url: str) -> str | URL:
    if not url.startswith("mssql+pyodbc://"):
        return url

    parsed = urlparse(url)
    query = {key: unquote(values[-1]).replace("+", " ") for key, values in parse_qs(parsed.query).items()}
    return URL.create(
        "mssql+pyodbc",
        username=unquote(parsed.username or ""),
        password=unquote(parsed.password or ""),
        host=parsed.hostname or "",
        port=parsed.port,
        database=parsed.path.lstrip("/"),
        query=query,
    )


def _resolve_database_url() -> str | URL:
    url = settings.DATABASE_URL
    if url.startswith("mssql+pyodbc://") and importlib.util.find_spec("pyodbc") is None:
        print("[WARN] pyodbc not installed; falling back to local SQLite database")
        return _fallback_sqlite_url()
    normalized = _normalize_database_url(url)
    return normalized


def _create_engine():
    # Azure SQL / SQL Server needs pre-ping; older SQL Server ODBC drivers also
    # need setinputsizes disabled to avoid HY104 precision errors during metadata
    # and DDL operations.
    resolved_url = _resolve_database_url()
    engine_kwargs = {
        "pool_pre_ping": True,
        "future": True,
    }
    drivername = resolved_url.drivername if isinstance(resolved_url, URL) else str(resolved_url).split(":", 1)[0]
    if drivername.startswith("mssql"):
        engine_kwargs["use_setinputsizes"] = False
    return create_engine(resolved_url, **engine_kwargs)


engine = _create_engine()
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False, class_=Session)


def _create_sqlite_engine():
    return create_engine(_fallback_sqlite_url(), pool_pre_ping=True, future=True)


def _switch_to_fallback_sqlite(reason: Exception | str) -> None:
    """Use local SQLite when the configured SQL database is unavailable in dev."""
    global engine, SessionLocal, _using_fallback_sqlite
    if _using_fallback_sqlite:
        return
    _using_fallback_sqlite = True
    logger.warning("database_fallback_sqlite", extra={"reason": str(reason)[:300]})
    engine = _create_sqlite_engine()
    SessionLocal.configure(bind=engine)
    init_db()


def _ensure_connection() -> None:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except SQLAlchemyError as exc:
        if settings.APP_ENV.strip().lower() in {"production", "prod", "azure"}:
            raise
        _switch_to_fallback_sqlite(exc)


def _seed_demo_users() -> None:
    if settings.APP_ENV.strip().lower() in {"production", "prod", "azure"}:
        return

    from app.utils.security import hash_password, verify_password
    from app.db.models import User
    from app.demo_sellers import DEMO_SELLERS

    demo_email = "test@propiq.ai"
    demo_users: list[tuple[str, str, str, str, str | None]] = [
        ("Demo Buyer", demo_email, "BUYER", "test123", None),
        ("Demo Seller", demo_email, "SELLER", "test123", None),
        ("Demo Admin", demo_email, "ADMIN", "test123", None),
    ]
    demo_users.extend(
        (seller["name"], seller["email"], "SELLER", seller["password"], seller["user_id"])
        for seller in DEMO_SELLERS
    )

    with SessionLocal() as db:
        changed = False
        for name, email, role, password, user_id in demo_users:
            existing = db.query(User).filter(User.email == email, User.role == role).first()
            if existing:
                if existing.name != name:
                    existing.name = name
                    changed = True
                if not existing.is_active:
                    existing.is_active = True
                    changed = True
                if not verify_password(password, existing.password_hash):
                    existing.password_hash = hash_password(password)
                    changed = True
                continue
            user_kwargs = {
                "name": name,
                "email": email,
                "role": role,
                "password_hash": hash_password(password),
            }
            if user_id:
                user_kwargs["user_id"] = user_id
            db.add(User(**user_kwargs))
            changed = True
        if changed:
            db.commit()


def init_db() -> None:
    from app.db.base import Base
    from app.db import models  # noqa: F401 (import registers models)

    try:
        Base.metadata.create_all(bind=engine)
    except SQLAlchemyError as exc:
        if settings.APP_ENV.strip().lower() in {"production", "prod", "azure"}:
            raise
        _switch_to_fallback_sqlite(exc)
        Base.metadata.create_all(bind=engine)
    _seed_demo_users()


@contextmanager
def db_session() -> Iterator[Session]:
    _ensure_connection()
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_db() -> Iterator[Session]:
    # FastAPI dependency (generator)
    _ensure_connection()
    with db_session() as db:
        yield db
