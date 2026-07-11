"""
Pytest fixtures and shared test configuration.

All Google Cloud services are mocked so tests run without GCP credentials.
Feature flags are all set to False via environment variables in CI.
"""

from __future__ import annotations

import os
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

# Force all GCP services OFF before importing the app
os.environ.setdefault("USE_GEMINI", "false")
os.environ.setdefault("USE_FIRESTORE", "false")
os.environ.setdefault("USE_BIGQUERY", "false")
os.environ.setdefault("USE_PUBSUB", "false")
os.environ.setdefault("PROJECT_ID", "test-project")

from app.main import app  # noqa: E402


@pytest.fixture(scope="session")
def client() -> TestClient:
    """FastAPI test client — reused across all tests in a session."""
    return TestClient(app)


@pytest.fixture
def mock_gemini_fan():
    """Mock the Gemini service to return a predictable fan assistant response."""
    mock_response = {
        "reply": "The nearest accessible restroom is at the North Concourse, about 2 minutes walk from your current location.",
        "language": "en",
        "category": "accessibility",
        "suggested_actions": [
            "Get directions to North Restrooms",
            "Check wait times",
            "Find first aid station",
        ],
    }
    with patch(
        "app.routes.assistant.generate_fan_response",
        new_callable=AsyncMock,
    ) as mock:
        mock.return_value = mock_response
        yield mock


@pytest.fixture
def mock_gemini_crowd():
    """Mock the Gemini crowd analysis to return predictable alerts."""
    from app.models.stadium import CrowdAlert

    mock_alerts = [
        CrowdAlert(
            zone_id="gate-a",
            severity="warning",
            message="Gate A is at 85% capacity with 12 min wait.",
            recommended_action="Open additional screening lanes.",
            estimated_impact="Reduce wait time by 5 minutes.",
        ),
        CrowdAlert(
            zone_id="food-court-a",
            severity="critical",
            message="Food Court A is at 95% capacity.",
            recommended_action="Redirect fans to Food Court B via digital signage.",
            estimated_impact="Reduce congestion by 20% within 10 minutes.",
        ),
    ]
    with patch(
        "app.routes.crowd.generate_crowd_alerts",
        new_callable=AsyncMock,
    ) as mock:
        mock.return_value = mock_alerts
        yield mock


@pytest.fixture
def sample_fan_query() -> dict:
    """Realistic fan query payload for use across multiple tests."""
    return {
        "message": "Where is the nearest wheelchair-accessible restroom?",
        "language": "en",
        "stadium_id": "stadium-alpha",
        "session_id": "test-session-001",
        "category": "accessibility",
    }
