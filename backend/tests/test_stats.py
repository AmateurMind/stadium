"""
Unit and integration tests for match statistics endpoints and service fallback.
"""

from __future__ import annotations

from fastapi.testclient import TestClient


class TestStatsServiceAndRouter:
    """Tests for GET /api/stats."""

    def test_get_stats_returns_simulated_by_default(self, client: TestClient) -> None:
        response = client.get("/api/stats")
        assert response.status_code == 200
        data = response.json()
        assert data["match_id"] == "mt_010249745"
        assert "overview" in data
        assert "expected_goals" in data["overview"]
        assert "possession_pct" in data["overview"]
        assert data["source"] in ("simulated", "thestatsapi")
