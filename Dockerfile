# ==========================================
# Stage 1: Build the React Frontend
# ==========================================
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Runtime Environment
# ==========================================
FROM python:3.11-slim AS runtime
WORKDIR /app

# Install dev and production requirements (for health checks and uvicorn)
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application files
COPY backend/app/ ./app/
COPY backend/data/ ./data/

# Copy built frontend assets to the static directory expected by FastAPI
COPY --from=frontend-builder /app/frontend/dist/ ./static/

# Environment configurations
ENV PORT=8080 \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Expose target port
EXPOSE 8080

# Command to run under Cloud Run (using standard exec form)
CMD exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
