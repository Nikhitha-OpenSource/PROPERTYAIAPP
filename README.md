# 🏢 PROPIQ AI — Comprehensive Project Documentation

PROPIQ AI is an intelligent, AI-driven real estate platform tailored for the Indian market (specifically Hyderabad/Telangana). It combines Natural Language Processing (NLP), Machine Learning (ML), OCR, and Retrieval-Augmented Generation (RAG) to help users search for properties, predict prices, score commercial viability, and verify complex legal documents.

This document explains the technology stack, the architecture, and how each component works under the hood.

---

## 1. 🛠️ Technology Stack (What we used & Why)

### **Frontend (User Interface)**
- **React.js & TypeScript**: Core framework for building a robust, strictly-typed single-page application.
- **Vite**: Ultra-fast build tool and development server used to bundle the React app.
- **Lucide React**: Icon library used across the dashboard (e.g., bot icons, upload icons).
- **React Router**: For seamless client-side navigation between Properties, Deeds, Analytics, and Compare pages.

### **Backend (API & Core Logic)**
- **Python 3.11**: Primary language for AI, ML, and backend logic.
- **FastAPI**: Extremely fast asynchronous web framework for Python. Serves the API endpoints (`/chat`, `/voice`, `/doc-query`) that the frontend consumes.
- **Pytest**: Used in the CI/CD pipeline to ensure backend code reliability before deployment.

### **AI, ML, and Data processing**
- **LangChain**: Orchestration framework used to connect LLMs to external tools (Property Search, ML Models, Legal Docs).
- **Azure OpenAI (GPT-4o)**: The core "brain" of PropBot. Processes user intent and decides which tools to call.
- **Scikit-Learn (Pickle files)**: Used for the predictive ML models (`price_predictor.pkl`, `commercial_scorer.pkl`).
- **Azure Document Intelligence**: Advanced OCR used to read scanned sale deeds, ECs, and Pattas to extract owner names and survey numbers.
- **ElevenLabs API**: Converts PropBot's text responses into ultra-realistic spoken audio in real-time.

### **Databases & Storage**
- **MongoDB**: NoSQL database used to store extracted document schemas (like the extracted JSON from a sale deed).
- **Redis**: In-memory cache used to store temporary user session data and speed up frequent queries.
- **SQLite / SQLAlchemy**: Used for standard relational data (Users, Auth).
- **Azure Blob Storage**: Securely stores uploaded user deeds (`deed-documents`) and property photos (`property-images`).

### **Infrastructure & DevOps**
- **Docker**: Containerizes the entire application. Uses a "Multi-Stage Build" to compile the React frontend, throw away the heavy Node.js engine, and serve the static files alongside the Python API.
- **Nginx**: A lightweight web server running inside the Docker container. It serves the React UI on Port 80 and silently acts as a "Reverse Proxy", routing `/api` requests to FastAPI running on Port 8000.
- **GitHub Actions**: Automated CI/CD pipeline (`deploy.yml`) that runs tests, builds the Docker image in the cloud, and pushes it to Azure.
- **Azure Container Apps**: Serverless cloud environment that hosts the final Docker image.

---

## 2. 🧠 Core Features: How Everything Works Together

### A. The AI Agent: "PropBot" (`propiq_agents.py` & `AgentChat.tsx`)
**What it does:** Acts as a floating chat assistant that can control the screen, answer questions, and speak.
**How it works:**
1. The user types "Show me 3BHK in Kondapur under 80L".
2. The frontend sends this to the FastAPI backend (`/chat`).
3. **LangChain** passes the prompt to **Azure OpenAI**.
4. Azure OpenAI realizes it needs to use the `search_properties` tool.
5. The tool extracts `locality: Kondapur`, `bhk: 3`, `max_price: 8000000`.
6. The backend returns a `GUI_COMMAND` (e.g., `APPLY_FILTER`) along with the text response.
7. The frontend React app catches this command and physically clicks/updates the UI filters for the user.
8. The frontend then sends the text response to the `/voice` endpoint, where **ElevenLabs** streams back an MP3 of the bot speaking.

### B. Smart Deed & Legal Verification (`DeedPage.tsx`)
**What it does:** Automates the painful process of verifying land deeds and RERA registrations.
**How it works:**
1. User uploads a scanned PDF/JPG of a Sale Deed and inputs the "Declared Owner Name".
2. The files are securely uploaded to **Azure Blob Storage**.
3. **Azure Document Intelligence** (OCR) scans the image, reading the text to find the exact "Extracted Name" on the document.
4. A matching algorithm compares the Declared Name vs Extracted Name and gives a match score (e.g., 97%).
5. An AI model estimates the legal timeline based on historical Telangana data (e.g., 28 Days to register).
6. A separate tab uses the **RERA Tool** to verify project numbers against the official Telangana RERA registry.

### C. Commercial Viability Score (`commercial_scorer.pkl`)
**What it does:** Tells an investor if a piece of empty land is worth buying for a commercial building.
**How it works:**
1. User inputs: FSI (Floor Space Index), Road Width, and Land Use Zone.
2. The backend loads the pre-trained Scikit-Learn model.
3. The ML model outputs a score from 0-100 (e.g., 74/100).
4. The system translates this score into human-readable advice: "High FSI ratio enables multi-floor development. Good road width ensures accessibility."

### D. Property Price Prediction (`price_predictor.pkl`)
**What it does:** Prevents users from overpaying by giving an AI-estimated fair value.
**How it works:**
1. User inputs Locality, Area (sqft), Age, BHK, and Furnishing status.
2. The backend ML model compares these parameters against historical pricing data for Hyderabad.
3. It returns a highly accurate estimate (e.g., ₹85 Lakhs) with a high/low confidence interval bracket.

### E. Legal RAG Pipeline (`rag_service.py`)
**What it does:** Allows the bot to answer highly specific legal questions without hallucinating.
**How it works:**
1. We provided raw text files (like `telangana_sale_deed_template.txt`) to the system.
2. When a user asks "How long does a deed transfer take?", the system converts the question into a mathematical vector (Embedding).
3. **Azure AI Search** looks for the most relevant text in our legal documents.
4. The relevant text is injected into the LLM prompt: *"Answer the user using ONLY this official document text."*

---

## 3. 📂 Project Directory Structure

```text
D:\CAPSTONE\
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions CI/CD automation script
├── backend/
│   ├── app/
│   │   ├── agents/         # LangChain logic, tools, and PropBot definition
│   │   ├── routers/        # FastAPI endpoints (/chat, /voice)
│   │   ├── services/       # Core business logic (RAG, database connections)
│   │   └── main.py         # Backend server entry point
│   ├── ml/models/          # Pre-trained Scikit-Learn .pkl files
│   ├── tests/              # Pytest automated testing suite
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     # React UI elements (AgentChat, Navigation)
│   │   ├── pages/          # Full page views (DeedPage, Analytics, Properties)
│   │   ├── utils/          # API Axios configurations and MockData
│   │   └── App.tsx         # React application router
│   └── package.json        # Node.js dependencies
├── data/
│   ├── legal_docs/         # Raw text files used for the RAG pipeline
│   └── images/             # Property photos (scraped via Python scripts)
├── Dockerfile              # The unified build instructions for the container
├── docker-compose.yml      # Local dev environment (Spins up App, MongoDB, Redis)
├── .dockerignore           # Prevents massive files from crashing the build
└── .gitignore              # Hides secrets and API keys from GitHub
```

---

## 4. 🚀 The Deployment Journey (Code to Cloud)

This project utilizes a highly modern, cloud-native deployment strategy:

1. **Develop Local:** You write code on your PC. You use `docker-compose up` to run the app locally alongside MongoDB and Redis.
2. **Push to GitHub:** You run `git push origin main`.
3. **GitHub Takes Over:** GitHub Actions reads `deploy.yml`. It spins up an Ubuntu server in the cloud, installs Python, and runs your `pytest` suite.
4. **Building the Artifact:** GitHub builds your `Dockerfile`. It compiles the React app, bundles it with Python and Nginx, and shrinks it down to a tiny footprint.
5. **Azure Registry:** GitHub logs into your Azure Container Registry (`proai.azurecr.io`) and securely pushes the newly built image.
6. **Go Live:** Azure Container Apps pulls the new image, injects your secret API keys (OpenAI, ElevenLabs) securely from Azure Key Vault, and spins up the live website on Port 80.

Everything happens automatically in under 5 minutes without you lifting a finger!
