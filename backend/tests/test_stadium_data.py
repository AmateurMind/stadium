"""
Pure function unit tests for stadium data service.

Tests verify deterministic behaviour, zone generation,
and rule-based alert logic — no I/O, no network.
"""

from __future__ import annotations

from app.models.stadium import ZoneStatus
from app.services.stadium_data import (
    STADIUM_CAPACITY,
    get_rule_based_alerts,
    get_total_attendance,
    get_zone_statuses,
    find_nearest_zone,
)


class TestZoneStatuses:
    """Tests for get_zone_statuses()."""

    def test_returns_all_zones(self) -> None:
        zones = get_zone_statuses()
        assert len(zones) == 15

    def test_all_zones_have_valid_types(self) -> None:
        valid_types = {"gate", "concourse", "seating", "restroom", "concession",
                       "first_aid", "parking", "vip"}
        zones = get_zone_statuses()
        for zone in zones:
            assert zone.zone_type in valid_types

    def test_occupancy_within_bounds(self) -> None:
        zones = get_zone_statuses()
        for zone in zones:
            assert 0 <= zone.occupancy_pct <= 100
            assert 0 <= zone.current_occupancy <= zone.max_capacity

    def test_status_matches_occupancy(self) -> None:
        zones = get_zone_statuses()
        for zone in zones:
            if zone.occupancy_pct >= 90:
                assert zone.status == "congested"
            elif zone.occupancy_pct >= 70:
                assert zone.status == "busy"
            else:
                assert zone.status == "normal"

    def test_consecutive_calls_return_consistent_data(self) -> None:
        zones1 = get_zone_statuses()
        zones2 = get_zone_statuses()
        for z1, z2 in zip(zones1, zones2):
            assert z1.zone_id == z2.zone_id
            assert z1.current_occupancy == z2.current_occupancy


class TestRuleBasedAlerts:
    """Tests for get_rule_based_alerts()."""

    def test_congested_zone_generates_critical_alert(self) -> None:
        zones = [
            ZoneStatus(
                zone_id="gate-a",
                zone_name="Gate A",
                zone_type="gate",
                current_occupancy=4600,
                max_capacity=5000,
                occupancy_pct=92.0,
                status="congested",
                wait_time_minutes=20,
            )
        ]
        alerts = get_rule_based_alerts(zones)
        assert len(alerts) == 1
        assert alerts[0].severity == "critical"
        assert "gate-a" in alerts[0].zone_id

    def test_busy_gate_generates_warning_alert(self) -> None:
        zones = [
            ZoneStatus(
                zone_id="gate-b",
                zone_name="Gate B",
                zone_type="gate",
                current_occupancy=3200,
                max_capacity=4000,
                occupancy_pct=80.0,
                status="busy",
                wait_time_minutes=10,
            )
        ]
        alerts = get_rule_based_alerts(zones)
        assert len(alerts) == 1
        assert alerts[0].severity == "warning"

    def test_normal_zone_generates_no_alert(self) -> None:
        zones = [
            ZoneStatus(
                zone_id="section-101",
                zone_name="Section 101",
                zone_type="seating",
                current_occupancy=1000,
                max_capacity=3000,
                occupancy_pct=33.3,
                status="normal",
                wait_time_minutes=0,
            )
        ]
        alerts = get_rule_based_alerts(zones)
        assert len(alerts) == 0


class TestAttendance:
    """Tests for total attendance and capacity calculations."""

    def test_total_attendance_is_sum_of_occupancies(self) -> None:
        zones = get_zone_statuses()
        total = get_total_attendance(zones)
        assert total == sum(z.current_occupancy for z in zones)

    def test_stadium_capacity_is_defined(self) -> None:
        assert STADIUM_CAPACITY == 60000


class TestFindNearestZone:
    """Tests for find_nearest_zone()."""

    def test_finds_restroom(self) -> None:
        zone = find_nearest_zone("restroom")
        assert zone is not None
        assert zone.zone_type == "restroom"

    def test_finds_accessible_restroom(self) -> None:
        zone = find_nearest_zone("restroom", accessible_only=True)
        assert zone is not None
        assert zone.is_accessible is True

    def test_returns_none_for_invalid_type(self) -> None:
        zone = find_nearest_zone("nonexistent")
        assert zone is None
