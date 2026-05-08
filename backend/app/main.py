"""
PROPIQ AI - FastAPI Main Application Entry Point
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import connect_db, close_db
from app.db.session import init_db
from app.routers import properties, predict, deeds, agents, chat, analytics, auth
from app.utils.logging import setup_logging
from app.services.data_service import _load_data

setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Pre-load CSV data into memory at startup
    try:
        _load_data()
    except Exception as e:
        print(f"[WARN] Data preload warning: {e}")

    # Init SQL tables (SQLite/local/SQL Server/Azure SQL depending on DATABASE_URL)
    try:
        init_db()
        print("[OK] SQL tables ready")
    except Exception as e:
        print(f"[WARN] SQL init failed: {e}")

    try:
        await connect_db()
        print("[OK] MongoDB Connected")
    except Exception as e:
        print(f"[WARN] MONGODB OFFLINE: {e}. Running in CSV data mode.")

    yield

    try:
        await close_db()
    except Exception:
        pass


app = FastAPI(
    title="PROPIQ AI",
    description=(
        "Intelligent Real Estate Platform - property listings, ML predictions, "
        "AI agents, land deed verification, and market analytics."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# -- Middleware ----------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# -- Static Files: serve property images from data/images ---------------------
# uvicorn runs from d:\CAPSTONE\backend, so ".." resolves to d:\CAPSTONE
_images_dir = os.path.abspath(os.path.join("..", "data", "images"))
if os.path.isdir(_images_dir):
    app.mount("/images", StaticFiles(directory=_images_dir), name="images")
    print(f"[OK] Static images mounted from: {_images_dir}")
else:
    # Try absolute fallback
    _images_dir_abs = r"d:\CAPSTONE\data\images"
    if os.path.isdir(_images_dir_abs):
        app.mount("/images", StaticFiles(directory=_images_dir_abs), name="images")
        print(f"[OK] Static images mounted from: {_images_dir_abs}")
    else:
        print(f"[WARN] Images dir not found - image serving disabled")

# -- Routers ------------------------------------------------------------------
app.include_router(auth.router,       prefix="/api/v1/auth",       tags=["Auth"])
app.include_router(properties.router, prefix="/api/v1/properties", tags=["Properties"])
app.include_router(predict.router,    prefix="/api/v1/predict",    tags=["ML Predictions"])
app.include_router(deeds.router,      prefix="/api/v1/deeds",      tags=["Deeds & Legal"])
app.include_router(agents.router,     prefix="/api/v1/agents",     tags=["AI Agents"])
app.include_router(chat.router,       prefix="/api/v1/chat",       tags=["Chat"])
app.include_router(analytics.router,  prefix="/api/v1/analytics",  tags=["Analytics"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "PROPIQ AI Backend", "version": "1.0.0"}
