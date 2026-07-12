"""
API route integration tests for StadiumSync.

All GCP services are disabled via conftest.py environment variables.
Tests verify HTTP status codes, response structure, and validation.
"""

from __future__ import annotations

from fastapi.testclient import TestClient


class TestHealthEndpoint:
    """Tests for GET /api/health."""

    def test_health_returns_200(self, client: TestClient) -> None:
        response = client.get("/api/health")
        assert response.status_code == 200

    def test_health_returns_correct_structure(self, client: TestClient) -> None:
        data = client.get("/api/health").json()
        assert data["status"] == "healthy"
        assert data["version"] == "1.0.0"
        assert "timestamp" in data
        assert "services" in data

    def test_health_services_reflect_feature_flags(self, client: TestClient) -> None:
        data = client.get("/api/health").json()
        services = data["services"]
        # All services disabled in test environment
        assert services["gemini"] is False
        assert services["firestore"] is False


class TestAssistantEndpoint:
    """Tests for POST /api/assistant."""

    def test_assistant_returns_200(self, client: TestClient, sample_fan_query: dict) -> None:
        response = client.post("/api/assistant", json=sample_fan_query)
        assert response.status_code == 200

    def test_assistant_returns_correct_structure(
        self, client: TestClient, sample_fan_query: dict
    ) -> None:
        data = client.post("/api/assistant", json=sample_fan_query).json()
        assert "reply" in data
        assert "language" in data
        assert "category" in data
        assert "source" in data
        assert "suggested_actions" in data

    def test_assistant_fallback_source_is_rules(
        self, client: TestClient, sample_fan_query: dict
    ) -> None:
        data = client.post("/api/assistant", json=sample_fan_query).json()
        assert data["source"] == "rules"

    def test_assistant_respects_language(
        self, client: TestClient, sample_fan_query: dict
    ) -> None:
        sample_fan_query["language"] = "es"
        data = client.post("/api/assistant", json=sample_fan_query).json()
        assert data["language"] == "es"

    def test_assistant_honors_selected_topic_in_offline_mode(
        self, client: TestClient, sample_fan_query: dict
    ) -> None:
        sample_fan_query.update(
            {
                "message": "I need some help.",
                "category": "amenities",
                "stadium_id": "metlife",
            }
        )
        data = client.post("/api/assistant", json=sample_fan_query).json()

        assert data["source"] == "rules"
        assert data["category"] == "amenities"
        assert "Amenities at MetLife Stadium" in data["reply"]

    def test_assistant_validates_missing_session_id(self, client: TestClient) -> None:
        response = client.post("/api/assistant", json={
            "message": "Where is Gate A?",
        })
        assert response.status_code == 422

    def test_assistant_validates_empty_message(self, client: TestClient) -> None:
        response = client.post("/api/assistant", json={
            "message": "",
            "session_id": "test-session-001",
        })
        assert response.status_code == 422

    def test_assistant_validates_invalid_language(self, client: TestClient) -> None:
        response = client.post("/api/assistant", json={
            "message": "Hello",
            "session_id": "test-session-001",
            "language": "invalid",
        })
        assert response.status_code == 422

    def test_assistant_validates_session_id_special_chars(self, client: TestClient) -> None:
        response = client.post("/api/assistant", json={
            "message": "Hello",
            "session_id": "../etc/passwd",
        })
        assert response.status_code == 422


class TestCrowdEndpoint:
    """Tests for GET /api/crowd."""

    def test_crowd_returns_200(self, client: TestClient) -> None:
        response = client.get("/api/crowd")
        assert response.status_code == 200

    def test_crowd_returns_correct_structure(self, client: TestClient) -> None:
        data = client.get("/api/crowd").json()
        assert "zones" in data
        assert "alerts" in data
        assert "total_attendance" in data
        assert "stadium_capacity" in data
        assert "overall_occupancy_pct" in data
        assert "source" in data
        assert "operations_brief" in data

    def test_crowd_operations_brief_is_actionable(self, client: TestClient) -> None:
        data = client.get("/api/crowd").json()
        brief = data["operations_brief"]
        assert brief["risk_level"] in {"low", "elevated", "high", "critical"}
        assert len(brief["headline"]) > 0
        assert len(brief["recommended_staffing"]) > 0
        assert len(brief["fan_messaging"]) > 0
        assert "accessibility_note" in brief
        assert "sustainability_note" in brief

    def test_crowd_zones_have_required_fields(self, client: TestClient) -> None:
        data = client.get("/api/crowd").json()
        assert len(data["zones"]) > 0
        zone = data["zones"][0]
        assert "zone_id" in zone
        assert "zone_name" in zone
        assert "current_occupancy" in zone
        assert "max_capacity" in zone
        assert "occupancy_pct" in zone
        assert "status" in zone

    def test_crowd_fallback_source_is_rules(self, client: TestClient) -> None:
        data = client.get("/api/crowd").json()
        assert data["source"] == "rules"

    def test_crowd_total_attendance_is_positive(self, client: TestClient) -> None:
        data = client.get("/api/crowd").json()
        assert data["total_attendance"] > 0

    def test_crowd_occupancy_within_bounds(self, client: TestClient) -> None:
        data = client.get("/api/crowd").json()
        assert 0 <= data["overall_occupancy_pct"] <= 100


class TestZonesEndpoint:
    """Tests for GET /api/zones."""

    def test_zones_returns_200(self, client: TestClient) -> None:
        response = client.get("/api/zones")
        assert response.status_code == 200

    def test_zones_returns_all_zones(self, client: TestClient) -> None:
        data = client.get("/api/zones").json()
        assert data["total"] == 15  # 15 zones defined in stadium_data

    def test_zones_filter_by_type(self, client: TestClient) -> None:
        data = client.get("/api/zones?zone_type=gate").json()
        assert data["total"] == 4  # 4 gates defined
        for zone in data["zones"]:
            assert zone["zone_type"] == "gate"

    def test_zones_filter_accessible_only(self, client: TestClient) -> None:
        data = client.get("/api/zones?accessible_only=true").json()
        for zone in data["zones"]:
            assert zone["is_accessible"] is True

    def test_zones_filter_combined(self, client: TestClient) -> None:
        data = client.get("/api/zones?zone_type=seating&accessible_only=true").json()
        for zone in data["zones"]:
            assert zone["zone_type"] == "seating"
            assert zone["is_accessible"] is True
