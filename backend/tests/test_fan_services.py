"""Integration tests for the fan-services API."""

from __future__ import annotations

from fastapi.testclient import TestClient


class TestFanServicesEndpoint:
    """Verify the prototype services remain explicit, actionable, and structured."""

    def test_returns_accessibility_recommendations_and_safety_guidance(
        self, client: TestClient
    ) -> None:
        response = client.get("/api/services?stadium_id=metlife")

        assert response.status_code == 200
        data = response.json()
        assert data["stadium_name"] == "MetLife Stadium"
        assert "Prototype data" in data["data_notice"]
        assert "voice_navigation" in data["accessibility"]
        assert data["food_recommendation"]["kickoff_in_minutes"] == 30
        assert {option["mode"] for option in data["transport"]["options"]} == {
            "metro",
            "shuttle",
            "rideshare",
            "walking",
        }
        assert "Unattended bags" in data["vision"]["detection_capabilities"]
        assert any(
            playbook["detection_type"] == "unattended_bag"
            for playbook in data["vision"]["response_playbooks"]
        )

    def test_returns_not_found_for_unknown_stadium(self, client: TestClient) -> None:
        response = client.get("/api/services?stadium_id=unknown-venue")

        assert response.status_code == 404
