"""
Pydantic validation unit tests for StadiumSync models.

Verifies strict field constraints, regex patterns, and type enforcement
at the schema level — matching carbon-wise's test_validation.py approach.
"""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.models.stadium import FanQuery, ZoneStatus


class TestFanQueryValidation:
    """Tests for FanQuery Pydantic model validation."""

    def test_valid_query_with_all_fields(self) -> None:
        query = FanQuery(
            message="Where is the nearest restroom?",
            language="en",
            stadium_id="stadium-alpha",
            session_id="test-session-001",
            category="navigation",
        )
        assert query.message == "Where is the nearest restroom?"

    def test_valid_query_with_defaults(self) -> None:
        query = FanQuery(
            message="Hello",
            session_id="test-session-001",
        )
        assert query.language == "en"
        assert query.category == "general"
        assert query.stadium_id == "stadium-alpha"

    def test_empty_message_raises_validation_error(self) -> None:
        with pytest.raises(ValidationError):
            FanQuery(message="", session_id="test-session-001")

    def test_message_exceeds_max_length_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            FanQuery(message="x" * 1001, session_id="test-session-001")

    def test_session_id_too_short_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            FanQuery(message="Hello", session_id="short")

    def test_session_id_with_spaces_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            FanQuery(message="Hello", session_id="test session 001")

    def test_session_id_with_special_chars_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            FanQuery(message="Hello", session_id="../etc/passwd")

    def test_session_id_at_max_length_is_valid(self) -> None:
        query = FanQuery(message="Hello", session_id="a" * 64)
        assert len(query.session_id) == 64

    def test_session_id_too_long_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            FanQuery(message="Hello", session_id="a" * 65)

    def test_invalid_language_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            FanQuery(
                message="Hello",
                session_id="test-session-001",
                language="invalid",
            )

    def test_invalid_category_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            FanQuery(
                message="Hello",
                session_id="test-session-001",
                category="invalid",
            )

    def test_invalid_stadium_id_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            FanQuery(
                message="Hello",
                session_id="test-session-001",
                stadium_id="../../bad",
            )

    def test_all_supported_languages_valid(self) -> None:
        for lang in ["en", "es", "fr", "ar", "pt", "de", "ja", "ko", "zh", "hi"]:
            query = FanQuery(
                message="Hello",
                session_id="test-session-001",
                language=lang,
            )
            assert query.language == lang


class TestZoneStatusValidation:
    """Tests for ZoneStatus Pydantic model validation."""

    def test_valid_zone_status(self) -> None:
        zone = ZoneStatus(
            zone_id="gate-a",
            zone_name="Gate A",
            zone_type="gate",
            current_occupancy=1000,
            max_capacity=5000,
            occupancy_pct=20.0,
            status="normal",
            wait_time_minutes=5,
        )
        assert zone.zone_id == "gate-a"

    def test_negative_occupancy_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            ZoneStatus(
                zone_id="gate-a",
                zone_name="Gate A",
                zone_type="gate",
                current_occupancy=-1,
                max_capacity=5000,
                occupancy_pct=0,
                status="normal",
                wait_time_minutes=0,
            )

    def test_zero_max_capacity_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            ZoneStatus(
                zone_id="gate-a",
                zone_name="Gate A",
                zone_type="gate",
                current_occupancy=0,
                max_capacity=0,
                occupancy_pct=0,
                status="normal",
                wait_time_minutes=0,
            )

    def test_invalid_status_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            ZoneStatus(
                zone_id="gate-a",
                zone_name="Gate A",
                zone_type="gate",
                current_occupancy=0,
                max_capacity=5000,
                occupancy_pct=0,
                status="unknown",
                wait_time_minutes=0,
            )

    def test_wait_time_exceeds_max_raises_error(self) -> None:
        with pytest.raises(ValidationError):
            ZoneStatus(
                zone_id="gate-a",
                zone_name="Gate A",
                zone_type="gate",
                current_occupancy=0,
                max_capacity=5000,
                occupancy_pct=0,
                status="normal",
                wait_time_minutes=121,
            )
