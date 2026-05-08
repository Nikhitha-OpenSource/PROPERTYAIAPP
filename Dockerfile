# Stage 1: Build the React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Final Minimal Runtime Image
FROM python:3.11-slim

# Install ONLY nginx, clean up Linux cache immediately to save space
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx && \
    rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

WORKDIR /app

# Install Python dependencies (no pip cache, strip compiled pyc files)
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt && \
    find /usr/local/lib/python3.11 -name '*.pyc' -delete && \
    find /usr/local/lib/python3.11 -name '__pycache__' -delete

# Copy backend code and static frontend files
COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist /var/www/html

# Configure Nginx to serve the frontend and proxy API requests to FastAPI
RUN echo 'server {\n\
    listen 80;\n\
    location / {\n\
        root /var/www/html;\n\
        index index.html;\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location ~ ^/(api|docs|openapi.json) {\n\
        proxy_pass http://127.0.0.1:8000;\n\
        proxy_set_header Host $host;\n\
    }\n\
}' > /etc/nginx/sites-available/default

# Create startup script
RUN echo '#!/bin/sh\n\
nginx\n\
cd /app/backend && exec uvicorn app.main:app --host 127.0.0.1 --port 8000\n\
' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 80
CMD ["/app/start.sh"]