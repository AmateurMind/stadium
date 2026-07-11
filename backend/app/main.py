"""
StadiumSync — FastAPI application entry point.

Architecture:
  - SecurityHeadersMiddleware: OWASP-style security headers
  - CORSMiddleware: local development origins
  - slowapi rate limiting: per-IP throttling
  - Router mounts: /api/health, /api/assistant, /api/crowd, /api/zones
  - SPA fallback: serves the compiled React app for non-API paths
"""

from __future__ import annotations

import logging
import os
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from typing import Any, cast

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.core.security import SecurityHeadersMiddleware
from app.routes import assistant, crowd, health, zones, grounds


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Configure logging during startup and shutdown."""
    settings = get_settings()
    logging.basicConfig(
        level=getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s - %(message)s",
    )
    logging.getLogger(__name__).info(
        "StadiumSync starting up (env=%s, gemini=%s, firestore=%s)",
        settings.ENVIRONMENT,
        settings.USE_GEMINI,
        settings.USE_FIRESTORE,
    )
    yield
    logging.getLogger(__name__).info("StadiumSync shutting down")


app = FastAPI(
    title="StadiumSync API",
    description=(
        "GenAI-enabled smart stadium operations platform for the "
        "FIFA World Cup 2026. Provides multilingual fan assistance, "
        "real-time crowd management, and operational intelligence."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(SecurityHeadersMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
    max_age=3600,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, cast(Any, _rate_limit_exceeded_handler))

app.include_router(health.router, prefix="/api")
app.include_router(assistant.router, prefix="/api")
app.include_router(crowd.router, prefix="/api")
app.include_router(zones.router, prefix="/api")
app.include_router(grounds.router, prefix="/api")

_static_path = os.path.join(os.path.dirname(__file__), "..", "static")
_assets_path = os.path.join(_static_path, "assets")

if os.path.isdir(_assets_path):
    app.mount("/assets", StaticFiles(directory=_assets_path), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str) -> FileResponse:
        """Serve the React SPA for all non-API routes."""
        return FileResponse(os.path.join(_static_path, "index.html"))
