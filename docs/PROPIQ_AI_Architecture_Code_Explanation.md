# PROPIQ AI Architecture And Code Explanation

Generated: 2026-05-11 07:10.

Scope: source code, tests, config, workflows, scripts, and major data/model/BI assets. Generated/vendor/build/cache folders are excluded. Environment files are listed only by purpose; secret values are not included.

## Table Of Contents
[TOC]

## 1. Architecture Overview

PROPIQ AI is a Hyderabad/Telangana real-estate intelligence platform. The frontend is a React/Vite SPA. The backend is FastAPI with SQL persistence, Mongo helpers, CSV/JSON fallback data, ML services, deed verification, PropBot agent APIs, chat, analytics, and Power BI export support.

```text
Browser
  -> React/Vite SPA: routes, pages, Zustand state, Axios wrappers, Leaflet/Recharts
  -> FastAPI /api/v1
       Auth -> SQL User -> JWT
       Properties -> SQL listings + CSV/JSON fallback + static /images
       Predict -> MLService -> pickle models or heuristics
       Deeds -> DeedService -> storage, OCR, fuzzy match, legal checklist
       Agents -> AgentService/LangChain -> Azure OpenAI or fallback replies
       Chat -> WebSocket + SQL ChatMessage
       Analytics -> SQL seller ops + MLService + Power BI-shaped tables
  -> Storage/integrations: SQLite/Azure SQL, MongoDB, Redis, Azure OpenAI, Blob Storage, Document Intelligence, Google Places, ElevenLabs, Power BI
```

### Layer Summary

| Layer | Role |
|---|---|
| Frontend pages/components | User workflows and UI for search, map, valuation, deeds, analytics, chat, seller, and admin screens. |
| Frontend utilities/state | Axios wrappers, mock mode, INR formatting, placeholder image selection, persisted auth, compare state. |
| API routers | HTTP/WebSocket contract between UI and backend. |
| Services | Business logic and cloud/local fallback boundaries. |
| Persistence models | SQLAlchemy tables plus Pydantic document/API schemas. |
| ML/data engineering | Synthetic training, CSV imports, image scraping, Databricks ETL. |
| Deployment/BI | Docker, Compose, GitHub Actions, Nginx, Power BI exports. |

### Main Runtime Flows

1. Property browsing: React calls `propertiesApi`; FastAPI merges SQL listings with fallback catalog data; UI renders cards, details, map pins, price history, and compare state.
2. AI valuation: `PredictPage` and detail pages call `/predict`; `MLService` returns model-backed or heuristic results.
3. Deed verification: `DeedPage` uploads files; `DeedService` stores them, runs OCR/local extraction, fuzzy-matches names, attaches legal checklist text, and exposes admin decisions.
4. PropBot: `AgentChat` calls `/agents/chat`; `AgentService` parses intent and returns replies, navigation cards, and UI commands.
5. Buyer/seller chat: `ChatPage` opens a tokenized WebSocket; backend persists and broadcasts messages.
6. Admin/BI: `AdminPage` loads seller operations, deed summaries, verification rows, and Power BI-shaped tables.

## 2. Route Maps

### Backend API

| Endpoint | File | Purpose |
|---|---|---|
| `/health` | `backend/app/main.py` | Backend health/liveness. |
| `/api/v1/auth/*` | `backend/app/routers/auth.py` | Register, login, refresh. |
| `/api/v1/properties/*` | `backend/app/routers/properties.py` | Listings, map, detail, nearby, price history, moderation. |
| `/api/v1/predict/*` | `backend/app/routers/predict.py` | ML valuation and insight APIs. |
| `/api/v1/deeds/*` | `backend/app/routers/deeds.py` | Document verification, legal utilities, admin review. |
| `/api/v1/agents/*` | `backend/app/routers/agents.py` | PropBot chat, voice, search, document Q&A. |
| `/api/v1/chat/*` | `backend/app/routers/chat.py` | Buyer/seller REST and WebSocket chat. |
| `/api/v1/analytics/*` | `backend/app/routers/analytics.py` | Market/admin analytics and Power BI-shaped data. |

### Frontend

| Route | Component | Purpose |
|---|---|---|
| `/` | `LandingPage` | Home/search/featured listings. |
| `/properties` | `PropertiesPage` | Filterable listing browser. |
| `/properties/map` | `MapPage` | Leaflet map over GeoJSON. |
| `/properties/:id` | `PropertyDetailPage` | Details, valuation, nearby, EMI, chat CTA. |
| `/properties/:id/chat` | `ChatPage` | Buyer/seller chat. |
| `/list-property` | `AddPropertyPage` | Protected listing wizard. |
| `/predict/commercial` | `PredictPage` | Price/commercial/appreciation tools. |
| `/deeds` | `DeedPage` | Legal workflow tools. |
| `/analytics` | `AnalyticsPage` | Market dashboard. |
| `/compare` | `ComparePage` | Compare shortlisted properties. |
| `/login` | `LoginPage` | Auth flow. |
| `/seller` | `SellerPage` | Seller dashboard. |
| `/admin` | `AdminPage` | Admin command center. |

## 3. File Catalog

This report covers 106 text/source/config files and 452 extracted classes, functions, methods, and YAML sections.

### AI Agent Layer

| File | Lines | Purpose |
|---|---:|---|
| `backend/app/agents/__init__.py` | 0 | Package marker so Python can import this directory as a module. |
| `backend/app/agents/propiq_agents.py` | 358 | LangChain tool-calling agent with tools for property search, valuation, legal Q&A, commercial scoring, and appreciation forecasting. |

### API Schemas

| File | Lines | Purpose |
|---|---:|---|
| `backend/app/schemas/__init__.py` | 0 | Package marker so Python can import this directory as a module. |
| `backend/app/schemas/property.py` | 100 | Source/configuration file used by this layer. |

### Automated Tests

| File | Lines | Purpose |
|---|---:|---|
| `backend/tests/__init__.py` | 0 | Package marker so Python can import this directory as a module. |
| `backend/tests/conftest.py` | 12 | Source/configuration file used by this layer. |
| `backend/tests/test_api.py` | 189 | Main async pytest suite covering backend health, auth, listings, ML, deeds, RERA, analytics, GeoJSON, and agent behavior. |

### BI Exports

| File | Lines | Purpose |
|---|---:|---|
| `powerbi-export/propiq-powerbi-dataset.json` | 259 | JSON configuration or structured data file. |

### Backend API Routers

| File | Lines | Purpose |
|---|---:|---|
| `backend/app/routers/__init__.py` | 0 | Package marker so Python can import this directory as a module. |
| `backend/app/routers/agents.py` | 150 | PropBot API for chat, voice, session history, GUI commands, natural-language search, and legal document Q&A. |
| `backend/app/routers/analytics.py` | 478 | Market and admin analytics API, including Power BI-ready seller operations datasets. |
| `backend/app/routers/auth.py` | 112 | Source/configuration file used by this layer. |
| `backend/app/routers/chat.py` | 359 | Buyer/seller WebSocket chat API with JWT validation, persisted messages, active threads, history, and safety alerts. |
| `backend/app/routers/deeds.py` | 325 | Deed/legal workflow API for uploads, OCR verification, admin review, local file serving, stamp duty, timeline, and RERA checks. |
| `backend/app/routers/predict.py` | 111 | ML prediction API for price, appreciation, commercial score, anomaly detection, and locality insights. |
| `backend/app/routers/properties.py` | 286 | Property API that merges SQL listings with CSV/JSON fallback listings and exposes detail, map, nearby, history, verify, and delete behavior. |

### Backend App Core

| File | Lines | Purpose |
|---|---:|---|
| `backend/app/__init__.py` | 0 | Package marker so Python can import this directory as a module. |
| `backend/app/config.py` | 137 | Typed pydantic-settings configuration for app, DBs, Azure services, JWT, external APIs, and ML paths. |
| `backend/app/database.py` | 90 | Async MongoDB/Motor singleton client, database handle, collection helpers, startup ping, and shutdown cleanup. |
| `backend/app/demo_sellers.py` | 87 | Source/configuration file used by this layer. |
| `backend/app/main.py` | 101 | FastAPI entry point: startup/shutdown lifespan, middleware, static image serving, router registration, and health endpoint. |

### Backend Data Scripts

| File | Lines | Purpose |
|---|---:|---|
| `backend/scripts/__init__.py` | 0 | Package marker so Python can import this directory as a module. |
| `backend/scripts/generate_synthetic_data.py` | 135 | Generates realistic Hyderabad property data and optionally inserts it into SQL. |
| `backend/scripts/import_all_data.py` | 69 | Master data import wizard for property and price-history datasets. |
| `backend/scripts/import_price_history.py` | 106 | Imports NHB RESIDEX-style price-history Excel/CSV files into MongoDB. |
| `backend/scripts/import_properties_csv.py` | 130 | Imports supported real-estate CSV schemas into MongoDB. |
| `backend/scripts/scrape_images.py` | 200 | Scrapes property images, validates/resizes them, writes thumbnails, and exports image metadata. |
| `backend/scripts/seed_mock_to_mongo.py` | 454 | Seeds MongoDB with curated sample properties aligned to frontend demo data. |

### Backend Services

| File | Lines | Purpose |
|---|---:|---|
| `backend/app/services/__init__.py` | 0 | Package marker so Python can import this directory as a module. |
| `backend/app/services/agent_service.py` | 387 | Lightweight PropBot service for intent parsing, curated replies, GUI commands, OpenAI calls, sessions, search, and RAG delegation. |
| `backend/app/services/data_service.py` | 633 | CSV/JSON-backed Hyderabad property catalog, normalization, deterministic coordinates/images/sellers, filtering, GeoJSON, and analytics. |
| `backend/app/services/deed_service.py` | 357 | Deed file storage, OCR/local extraction, fuzzy name matching, legal checklist/RAG, and verification serialization. |
| `backend/app/services/geocoding_service.py` | 66 | Nearby POI lookup with Google Places integration and local mock fallback. |
| `backend/app/services/ml_service.py` | 172 | ML inference facade with optional pickle artifacts and heuristic fallbacks for local demos. |
| `backend/app/services/rag_service.py` | 97 | Legal RAG service using FAISS/Azure OpenAI when configured and deterministic legal fallbacks otherwise. |

### Backend Support

| File | Lines | Purpose |
|---|---:|---|
| `backend/.env` | secret | Local environment-variable file; values are intentionally redacted. |
| `backend/data/sample_properties.json` | 35627 | JSON configuration or structured data file. |
| `backend/ml/__init__.py` | 0 | Package marker so Python can import this directory as a module. |
| `backend/test_azure_sql.py` | 60 | Source/configuration file used by this layer. |
| `backend/test_integration.py` | 51 | Source/configuration file used by this layer. |

### Backend Utilities

| File | Lines | Purpose |
|---|---:|---|
| `backend/app/utils/__init__.py` | 0 | Package marker so Python can import this directory as a module. |
| `backend/app/utils/logging.py` | 34 | structlog setup with optional Azure Application Insights exporter. |
| `backend/app/utils/security.py` | 96 | Password hashing, JWT generation/decoding, current-user dependency, mock-token fallback, and role guards. |

### CI/CD

| File | Lines | Purpose |
|---|---:|---|
| `.github/workflows/deploy.yml` | 71 | GitHub Actions workflow that tests the backend and builds/pushes the unified Docker image to Azure Container Registry. |

### Data Assets

| File | Lines | Purpose |
|---|---:|---|
| `data/README.md` | 58 | Repository documentation or ignore/configuration file. |
| `data/images/images_manifest.json` | 602 | JSON configuration or structured data file. |

### Data Engineering

| File | Lines | Purpose |
|---|---:|---|
| `data-engineering/databricks-notebooks/01_etl_pipeline.py` | 101 | PySpark/Databricks ETL: raw property JSON to cleaned features and locality price index Delta tables. |
| `data-engineering/scrape_hyderabad.py` | 262 | Hyderabad dataset generator and optional live image scraper from 99acres. |
| `data-engineering/utils/html_helpers.py` | 44 | Robots.txt, polite fetch, BeautifulSoup, and text helper utilities for scraping. |

### Frontend App Shell

| File | Lines | Purpose |
|---|---:|---|
| `frontend/src/App.tsx` | 62 | React route shell with protected routes, navbar, page wiring, and global PropBot widget. |
| `frontend/src/index.css` | 453 | Global design system: color tokens, layout helpers, cards, buttons, badges, forms, navbar, hero, maps, chat widget, tables, skeletons, and responsive rules. |
| `frontend/src/main.tsx` | 11 | React entrypoint that mounts the App and imports global styles. |
| `frontend/src/theme.ts` | 23 | Source/configuration file used by this layer. |
| `frontend/src/vite-env.d.ts` | 2 | Source/configuration file used by this layer. |

### Frontend Components

| File | Lines | Purpose |
|---|---:|---|
| `frontend/src/components/Agent/AgentChat.tsx` | 268 | Floating PropBot widget with quick prompts, session chat, voice playback, navigation cards, and GUI command dispatch. |
| `frontend/src/components/Property/PropertyCard.tsx` | 105 | Reusable property listing card with image fallback, price/details badges, navigation, and compare action. |
| `frontend/src/components/UI/Navbar.tsx` | 84 | Role-aware top navigation and auth actions. |

### Frontend Pages

| File | Lines | Purpose |
|---|---:|---|
| `frontend/src/pages/AddPropertyPage.tsx` | 390 | Seller/admin multi-step property listing wizard with deed approval gate and final listing submit. |
| `frontend/src/pages/AdminPage.tsx` | 845 | Admin command center for seller analytics, Power BI exports, listing moderation, and buyer deed verification decisions. |
| `frontend/src/pages/AnalyticsPage.tsx` | 180 | Market analytics dashboard with KPI cards, trends, locality scores, commercial zones, and heatmap chips. |
| `frontend/src/pages/ChatPage.tsx` | 223 | Property chat page using REST history and authenticated WebSocket messages. |
| `frontend/src/pages/ComparePage.tsx` | 122 | Side-by-side compare page for up to three stored property cards. |
| `frontend/src/pages/DeedPage.tsx` | 337 | Legal workflow page for upload, status/timeline, stamp-duty calculation, and RERA check. |
| `frontend/src/pages/LandingPage.tsx` | 229 | Home page with hero search, stats, feature cards, featured listings, top localities, and PropBot CTA. |
| `frontend/src/pages/LoginPage.tsx` | 95 | Login/register form with role selection, auth persistence, and role-based redirects. |
| `frontend/src/pages/MapPage.tsx` | 144 | Leaflet map page over backend GeoJSON with price pins and filters. |
| `frontend/src/pages/PredictPage.tsx` | 280 | Tabbed AI prediction page for price, commercial score, and appreciation forecast. |
| `frontend/src/pages/PropertiesPage.tsx` | 192 | Filterable property listing page with grid/list mode and PropBot filter listener. |
| `frontend/src/pages/PropertyDetailPage.tsx` | 263 | Property detail page with gallery, valuation, EMI estimate, nearby places, price chart, and seller chat. |
| `frontend/src/pages/SellerPage.tsx` | 284 | Seller dashboard for owned listings, inquiries, mock views/leads, trends, and listing actions. |

### Frontend State

| File | Lines | Purpose |
|---|---:|---|
| `frontend/src/store/useStore.ts` | 93 | Zustand stores for property list/compare state and persisted auth state. |

### Frontend Support

| File | Lines | Purpose |
|---|---:|---|
| `frontend/.env.local` | secret | Local environment-variable file; values are intentionally redacted. |
| `frontend/index.html` | 20 | HTML shell or static HTML file. |
| `frontend/nginx.conf` | 30 | Source/configuration file used by this layer. |
| `frontend/package-lock.json` | 3827 | Generated npm dependency lockfile. |
| `frontend/package.json` | 35 | npm package manifest with frontend scripts and dependencies. |
| `frontend/tsconfig.json` | 24 | TypeScript compiler configuration. |
| `frontend/tsconfig.node.json` | 2 | TypeScript compiler configuration. |
| `frontend/vite.config.ts` | 23 | Source/configuration file used by this layer. |

### Frontend Utilities

| File | Lines | Purpose |
|---|---:|---|
| `frontend/src/utils/api.ts` | 496 | Axios client plus real/mock API wrappers for properties, chat, prediction, agents, analytics, deeds, auth, formatting, and images. |
| `frontend/src/utils/mockData.ts` | 252 | Mock data generators used when VITE_USE_MOCK is enabled. |

### ML Training

| File | Lines | Purpose |
|---|---:|---|
| `backend/ml/training/__init__.py` | 0 | Package marker so Python can import this directory as a module. |
| `backend/ml/training/train_all.py` | 209 | Synthetic ML training pipeline for price prediction, commercial scoring, anomaly detection, and appreciation history artifacts. |

### Mongo/Pydantic Models

| File | Lines | Purpose |
|---|---:|---|
| `backend/app/models/__init__.py` | 0 | Package marker so Python can import this directory as a module. |
| `backend/app/models/deed.py` | 27 | Source/configuration file used by this layer. |
| `backend/app/models/property.py` | 65 | Source/configuration file used by this layer. |
| `backend/app/models/user.py` | 31 | Source/configuration file used by this layer. |

### Repository Config

| File | Lines | Purpose |
|---|---:|---|
| `.env` | secret | Local environment-variable file; values are intentionally redacted. |
| `.mcp.json` | 9 | JSON configuration or structured data file. |
| `.vscode/settings.json` | 11 | JSON configuration or structured data file. |

### Repository Root

| File | Lines | Purpose |
|---|---:|---|
| `DATA_SOURCES.md` | 309 | Repository documentation or ignore/configuration file. |
| `Dockerfile` | 50 | Multi-stage build: compiles the React frontend, installs the Python backend, serves static files with Nginx, and proxies API traffic to FastAPI. |
| `PROJECT_DOCUMENTATION.md` | 136 | Repository documentation or ignore/configuration file. |
| `README.md` | 90 | Repository documentation or ignore/configuration file. |
| `SELLER_ACCOUNTS_AND_PROPERTIES.md` | 1030 | Repository documentation or ignore/configuration file. |
| `docker-compose.yml` | 64 | Local app, MongoDB, and Redis orchestration with environment wiring for Azure, ML, auth, and external APIs. |
| `docs/generate_architecture_report.py` | 637 | Source/configuration file used by this layer. |
| `test_api.py` | 27 | Source/configuration file used by this layer. |

### SQL Persistence

| File | Lines | Purpose |
|---|---:|---|
| `backend/app/db/__init__.py` | 4 | Package marker so Python can import this directory as a module. |
| `backend/app/db/base.py` | 7 | Source/configuration file used by this layer. |
| `backend/app/db/models.py` | 135 | SQLAlchemy ORM entities for users, properties, leads, chat messages, events, reviews, and deed verifications. |
| `backend/app/db/session.py` | 177 | SQLAlchemy engine/session setup, Azure SQL URL normalization, SQLite fallback, table creation, and demo user seeding. |

### Sample Legal Data Tools

| File | Lines | Purpose |
|---|---:|---|
| `backend/data/sample_deeds/README.md` | 58 | Repository documentation or ignore/configuration file. |
| `backend/data/sample_deeds/bulk_upload_deeds.json` | 129 | JSON configuration or structured data file. |
| `backend/data/sample_deeds/create_bulk_upload_files.py` | 185 | Source/configuration file used by this layer. |
| `backend/data/sample_deeds/upload_sample_deeds.py` | 208 | Source/configuration file used by this layer. |

## 4. File-By-File And Function Reference

Each entry includes file purpose and every extracted top-level function/class plus class methods where present.

### `.env`

- Layer: Repository Config
- Lines: not read; secret values redacted
- Purpose: Local environment-variable file; values are intentionally redacted.
- Functions/classes: environment values only; intentionally not included.

### `.github/workflows/deploy.yml`

- Layer: CI/CD
- Lines: 71
- Purpose: GitHub Actions workflow that tests the backend and builds/pushes the unified Docker image to Azure Container Registry.

| Line | Symbol | What It Does |
|---:|---|---|
| 1 | `yaml section name` | Function/helper implementing name behavior in this file. |
| 3 | `yaml section on` | Function/helper implementing on behavior in this file. |
| 10 | `yaml section env` | Function/helper implementing env behavior in this file. |
| 16 | `yaml section jobs` | Function/helper implementing jobs behavior in this file. |

### `.mcp.json`

- Layer: Repository Config
- Lines: 9
- Purpose: JSON configuration or structured data file.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `.vscode/settings.json`

- Layer: Repository Config
- Lines: 11
- Purpose: JSON configuration or structured data file.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `DATA_SOURCES.md`

- Layer: Repository Root
- Lines: 309
- Purpose: Repository documentation or ignore/configuration file.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `Dockerfile`

- Layer: Repository Root
- Lines: 50
- Purpose: Multi-stage build: compiles the React frontend, installs the Python backend, serves static files with Nginx, and proxies API traffic to FastAPI.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `PROJECT_DOCUMENTATION.md`

- Layer: Repository Root
- Lines: 136
- Purpose: Repository documentation or ignore/configuration file.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `README.md`

- Layer: Repository Root
- Lines: 90
- Purpose: Repository documentation or ignore/configuration file.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `SELLER_ACCOUNTS_AND_PROPERTIES.md`

- Layer: Repository Root
- Lines: 1030
- Purpose: Repository documentation or ignore/configuration file.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `backend/.env`

- Layer: Backend Support
- Lines: not read; secret values redacted
- Purpose: Local environment-variable file; values are intentionally redacted.
- Functions/classes: environment values only; intentionally not included.

### `backend/app/__init__.py`

- Layer: Backend App Core
- Lines: 0
- Purpose: Package marker so Python can import this directory as a module.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `backend/app/agents/__init__.py`

- Layer: AI Agent Layer
- Lines: 0
- Purpose: Package marker so Python can import this directory as a module.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `backend/app/agents/propiq_agents.py`

- Layer: AI Agent Layer
- Lines: 358
- Purpose: LangChain tool-calling agent with tools for property search, valuation, legal Q&A, commercial scoring, and appreciation forecasting.

| Line | Symbol | What It Does |
|---:|---|---|
| 17 | `function _get_llm` | Private helper for get llm inside this module. |
| 57 | `function search_properties` | Search for properties using natural language.  |
| 104 | `function get_price_prediction` | Predict property price using the ML model.  |
| 154 | `function query_legal_docs` | Answer questions about land deeds, RERA, stamp duty, legal timelines using the RAG pipeline over legal documents.  |
| 187 | `function get_commercial_score` | Score the commercial viability of a land parcel using the ML model.  |
| 238 | `function get_appreciation_forecast` | Forecast property price appreciation over 1, 3, and 5 years.  |
| 301 | `function create_propiq_agent` | Builds the LangChain AgentExecutor with PROPIQ tools and prompt. |
| 318 | `function agent_chat` | Chat with the PropBot agent, maintaining session history.  |

### `backend/app/config.py`

- Layer: Backend App Core
- Lines: 137
- Purpose: Typed pydantic-settings configuration for app, DBs, Azure services, JWT, external APIs, and ML paths.

| Line | Symbol | What It Does |
|---:|---|---|
| 17 | `class Settings` | Class grouping data and behavior for settings. |
| 107 | `method Settings._parse_cors_origins` | Method on `Settings` that handles parse cors origins behavior. |
| 119 | `method Settings._parse_debug` | Method on `Settings` that handles parse debug behavior. |
| 132 | `function get_settings` | Retrieves or derives get settings for this module. |

### `backend/app/database.py`

- Layer: Backend App Core
- Lines: 90
- Purpose: Async MongoDB/Motor singleton client, database handle, collection helpers, startup ping, and shutdown cleanup.

| Line | Symbol | What It Does |
|---:|---|---|
| 17 | `function get_mongo_client` | Return the Motor async client (creates it if not yet initialised). |
| 31 | `function get_database` | Return the default PROPIQ database handle. |
| 39 | `async function connect_db` | Called at app startup — verify the connection is alive. |
| 50 | `async function close_db` | Called at app shutdown — gracefully close the Motor client. |
| 61 | `function get_collection` | Shortcut: db[collection_name]. |
| 67 | `function properties_collection` | Function/helper implementing properties collection behavior in this file. |
| 70 | `function users_collection` | Function/helper implementing users collection behavior in this file. |
| 73 | `function transactions_collection` | Function/helper implementing transactions collection behavior in this file. |
| 76 | `function legal_docs_collection` | Function/helper implementing legal docs collection behavior in this file. |
| 79 | `function analytics_collection` | Function/helper implementing analytics collection behavior in this file. |
| 82 | `function chat_history_collection` | Function/helper implementing chat history collection behavior in this file. |
| 87 | `async function get_db` | FastAPI dependency — inject the database into route handlers. |

### `backend/app/db/__init__.py`

- Layer: SQL Persistence
- Lines: 4
- Purpose: Package marker so Python can import this directory as a module.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `backend/app/db/base.py`

- Layer: SQL Persistence
- Lines: 7
- Purpose: Source/configuration file used by this layer.

| Line | Symbol | What It Does |
|---:|---|---|
| 4 | `class Base` | SQLAlchemy ORM model for the base entity/table. |

### `backend/app/db/models.py`

- Layer: SQL Persistence
- Lines: 135
- Purpose: SQLAlchemy ORM entities for users, properties, leads, chat messages, events, reviews, and deed verifications.

| Line | Symbol | What It Does |
|---:|---|---|
| 14 | `function _uuid` | Private helper for uuid inside this module. |
| 18 | `class User` | SQLAlchemy ORM model for the user entity/table. |
| 31 | `class Property` | SQLAlchemy ORM model for the property entity/table. |
| 59 | `class Lead` | SQLAlchemy ORM model for the lead entity/table. |
| 70 | `class ChatMessage` | SQLAlchemy ORM model for the chat message entity/table. |
| 82 | `class Event` | SQLAlchemy ORM model for the event entity/table. |
| 94 | `class Review` | SQLAlchemy ORM model for the review entity/table. |
| 111 | `class DeedVerification` | SQLAlchemy ORM model for the deed verification entity/table. |

### `backend/app/db/session.py`

- Layer: SQL Persistence
- Lines: 177
- Purpose: SQLAlchemy engine/session setup, Azure SQL URL normalization, SQLite fallback, table creation, and demo user seeding.

| Line | Symbol | What It Does |
|---:|---|---|
| 21 | `function _fallback_sqlite_url` | Private helper for fallback sqlite url inside this module. |
| 25 | `function _normalize_database_url` | Private helper for normalize database url inside this module. |
| 42 | `function _resolve_database_url` | Private helper for resolve database url inside this module. |
| 51 | `function _create_engine` | Private helper for create engine inside this module. |
| 70 | `function _create_sqlite_engine` | Private helper for create sqlite engine inside this module. |
| 74 | `function _switch_to_fallback_sqlite` | Use local SQLite when the configured SQL database is unavailable in dev. |
| 86 | `function _ensure_connection` | Private helper for ensure connection inside this module. |
| 96 | `function _seed_demo_users` | Private helper for seed demo users inside this module. |
| 144 | `function init_db` | Function/helper implementing init db behavior in this file. |
| 159 | `function db_session` | Function/helper implementing db session behavior in this file. |
| 172 | `function get_db` | Retrieves or derives get db for this module. |

### `backend/app/demo_sellers.py`

- Layer: Backend App Core
- Lines: 87
- Purpose: Source/configuration file used by this layer.

| Line | Symbol | What It Does |
|---:|---|---|
| 11 | `class DemoSeller` | Class grouping data and behavior for demo seller. |
| 82 | `function seller_for_property_position` | Return the seller for a 1-based property position. |

### `backend/app/main.py`

- Layer: Backend App Core
- Lines: 101
- Purpose: FastAPI entry point: startup/shutdown lifespan, middleware, static image serving, router registration, and health endpoint.

| Line | Symbol | What It Does |
|---:|---|---|
| 22 | `async function lifespan` | Runs startup/shutdown work: preloads property data, initializes SQL tables/demo users, connects to MongoDB if available, and closes Mongo on shutdown. |
| 99 | `async function health_check` | Returns a small health payload for uptime checks and tests. |

### `backend/app/models/__init__.py`

- Layer: Mongo/Pydantic Models
- Lines: 0
- Purpose: Package marker so Python can import this directory as a module.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `backend/app/models/deed.py`

- Layer: Mongo/Pydantic Models
- Lines: 27
- Purpose: Source/configuration file used by this layer.

| Line | Symbol | What It Does |
|---:|---|---|
| 7 | `function generate_uuid` | Function/helper implementing generate uuid behavior in this file. |
| 10 | `class DeedVerificationModel` | Pydantic model/schema for deed verification model data. |

### `backend/app/models/property.py`

- Layer: Mongo/Pydantic Models
- Lines: 65
- Purpose: Source/configuration file used by this layer.

| Line | Symbol | What It Does |
|---:|---|---|
| 7 | `function generate_uuid` | Function/helper implementing generate uuid behavior in this file. |
| 10 | `class PropertyModel` | Pydantic model/schema for property model data. |
| 43 | `class LandParcelModel` | Pydantic model/schema for land parcel model data. |

### `backend/app/models/user.py`

- Layer: Mongo/Pydantic Models
- Lines: 31
- Purpose: Source/configuration file used by this layer.

| Line | Symbol | What It Does |
|---:|---|---|
| 7 | `function generate_uuid` | Function/helper implementing generate uuid behavior in this file. |
| 10 | `class UserModel` | Pydantic model/schema for user model data. |
| 23 | `class UserAlertModel` | Pydantic model/schema for user alert model data. |

### `backend/app/routers/__init__.py`

- Layer: Backend API Routers
- Lines: 0
- Purpose: Package marker so Python can import this directory as a module.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `backend/app/routers/agents.py`

- Layer: Backend API Routers
- Lines: 150
- Purpose: PropBot API for chat, voice, session history, GUI commands, natural-language search, and legal document Q&A.

| Line | Symbol | What It Does |
|---:|---|---|
| 15 | `class ChatRequest` | Pydantic request/response schema used by this router for chat request payloads. |
| 21 | `class ChatResponse` | Pydantic request/response schema used by this router for chat response payloads. |
| 29 | `class GUICommandRequest` | Pydantic request/response schema used by this router for guicommand request payloads. |
| 36 | `class SearchRequest` | Pydantic request/response schema used by this router for search request payloads. |
| 41 | `class DocQueryRequest` | Pydantic request/response schema used by this router for doc query request payloads. |
| 46 | `class VoiceRequest` | Pydantic request/response schema used by this router for voice request payloads. |
| 52 | `function _tts_text` | Private helper for tts text inside this module. |
| 58 | `async function agent_chat` | Send a message to the Universal GUI Agent (PropBot). |
| 73 | `async function agent_voice` | Generate PropBot speech with ElevenLabs while keeping the API key server-side. |
| 119 | `async function get_session` | Retrieve conversation history for an agent session. |
| 128 | `async function issue_gui_command` | Agent issues a GUI command to the frontend (navigate, filter, compare). |
| 137 | `async function agent_search` | Agent-driven natural language property search. |
| 146 | `async function doc_query` | RAG query on legal documents (deeds, RERA, zoning laws). |

### `backend/app/routers/analytics.py`

- Layer: Backend API Routers
- Lines: 478
- Purpose: Market and admin analytics API, including Power BI-ready seller operations datasets.

| Line | Symbol | What It Does |
|---:|---|---|
| 27 | `async function market_trends` | Price trends by locality over the specified number of months. |
| 37 | `async function price_heatmap` | GeoJSON heatmap for price intensity across Hyderabad. |
| 62 | `async function top_localities` | Top performing localities ranked by metric. |
| 77 | `async function commercial_zones` | Commercial zone intelligence for Hyderabad. |
| 91 | `function _month_keys` | Private helper for month keys inside this module. |
| 104 | `function _demo_seller_ops` | Private helper for demo seller ops inside this module. |
| 254 | `function _powerbi_embed_url` | Private helper for powerbi embed url inside this module. |
| 263 | `async function admin_seller_ops` | Operational admin analytics for sellers, sold deals, leads, and reviews. |
| 446 | `async function admin_powerbi_dataset` | Power BI-ready flat datasets for admin seller operations. |

### `backend/app/routers/auth.py`

- Layer: Backend API Routers
- Lines: 112
- Purpose: Source/configuration file used by this layer.

| Line | Symbol | What It Does |
|---:|---|---|
| 18 | `class RegisterRequest` | Pydantic request/response schema used by this router for register request payloads. |
| 26 | `class TokenResponse` | Pydantic request/response schema used by this router for token response payloads. |
| 35 | `class RefreshRequest` | Pydantic request/response schema used by this router for refresh request payloads. |
| 40 | `async function register` | Register a new user account. |
| 74 | `async function login` | Login with email + password, returns JWT tokens. |
| 102 | `async function refresh_token` | Refresh access token using refresh token (mock). |

### `backend/app/routers/chat.py`

- Layer: Backend API Routers
- Lines: 359
- Purpose: Buyer/seller WebSocket chat API with JWT validation, persisted messages, active threads, history, and safety alerts.

| Line | Symbol | What It Does |
|---:|---|---|
| 18 | `class ConnectionManager` | Manages WebSocket connections per channel. |
| 21 | `method ConnectionManager.__init__` | Method on `ConnectionManager` that handles init behavior. |
| 24 | `async method ConnectionManager.connect` | Method on `ConnectionManager` that handles connect behavior. |
| 28 | `method ConnectionManager.disconnect` | Method on `ConnectionManager` that handles disconnect behavior. |
| 32 | `async method ConnectionManager.broadcast` | Method on `ConnectionManager` that handles broadcast behavior. |
| 44 | `function _channel_property_id` | Private helper for channel property id inside this module. |
| 51 | `function _property_summary` | Private helper for property summary inside this module. |
| 71 | `function _visible_seller_properties` | Return properties whose chats this seller/admin may see. |
| 92 | `function _get_token_from_websocket` | Private helper for get token from websocket inside this module. |
| 101 | `async function _get_user_from_websocket` | Private helper for get user from websocket inside this module. |
| 127 | `async function websocket_chat` | Validates token, accepts messages, prevents sender impersonation, persists chat rows, and broadcasts to the channel. |
| 188 | `async function start_property_chat` | Mark a buyer's property chat as active as soon as they open the chat page. |
| 250 | `async function get_seller_active_chats` | Return active chat threads only for properties owned by the seller. |
| 292 | `async function get_chat_history` | Fetch chat history for a channel (JWT protected). |
| 328 | `async function send_visit_alert` | Send 'visit before payment' nudge alert to the buyer (JWT protected). |

### `backend/app/routers/deeds.py`

- Layer: Backend API Routers
- Lines: 325
- Purpose: Deed/legal workflow API for uploads, OCR verification, admin review, local file serving, stamp duty, timeline, and RERA checks.

| Line | Symbol | What It Does |
|---:|---|---|
| 24 | `class VerificationDecision` | Pydantic request/response schema used by this router for verification decision payloads. |
| 30 | `function _latest_for_parcel` | Private helper for latest for parcel inside this module. |
| 39 | `function _can_view_verification` | Private helper for can view verification inside this module. |
| 44 | `async function upload_deed_documents` | Receives deed files, creates a verification row, runs OCR/name/legal checks, and returns serialized status. |
| 81 | `async function get_admin_deed_summary` | Admin stats for properties, users, and deed verification automation. |
| 126 | `async function list_admin_verifications` | Admin list of buyer-submitted verification packets and documents. |
| 146 | `async function update_admin_verification` | Function/helper implementing update admin verification behavior in this file. |
| 173 | `async function get_deed_file` | Serve locally stored deed files to the submitter or an admin. |
| 195 | `async function get_deed_status` | Get the current verification status for a parcel. |
| 210 | `async function trigger_verification` | Re-run OCR, name match, and legal checklist for the latest parcel upload. |
| 226 | `async function get_legal_timeline` | Estimate days-to-completion for deed transfer using ML heuristics. |
| 244 | `async function calculate_stamp_duty` | Calculate stamp duty based on state and property value. |
| 269 | `async function check_rera` | Check RERA registration status through the official Telangana RERA source. |

### `backend/app/routers/predict.py`

- Layer: Backend API Routers
- Lines: 111
- Purpose: ML prediction API for price, appreciation, commercial score, anomaly detection, and locality insights.

| Line | Symbol | What It Does |
|---:|---|---|
| 10 | `class LandPriceRequest` | Pydantic request/response schema used by this router for land price request payloads. |
| 22 | `class LandPriceResponse` | Pydantic request/response schema used by this router for land price response payloads. |
| 30 | `class AppreciationRequest` | Pydantic request/response schema used by this router for appreciation request payloads. |
| 36 | `class AppreciationResponse` | Pydantic request/response schema used by this router for appreciation response payloads. |
| 41 | `class CommercialScoreRequest` | Pydantic request/response schema used by this router for commercial score request payloads. |
| 50 | `class CommercialScoreResponse` | Pydantic request/response schema used by this router for commercial score response payloads. |
| 57 | `class AnomalyRequest` | Pydantic request/response schema used by this router for anomaly request payloads. |
| 66 | `class AnomalyResponse` | Pydantic request/response schema used by this router for anomaly response payloads. |
| 73 | `async function predict_land_price` | Predict land/property price using XGBoost model. |
| 82 | `async function predict_appreciation` | Forecast price appreciation for 1/3/5 years using Prophet + LSTM. |
| 91 | `async function predict_commercial_score` | Predict commercial viability score (0-100) for a land parcel. |
| 98 | `async function detect_anomaly` | Detect if a listing has suspicious pricing (Isolation Forest). |
| 105 | `async function get_locality_insights` | ML-based locality score: schools, hospitals, transit, safety, growth. |

### `backend/app/routers/properties.py`

- Layer: Backend API Routers
- Lines: 286
- Purpose: Property API that merges SQL listings with CSV/JSON fallback listings and exposes detail, map, nearby, history, verify, and delete behavior.

| Line | Symbol | What It Does |
|---:|---|---|
| 17 | `class PropertyCreate` | Pydantic request/response schema used by this router for property create payloads. |
| 32 | `function _property_to_dict` | Converts a SQLAlchemy Property row into the frontend JSON shape. |
| 59 | `async function create_property` | Create a new property listing (seller/admin). |
| 108 | `async function list_properties_endpoint` | Applies filters to SQL listings, fetches matching CSV fallback records, deduplicates, and returns a page of results. |
| 196 | `async function properties_geojson` | GeoJSON FeatureCollection of all property pins for map view. |
| 202 | `async function get_property_endpoint` | Get full property detail by ID (DB merged with CSV). |
| 219 | `async function get_nearby` | Nearby POIs for a property — returns NearbyPOI-compatible list. |
| 235 | `async function get_price_history` | Historical price trend for the property's locality. |
| 244 | `class PropertyPatch` | Pydantic request/response schema used by this router for property patch payloads. |
| 249 | `async function patch_property` | Partial update for a property (used by admin approve). |
| 273 | `async function delete_property` | Function/helper implementing delete property behavior in this file. |

### `backend/app/schemas/__init__.py`

- Layer: API Schemas
- Lines: 0
- Purpose: Package marker so Python can import this directory as a module.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `backend/app/schemas/property.py`

- Layer: API Schemas
- Lines: 100
- Purpose: Source/configuration file used by this layer.

| Line | Symbol | What It Does |
|---:|---|---|
| 8 | `class PropertyBase` | Pydantic model/schema for property base data. |
| 34 | `class PropertyCreate` | Pydantic model/schema for property create data. |
| 38 | `class PropertyUpdate` | Pydantic model/schema for property update data. |
| 46 | `class PropertyResponse` | Pydantic model/schema for property response data. |
| 57 | `class PropertyListResponse` | Pydantic model/schema for property list response data. |
| 64 | `class GeoJSONFeature` | Pydantic model/schema for geo jsonfeature data. |
| 70 | `class GeoJSONCollection` | Pydantic model/schema for geo jsoncollection data. |
| 75 | `class NearbyPOI` | Pydantic model/schema for nearby poi data. |
| 83 | `class PriceHistoryPoint` | Pydantic model/schema for price history point data. |
| 90 | `class ReviewCreate` | Pydantic model/schema for review create data. |
| 96 | `class ReviewResponse` | Pydantic model/schema for review response data. |

### `backend/app/services/__init__.py`

- Layer: Backend Services
- Lines: 0
- Purpose: Package marker so Python can import this directory as a module.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `backend/app/services/agent_service.py`

- Layer: Backend Services
- Lines: 387
- Purpose: Lightweight PropBot service for intent parsing, curated replies, GUI commands, OpenAI calls, sessions, search, and RAG delegation.

| Line | Symbol | What It Does |
|---:|---|---|
| 33 | `function _build_gui_command` | Private helper for build gui command inside this module. |
| 37 | `function _build_navigation_link` | Private helper for build navigation link inside this module. |
| 41 | `function _format_inr` | Private helper for format inr inside this module. |
| 52 | `function _query_from_params` | Private helper for query from params inside this module. |
| 61 | `function _build_navigation_links` | Private helper for build navigation links inside this module. |
| 118 | `function _compose_curated_reply` | Private helper for compose curated reply inside this module. |
| 205 | `function _parse_intent` | Extracts simple user intent and filters from plain English for PropBot. |
| 257 | `async function _call_azure_openai` | Call Azure OpenAI with conversation history. |
| 299 | `function _fallback_response` | Private helper for fallback response inside this module. |
| 327 | `class AgentService` | Class grouping data and behavior for agent service. |
| 328 | `method AgentService.__init__` | Method on `AgentService` that handles init behavior. |
| 331 | `async method AgentService.chat` | Method on `AgentService` that handles chat behavior. |
| 356 | `async method AgentService.get_session` | Method on `AgentService` that handles get session behavior. |
| 362 | `async method AgentService.issue_gui_command` | Method on `AgentService` that handles issue gui command behavior. |
| 365 | `async method AgentService.natural_language_search` | Method on `AgentService` that handles natural language search behavior. |
| 373 | `async method AgentService.rag_query` | Method on `AgentService` that handles rag query behavior. |

### `backend/app/services/data_service.py`

- Layer: Backend Services
- Lines: 633
- Purpose: CSV/JSON-backed Hyderabad property catalog, normalization, deterministic coordinates/images/sellers, filtering, GeoJSON, and analytics.

| Line | Symbol | What It Does |
|---:|---|---|
| 189 | `function _stable_hash` | Private helper for stable hash inside this module. |
| 193 | `function _pick_images` | Return a deterministic set of relevant image URLs for a property. |
| 202 | `function _apply_demo_seller_ownership` | Assign one deterministic seller account to each block of 100 demo properties. |
| 212 | `function _normalize_locality` | Private helper for normalize locality inside this module. |
| 222 | `function _get_coords` | Return deterministic coordinates for a property within a Hyderabad locality. |
| 251 | `function _build_amenities` | Private helper for build amenities inside this module. |
| 255 | `function _row_to_property` | Transforms one raw CSV row into the full property object used by the UI. |
| 393 | `function _load_data` | Loads property JSON/CSV once and falls back to synthetic data if loading fails. |
| 441 | `function _build_fallback` | Generate 80 synthetic Hyderabad properties if CSV is unavailable. |
| 490 | `function get_properties` | Retrieves or derives get properties for this module. |
| 540 | `function get_property_by_id` | Retrieves or derives get property by id for this module. |
| 553 | `function get_localities` | Retrieves or derives get localities for this module. |
| 565 | `function get_geojson` | Return all Hyderabad properties as GeoJSON FeatureCollection.  |
| 596 | `function get_analytics` | Compute real analytics from the loaded Hyderabad dataset. |

### `backend/app/services/deed_service.py`

- Layer: Backend Services
- Lines: 357
- Purpose: Deed file storage, OCR/local extraction, fuzzy name matching, legal checklist/RAG, and verification serialization.

| Line | Symbol | What It Does |
|---:|---|---|
| 28 | `function _use_cloud_integrations` | Private helper for use cloud integrations inside this module. |
| 33 | `function _safe_filename` | Private helper for safe filename inside this module. |
| 38 | `function _json_dump` | Private helper for json dump inside this module. |
| 42 | `function _json_load` | Private helper for json load inside this module. |
| 51 | `async function _upload_to_blob` | Stores a deed file in Azure Blob in cloud mode or local storage in demo mode. |
| 96 | `function _extract_owner_name` | Private helper for extract owner name inside this module. |
| 108 | `async function _run_ocr` | Run Azure Document Intelligence or a deterministic local fallback. |
| 165 | `function _fuzzy_name_match` | Compare two names using fuzzy matching.  |
| 176 | `function serialize_verification` | Function/helper implementing serialize verification behavior in this file. |
| 201 | `class DeedService` | Class grouping data and behavior for deed service. |
| 202 | `async method DeedService.upload_and_create_verification` | Upload deed files and create a verification record. |
| 236 | `async method DeedService.run_verification` | Run OCR, fuzzy name matching, and the legal RAG checklist. |
| 275 | `async method DeedService.run_legal_check` | Use the RAG service to attach a legal checklist summary. |
| 319 | `method DeedService._fallback_legal_summary` | Method on `DeedService` that handles fallback legal summary behavior. |
| 328 | `async method DeedService.estimate_legal_timeline` | Estimate days-to-completion for deed transfer using ML heuristics. |

### `backend/app/services/geocoding_service.py`

- Layer: Backend Services
- Lines: 66
- Purpose: Nearby POI lookup with Google Places integration and local mock fallback.

| Line | Symbol | What It Does |
|---:|---|---|
| 6 | `async function get_nearby_pois` | Fetch nearby POIs from Google Places API.  |
| 46 | `function _haversine` | Private helper for haversine inside this module. |
| 56 | `function _mock_pois` | Private helper for mock pois inside this module. |

### `backend/app/services/ml_service.py`

- Layer: Backend Services
- Lines: 172
- Purpose: ML inference facade with optional pickle artifacts and heuristic fallbacks for local demos.

| Line | Symbol | What It Does |
|---:|---|---|
| 12 | `class MLService` | Wraps all ML model inference.  |
| 19 | `method MLService.__init__` | Method on `MLService` that handles init behavior. |
| 34 | `method MLService._load_price_model` | Method on `MLService` that handles load price model behavior. |
| 40 | `method MLService._load_commercial_model` | Method on `MLService` that handles load commercial model behavior. |
| 46 | `async method MLService.predict_price` | Predict property price.  |
| 73 | `async method MLService.predict_appreciation` | Forecast appreciation using locality growth trends. |
| 94 | `async method MLService.predict_commercial_score` | Compute commercial viability score 0-100. |
| 123 | `async method MLService.detect_anomaly` | Detect anomalous pricing using Isolation Forest heuristic. |
| 140 | `async method MLService.get_locality_insights` | Method on `MLService` that handles get locality insights behavior. |
| 155 | `async method MLService.get_price_history` | Return 12-month synthetic price history for a locality. |

### `backend/app/services/rag_service.py`

- Layer: Backend Services
- Lines: 97
- Purpose: Legal RAG service using FAISS/Azure OpenAI when configured and deterministic legal fallbacks otherwise.

| Line | Symbol | What It Does |
|---:|---|---|
| 7 | `function _cloud_rag_enabled` | Private helper for cloud rag enabled inside this module. |
| 12 | `class RAGService` | Class grouping data and behavior for ragservice. |
| 13 | `method RAGService.__init__` | Method on `RAGService` that handles init behavior. |
| 17 | `method RAGService._init_rag` | Initialize FAISS vector store from legal documents. |
| 69 | `async method RAGService.query` | Method on `RAGService` that handles query behavior. |
| 81 | `method RAGService._fallback` | Method on `RAGService` that handles fallback behavior. |

### `backend/app/utils/__init__.py`

- Layer: Backend Utilities
- Lines: 0
- Purpose: Package marker so Python can import this directory as a module.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `backend/app/utils/logging.py`

- Layer: Backend Utilities
- Lines: 34
- Purpose: structlog setup with optional Azure Application Insights exporter.

| Line | Symbol | What It Does |
|---:|---|---|
| 7 | `function setup_logging` | Function/helper implementing setup logging behavior in this file. |

### `backend/app/utils/security.py`

- Layer: Backend Utilities
- Lines: 96
- Purpose: Password hashing, JWT generation/decoding, current-user dependency, mock-token fallback, and role guards.

| Line | Symbol | What It Does |
|---:|---|---|
| 20 | `function hash_password` | Function/helper implementing hash password behavior in this file. |
| 24 | `function verify_password` | Function/helper implementing verify password behavior in this file. |
| 31 | `function create_access_token` | Creates access token data, UI, or files for this workflow. |
| 41 | `function create_refresh_token` | Creates refresh token data, UI, or files for this workflow. |
| 50 | `function decode_token` | Function/helper implementing decode token behavior in this file. |
| 57 | `class MockUser` | Class grouping data and behavior for mock user. |
| 58 | `method MockUser.__init__` | Method on `MockUser` that handles init behavior. |
| 63 | `async function get_current_user` | Retrieves or derives get current user for this module. |
| 89 | `function require_roles` | Function/helper implementing require roles behavior in this file. |

### `backend/data/sample_deeds/README.md`

- Layer: Sample Legal Data Tools
- Lines: 58
- Purpose: Repository documentation or ignore/configuration file.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `backend/data/sample_deeds/bulk_upload_deeds.json`

- Layer: Sample Legal Data Tools
- Lines: 129
- Purpose: JSON configuration or structured data file.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `backend/data/sample_deeds/create_bulk_upload_files.py`

- Layer: Sample Legal Data Tools
- Lines: 185
- Purpose: Source/configuration file used by this layer.

| Line | Symbol | What It Does |
|---:|---|---|
| 11 | `function create_bulk_upload_json` | Create a JSON file with all sample deeds for bulk upload. |
| 160 | `function create_csv_upload_file` | Create a CSV file for bulk upload. |

### `backend/data/sample_deeds/upload_sample_deeds.py`

- Layer: Sample Legal Data Tools
- Lines: 208
- Purpose: Source/configuration file used by this layer.

| Line | Symbol | What It Does |
|---:|---|---|
| 14 | `class DeedUploader` | Class grouping data and behavior for deed uploader. |
| 15 | `method DeedUploader.__init__` | Method on `DeedUploader` that handles init behavior. |
| 20 | `method DeedUploader.parse_deed_content` | Parse deed content and extract structured data. |
| 57 | `method DeedUploader.create_deed_payload` | Create API payload from parsed deed data. |
| 98 | `method DeedUploader.upload_deed` | Upload a single deed to the API. |
| 119 | `method DeedUploader.upload_all_sample_deeds` | Upload all sample deeds from the sample_deeds directory. |
| 167 | `method DeedUploader.generate_upload_manifest` | Generate a JSON manifest of uploaded deeds. |
| 190 | `function main` | Main upload function. |

### `backend/data/sample_properties.json`

- Layer: Backend Support
- Lines: 35627
- Purpose: JSON configuration or structured data file.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `backend/ml/__init__.py`

- Layer: Backend Support
- Lines: 0
- Purpose: Package marker so Python can import this directory as a module.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `backend/ml/training/__init__.py`

- Layer: ML Training
- Lines: 0
- Purpose: Package marker so Python can import this directory as a module.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `backend/ml/training/train_all.py`

- Layer: ML Training
- Lines: 209
- Purpose: Synthetic ML training pipeline for price prediction, commercial scoring, anomaly detection, and appreciation history artifacts.

| Line | Symbol | What It Does |
|---:|---|---|
| 28 | `function generate_property_dataset` | Generate synthetic Hyderabad property dataset for training. |
| 70 | `function train_price_model` | Train XGBoost price prediction model. |
| 112 | `function train_commercial_model` | Train Gradient Boosting commercial viability classifier. |
| 144 | `function train_anomaly_model` | Train Isolation Forest for anomaly detection. |
| 168 | `function train_appreciation_model` | Create locality price index for Prophet (synthetic time series). |

### `backend/scripts/__init__.py`

- Layer: Backend Data Scripts
- Lines: 0
- Purpose: Package marker so Python can import this directory as a module.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `backend/scripts/generate_synthetic_data.py`

- Layer: Backend Data Scripts
- Lines: 135
- Purpose: Generates realistic Hyderabad property data and optionally inserts it into SQL.

| Line | Symbol | What It Does |
|---:|---|---|
| 45 | `function generate_property` | Function/helper implementing generate property behavior in this file. |
| 94 | `async function main` | Function/helper implementing main behavior in this file. |

### `backend/scripts/import_all_data.py`

- Layer: Backend Data Scripts
- Lines: 69
- Purpose: Master data import wizard for property and price-history datasets.

| Line | Symbol | What It Does |
|---:|---|---|
| 18 | `function banner` | Function/helper implementing banner behavior in this file. |
| 23 | `async function main` | Function/helper implementing main behavior in this file. |

### `backend/scripts/import_price_history.py`

- Layer: Backend Data Scripts
- Lines: 106
- Purpose: Imports NHB RESIDEX-style price-history Excel/CSV files into MongoDB.

| Line | Symbol | What It Does |
|---:|---|---|
| 17 | `async function import_price_history` | Parses Excel/CSV price history files and imports them into MongoDB. |

### `backend/scripts/import_properties_csv.py`

- Layer: Backend Data Scripts
- Lines: 130
- Purpose: Imports supported real-estate CSV schemas into MongoDB.

| Line | Symbol | What It Does |
|---:|---|---|
| 19 | `async function import_all_csvs` | Parses all CSVs in properties_dir and imports them into MongoDB. |

### `backend/scripts/scrape_images.py`

- Layer: Backend Data Scripts
- Lines: 200
- Purpose: Scrapes property images, validates/resizes them, writes thumbnails, and exports image metadata.

| Line | Symbol | What It Does |
|---:|---|---|
| 53 | `function make_filename` | Generate a unique filename from URL hash. |
| 59 | `function save_image` | Download image, save full + thumbnail.  |
| 92 | `function scrape_ddg` | Get image URLs using DuckDuckGo search. |
| 106 | `function scrape_all_images` | Scrapes or generates all images data for local datasets. |
| 169 | `function export_metadata` | Create a JSON manifest of all downloaded images. |

### `backend/scripts/seed_mock_to_mongo.py`

- Layer: Backend Data Scripts
- Lines: 454
- Purpose: Seeds MongoDB with curated sample properties aligned to frontend demo data.

| Line | Symbol | What It Does |
|---:|---|---|
| 439 | `async function seed_database` | Function/helper implementing seed database behavior in this file. |

### `backend/test_azure_sql.py`

- Layer: Backend Support
- Lines: 60
- Purpose: Source/configuration file used by this layer.

| Line | Symbol | What It Does |
|---:|---|---|
| 10 | `function sqlalchemy_url_to_pyodbc` | Function/helper implementing sqlalchemy url to pyodbc behavior in this file. |

### `backend/test_integration.py`

- Layer: Backend Support
- Lines: 51
- Purpose: Source/configuration file used by this layer.

| Line | Symbol | What It Does |
|---:|---|---|
| 5 | `function _safe_text` | Private helper for safe text inside this module. |
| 10 | `function test_health` | Test case that verifies health behavior. |
| 17 | `function test_properties` | Test case that verifies properties behavior. |
| 29 | `function test_chat` | Test case that verifies chat behavior. |

### `backend/tests/__init__.py`

- Layer: Automated Tests
- Lines: 0
- Purpose: Package marker so Python can import this directory as a module.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `backend/tests/conftest.py`

- Layer: Automated Tests
- Lines: 12
- Purpose: Source/configuration file used by this layer.

| Line | Symbol | What It Does |
|---:|---|---|
| 7 | `function event_loop` | Create an instance of the default event loop for the test session. |

### `backend/tests/test_api.py`

- Layer: Automated Tests
- Lines: 189
- Purpose: Main async pytest suite covering backend health, auth, listings, ML, deeds, RERA, analytics, GeoJSON, and agent behavior.

| Line | Symbol | What It Does |
|---:|---|---|
| 16 | `async function test_health` | Test case that verifies health behavior. |
| 24 | `async function test_demo_admin_login` | Test case that verifies demo admin login behavior. |
| 37 | `async function test_register_allows_same_email_for_buyer_and_seller_but_not_admin` | Test case that verifies register allows same email for buyer and seller but not admin behavior. |
| 69 | `async function test_list_properties` | Test case that verifies list properties behavior. |
| 84 | `async function test_predict_land_price` | Test case that verifies predict land price behavior. |
| 96 | `async function test_commercial_score` | Test case that verifies commercial score behavior. |
| 109 | `async function test_appreciation_forecast` | Test case that verifies appreciation forecast behavior. |
| 121 | `async function test_stamp_duty` | Test case that verifies stamp duty behavior. |
| 131 | `async function test_rera_check_uses_official_manual_workflow_without_fake_registration` | Test case that verifies rera check uses official manual workflow without fake registration behavior. |
| 143 | `async function test_market_trends` | Test case that verifies market trends behavior. |
| 150 | `async function test_geojson` | Test case that verifies geojson behavior. |
| 159 | `async function test_agent_chat_returns_clear_answer_and_navigation_cards` | Test case that verifies agent chat returns clear answer and navigation cards behavior. |
| 175 | `async function test_agent_voice_requires_elevenlabs_key_when_not_configured` | Test case that verifies agent voice requires elevenlabs key when not configured behavior. |

### `data-engineering/databricks-notebooks/01_etl_pipeline.py`

- Layer: Data Engineering
- Lines: 101
- Purpose: PySpark/Databricks ETL: raw property JSON to cleaned features and locality price index Delta tables.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `data-engineering/scrape_hyderabad.py`

- Layer: Data Engineering
- Lines: 262
- Purpose: Hyderabad dataset generator and optional live image scraper from 99acres.

| Line | Symbol | What It Does |
|---:|---|---|
| 50 | `function _stable_coords_seed` | Private helper for stable coords seed inside this module. |
| 54 | `function deterministic_coords` | Function/helper implementing deterministic coords behavior in this file. |
| 63 | `function can_fetch` | Function/helper implementing can fetch behavior in this file. |
| 73 | `function fetch` | Function/helper implementing fetch behavior in this file. |
| 80 | `function normalize_price` | Function/helper implementing normalize price behavior in this file. |
| 92 | `function normalize_area` | Function/helper implementing normalize area behavior in this file. |
| 98 | `function _is_candidate_image_url` | Private helper for is candidate image url inside this module. |
| 109 | `function _extract_image_urls_from_html` | Private helper for extract image urls from html inside this module. |
| 128 | `function _fetch_image_urls_from_listing` | Private helper for fetch image urls from listing inside this module. |
| 138 | `function _scrape_99acres_listing_urls` | Private helper for scrape 99acres listing urls inside this module. |
| 158 | `function _scrape_99acres_image_urls` | Private helper for scrape 99acres image urls inside this module. |
| 185 | `function scrape_mock` | Generate the Hyderabad dataset and optionally scrape live images from 99acres. |

### `data-engineering/utils/html_helpers.py`

- Layer: Data Engineering
- Lines: 44
- Purpose: Robots.txt, polite fetch, BeautifulSoup, and text helper utilities for scraping.

| Line | Symbol | What It Does |
|---:|---|---|
| 11 | `function can_fetch` | Return True if the site’s robots.txt allows the given path. |
| 23 | `function fetch` | GET `url` with a standard header and a polite pause. |
| 38 | `function soup_from_response` | Convenient wrapper that returns a lxml-parsed soup. |
| 42 | `function text_or_none` | Function/helper implementing text or none behavior in this file. |

### `data/README.md`

- Layer: Data Assets
- Lines: 58
- Purpose: Repository documentation or ignore/configuration file.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `data/images/images_manifest.json`

- Layer: Data Assets
- Lines: 602
- Purpose: JSON configuration or structured data file.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `docker-compose.yml`

- Layer: Repository Root
- Lines: 64
- Purpose: Local app, MongoDB, and Redis orchestration with environment wiring for Azure, ML, auth, and external APIs.

| Line | Symbol | What It Does |
|---:|---|---|
| 1 | `yaml section services` | Function/helper implementing services behavior in this file. |
| 61 | `yaml section volumes` | Function/helper implementing volumes behavior in this file. |

### `docs/generate_architecture_report.py`

- Layer: Repository Root
- Lines: 637
- Purpose: Source/configuration file used by this layer.

| Line | Symbol | What It Does |
|---:|---|---|
| 163 | `function relpath` | Function/helper implementing relpath behavior in this file. |
| 167 | `function should_include` | Function/helper implementing should include behavior in this file. |
| 178 | `function layer_for` | Function/helper implementing layer for behavior in this file. |
| 195 | `function read_text` | Function/helper implementing read text behavior in this file. |
| 208 | `function clean_sentence` | Function/helper implementing clean sentence behavior in this file. |
| 216 | `function humanize` | Function/helper implementing humanize behavior in this file. |
| 222 | `function fallback_summary` | Function/helper implementing fallback summary behavior in this file. |
| 247 | `function extract_symbols` | Function/helper implementing extract symbols behavior in this file. |
| 315 | `function explain_symbol` | Function/helper implementing explain symbol behavior in this file. |
| 359 | `function build_files` | Function/helper implementing build files behavior in this file. |
| 379 | `function render_markdown` | Render helper for the markdown section. |
| 566 | `function write_outputs` | Function/helper implementing write outputs behavior in this file. |
| 626 | `function main` | Function/helper implementing main behavior in this file. |

### `frontend/.env.local`

- Layer: Frontend Support
- Lines: not read; secret values redacted
- Purpose: Local environment-variable file; values are intentionally redacted.
- Functions/classes: environment values only; intentionally not included.

### `frontend/index.html`

- Layer: Frontend Support
- Lines: 20
- Purpose: HTML shell or static HTML file.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `frontend/nginx.conf`

- Layer: Frontend Support
- Lines: 30
- Purpose: Source/configuration file used by this layer.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `frontend/package-lock.json`

- Layer: Frontend Support
- Lines: 3827
- Purpose: Generated npm dependency lockfile.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `frontend/package.json`

- Layer: Frontend Support
- Lines: 35
- Purpose: npm package manifest with frontend scripts and dependencies.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `frontend/src/App.tsx`

- Layer: Frontend App Shell
- Lines: 62
- Purpose: React route shell with protected routes, navbar, page wiring, and global PropBot widget.

| Line | Symbol | What It Does |
|---:|---|---|
| 18 | `function RequireRole` | Route guard that redirects missing or unauthorized roles. |
| 26 | `function App` | React component rendering the app UI. |

### `frontend/src/components/Agent/AgentChat.tsx`

- Layer: Frontend Components
- Lines: 268
- Purpose: Floating PropBot widget with quick prompts, session chat, voice playback, navigation cards, and GUI command dispatch.

| Line | Symbol | What It Does |
|---:|---|---|
| 5 | `interface NavLink` | TypeScript interface describing the shape of nav link data in this module. |
| 12 | `interface Message` | TypeScript interface describing the shape of message data in this module. |
| 25 | `function AgentChat` | React component rendering the agent chat UI. |
| 56 | `function stopVoice` | Function/helper implementing stop voice behavior in this file. |
| 64 | `function playVoice` | Requests TTS audio for a bot message and plays it in the browser. |
| 116 | `function send` | Sends the user prompt to the agent API, appends bot replies, stores session ID, and dispatches GUI commands. |
| 146 | `function renderMessageText` | Render helper for the message text section. |

### `frontend/src/components/Property/PropertyCard.tsx`

- Layer: Frontend Components
- Lines: 105
- Purpose: Reusable property listing card with image fallback, price/details badges, navigation, and compare action.

| Line | Symbol | What It Does |
|---:|---|---|
| 6 | `interface Props` | TypeScript interface describing the shape of props data in this module. |
| 30 | `function PropertyCard` | React component rendering the property card UI. |
| 42 | `function handleImgError` | UI event handler for img error actions. |
| 47 | `function handleCardClick` | UI event handler for card click actions. |

### `frontend/src/components/UI/Navbar.tsx`

- Layer: Frontend Components
- Lines: 84
- Purpose: Role-aware top navigation and auth actions.

| Line | Symbol | What It Does |
|---:|---|---|
| 4 | `function Navbar` | React component rendering the navbar UI. |

### `frontend/src/index.css`

- Layer: Frontend App Shell
- Lines: 453
- Purpose: Global design system: color tokens, layout helpers, cards, buttons, badges, forms, navbar, hero, maps, chat widget, tables, skeletons, and responsive rules.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `frontend/src/main.tsx`

- Layer: Frontend App Shell
- Lines: 11
- Purpose: React entrypoint that mounts the App and imports global styles.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `frontend/src/pages/AddPropertyPage.tsx`

- Layer: Frontend Pages
- Lines: 390
- Purpose: Seller/admin multi-step property listing wizard with deed approval gate and final listing submit.

| Line | Symbol | What It Does |
|---:|---|---|
| 5 | `function AddPropertyPage` | React component rendering the add property page UI. |
| 36 | `function handleNext` | Advances the listing wizard, enforces deed verification at step 3, and submits the final property payload. |

### `frontend/src/pages/AdminPage.tsx`

- Layer: Frontend Pages
- Lines: 845
- Purpose: Admin command center for seller analytics, Power BI exports, listing moderation, and buyer deed verification decisions.

| Line | Symbol | What It Does |
|---:|---|---|
| 36 | `type AdminTab` | TypeScript type describing the shape of admin tab data in this module. |
| 38 | `function getPropertyId` | Retrieves or derives get property id for this module. |
| 40 | `function formatDate` | Function/helper implementing format date behavior in this file. |
| 46 | `function scoreLabel` | Function/helper implementing score label behavior in this file. |
| 51 | `function percent` | Function/helper implementing percent behavior in this file. |
| 53 | `function badgeForStatus` | Function/helper implementing badge for status behavior in this file. |
| 61 | `function downloadFile` | Function/helper implementing download file behavior in this file. |
| 71 | `function toCsv` | Function/helper implementing to csv behavior in this file. |
| 78 | `function escape` | Function/helper implementing escape behavior in this file. |
| 87 | `function AdminPage` | React component rendering the admin page UI. |
| 97 | `function loadDashboard` | Loads property, seller analytics, deed stats, verification rows, and Power BI dataset data in parallel. |
| 122 | `function handleApprove` | UI event handler for approve actions. |
| 133 | `function handleDelete` | UI event handler for delete actions. |
| 146 | `function openDocument` | Function/helper implementing open document behavior in this file. |
| 166 | `function handleVerificationDecision` | UI event handler for verification decision actions. |
| 240 | `function renderSellerAnalytics` | Render helper for the seller analytics section. |
| 425 | `function renderPowerBI` | Render helper for the power bi section. |
| 618 | `function renderPropertyTable` | Render helper for the property table section. |
| 680 | `function renderDeedTable` | Renders buyer verification packets with document-open, approve, and reject actions. |

### `frontend/src/pages/AnalyticsPage.tsx`

- Layer: Frontend Pages
- Lines: 180
- Purpose: Market analytics dashboard with KPI cards, trends, locality scores, commercial zones, and heatmap chips.

| Line | Symbol | What It Does |
|---:|---|---|
| 7 | `function AnalyticsPage` | React component rendering the analytics page UI. |

### `frontend/src/pages/ChatPage.tsx`

- Layer: Frontend Pages
- Lines: 223
- Purpose: Property chat page using REST history and authenticated WebSocket messages.

| Line | Symbol | What It Does |
|---:|---|---|
| 6 | `type ChatMessage` | TypeScript type describing the shape of chat message data in this module. |
| 14 | `function displayTime` | Function/helper implementing display time behavior in this file. |
| 19 | `function ChatPage` | React component rendering the chat page UI. |
| 32 | `function scrollToBottom` | Function/helper implementing scroll to bottom behavior in this file. |
| 112 | `function handleSend` | UI event handler for send actions. |
| 135 | `function labelFor` | Function/helper implementing label for behavior in this file. |

### `frontend/src/pages/ComparePage.tsx`

- Layer: Frontend Pages
- Lines: 122
- Purpose: Side-by-side compare page for up to three stored property cards.

| Line | Symbol | What It Does |
|---:|---|---|
| 20 | `function ComparePage` | React component rendering the compare page UI. |
| 24 | `function getBest` | Retrieves or derives get best for this module. |

### `frontend/src/pages/DeedPage.tsx`

- Layer: Frontend Pages
- Lines: 337
- Purpose: Legal workflow page for upload, status/timeline, stamp-duty calculation, and RERA check.

| Line | Symbol | What It Does |
|---:|---|---|
| 6 | `function DeedPage` | React component rendering the deed page UI. |
| 22 | `function checkStatus` | Function/helper implementing check status behavior in this file. |
| 32 | `function calcStamp` | Function/helper implementing calc stamp behavior in this file. |
| 37 | `function checkRera` | Function/helper implementing check rera behavior in this file. |

### `frontend/src/pages/LandingPage.tsx`

- Layer: Frontend Pages
- Lines: 229
- Purpose: Home page with hero search, stats, feature cards, featured listings, top localities, and PropBot CTA.

| Line | Symbol | What It Does |
|---:|---|---|
| 17 | `function LandingPage` | React component rendering the landing page UI. |
| 35 | `function handleSearch` | UI event handler for search actions. |

### `frontend/src/pages/LoginPage.tsx`

- Layer: Frontend Pages
- Lines: 95
- Purpose: Login/register form with role selection, auth persistence, and role-based redirects.

| Line | Symbol | What It Does |
|---:|---|---|
| 6 | `function LoginPage` | React component rendering the login page UI. |
| 24 | `function switchMode` | Function/helper implementing switch mode behavior in this file. |
| 30 | `function submit` | Function/helper implementing submit behavior in this file. |

### `frontend/src/pages/MapPage.tsx`

- Layer: Frontend Pages
- Lines: 144
- Purpose: Leaflet map page over backend GeoJSON with price pins and filters.

| Line | Symbol | What It Does |
|---:|---|---|
| 14 | `function createPriceIcon` | Creates price icon data, UI, or files for this workflow. |
| 20 | `interface GeoFeature` | TypeScript interface describing the shape of geo feature data in this module. |
| 25 | `function MapController` | Function/helper implementing map controller behavior in this file. |
| 31 | `function MapPage` | React component rendering the map page UI. |

### `frontend/src/pages/PredictPage.tsx`

- Layer: Frontend Pages
- Lines: 280
- Purpose: Tabbed AI prediction page for price, commercial score, and appreciation forecast.

| Line | Symbol | What It Does |
|---:|---|---|
| 7 | `type Tab` | TypeScript type describing the shape of tab data in this module. |
| 9 | `function PredictPage` | React component rendering the predict page UI. |
| 27 | `function runPricePredict` | Runs the price predict workflow and stores the result. |
| 33 | `function runCommercial` | Runs the commercial workflow and stores the result. |
| 39 | `function runAppreciation` | Runs the appreciation workflow and stores the result. |
| 45 | `function scoreColor` | Function/helper implementing score color behavior in this file. |

### `frontend/src/pages/PropertiesPage.tsx`

- Layer: Frontend Pages
- Lines: 192
- Purpose: Filterable property listing page with grid/list mode and PropBot filter listener.

| Line | Symbol | What It Does |
|---:|---|---|
| 8 | `function PropertiesPage` | React component rendering the properties page UI. |
| 28 | `function fetchProperties` | Builds query params from filters, calls the listing API, and updates loading/list/total state. |
| 57 | `function handler` | UI event handler for r actions. |

### `frontend/src/pages/PropertyDetailPage.tsx`

- Layer: Frontend Pages
- Lines: 263
- Purpose: Property detail page with gallery, valuation, EMI estimate, nearby places, price chart, and seller chat.

| Line | Symbol | What It Does |
|---:|---|---|
| 6 | `function PropertyDetailPage` | React component rendering the property detail page UI. |

### `frontend/src/pages/SellerPage.tsx`

- Layer: Frontend Pages
- Lines: 284
- Purpose: Seller dashboard for owned listings, inquiries, mock views/leads, trends, and listing actions.

| Line | Symbol | What It Does |
|---:|---|---|
| 26 | `function SellerPage` | React component rendering the seller page UI. |
| 41 | `function fetchDashboardListings` | Function/helper implementing fetch dashboard listings behavior in this file. |
| 58 | `function handleEdit` | UI event handler for edit actions. |
| 63 | `function handleDelete` | UI event handler for delete actions. |

### `frontend/src/store/useStore.ts`

- Layer: Frontend State
- Lines: 93
- Purpose: Zustand stores for property list/compare state and persisted auth state.

| Line | Symbol | What It Does |
|---:|---|---|
| 2 | `interface Property` | TypeScript interface describing the shape of property data in this module. |
| 20 | `interface Filters` | TypeScript interface describing the shape of filters data in this module. |
| 29 | `interface PropertyStore` | TypeScript interface describing the shape of property store data in this module. |
| 37 | `object method setProperties` | Function/helper implementing set properties behavior in this file. |
| 38 | `object method setLoading` | Function/helper implementing set loading behavior in this file. |
| 39 | `object method setFilters` | Function/helper implementing set filters behavior in this file. |
| 40 | `object method setPage` | Function/helper implementing set page behavior in this file. |
| 41 | `object method addToCompare` | Function/helper implementing add to compare behavior in this file. |
| 42 | `object method removeFromCompare` | Function/helper implementing remove from compare behavior in this file. |
| 43 | `object method clearCompare` | Function/helper implementing clear compare behavior in this file. |
| 53 | `object method setProperties` | Function/helper implementing set properties behavior in this file. |
| 55 | `object method setLoading` | Function/helper implementing set loading behavior in this file. |
| 56 | `object method setFilters` | Function/helper implementing set filters behavior in this file. |
| 57 | `object method setPage` | Function/helper implementing set page behavior in this file. |
| 58 | `object method addToCompare` | Function/helper implementing add to compare behavior in this file. |
| 66 | `object method removeFromCompare` | Function/helper implementing remove from compare behavior in this file. |
| 67 | `object method clearCompare` | Function/helper implementing clear compare behavior in this file. |
| 69 | `interface AuthStore` | TypeScript interface describing the shape of auth store data in this module. |
| 73 | `object method setAuth` | Function/helper implementing set auth behavior in this file. |
| 74 | `object method logout` | Function/helper implementing logout behavior in this file. |
| 79 | `object method user` | Function/helper implementing user behavior in this file. |
| 82 | `object method setAuth` | Function/helper implementing set auth behavior in this file. |
| 87 | `object method logout` | Function/helper implementing logout behavior in this file. |

### `frontend/src/theme.ts`

- Layer: Frontend App Shell
- Lines: 23
- Purpose: Source/configuration file used by this layer.

| Line | Symbol | What It Does |
|---:|---|---|
| 21 | `type ColorKey` | TypeScript type describing the shape of color key data in this module. |

### `frontend/src/utils/api.ts`

- Layer: Frontend Utilities
- Lines: 496
- Purpose: Axios client plus real/mock API wrappers for properties, chat, prediction, agents, analytics, deeds, auth, formatting, and images.

| Line | Symbol | What It Does |
|---:|---|---|
| 14 | `function delay` | Function/helper implementing delay behavior in this file. |
| 15 | `function mock` | Function/helper implementing mock behavior in this file. |
| 46 | `object method list` | API wrapper that lists/searches records for this service group. |
| 63 | `object method get` | API wrapper that fetches one record by ID. |
| 68 | `object method geojson` | API wrapper that fetches map-ready GeoJSON. |
| 73 | `object method nearby` | API wrapper that fetches nearby places. |
| 81 | `object method priceHistory` | API wrapper that fetches price-history data. |
| 89 | `object method create` | API wrapper that creates a new record. |
| 94 | `object method update` | API wrapper that updates a record. |
| 99 | `object method patch` | API wrapper that partially updates a record. |
| 104 | `object method delete` | API wrapper that deletes a record. |
| 113 | `object method startPropertyChat` | Function/helper implementing start property chat behavior in this file. |
| 117 | `object method history` | Function/helper implementing history behavior in this file. |
| 122 | `object method sellerActive` | Function/helper implementing seller active behavior in this file. |
| 131 | `object method landPrice` | Function/helper implementing land price behavior in this file. |
| 135 | `object method appreciation` | Function/helper implementing appreciation behavior in this file. |
| 140 | `object method commercialScore` | Function/helper implementing commercial score behavior in this file. |
| 145 | `object method anomaly` | Function/helper implementing anomaly behavior in this file. |
| 150 | `object method localityInsights` | Function/helper implementing locality insights behavior in this file. |
| 159 | `object method chat` | API wrapper for PropBot chat. |
| 166 | `object method search` | Function/helper implementing search behavior in this file. |
| 177 | `object method docQuery` | Function/helper implementing doc query behavior in this file. |
| 182 | `object method voice` | API wrapper for PropBot text-to-speech audio. |
| 193 | `object method marketTrends` | Function/helper implementing market trends behavior in this file. |
| 197 | `object method heatmap` | Function/helper implementing heatmap behavior in this file. |
| 202 | `object method topLocalities` | Function/helper implementing top localities behavior in this file. |
| 207 | `object method commercialZones` | Function/helper implementing commercial zones behavior in this file. |
| 212 | `object method demandForecast` | Function/helper implementing demand forecast behavior in this file. |
| 221 | `object method adminSellerOps` | Function/helper implementing admin seller ops behavior in this file. |
| 268 | `object method powerBIDataset` | Function/helper implementing power bidataset behavior in this file. |
| 323 | `object method upload` | API wrapper for deed document upload. |
| 347 | `object method status` | API wrapper for deed status. |
| 352 | `object method verify` | API wrapper to trigger deed verification. |
| 357 | `object method timeline` | API wrapper for legal timeline. |
| 362 | `object method stampDuty` | API wrapper for stamp-duty calculation. |
| 367 | `object method rera` | API wrapper for RERA lookup. |
| 372 | `object method adminSummary` | Function/helper implementing admin summary behavior in this file. |
| 387 | `object method adminVerifications` | Function/helper implementing admin verifications behavior in this file. |
| 411 | `object method updateVerification` | Function/helper implementing update verification behavior in this file. |
| 416 | `object method documentBlob` | Function/helper implementing document blob behavior in this file. |
| 424 | `type AuthPayload` | TypeScript type describing the shape of auth payload data in this module. |
| 429 | `function mockAuthResponse` | Function/helper implementing mock auth response behavior in this file. |
| 444 | `object method login` | API wrapper for role-aware login. |
| 451 | `object method register` | API wrapper for buyer/seller registration. |
| 465 | `function formatINR` | Function/helper implementing format inr behavior in this file. |

### `frontend/src/utils/mockData.ts`

- Layer: Frontend Utilities
- Lines: 252
- Purpose: Mock data generators used when VITE_USE_MOCK is enabled.

| Line | Symbol | What It Does |
|---:|---|---|
| 35 | `function MOCK_PROPERTY_DETAIL` | Function/helper implementing mock property detail behavior in this file. |
| 71 | `function genTrend` | Function/helper implementing gen trend behavior in this file. |
| 127 | `function MOCK_PRICE_PREDICTION` | Function/helper implementing mock price prediction behavior in this file. |
| 137 | `function MOCK_COMMERCIAL_SCORE` | Function/helper implementing mock commercial score behavior in this file. |
| 144 | `function MOCK_APPRECIATION` | Function/helper implementing mock appreciation behavior in this file. |
| 175 | `function MOCK_AGENT_CHAT` | Function/helper implementing mock agent chat behavior in this file. |
| 203 | `function MOCK_DEED_STATUS` | Function/helper implementing mock deed status behavior in this file. |
| 212 | `function MOCK_DEED_TIMELINE` | Function/helper implementing mock deed timeline behavior in this file. |
| 220 | `function MOCK_STAMP_DUTY` | Function/helper implementing mock stamp duty behavior in this file. |
| 238 | `function MOCK_RERA` | Function/helper implementing mock rera behavior in this file. |

### `frontend/src/vite-env.d.ts`

- Layer: Frontend App Shell
- Lines: 2
- Purpose: Source/configuration file used by this layer.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `frontend/tsconfig.json`

- Layer: Frontend Support
- Lines: 24
- Purpose: TypeScript compiler configuration.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `frontend/tsconfig.node.json`

- Layer: Frontend Support
- Lines: 2
- Purpose: TypeScript compiler configuration.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `frontend/vite.config.ts`

- Layer: Frontend Support
- Lines: 23
- Purpose: Source/configuration file used by this layer.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `powerbi-export/propiq-powerbi-dataset.json`

- Layer: BI Exports
- Lines: 259
- Purpose: JSON configuration or structured data file.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

### `test_api.py`

- Layer: Repository Root
- Lines: 27
- Purpose: Source/configuration file used by this layer.
- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.

## 5. Data, Model, And BI Assets

| Asset | Role |
|---|---|
| `backend/ml/models/*.pkl` | Serialized trained/fallback ML artifacts for price prediction, commercial scoring, anomaly detection, and price history. |
| `backend/ml/models/training_data.csv` | Synthetic training data emitted by the ML training script. |
| `backend/data/sample_properties.json` | Large generated property catalog used by backend fallback/demo loading. |
| `data/datasets/properties/*.csv` | Raw/generated property datasets, including Hyderabad and multi-city sources. |
| `data/datasets/price_history/nhb_residex_quarterly.xlsx` | NHB RESIDEX quarterly price index source. |
| `data/legal_docs/**/*.pdf` | RERA, building rules, title, registration, stamp, and transfer law documents for legal context/RAG. |
| `data/legal_docs/deeds/telangana_sale_deed_template.txt` | Template/legal text used by deed workflows. |
| `data/images/property_photos/*` | Property photos served through backend static image mount or referenced in data. |
| `data/images/thumbnails/*` | Generated thumbnails for property photos. |
| `data/images/images_manifest.json` | Image metadata manifest. |
| `powerbi-export/*` | Power BI CSV, dataset JSON, PBIDS, and workbook exports for admin analytics. |

## 6. Deployment And Environment Notes

- Local development can run backend/frontend separately or use Docker Compose.
- The production-style Dockerfile builds React first, then serves frontend static files and FastAPI through a single Nginx/Python image.
- GitHub Actions currently runs backend tests and builds/pushes the Docker image to Azure Container Registry on `main`.
- Environment variables control SQL/Mongo/Redis, Azure OpenAI, Blob Storage, Document Intelligence, Cognitive Search, Google Places, ElevenLabs, JWT, and Application Insights.
- Secret files are intentionally redacted in this report. Keep actual keys in environment variables or Azure Key Vault.

## 7. Testing Summary

- `backend/tests/test_api.py` is the main automated suite using `httpx.AsyncClient` with ASGI transport.
- It covers health, auth, registration role rules, properties, ML endpoints, stamp duty, RERA manual verification behavior, analytics, GeoJSON, and PropBot behavior.
- `backend/test_integration.py`, `backend/test_azure_sql.py`, and root `test_api.py` are manual smoke/diagnostic scripts against running services.

## 8. Fast Reading Order

1. `frontend/src/App.tsx` for user routes.
2. `frontend/src/utils/api.ts` for frontend-to-backend mapping.
3. Matching files in `backend/app/routers/` for API contracts.
4. `backend/app/services/` for business logic and fallback behavior.
5. `backend/app/db/models.py`, `backend/app/models/*`, and `backend/app/schemas/*` for data shapes.
6. `backend/tests/test_api.py` for executable examples of expected behavior.
