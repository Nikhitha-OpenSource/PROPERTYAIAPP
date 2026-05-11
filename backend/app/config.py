"""
PROPIQ AI — Application Configuration
All settings loaded from environment variables (.env file or Azure Key Vault refs)
"""
from functools import lru_cache
from pathlib import Path
from typing import Annotated, List
from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


_BACKEND_DIR = Path(__file__).resolve().parents[1]
_REPO_ROOT = Path(__file__).resolve().parents[2]
_ENV_FILES = (_REPO_ROOT / ".env", _BACKEND_DIR / ".env")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=_ENV_FILES, env_file_encoding="utf-8", extra="ignore")

    # ── App ───────────────────────────────────────────────────────────────────
    APP_NAME: str = "PROPIQ AI"
    APP_ENV: str = Field(default="development", validation_alias=AliasChoices("APP_ENV", "ENVIRONMENT"))
    DEBUG: bool = True
    CORS_ORIGINS: Annotated[List[str], NoDecode] = ["http://localhost:5173", "http://localhost:3000"]
    SEED_DEMO_USERS: bool = True

    # ── MongoDB ───────────────────────────────────────────────────────────────
    MONGODB_URI: str = "mongodb://localhost:27017"          # override with Atlas URI in .env
    MONGODB_DB_NAME: str = "propiqdb"

    # ── SQL (Azure SQL / SQL Server / Local SQL) ─────────────────────────────
    # Examples:
    # - Local SQLite (dev): sqlite:///./propiq.db
    # - Local SQL Server (Docker): mssql+pyodbc://sa:<pwd>@localhost:1433/propiqdb?driver=ODBC+Driver+18+for+SQL+Server&TrustServerCertificate=yes
    # - Azure SQL: mssql+pyodbc://<user>:<pwd>@<server>.database.windows.net:1433/<db>?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no
    DATABASE_URL: str = f"sqlite:///{(_BACKEND_DIR / 'propiq.db').as_posix()}"
    DATABASE_FALLBACK_SQLITE: bool = True

    # ── CosmosDB ──────────────────────────────────────────────────────────────
    AZURE_COSMOS_URL: str = ""
    AZURE_COSMOS_KEY: str = ""
    COSMOS_DATABASE_NAME: str = "propiqdb"

    # ── Azure OpenAI ──────────────────────────────────────────────────────────
    AZURE_OPENAI_ENDPOINT: str = ""
    AZURE_OPENAI_KEY: str = ""
    AZURE_OPENAI_API_VERSION: str = "2024-02-01"
    AZURE_OPENAI_DEPLOYMENT: str = "gpt-4o"
    AZURE_OPENAI_EMBEDDING_DEPLOYMENT: str = "text-embedding-ada-002"
    USE_LOCAL_LLM: bool = False
    OLLAMA_MODEL: str = "llama3"

    # ── Blob Storage ──────────────────────────────────────────────────────────
    AZURE_STORAGE_CONNECTION_STRING: str = ""
    AZURE_STORAGE_ACCOUNT_NAME: str = "propiqstorage"
    AZURE_BLOB_CONTAINER_IMAGES: str = "property-images"
    AZURE_BLOB_CONTAINER_DEEDS: str = "deed-documents"

    # ── Document Intelligence ─────────────────────────────────────────────────
    AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT: str = ""
    AZURE_DOCUMENT_INTELLIGENCE_KEY: str = ""

    # ── Cognitive Search ──────────────────────────────────────────────────────
    AZURE_SEARCH_ENDPOINT: str = ""
    AZURE_SEARCH_KEY: str = ""
    AZURE_SEARCH_PROPERTIES_INDEX: str = "properties-index"
    AZURE_SEARCH_LEGAL_DOCS_INDEX: str = "legal-docs-index"

    # ── Azure ML ──────────────────────────────────────────────────────────────
    AZURE_ML_SUBSCRIPTION_ID: str = ""
    AZURE_ML_RESOURCE_GROUP: str = "propiq-rg"
    AZURE_ML_WORKSPACE_NAME: str = "propiqml"

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379"

    # ── JWT ───────────────────────────────────────────────────────────────────
    JWT_SECRET: str = Field(
        default="dev-secret-change-in-production",
        validation_alias=AliasChoices("JWT_SECRET", "SECRET_KEY"),
    )
    JWT_ALGORITHM: str = Field(default="HS256", validation_alias=AliasChoices("JWT_ALGORITHM", "ALGORITHM"))
    JWT_EXPIRE_MINUTES: int = Field(
        default=60,
        validation_alias=AliasChoices("JWT_EXPIRE_MINUTES", "ACCESS_TOKEN_EXPIRE_MINUTES"),
    )
    JWT_REFRESH_EXPIRE_DAYS: int = 7
    DEMO_USER_EMAIL: str = "test@propiq.ai"
    DEMO_USER_PASSWORD: str = "test123"
    DEMO_USER_EMAIL_ALIASES: Annotated[List[str], NoDecode] = ["test@testprop.ai"]

    # ── External APIs ─────────────────────────────────────────────────────────
    GOOGLE_PLACES_API_KEY: str = ""
    POWERBI_EMBED_URL: str = ""
    TELANGANA_RERA_API_URL: str = ""
    TELANGANA_RERA_SEARCH_URL: str = "https://rerait.telangana.gov.in/SearchList/Search"
    ELEVENLABS_API_KEY: str = ""
    ELEVENLABS_VOICE_ID: str = "JBFqnCBsd6RMkjVDRZzb"
    ELEVENLABS_MODEL_ID: str = "eleven_multilingual_v2"
    ELEVENLABS_OUTPUT_FORMAT: str = "mp3_44100_128"

    # ── Application Insights ──────────────────────────────────────────────────
    AZURE_APPINSIGHTS_CONNECTION_STRING: str = ""

    # ── ML Model Paths ────────────────────────────────────────────────────────
    ML_MODELS_DIR: str = str(_BACKEND_DIR / "ml" / "models")
    FAISS_INDEX_PATH: str = str(_REPO_ROOT / "data" / "faiss_legal_index")
    LEGAL_DOCS_DIR: str = str(_REPO_ROOT / "data" / "legal_docs")

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def _parse_cors_origins(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return []
            if value.startswith("["):
                return value
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("DEMO_USER_EMAIL_ALIASES", mode="before")
    @classmethod
    def _parse_demo_email_aliases(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return []
            if value.startswith("["):
                return value
            return [item.strip().lower() for item in value.split(",") if item.strip()]
        return value

    @field_validator("DEBUG", mode="before")
    @classmethod
    def _parse_debug(cls, value):
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"1", "true", "yes", "on", "debug"}:
                return True
            if normalized in {"0", "false", "no", "off", ""}:
                return False
            if normalized in {"warn", "warning", "info", "error", "release"}:
                return False
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
