# PROPIQ AI - Intelligent Real Estate Platform

Capstone Project | Left Shift 2026 T5 | Smart Real Estate Intelligence Suite

Full project documentation: [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)

## Quick Start

### Option 1: Docker

```powershell
cd D:\CAPSTONE
docker compose up --build
```

- Unified app: http://localhost
- Backend API: http://localhost/api/v1
- Swagger Docs: http://localhost/docs

### Option 2: Local Development

Backend:

```powershell
cd D:\CAPSTONE\backend
venv\Scripts\activate
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```powershell
cd D:\CAPSTONE\frontend
npm run dev -- --host 127.0.0.1
```

- Frontend: http://127.0.0.1:5173
- Backend health: http://127.0.0.1:8000/health

## Architecture

- Frontend: React 18, TypeScript, Vite, Leaflet, Recharts
- Backend: FastAPI, SQLAlchemy, Pydantic
- Databases: SQLite/Azure SQL plus MongoDB
- AI Agents: LangChain, CrewAI, Azure OpenAI or local fallback behavior
- ML Models: XGBoost, Prophet-style forecasting data, Gradient Boosting, Isolation Forest
- Cloud: Azure OpenAI, Blob Storage, Document Intelligence, Cognitive Search, Azure ML
- BI: Power BI workbook, PBIDS files, CSV exports, dataset JSON

## Key Directories

```text
backend/app/routers/      FastAPI route handlers
backend/app/services/     Business logic, ML, RAG, deed, geocoding, agent services
backend/app/agents/       Agent definitions
backend/ml/training/      ML model training scripts
frontend/src/pages/       React pages
frontend/src/components/  Reusable components
data/                     Local datasets, images, legal documents
data-engineering/         Scraping and Databricks ETL assets
powerbi-export/           Power BI workbook and export data
```

## Testing

```powershell
cd D:\CAPSTONE\backend
venv\Scripts\activate
pytest tests\ -v
```

## ML Training

```powershell
cd D:\CAPSTONE\backend
venv\Scripts\activate
python ml\training\train_all.py
```

## Documentation

Read [PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md) for:

- Full architecture and data flow
- Frontend route map
- Backend API map
- Environment variable reference
- Docker and local setup
- ML, data import, Power BI, and troubleshooting notes
