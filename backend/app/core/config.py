"""
Application configuration via environment variables.

Uses pydantic-settings so all values can be overridden with env vars
or a .env file during local development.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.

    Feature flags (USE_*) default to True for production-like behaviour.
    Set them to False in local development to avoid needing GCP credentials.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # -----------------------------------------------------------------------
    # Google Cloud
    # -----------------------------------------------------------------------
    PROJECT_ID: str = Field(default="my-gcp-project", description="GCP project ID")
    REGION: str = Field(default="us-central1", description="GCP region for Vertex AI")

    # -----------------------------------------------------------------------
    # Feature Flags
    # -----------------------------------------------------------------------
    USE_GEMINI: bool = Field(
        default=True,
        description="Enable Vertex AI Gemini for AI assistant (requires GCP credentials)",
    )
    USE_FIRESTORE: bool = Field(
        default=True,
        description="Enable Firestore persistence (requires GCP credentials)",
    )
    USE_BIGQUERY: bool = Field(
        default=True,
        description="Enable BigQuery analytics logging (requires GCP credentials)",
    )
    USE_PUBSUB: bool = Field(
        default=True,
        description="Enable Pub/Sub event publishing (requires GCP credentials)",
    )

    # -----------------------------------------------------------------------
    # BigQuery
    # -----------------------------------------------------------------------
    BIGQUERY_DATASET: str = Field(
        default="stadium_analytics",
        description="BigQuery dataset containing stadium analytics tables",
    )
    BIGQUERY_TABLE: str = Field(
        default="stadium_events",
        description="BigQuery table for anonymised stadium event logging",
    )

    # -----------------------------------------------------------------------
    # Pub/Sub
    # -----------------------------------------------------------------------
    PUBSUB_TOPIC: str = Field(
        default="stadium-events",
        description="Pub/Sub topic name for stadium operation events",
    )

    # -----------------------------------------------------------------------
    # Gemini / Vertex AI
    # -----------------------------------------------------------------------
    GEMINI_MODEL: str = Field(
        default="gemini-2.0-flash",
        description="Vertex AI Generative Model identifier",
    )
    GEMINI_API_KEY: str | None = Field(
        default=None,
        description="Google AI Studio Gemini API Key",
    )

    # -----------------------------------------------------------------------
    # Application
    # -----------------------------------------------------------------------
    ENVIRONMENT: str = Field(
        default="development",
        description="Runtime environment: development | staging | production",
    )
    LOG_LEVEL: str = Field(
        default="INFO",
        description="Python logging level: DEBUG | INFO | WARNING | ERROR",
    )
    MAX_CHAT_HISTORY: int = Field(
        default=50,
        ge=1,
        le=200,
        description="Maximum number of chat messages retained per session",
    )
    THE_STATS_API_KEY: str | None = Field(
        default=None,
        description="API Key for www.thestatsapi.com",
    )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings (singleton)."""
    return Settings()
