"""Regression tests for deterministic, topic-aware offline assistant replies."""

from __future__ import annotations

from app.services.offline_service import offline_answer


class TestOfflineAssistantTopics:
    """Selected fan topics must guide a reply when the message is otherwise ambiguous."""

    def test_selected_amenities_topic_returns_venue_specific_guidance(self) -> None:
        response = offline_answer(
            message="I need some help.",
            language="en",
            stadium_id="metlife",
            category="amenities",
        )

        assert response["category"] == "amenities"
        assert "Amenities at MetLife Stadium" in response["reply"]
        assert "Concession stands" in response["reply"]
