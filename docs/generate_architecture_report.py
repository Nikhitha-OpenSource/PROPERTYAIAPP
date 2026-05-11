from __future__ import annotations

import ast
import html
import json
import re
import subprocess
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
SECRET_FILES = {".env", "backend/.env", "frontend/.env.local"}
EXCLUDE_DIRS = {".git", "node_modules", "venv", "__pycache__", "dist", "build", ".pytest_cache"}
CODE_EXTS = {
    ".py",
    ".ts",
    ".tsx",
    ".css",
    ".yml",
    ".yaml",
    ".json",
    ".html",
    ".conf",
    ".md",
    ".dockerignore",
    ".gitignore",
}
CODE_NAMES = {"Dockerfile", "docker-compose.yml"}


LAYER_RULES = [
    ("backend/app/routers/", "Backend API Routers"),
    ("backend/app/services/", "Backend Services"),
    ("backend/app/agents/", "AI Agent Layer"),
    ("backend/app/db/", "SQL Persistence"),
    ("backend/app/models/", "Mongo/Pydantic Models"),
    ("backend/app/schemas/", "API Schemas"),
    ("backend/app/utils/", "Backend Utilities"),
    ("backend/ml/training/", "ML Training"),
    ("backend/scripts/", "Backend Data Scripts"),
    ("backend/tests/", "Automated Tests"),
    ("backend/data/sample_deeds/", "Sample Legal Data Tools"),
    ("frontend/src/pages/", "Frontend Pages"),
    ("frontend/src/components/", "Frontend Components"),
    ("frontend/src/utils/", "Frontend Utilities"),
    ("frontend/src/store/", "Frontend State"),
    ("frontend/src/", "Frontend App Shell"),
    ("data-engineering/", "Data Engineering"),
    (".github/workflows/", "CI/CD"),
    ("powerbi-export/", "BI Exports"),
]


FILE_SUMMARY = {
    ".github/workflows/deploy.yml": "GitHub Actions workflow that tests the backend and builds/pushes the unified Docker image to Azure Container Registry.",
    "Dockerfile": "Multi-stage build: compiles the React frontend, installs the Python backend, serves static files with Nginx, and proxies API traffic to FastAPI.",
    "docker-compose.yml": "Local app, MongoDB, and Redis orchestration with environment wiring for Azure, ML, auth, and external APIs.",
    "backend/app/main.py": "FastAPI entry point: startup/shutdown lifespan, middleware, static image serving, router registration, and health endpoint.",
    "backend/app/config.py": "Typed pydantic-settings configuration for app, DBs, Azure services, JWT, external APIs, and ML paths.",
    "backend/app/database.py": "Async MongoDB/Motor singleton client, database handle, collection helpers, startup ping, and shutdown cleanup.",
    "backend/app/db/session.py": "SQLAlchemy engine/session setup, Azure SQL URL normalization, SQLite fallback, table creation, and demo user seeding.",
    "backend/app/db/models.py": "SQLAlchemy ORM entities for users, properties, leads, chat messages, events, reviews, and deed verifications.",
    "backend/app/routers/properties.py": "Property API that merges SQL listings with CSV/JSON fallback listings and exposes detail, map, nearby, history, verify, and delete behavior.",
    "backend/app/routers/predict.py": "ML prediction API for price, appreciation, commercial score, anomaly detection, and locality insights.",
    "backend/app/routers/deeds.py": "Deed/legal workflow API for uploads, OCR verification, admin review, local file serving, stamp duty, timeline, and RERA checks.",
    "backend/app/routers/agents.py": "PropBot API for chat, voice, session history, GUI commands, natural-language search, and legal document Q&A.",
    "backend/app/routers/chat.py": "Buyer/seller WebSocket chat API with JWT validation, persisted messages, active threads, history, and safety alerts.",
    "backend/app/routers/analytics.py": "Market and admin analytics API, including Power BI-ready seller operations datasets.",
    "backend/app/services/data_service.py": "CSV/JSON-backed Hyderabad property catalog, normalization, deterministic coordinates/images/sellers, filtering, GeoJSON, and analytics.",
    "backend/app/services/ml_service.py": "ML inference facade with optional pickle artifacts and heuristic fallbacks for local demos.",
    "backend/app/services/deed_service.py": "Deed file storage, OCR/local extraction, fuzzy name matching, legal checklist/RAG, and verification serialization.",
    "backend/app/services/rag_service.py": "Legal RAG service using FAISS/Azure OpenAI when configured and deterministic legal fallbacks otherwise.",
    "backend/app/services/agent_service.py": "Lightweight PropBot service for intent parsing, curated replies, GUI commands, OpenAI calls, sessions, search, and RAG delegation.",
    "backend/app/services/geocoding_service.py": "Nearby POI lookup with Google Places integration and local mock fallback.",
    "backend/app/agents/propiq_agents.py": "LangChain tool-calling agent with tools for property search, valuation, legal Q&A, commercial scoring, and appreciation forecasting.",
    "backend/app/utils/security.py": "Password hashing, JWT generation/decoding, current-user dependency, mock-token fallback, and role guards.",
    "backend/app/utils/logging.py": "structlog setup with optional Azure Application Insights exporter.",
    "backend/ml/training/train_all.py": "Synthetic ML training pipeline for price prediction, commercial scoring, anomaly detection, and appreciation history artifacts.",
    "backend/scripts/generate_synthetic_data.py": "Generates realistic Hyderabad property data and optionally inserts it into SQL.",
    "backend/scripts/import_all_data.py": "Master data import wizard for property and price-history datasets.",
    "backend/scripts/import_properties_csv.py": "Imports supported real-estate CSV schemas into MongoDB.",
    "backend/scripts/import_price_history.py": "Imports NHB RESIDEX-style price-history Excel/CSV files into MongoDB.",
    "backend/scripts/scrape_images.py": "Scrapes property images, validates/resizes them, writes thumbnails, and exports image metadata.",
    "backend/scripts/seed_mock_to_mongo.py": "Seeds MongoDB with curated sample properties aligned to frontend demo data.",
    "backend/tests/test_api.py": "Main async pytest suite covering backend health, auth, listings, ML, deeds, RERA, analytics, GeoJSON, and agent behavior.",
    "frontend/src/App.tsx": "React route shell with protected routes, navbar, page wiring, and global PropBot widget.",
    "frontend/src/main.tsx": "React entrypoint that mounts the App and imports global styles.",
    "frontend/src/index.css": "Global design system: color tokens, layout helpers, cards, buttons, badges, forms, navbar, hero, maps, chat widget, tables, skeletons, and responsive rules.",
    "frontend/src/store/useStore.ts": "Zustand stores for property list/compare state and persisted auth state.",
    "frontend/src/utils/api.ts": "Axios client plus real/mock API wrappers for properties, chat, prediction, agents, analytics, deeds, auth, formatting, and images.",
    "frontend/src/utils/mockData.ts": "Mock data generators used when VITE_USE_MOCK is enabled.",
    "frontend/src/components/Agent/AgentChat.tsx": "Floating PropBot widget with quick prompts, session chat, voice playback, navigation cards, and GUI command dispatch.",
    "frontend/src/components/Property/PropertyCard.tsx": "Reusable property listing card with image fallback, price/details badges, navigation, and compare action.",
    "frontend/src/components/UI/Navbar.tsx": "Role-aware top navigation and auth actions.",
    "frontend/src/pages/LandingPage.tsx": "Home page with hero search, stats, feature cards, featured listings, top localities, and PropBot CTA.",
    "frontend/src/pages/PropertiesPage.tsx": "Filterable property listing page with grid/list mode and PropBot filter listener.",
    "frontend/src/pages/PropertyDetailPage.tsx": "Property detail page with gallery, valuation, EMI estimate, nearby places, price chart, and seller chat.",
    "frontend/src/pages/MapPage.tsx": "Leaflet map page over backend GeoJSON with price pins and filters.",
    "frontend/src/pages/PredictPage.tsx": "Tabbed AI prediction page for price, commercial score, and appreciation forecast.",
    "frontend/src/pages/DeedPage.tsx": "Legal workflow page for upload, status/timeline, stamp-duty calculation, and RERA check.",
    "frontend/src/pages/AnalyticsPage.tsx": "Market analytics dashboard with KPI cards, trends, locality scores, commercial zones, and heatmap chips.",
    "frontend/src/pages/ComparePage.tsx": "Side-by-side compare page for up to three stored property cards.",
    "frontend/src/pages/LoginPage.tsx": "Login/register form with role selection, auth persistence, and role-based redirects.",
    "frontend/src/pages/ChatPage.tsx": "Property chat page using REST history and authenticated WebSocket messages.",
    "frontend/src/pages/AddPropertyPage.tsx": "Seller/admin multi-step property listing wizard with deed approval gate and final listing submit.",
    "frontend/src/pages/SellerPage.tsx": "Seller dashboard for owned listings, inquiries, mock views/leads, trends, and listing actions.",
    "frontend/src/pages/AdminPage.tsx": "Admin command center for seller analytics, Power BI exports, listing moderation, and buyer deed verification decisions.",
    "data-engineering/scrape_hyderabad.py": "Hyderabad dataset generator and optional live image scraper from 99acres.",
    "data-engineering/utils/html_helpers.py": "Robots.txt, polite fetch, BeautifulSoup, and text helper utilities for scraping.",
    "data-engineering/databricks-notebooks/01_etl_pipeline.py": "PySpark/Databricks ETL: raw property JSON to cleaned features and locality price index Delta tables.",
}


SPECIAL_SYMBOLS = {
    "backend/app/main.py::lifespan": "Runs startup/shutdown work: preloads property data, initializes SQL tables/demo users, connects to MongoDB if available, and closes Mongo on shutdown.",
    "backend/app/main.py::health_check": "Returns a small health payload for uptime checks and tests.",
    "backend/app/routers/properties.py::_property_to_dict": "Converts a SQLAlchemy Property row into the frontend JSON shape.",
    "backend/app/routers/properties.py::list_properties_endpoint": "Applies filters to SQL listings, fetches matching CSV fallback records, deduplicates, and returns a page of results.",
    "backend/app/routers/deeds.py::upload_deed_documents": "Receives deed files, creates a verification row, runs OCR/name/legal checks, and returns serialized status.",
    "backend/app/routers/chat.py::websocket_chat": "Validates token, accepts messages, prevents sender impersonation, persists chat rows, and broadcasts to the channel.",
    "backend/app/services/data_service.py::_row_to_property": "Transforms one raw CSV row into the full property object used by the UI.",
    "backend/app/services/data_service.py::_load_data": "Loads property JSON/CSV once and falls back to synthetic data if loading fails.",
    "backend/app/services/deed_service.py::_upload_to_blob": "Stores a deed file in Azure Blob in cloud mode or local storage in demo mode.",
    "backend/app/services/deed_service.py::run_verification": "Moves a verification through OCR extraction, name matching, legal check, rejection, or admin-review states.",
    "backend/app/services/agent_service.py::_parse_intent": "Extracts simple user intent and filters from plain English for PropBot.",
    "backend/app/services/agent_service.py::chat": "Maintains an in-memory session, builds GUI commands/navigation cards, and returns a PropBot reply.",
    "backend/app/agents/propiq_agents.py::create_propiq_agent": "Builds the LangChain AgentExecutor with PROPIQ tools and prompt.",
    "frontend/src/App.tsx::RequireRole": "Route guard that redirects missing or unauthorized roles.",
    "frontend/src/components/Agent/AgentChat.tsx::send": "Sends the user prompt to the agent API, appends bot replies, stores session ID, and dispatches GUI commands.",
    "frontend/src/components/Agent/AgentChat.tsx::playVoice": "Requests TTS audio for a bot message and plays it in the browser.",
    "frontend/src/pages/PropertiesPage.tsx::fetchProperties": "Builds query params from filters, calls the listing API, and updates loading/list/total state.",
    "frontend/src/pages/AddPropertyPage.tsx::handleNext": "Advances the listing wizard, enforces deed verification at step 3, and submits the final property payload.",
    "frontend/src/pages/AdminPage.tsx::loadDashboard": "Loads property, seller analytics, deed stats, verification rows, and Power BI dataset data in parallel.",
    "frontend/src/pages/AdminPage.tsx::renderDeedTable": "Renders buyer verification packets with document-open, approve, and reject actions.",
}


API_METHOD_HINTS = {
    "list": "API wrapper that lists/searches records for this service group.",
    "get": "API wrapper that fetches one record by ID.",
    "geojson": "API wrapper that fetches map-ready GeoJSON.",
    "nearby": "API wrapper that fetches nearby places.",
    "priceHistory": "API wrapper that fetches price-history data.",
    "create": "API wrapper that creates a new record.",
    "update": "API wrapper that updates a record.",
    "patch": "API wrapper that partially updates a record.",
    "delete": "API wrapper that deletes a record.",
    "chat": "API wrapper for PropBot chat.",
    "voice": "API wrapper for PropBot text-to-speech audio.",
    "login": "API wrapper for role-aware login.",
    "register": "API wrapper for buyer/seller registration.",
    "upload": "API wrapper for deed document upload.",
    "status": "API wrapper for deed status.",
    "verify": "API wrapper to trigger deed verification.",
    "timeline": "API wrapper for legal timeline.",
    "stampDuty": "API wrapper for stamp-duty calculation.",
    "rera": "API wrapper for RERA lookup.",
}


def relpath(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def should_include(path: Path) -> bool:
    if not path.is_file():
        return False
    parts = path.relative_to(ROOT).parts
    if any(part in EXCLUDE_DIRS or part.startswith("pytest-cache-files") for part in parts):
        return False
    if relpath(path) in SECRET_FILES:
        return True
    return path.suffix.lower() in CODE_EXTS or path.name in CODE_NAMES


def layer_for(rel: str) -> str:
    for prefix, layer in LAYER_RULES:
        if rel.startswith(prefix):
            return layer
    if rel.startswith("backend/app/"):
        return "Backend App Core"
    if rel.startswith("backend/"):
        return "Backend Support"
    if rel.startswith("frontend/"):
        return "Frontend Support"
    if rel.startswith("data/"):
        return "Data Assets"
    if rel.startswith("."):
        return "Repository Config"
    return "Repository Root"


def read_text(path: Path) -> str:
    if relpath(path) in SECRET_FILES:
        return ""
    for encoding in ("utf-8", "latin-1"):
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
        except Exception:
            return ""
    return ""


def clean_sentence(text: str) -> str:
    text = re.sub(r"\s+", " ", (text or "").strip())
    if not text:
        return ""
    match = re.search(r"(?<=[.!?])\s+", text)
    return text[: match.start() + 1] if match else text[:240]


def humanize(name: str) -> str:
    clean = name.strip("_") or name
    clean = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", clean)
    return clean.replace("_", " ").replace("-", " ").lower()


def fallback_summary(rel: str) -> str:
    name = Path(rel).name
    if name == "__init__.py":
        return "Package marker so Python can import this directory as a module."
    if rel in SECRET_FILES:
        return "Local environment-variable file; values are intentionally redacted."
    if name == "package-lock.json":
        return "Generated npm dependency lockfile."
    if name == "package.json":
        return "npm package manifest with frontend scripts and dependencies."
    if name.startswith("tsconfig"):
        return "TypeScript compiler configuration."
    if rel.endswith(".css"):
        return "Stylesheet defining visual design and layout rules."
    if rel.endswith((".md", ".gitignore", ".dockerignore")):
        return "Repository documentation or ignore/configuration file."
    if rel.endswith(".json"):
        return "JSON configuration or structured data file."
    if rel.endswith((".yml", ".yaml")):
        return "YAML configuration file."
    if rel.endswith(".html"):
        return "HTML shell or static HTML file."
    return "Source/configuration file used by this layer."


def extract_symbols(path: Path, text: str) -> list[dict]:
    rel = relpath(path)
    ext = path.suffix.lower()
    symbols: list[dict] = []
    if ext == ".py":
        try:
            tree = ast.parse(text)
        except SyntaxError as exc:
            return [{"type": "parse_error", "name": str(exc), "line": getattr(exc, "lineno", 0), "doc": ""}]
        for node in tree.body:
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                symbols.append(
                    {
                        "type": "async function" if isinstance(node, ast.AsyncFunctionDef) else "function",
                        "name": node.name,
                        "line": node.lineno,
                        "doc": ast.get_docstring(node) or "",
                    }
                )
            elif isinstance(node, ast.ClassDef):
                methods = []
                for child in node.body:
                    if isinstance(child, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        methods.append(
                            {
                                "type": "async method" if isinstance(child, ast.AsyncFunctionDef) else "method",
                                "name": child.name,
                                "line": child.lineno,
                                "doc": ast.get_docstring(child) or "",
                            }
                        )
                symbols.append(
                    {
                        "type": "class",
                        "name": node.name,
                        "line": node.lineno,
                        "doc": ast.get_docstring(node) or "",
                        "methods": methods,
                    }
                )
    elif ext in {".ts", ".tsx"}:
        patterns = [
            (r"(?m)^\s*(export\s+)?(interface|type)\s+([A-Za-z0-9_]+)", lambda m: (m.group(2), m.group(3))),
            (r"(?m)^\s*(export\s+default\s+)?function\s+([A-Za-z0-9_]+)\s*\(", lambda m: ("function", m.group(2))),
            (
                r"(?m)^\s*(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?(?:<[^>]+>\s*)?(?:\([^)]*\)|[A-Za-z0-9_]+)\s*=>",
                lambda m: ("function", m.group(1)),
            ),
            (r"(?m)^\s{2,}([A-Za-z0-9_]+):\s*(?:async\s*)?\([^)]*\)\s*=>", lambda m: ("object method", m.group(1))),
        ]
        seen = set()
        for pattern, maker in patterns:
            for match in re.finditer(pattern, text):
                typ, name = maker(match)
                line = text[: match.start()].count("\n") + 1
                key = (typ, name, line)
                if key in seen:
                    continue
                seen.add(key)
                symbols.append({"type": typ, "name": name, "line": line, "doc": ""})
    elif ext in {".yml", ".yaml"}:
        for match in re.finditer(r"(?m)^([A-Za-z0-9_-]+):", text):
            key = match.group(1)
            if key in {"name", "on", "env", "jobs", "services", "volumes"}:
                symbols.append({"type": "yaml section", "name": key, "line": text[: match.start()].count("\n") + 1, "doc": ""})
    return sorted(symbols, key=lambda item: (item.get("line", 0), item.get("name", "")))


def explain_symbol(rel: str, sym: dict) -> str:
    key = f"{rel}::{sym['name']}"
    if key in SPECIAL_SYMBOLS:
        return SPECIAL_SYMBOLS[key]
    doc = clean_sentence(sym.get("doc", ""))
    if doc:
        return doc
    name = sym["name"]
    typ = sym["type"]
    if rel.endswith("api.ts") and name in API_METHOD_HINTS:
        return API_METHOD_HINTS[name]
    if typ in {"interface", "type"}:
        return f"TypeScript {typ} describing the shape of {humanize(name)} data in this module."
    if typ == "class":
        if rel.startswith("backend/app/db/"):
            return f"SQLAlchemy ORM model for the {humanize(name)} entity/table."
        if rel.startswith("backend/app/routers/"):
            return f"Pydantic request/response schema used by this router for {humanize(name)} payloads."
        if rel.startswith(("backend/app/models/", "backend/app/schemas/")):
            return f"Pydantic model/schema for {humanize(name)} data."
        return f"Class grouping data and behavior for {humanize(name)}."
    if name.startswith("test_"):
        return f"Test case that verifies {humanize(name[5:])} behavior."
    if name.startswith("handle"):
        return f"UI event handler for {humanize(name[6:]) or humanize(name)} actions."
    if name.startswith("render"):
        return f"Render helper for the {humanize(name[6:])} section."
    if name.startswith("run"):
        return f"Runs the {humanize(name[3:])} workflow and stores the result."
    if name.startswith("get_") or name.startswith("get"):
        return f"Retrieves or derives {humanize(name)} for this module."
    if name.startswith("create"):
        return f"Creates {humanize(name[6:])} data, UI, or files for this workflow."
    if name.startswith("import"):
        return f"Imports {humanize(name[6:])} data into the configured storage layer."
    if name.startswith("scrape"):
        return f"Scrapes or generates {humanize(name[6:])} data for local datasets."
    if name.startswith("_"):
        return f"Private helper for {humanize(name)} inside this module."
    if rel.endswith(".tsx") and (name.endswith("Page") or name.endswith("Card") or name in {"Navbar", "App", "AgentChat"}):
        return f"React component rendering the {humanize(name)} UI."
    return f"Function/helper implementing {humanize(name)} behavior in this file."


def build_files() -> list[dict]:
    files = []
    for path in sorted(ROOT.rglob("*")):
        if not should_include(path):
            continue
        rel = relpath(path)
        text = read_text(path)
        lines = None if rel in SECRET_FILES else (text.count("\n") + 1 if text else 0)
        files.append(
            {
                "path": rel,
                "layer": layer_for(rel),
                "lines": lines,
                "summary": FILE_SUMMARY.get(rel, fallback_summary(rel)),
                "symbols": [] if rel in SECRET_FILES else extract_symbols(path, text),
            }
        )
    return files


def render_markdown(files: list[dict]) -> str:
    by_layer: dict[str, list[dict]] = {}
    symbol_count = 0
    for file in files:
        by_layer.setdefault(file["layer"], []).append(file)
        for sym in file["symbols"]:
            symbol_count += 1 + len(sym.get("methods", []))

    routes = [
        ("/health", "backend/app/main.py", "Backend health/liveness."),
        ("/api/v1/auth/*", "backend/app/routers/auth.py", "Register, login, refresh."),
        ("/api/v1/properties/*", "backend/app/routers/properties.py", "Listings, map, detail, nearby, price history, moderation."),
        ("/api/v1/predict/*", "backend/app/routers/predict.py", "ML valuation and insight APIs."),
        ("/api/v1/deeds/*", "backend/app/routers/deeds.py", "Document verification, legal utilities, admin review."),
        ("/api/v1/agents/*", "backend/app/routers/agents.py", "PropBot chat, voice, search, document Q&A."),
        ("/api/v1/chat/*", "backend/app/routers/chat.py", "Buyer/seller REST and WebSocket chat."),
        ("/api/v1/analytics/*", "backend/app/routers/analytics.py", "Market/admin analytics and Power BI-shaped data."),
    ]
    frontend_routes = [
        ("/", "LandingPage", "Home/search/featured listings."),
        ("/properties", "PropertiesPage", "Filterable listing browser."),
        ("/properties/map", "MapPage", "Leaflet map over GeoJSON."),
        ("/properties/:id", "PropertyDetailPage", "Details, valuation, nearby, EMI, chat CTA."),
        ("/properties/:id/chat", "ChatPage", "Buyer/seller chat."),
        ("/list-property", "AddPropertyPage", "Protected listing wizard."),
        ("/predict/commercial", "PredictPage", "Price/commercial/appreciation tools."),
        ("/deeds", "DeedPage", "Legal workflow tools."),
        ("/analytics", "AnalyticsPage", "Market dashboard."),
        ("/compare", "ComparePage", "Compare shortlisted properties."),
        ("/login", "LoginPage", "Auth flow."),
        ("/seller", "SellerPage", "Seller dashboard."),
        ("/admin", "AdminPage", "Admin command center."),
    ]

    md: list[str] = []
    add = md.append
    add("# PROPIQ AI Architecture And Code Explanation")
    add("")
    add(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}.")
    add("")
    add("Scope: source code, tests, config, workflows, scripts, and major data/model/BI assets. Generated/vendor/build/cache folders are excluded. Environment files are listed only by purpose; secret values are not included.")
    add("")
    add("## Table Of Contents")
    add("[TOC]")
    add("")
    add("## 1. Architecture Overview")
    add("")
    add("PROPIQ AI is a Hyderabad/Telangana real-estate intelligence platform. The frontend is a React/Vite SPA. The backend is FastAPI with SQL persistence, Mongo helpers, CSV/JSON fallback data, ML services, deed verification, PropBot agent APIs, chat, analytics, and Power BI export support.")
    add("")
    add("```text")
    add("Browser")
    add("  -> React/Vite SPA: routes, pages, Zustand state, Axios wrappers, Leaflet/Recharts")
    add("  -> FastAPI /api/v1")
    add("       Auth -> SQL User -> JWT")
    add("       Properties -> SQL listings + CSV/JSON fallback + static /images")
    add("       Predict -> MLService -> pickle models or heuristics")
    add("       Deeds -> DeedService -> storage, OCR, fuzzy match, legal checklist")
    add("       Agents -> AgentService/LangChain -> Azure OpenAI or fallback replies")
    add("       Chat -> WebSocket + SQL ChatMessage")
    add("       Analytics -> SQL seller ops + MLService + Power BI-shaped tables")
    add("  -> Storage/integrations: SQLite/Azure SQL, MongoDB, Redis, Azure OpenAI, Blob Storage, Document Intelligence, Google Places, ElevenLabs, Power BI")
    add("```")
    add("")
    add("### Layer Summary")
    add("")
    add("| Layer | Role |")
    add("|---|---|")
    add("| Frontend pages/components | User workflows and UI for search, map, valuation, deeds, analytics, chat, seller, and admin screens. |")
    add("| Frontend utilities/state | Axios wrappers, mock mode, INR formatting, placeholder image selection, persisted auth, compare state. |")
    add("| API routers | HTTP/WebSocket contract between UI and backend. |")
    add("| Services | Business logic and cloud/local fallback boundaries. |")
    add("| Persistence models | SQLAlchemy tables plus Pydantic document/API schemas. |")
    add("| ML/data engineering | Synthetic training, CSV imports, image scraping, Databricks ETL. |")
    add("| Deployment/BI | Docker, Compose, GitHub Actions, Nginx, Power BI exports. |")
    add("")
    add("### Main Runtime Flows")
    add("")
    add("1. Property browsing: React calls `propertiesApi`; FastAPI merges SQL listings with fallback catalog data; UI renders cards, details, map pins, price history, and compare state.")
    add("2. AI valuation: `PredictPage` and detail pages call `/predict`; `MLService` returns model-backed or heuristic results.")
    add("3. Deed verification: `DeedPage` uploads files; `DeedService` stores them, runs OCR/local extraction, fuzzy-matches names, attaches legal checklist text, and exposes admin decisions.")
    add("4. PropBot: `AgentChat` calls `/agents/chat`; `AgentService` parses intent and returns replies, navigation cards, and UI commands.")
    add("5. Buyer/seller chat: `ChatPage` opens a tokenized WebSocket; backend persists and broadcasts messages.")
    add("6. Admin/BI: `AdminPage` loads seller operations, deed summaries, verification rows, and Power BI-shaped tables.")
    add("")
    add("## 2. Route Maps")
    add("")
    add("### Backend API")
    add("")
    add("| Endpoint | File | Purpose |")
    add("|---|---|---|")
    for endpoint, file, purpose in routes:
        add(f"| `{endpoint}` | `{file}` | {purpose} |")
    add("")
    add("### Frontend")
    add("")
    add("| Route | Component | Purpose |")
    add("|---|---|---|")
    for route, component, purpose in frontend_routes:
        add(f"| `{route}` | `{component}` | {purpose} |")
    add("")
    add("## 3. File Catalog")
    add("")
    add(f"This report covers {len(files)} text/source/config files and {symbol_count} extracted classes, functions, methods, and YAML sections.")
    add("")
    for layer in sorted(by_layer):
        add(f"### {layer}")
        add("")
        add("| File | Lines | Purpose |")
        add("|---|---:|---|")
        for file in sorted(by_layer[layer], key=lambda item: item["path"]):
            lines = "secret" if file["lines"] is None else str(file["lines"])
            add(f"| `{file['path']}` | {lines} | {file['summary']} |")
        add("")
    add("## 4. File-By-File And Function Reference")
    add("")
    add("Each entry includes file purpose and every extracted top-level function/class plus class methods where present.")
    add("")
    for file in sorted(files, key=lambda item: item["path"]):
        rel = file["path"]
        add(f"### `{rel}`")
        add("")
        add(f"- Layer: {file['layer']}")
        add(f"- Lines: {'not read; secret values redacted' if file['lines'] is None else file['lines']}")
        add(f"- Purpose: {file['summary']}")
        if rel in SECRET_FILES:
            add("- Functions/classes: environment values only; intentionally not included.")
            add("")
            continue
        if not file["symbols"]:
            add("- Functions/classes: none extracted. This is configuration, styles, static documentation, package metadata, package marker content, or structured data.")
            add("")
            continue
        add("")
        add("| Line | Symbol | What It Does |")
        add("|---:|---|---|")
        for sym in file["symbols"]:
            add(f"| {sym.get('line', 0)} | `{sym['type']} {sym['name']}` | {explain_symbol(rel, sym)} |")
            for method in sym.get("methods", []):
                explanation = clean_sentence(method.get("doc", "")) or f"Method on `{sym['name']}` that handles {humanize(method['name'])} behavior."
                add(f"| {method.get('line', 0)} | `{method['type']} {sym['name']}.{method['name']}` | {explanation} |")
        add("")
    add("## 5. Data, Model, And BI Assets")
    add("")
    add("| Asset | Role |")
    add("|---|---|")
    assets = [
        ("backend/ml/models/*.pkl", "Serialized trained/fallback ML artifacts for price prediction, commercial scoring, anomaly detection, and price history."),
        ("backend/ml/models/training_data.csv", "Synthetic training data emitted by the ML training script."),
        ("backend/data/sample_properties.json", "Large generated property catalog used by backend fallback/demo loading."),
        ("data/datasets/properties/*.csv", "Raw/generated property datasets, including Hyderabad and multi-city sources."),
        ("data/datasets/price_history/nhb_residex_quarterly.xlsx", "NHB RESIDEX quarterly price index source."),
        ("data/legal_docs/**/*.pdf", "RERA, building rules, title, registration, stamp, and transfer law documents for legal context/RAG."),
        ("data/legal_docs/deeds/telangana_sale_deed_template.txt", "Template/legal text used by deed workflows."),
        ("data/images/property_photos/*", "Property photos served through backend static image mount or referenced in data."),
        ("data/images/thumbnails/*", "Generated thumbnails for property photos."),
        ("data/images/images_manifest.json", "Image metadata manifest."),
        ("powerbi-export/*", "Power BI CSV, dataset JSON, PBIDS, and workbook exports for admin analytics."),
    ]
    for asset, role in assets:
        add(f"| `{asset}` | {role} |")
    add("")
    add("## 6. Deployment And Environment Notes")
    add("")
    add("- Local development can run backend/frontend separately or use Docker Compose.")
    add("- The production-style Dockerfile builds React first, then serves frontend static files and FastAPI through a single Nginx/Python image.")
    add("- GitHub Actions currently runs backend tests and builds/pushes the Docker image to Azure Container Registry on `main`.")
    add("- Environment variables control SQL/Mongo/Redis, Azure OpenAI, Blob Storage, Document Intelligence, Cognitive Search, Google Places, ElevenLabs, JWT, and Application Insights.")
    add("- Secret files are intentionally redacted in this report. Keep actual keys in environment variables or Azure Key Vault.")
    add("")
    add("## 7. Testing Summary")
    add("")
    add("- `backend/tests/test_api.py` is the main automated suite using `httpx.AsyncClient` with ASGI transport.")
    add("- It covers health, auth, registration role rules, properties, ML endpoints, stamp duty, RERA manual verification behavior, analytics, GeoJSON, and PropBot behavior.")
    add("- `backend/test_integration.py`, `backend/test_azure_sql.py`, and root `test_api.py` are manual smoke/diagnostic scripts against running services.")
    add("")
    add("## 8. Fast Reading Order")
    add("")
    add("1. `frontend/src/App.tsx` for user routes.")
    add("2. `frontend/src/utils/api.ts` for frontend-to-backend mapping.")
    add("3. Matching files in `backend/app/routers/` for API contracts.")
    add("4. `backend/app/services/` for business logic and fallback behavior.")
    add("5. `backend/app/db/models.py`, `backend/app/models/*`, and `backend/app/schemas/*` for data shapes.")
    add("6. `backend/tests/test_api.py` for executable examples of expected behavior.")
    add("")
    return "\n".join(md)


def write_outputs(markdown_text: str) -> dict:
    md_path = DOCS / "PROPIQ_AI_Architecture_Code_Explanation.md"
    html_path = DOCS / "PROPIQ_AI_Architecture_Code_Explanation.html"
    pdf_path = DOCS / "PROPIQ_AI_Architecture_Code_Explanation.pdf"
    md_path.write_text(markdown_text, encoding="utf-8")

    try:
        import markdown

        body = markdown.markdown(markdown_text, extensions=["toc", "tables", "fenced_code"])
    except Exception:
        body = "<pre>" + html.escape(markdown_text) + "</pre>"

    css = """
@page { size: A4; margin: 15mm 12mm; }
body { font-family: "Segoe UI", Arial, sans-serif; line-height: 1.44; color: #1f2d3a; max-width: 980px; margin: 0 auto; padding: 22px; }
h1 { color: #1B4F72; font-size: 34px; border-bottom: 4px solid #2E86C1; padding-bottom: 12px; }
h2 { color: #1B4F72; font-size: 24px; margin-top: 34px; border-bottom: 1px solid #D9E2EA; padding-bottom: 8px; page-break-after: avoid; }
h3 { color: #173f5f; font-size: 18px; margin-top: 24px; page-break-after: avoid; }
p, li { font-size: 13px; }
code { font-family: Consolas, "Courier New", monospace; background: #EEF4F8; color: #15384F; padding: 1px 4px; border-radius: 3px; }
pre { background: #0F2233; color: #F4FBFF; padding: 14px; border-radius: 8px; overflow-x: auto; font-size: 12px; white-space: pre-wrap; }
pre code { background: transparent; color: inherit; padding: 0; }
table { width: 100%; border-collapse: collapse; margin: 12px 0 18px; font-size: 12px; page-break-inside: auto; }
th { background: #1B4F72; color: white; text-align: left; padding: 7px 8px; }
td { border: 1px solid #D9E2EA; vertical-align: top; padding: 6px 8px; }
tr:nth-child(even) td { background: #F6F9FC; }
a { color: #2E86C1; text-decoration: none; }
.toc ul { list-style: none; padding-left: 16px; }
"""
    html_text = (
        '<!doctype html><html><head><meta charset="utf-8">'
        "<title>PROPIQ AI Architecture And Code Explanation</title>"
        f"<style>{css}</style></head><body>{body}</body></html>"
    )
    html_path.write_text(html_text, encoding="utf-8")

    edge = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")
    if edge.exists():
        subprocess.run(
            [
                str(edge),
                "--headless",
                "--disable-gpu",
                f"--print-to-pdf={pdf_path}",
                html_path.resolve().as_uri(),
            ],
            check=False,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

    return {
        "markdown": str(md_path),
        "html": str(html_path),
        "pdf": str(pdf_path),
        "pdf_exists": pdf_path.exists(),
    }


def main() -> None:
    files = build_files()
    markdown_text = render_markdown(files)
    result = write_outputs(markdown_text)
    result["files"] = len(files)
    result["symbols"] = sum(1 + len(sym.get("methods", [])) for file in files for sym in file["symbols"])
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
