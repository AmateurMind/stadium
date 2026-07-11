"""
Unit and integration tests for stadium grounds service and endpoints.
"""

from __future__ import annotations

from fastapi.testclient import TestClient


class TestGroundsServiceAndRouter:
    """Tests for GET /api/grounds and grounds_service."""

    def test_get_grounds_returns_all(self, client: TestClient) -> None:
        response = client.get("/api/grounds")
        assert response.status_code == 200
        data = response.json()
        assert "grounds" in data
        assert data["total"] > 0
        assert any(g["id"] == "metlife" for g in data["grounds"])

    def test_search_grounds_by_title(self, client: TestClient) -> None:
        response = client.get("/api/grounds?query=SoFi")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["grounds"][0]["id"] == "sofi"

    def test_search_grounds_by_country(self, client: TestClient) -> None:
        response = client.get("/api/grounds?query=Mexico")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(g["id"] == "azteca" for g in data["grounds"])

    def test_search_no_results(self, client: TestClient) -> None:
        response = client.get("/api/grounds?query=NonExistentStadium")
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 0
        assert len(data["grounds"]) == 0

    def test_get_ground_detail_success(self, client: TestClient) -> None:
        response = client.get("/api/grounds/metlife")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "metlife"
        assert data["title"] == "MetLife Stadium"
        assert "accessibility" in data
        assert "facilities" in data

    def test_get_ground_detail_not_found(self, client: TestClient) -> None:
        response = client.get("/api/grounds/nonexistent")
        assert response.status_code == 404
        assert response.json()["detail"] == "Ground nonexistent not found"
