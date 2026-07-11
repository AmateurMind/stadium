"""
Gemini fallback / resilience tests for StadiumSync.

Verifies that the application gracefully falls back to rule-based
responses when Gemini is unavailable — matching carbon-wise's
test_gemini_fallback.py approach.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.services.gemini_service import GeminiUnavailableError


class TestFanAssistantFallback:
    """Tests for fan assistant Gemini fallback behaviour."""

    def test_gemini_error_falls_back_to_rules(
        self, client: TestClient, sample_fan_query: dict
    ) -> None:
        with patch(
            "app.routes.assistant.generate_fan_response",
            new_callable=AsyncMock,
            side_effect=GeminiUnavailableError("Network error"),
        ):
            # Need to also enable Gemini for this test
            with patch("app.routes.assistant.get_settings") as mock_settings:
                mock_settings.return_value.USE_GEMINI = True
                response = client.post("/api/assistant", json=sample_fan_query)

        assert response.status_code == 200
        data = response.json()
        assert data["source"] == "rules"
        assert len(data["reply"]) > 0

    def test_gemini_timeout_falls_back_to_rules(
        self, client: TestClient, sample_fan_query: dict
    ) -> None:
        with patch(
            "app.routes.assistant.generate_fan_response",
            new_callable=AsyncMock,
            side_effect=GeminiUnavailableError("Timeout"),
        ):
            with patch("app.routes.assistant.get_settings") as mock_settings:
                mock_settings.return_value.USE_GEMINI = True
                response = client.post("/api/assistant", json=sample_fan_query)

        assert response.status_code == 200
        data = response.json()
        assert data["source"] == "rules"

    def test_gemini_success_returns_gemini_source(
        self, client: TestClient, sample_fan_query: dict, mock_gemini_fan: AsyncMock
    ) -> None:
        with patch("app.routes.assistant.get_settings") as mock_settings:
            mock_settings.return_value.USE_GEMINI = True
            response = client.post("/api/assistant", json=sample_fan_query)

        assert response.status_code == 200
        data = response.json()
        assert data["source"] == "gemini"

    def test_rules_always_return_response(
        self, client: TestClient, sample_fan_query: dict
    ) -> None:
        """Rule engine should always return a valid response regardless of category."""
        for category in ["navigation", "amenities", "transport", "accessibility",
                         "schedule", "safety", "general"]:
            sample_fan_query["category"] = category
            response = client.post("/api/assistant", json=sample_fan_query)
            assert response.status_code == 200
            data = response.json()
            assert len(data["reply"]) > 0


class TestCrowdAnalysisFallback:
    """Tests for crowd analysis Gemini fallback behaviour."""

    def test_crowd_gemini_error_falls_back_to_rules(self, client: TestClient) -> None:
        with patch(
            "app.routes.crowd.generate_crowd_alerts",
            new_callable=AsyncMock,
            side_effect=GeminiUnavailableError("Network error"),
        ):
            with patch("app.routes.crowd.get_settings") as mock_settings:
                mock_settings.return_value.USE_GEMINI = True
                response = client.get("/api/crowd")

        assert response.status_code == 200
        data = response.json()
        assert data["source"] == "rules"

    def test_crowd_gemini_success_returns_gemini_source(
        self, client: TestClient, mock_gemini_crowd: AsyncMock
    ) -> None:
        with patch("app.routes.crowd.get_settings") as mock_settings:
            mock_settings.return_value.USE_GEMINI = True
            response = client.get("/api/crowd")

        assert response.status_code == 200
        data = response.json()
        assert data["source"] == "gemini"
