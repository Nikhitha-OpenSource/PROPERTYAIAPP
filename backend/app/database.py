"""
PROPIQ AI — MongoDB Database Connection (Motor async driver)
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure
import structlog

from app.config import settings

logger = structlog.get_logger(__name__)

# ── Global client (singleton) ─────────────────────────────────────────────────
_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


def get_mongo_client() -> AsyncIOMotorClient:
    """Return the Motor async client (creates it if not yet initialised)."""
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=5000,
            maxPoolSize=50,
            minPoolSize=5,
        )
        logger.info("mongodb_client_created", uri_prefix=settings.MONGODB_URI[:30])
    return _client


def get_database() -> AsyncIOMotorDatabase:
    """Return the default PROPIQ database handle."""
    global _db
    if _db is None:
        _db = get_mongo_client()[settings.MONGODB_DB_NAME]
    return _db


async def connect_db() -> None:
    """Called at app startup — verify the connection is alive."""
    client = get_mongo_client()
    try:
        await client.admin.command("ping")
        logger.info("mongodb_connected", db=settings.MONGODB_DB_NAME)
    except ConnectionFailure as exc:
        logger.error("mongodb_connection_failed", error=str(exc))
        raise


async def close_db() -> None:
    """Called at app shutdown — gracefully close the Motor client."""
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None
        logger.info("mongodb_client_closed")


# ── Collection helpers ────────────────────────────────────────────────────────
def get_collection(name: str):
    """Shortcut: db[collection_name]."""
    return get_database()[name]


# ── Named collections (type-hinted shortcuts) ─────────────────────────────────
def properties_collection():
    return get_collection("properties")

def users_collection():
    return get_collection("users")

def transactions_collection():
    return get_collection("transactions")

def legal_docs_collection():
    return get_collection("legal_docs")

def analytics_collection():
    return get_collection("analytics_events")

def chat_history_collection():
    return get_collection("chat_history")


# ── FastAPI dependency ─────────────────────────────────────────────────────────
async def get_db() -> AsyncIOMotorDatabase:
    """FastAPI dependency — inject the database into route handlers."""
    return get_database()
