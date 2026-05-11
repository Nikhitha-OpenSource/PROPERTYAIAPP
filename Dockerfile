# Stage 1: build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: unified runtime image
FROM python:3.11-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    APP_ENV=production \
    DEBUG=false \
    DATABASE_FALLBACK_SQLITE=true \
    SEED_DEMO_USERS=true

# Nginx serves the SPA; ODBC Driver 18 keeps Azure SQL usable when configured.
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl ca-certificates gnupg nginx unixodbc libgomp1 && \
    install -d /etc/apt/keyrings && \
    curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /etc/apt/keyrings/microsoft.gpg && \
    echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/microsoft.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" > /etc/apt/sources.list.d/mssql-release.list && \
    apt-get update && \
    ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt && \
    find /usr/local/lib/python3.11 -name '*.pyc' -delete && \
    find /usr/local/lib/python3.11 -name '__pycache__' -delete

# Copy backend code and static frontend files
COPY backend/ ./backend/
RUN python /app/backend/scripts/prepare_runtime_assets.py
COPY --from=frontend-builder /app/frontend/dist /var/www/html

# Configure Nginx to serve the frontend and proxy API requests to FastAPI
RUN printf '%s\n' \
    'server {' \
    '    listen 80;' \
    '    client_max_body_size 25m;' \
    '    location / {' \
    '        root /var/www/html;' \
    '        index index.html;' \
    '        try_files $uri $uri/ /index.html;' \
    '    }' \
    '    location ~ ^/(api|docs|redoc|openapi.json|health) {' \
    '        proxy_pass http://127.0.0.1:8000;' \
    '        proxy_http_version 1.1;' \
    '        proxy_set_header Host $host;' \
    '        proxy_set_header X-Real-IP $remote_addr;' \
    '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' \
    '        proxy_set_header X-Forwarded-Proto $scheme;' \
    '    }' \
    '}' > /etc/nginx/sites-available/default

# Create startup script
RUN mkdir -p /app/backend/storage/deed-documents && \
    printf '%s\n' \
    '#!/bin/sh' \
    'set -e' \
    'nginx' \
    'cd /app/backend' \
    'exec python -m uvicorn app.main:app --host 127.0.0.1 --port 8000' \
    > /app/start.sh && chmod +x /app/start.sh

EXPOSE 80
CMD ["/app/start.sh"]
