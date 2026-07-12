"""
Mock stadium data service.

Provides deterministic zone data and crowd simulation for the prototype.
In production, this would connect to real IoT sensors and ticketing systems.

Pure functions — no side effects, no I/O.
"""

from __future__ import annotations

import hashlib
import random
from datetime import UTC, datetime

from app.models.stadium import CrowdAlert, OperationsBrief, ZoneStatus

# ---------------------------------------------------------------------------
# Stadium layout definition (FIFA World Cup 2026 prototype stadium)
# ---------------------------------------------------------------------------
_STADIUM_ZONES: list[dict] = [
    {
        "zone_id": "gate-a",
        "zone_name": "Gate A — Main Entrance",
        "zone_type": "gate",
        "max_capacity": 5000,
        "is_accessible": True,
    },
    {
        "zone_id": "gate-b",
        "zone_name": "Gate B — East Entrance",
        "zone_type": "gate",
        "max_capacity": 4000,
        "is_accessible": True,
    },
    {
        "zone_id": "gate-c",
        "zone_name": "Gate C — West Entrance",
        "zone_type": "gate",
        "max_capacity": 4000,
        "is_accessible": True,
    },
    {
        "zone_id": "gate-d",
        "zone_name": "Gate D — VIP Entrance",
        "zone_type": "gate",
        "max_capacity": 1500,
        "is_accessible": True,
    },
    {
        "zone_id": "concourse-north",
        "zone_name": "North Concourse",
        "zone_type": "concourse",
        "max_capacity": 8000,
        "is_accessible": True,
    },
    {
        "zone_id": "concourse-south",
        "zone_name": "South Concourse",
        "zone_type": "concourse",
        "max_capacity": 8000,
        "is_accessible": True,
    },
    {
        "zone_id": "section-101",
        "zone_name": "Section 101 — Lower Bowl",
        "zone_type": "seating",
        "max_capacity": 3000,
        "is_accessible": True,
    },
    {
        "zone_id": "section-201",
        "zone_name": "Section 201 — Upper Bowl",
        "zone_type": "seating",
        "max_capacity": 4000,
        "is_accessible": False,
    },
    {
        "zone_id": "section-vip",
        "zone_name": "VIP Lounge",
        "zone_type": "vip",
        "max_capacity": 500,
        "is_accessible": True,
    },
    {
        "zone_id": "restroom-north",
        "zone_name": "North Restrooms",
        "zone_type": "restroom",
        "max_capacity": 200,
        "is_accessible": True,
    },
    {
        "zone_id": "restroom-south",
        "zone_name": "South Restrooms",
        "zone_type": "restroom",
        "max_capacity": 200,
        "is_accessible": True,
    },
    {
        "zone_id": "food-court-a",
        "zone_name": "Food Court A",
        "zone_type": "concession",
        "max_capacity": 1500,
        "is_accessible": True,
    },
    {
        "zone_id": "food-court-b",
        "zone_name": "Food Court B",
        "zone_type": "concession",
        "max_capacity": 1200,
        "is_accessible": True,
    },
    {
        "zone_id": "first-aid-main",
        "zone_name": "Main First Aid Station",
        "zone_type": "first_aid",
        "max_capacity": 50,
        "is_accessible": True,
    },
    {
        "zone_id": "parking-lot-1",
        "zone_name": "Parking Lot 1",
        "zone_type": "parking",
        "max_capacity": 3000,
        "is_accessible": True,
    },
]

STADIUM_CAPACITY = 60000


def _deterministic_seed() -> int:
    """Generate a seed based on the current 5-minute window for consistency."""
    now = datetime.now(tz=UTC)
    window = now.strftime("%Y-%m-%d-%H") + str(now.minute // 5)
    return int(hashlib.md5(window.encode()).hexdigest()[:8], 16)


def _occupancy_status(pct: float) -> str:
    """Derive status label from occupancy percentage."""
    if pct >= 90:
        return "congested"
    if pct >= 70:
        return "busy"
    return "normal"


def _wait_time(pct: float, zone_type: str, rng: random.Random) -> int:
    """Estimate wait time based on occupancy and zone type."""
    if zone_type in ("gate", "restroom", "concession"):
        if pct >= 90:
            return rng.randint(15, 30)
        if pct >= 70:
            return rng.randint(5, 15)
        return rng.randint(0, 5)
    return 0


def get_zone_statuses() -> list[ZoneStatus]:
    """
    Generate current zone statuses with deterministic-seeded occupancy.

    Returns:
        List of ZoneStatus objects for all stadium zones.
    """
    seed = _deterministic_seed()
    rng = random.Random(seed)

    zones: list[ZoneStatus] = []
    for zone_def in _STADIUM_ZONES:
        # Generate occupancy between 30% and 95% for realism
        base_pct = rng.uniform(30, 95)
        current = int(zone_def["max_capacity"] * base_pct / 100)
        pct = round(current / zone_def["max_capacity"] * 100, 1)

        zones.append(
            ZoneStatus(
                zone_id=zone_def["zone_id"],
                zone_name=zone_def["zone_name"],
                zone_type=zone_def["zone_type"],
                current_occupancy=current,
                max_capacity=zone_def["max_capacity"],
                occupancy_pct=pct,
                status=_occupancy_status(pct),
                wait_time_minutes=_wait_time(pct, zone_def["zone_type"], rng),
                is_accessible=zone_def["is_accessible"],
            )
        )
    return zones


def get_rule_based_alerts(zones: list[ZoneStatus]) -> list[CrowdAlert]:
    """
    Generate deterministic crowd management alerts based on zone statuses.

    Pure function — no AI calls, always returns consistent results.

    Args:
        zones: Current zone statuses.

    Returns:
        List of CrowdAlert recommendations.
    """
    alerts: list[CrowdAlert] = []

    for zone in zones:
        if zone.status == "congested":
            alerts.append(
                CrowdAlert(
                    zone_id=zone.zone_id,
                    severity="critical",
                    message=(
                        f"{zone.zone_name} is at {zone.occupancy_pct}% capacity. "
                        f"Immediate crowd management action required."
                    ),
                    recommended_action=(
                        f"Deploy additional staff to {zone.zone_name}. "
                        "Open overflow routes and activate digital signage to redirect flow."
                    ),
                    estimated_impact=(
                        "Reduce occupancy by ~15-20% within 10 minutes, "
                        "preventing safety incidents and improving fan experience."
                    ),
                )
            )
        elif zone.status == "busy" and zone.zone_type in ("gate", "restroom", "concession"):
            alerts.append(
                CrowdAlert(
                    zone_id=zone.zone_id,
                    severity="warning",
                    message=(
                        f"{zone.zone_name} is at {zone.occupancy_pct}% capacity "
                        f"with ~{zone.wait_time_minutes} min wait time."
                    ),
                    recommended_action=(
                        f"Monitor {zone.zone_name} closely. "
                        "Consider opening additional service points or lanes."
                    ),
                    estimated_impact=(
                        "Prevent escalation to congested status, "
                        "reduce wait times by ~5 minutes."
                    ),
                )
            )

    return alerts


def get_operations_brief(
    zones: list[ZoneStatus],
    alerts: list[CrowdAlert],
) -> OperationsBrief:
    """
    Build a deterministic command-center brief from live zone and alert data.

    The brief turns raw occupancy into staff actions, fan-facing messages,
    accessibility protection, and sustainability-aware routing guidance.
    """
    critical_alerts = [alert for alert in alerts if alert.severity == "critical"]
    warning_alerts = [alert for alert in alerts if alert.severity == "warning"]
    busy_zones = sorted(zones, key=lambda zone: zone.occupancy_pct, reverse=True)
    busiest_zone = busy_zones[0]

    if critical_alerts:
        risk_level = "critical"
    elif len(warning_alerts) >= 3 or busiest_zone.occupancy_pct >= 85:
        risk_level = "high"
    elif warning_alerts or busiest_zone.occupancy_pct >= 70:
        risk_level = "elevated"
    else:
        risk_level = "low"

    headline = (
        f"{busiest_zone.zone_name} is the highest-pressure zone "
        f"at {busiest_zone.occupancy_pct}% capacity."
    )

    staffing_actions = [
        f"Position supervisors at {busiest_zone.zone_name} for the next 10-minute cycle.",
    ]
    least_busy_gate = _least_busy_zone(zones, "gate")
    if least_busy_gate:
        staffing_actions.append(
            f"Use {least_busy_gate.zone_name} as the primary relief entry route."
        )

    service_zone = _least_busy_service_zone(zones)
    if service_zone:
        staffing_actions.append(
            f"Steer concession and restroom demand toward {service_zone.zone_name}."
        )

    fan_messages = [
        f"Please allow extra time near {busiest_zone.zone_name}.",
    ]
    if least_busy_gate:
        fan_messages.append(f"For faster entry, follow signs toward {least_busy_gate.zone_name}.")
    if service_zone:
        fan_messages.append(
            f"Shorter queues are currently available near {service_zone.zone_name}."
        )

    accessible_zones = [zone for zone in zones if zone.is_accessible]
    accessible_bottleneck = max(accessible_zones, key=lambda zone: zone.occupancy_pct)
    accessibility_note = (
        f"Protect step-free movement near {accessible_bottleneck.zone_name}; "
        "keep elevators, ramps, and companion seating routes staffed."
    )

    sustainability_note = (
        "Prioritize app push alerts and digital signage before printed notices; "
        "route fans to existing open lanes instead of adding temporary barriers."
    )

    return OperationsBrief(
        risk_level=risk_level,
        headline=headline,
        recommended_staffing=staffing_actions,
        fan_messaging=fan_messages,
        accessibility_note=accessibility_note,
        sustainability_note=sustainability_note,
    )


def get_total_attendance(zones: list[ZoneStatus]) -> int:
    """Sum current occupancy across all zones."""
    return sum(z.current_occupancy for z in zones)


def _least_busy_zone(zones: list[ZoneStatus], zone_type: str) -> ZoneStatus | None:
    candidates = [zone for zone in zones if zone.zone_type == zone_type and zone.status != "closed"]
    if not candidates:
        return None
    return min(candidates, key=lambda zone: zone.occupancy_pct)


def _least_busy_service_zone(zones: list[ZoneStatus]) -> ZoneStatus | None:
    candidates = [
        zone
        for zone in zones
        if zone.zone_type in ("restroom", "concession") and zone.status != "closed"
    ]
    if not candidates:
        return None
    return min(candidates, key=lambda zone: (zone.wait_time_minutes, zone.occupancy_pct))


def find_nearest_zone(
    zone_type: str,
    accessible_only: bool = False,
) -> ZoneStatus | None:
    """
    Find the least occupied zone of a given type.

    Args:
        zone_type: Type of zone to find (gate, restroom, concession, etc.)
        accessible_only: If True, only return wheelchair-accessible zones.

    Returns:
        The ZoneStatus with the lowest occupancy, or None if no match.
    """
    zones = get_zone_statuses()
    candidates = [
        z
        for z in zones
        if z.zone_type == zone_type
        and (not accessible_only or z.is_accessible)
        and z.status != "closed"
    ]
    if not candidates:
        return None
    return min(candidates, key=lambda z: z.occupancy_pct)
