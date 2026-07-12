"""Deterministic fan-service recommendations for the StadiumSync prototype."""

from __future__ import annotations

from app.models.stadium import (
    AccessibilityGuidance,
    FanServicesResponse,
    FoodRecommendation,
    TransportGuidance,
    TransportOption,
    VisionIncident,
    VisionSafetySnapshot,
    ZoneStatus,
)
from app.services.grounds_service import get_ground

SIMULATION_NOTICE = (
    "Prototype data: connect verified venue, weather, transit, and camera feeds before "
    "using this information for live operations."
)

_CONCESSION_LANDMARKS = {
    "food-court-a": "Gate A concourse",
    "food-court-b": "Gate B concourse",
}


def build_fan_services(
    stadium_id: str,
    zones: list[ZoneStatus],
) -> FanServicesResponse | None:
    """Create a venue-specific, clearly simulated fan-services snapshot."""
    ground = get_ground(stadium_id)
    if ground is None:
        return None

    title = ground["title"]
    accessibility = ground["accessibility"]
    facilities = ground["facilities"]
    step_free_entrances = [entry for entry in ground["entrances"] if entry["step_free"]]
    entrance_names = ", ".join(entry["name"] for entry in step_free_entrances)
    primary_entrance = step_free_entrances[0]

    food_zones = [zone for zone in zones if zone.zone_type == "concession"]
    recommended_food = min(food_zones, key=lambda zone: (zone.wait_time_minutes, zone.occupancy_pct))
    busiest_food = max(food_zones, key=lambda zone: (zone.wait_time_minutes, zone.occupancy_pct))

    busiest_gate = max(
        (zone for zone in zones if zone.zone_type == "gate"),
        key=lambda zone: zone.occupancy_pct,
    )
    vision_incidents = _build_vision_incidents(busiest_gate)

    return FanServicesResponse(
        stadium_id=stadium_id,
        stadium_name=title,
        data_notice=SIMULATION_NOTICE,
        accessibility=AccessibilityGuidance(
            voice_navigation=(
                f"Start at {primary_entrance['name']}. {primary_entrance['notes']} "
                f"{accessibility['lifts']}"
            ),
            wheelchair_route=(
                f"Use one of the step-free entrances: {entrance_names}. "
                f"{accessibility['calm_route']} {accessibility['adapted_restrooms']}"
            ),
            sign_language_avatar_script=(
                f"Welcome to {title}. Accessible entry is available at {entrance_names}. "
                "Staff can assist with step-free routes and companion seating."
            ),
            live_caption_preview=(
                "[Caption preview] Accessible route guidance is available. "
                "Please follow the blue accessibility signs."
            ),
            audio_description=accessibility["sight_support"],
        ),
        food_recommendation=FoodRecommendation(
            recommended_venue=recommended_food.zone_name,
            nearby_landmark=_CONCESSION_LANDMARKS.get(
                recommended_food.zone_id, "the main concourse"
            ),
            estimated_wait_minutes=recommended_food.wait_time_minutes,
            kickoff_in_minutes=30,
            reasoning=(
                "Kickoff is in 30 minutes in the simulated match context. "
                f"{busiest_food.zone_name} is currently the busier option, so choose "
                f"{recommended_food.zone_name} for the shorter estimated wait."
            ),
            source="simulated",
        ),
        transport=TransportGuidance(
            weather_summary="Clear conditions assumed in the simulated weather feed.",
            delay_summary="No delay is reported by the simulated transit feed.",
            options=[
                TransportOption(
                    mode="metro",
                    recommendation="Use the official transit route shown in the tournament app.",
                    reason=f"Avoid the busiest arrival point, currently {busiest_gate.zone_name}.",
                ),
                TransportOption(
                    mode="shuttle",
                    recommendation="Use the designated tournament shuttle stop.",
                    reason="Shuttles are the recommended accessible alternative to parking.",
                ),
                TransportOption(
                    mode="rideshare",
                    recommendation="Use the official rideshare pickup and drop-off zone.",
                    reason="Follow event signage to avoid gate-side vehicle congestion.",
                ),
                TransportOption(
                    mode="walking",
                    recommendation="Use the signed pedestrian approach to your assigned entrance.",
                    reason="This avoids vehicle queues while conditions remain clear.",
                ),
            ],
            source="simulated",
        ),
        vision=VisionSafetySnapshot(
            detection_capabilities=[
                "Long queues",
                "Spills",
                "Fights",
                "Unattended bags",
            ],
            active_incidents=vision_incidents,
            response_playbooks=[
                VisionIncident(
                    detection_type="spill",
                    location="Camera feed required",
                    severity="warning",
                    confidence_pct=0,
                    generated_guidance=(
                        "If a spill is detected, isolate the area, dispatch cleaning staff, "
                        "and maintain an accessible diversion route."
                    ),
                ),
                VisionIncident(
                    detection_type="fight",
                    location="Camera feed required",
                    severity="critical",
                    confidence_pct=0,
                    generated_guidance=(
                        "If a fight is detected, notify security, keep bystanders clear, and "
                        "preserve a route for emergency responders."
                    ),
                ),
                VisionIncident(
                    detection_type="unattended_bag",
                    location="Camera feed required",
                    severity="critical",
                    confidence_pct=0,
                    generated_guidance=(
                        "If an unattended bag is detected, do not touch it. Notify security "
                        "immediately and follow the venue incident protocol."
                    ),
                ),
            ],
            data_notice=(
                "Only queue pressure is simulated from occupancy data. Camera-based detections "
                "require a connected, privacy-reviewed vision feed."
            ),
            source="simulated",
        ),
    )


def _build_vision_incidents(busiest_gate: ZoneStatus) -> list[VisionIncident]:
    """Turn crowd pressure into a simulated long-queue safety observation."""
    if busiest_gate.occupancy_pct < 70:
        return []

    severity = "critical" if busiest_gate.occupancy_pct >= 90 else "warning"
    return [
        VisionIncident(
            detection_type="long_queue",
            location=busiest_gate.zone_name,
            severity=severity,
            confidence_pct=min(99, round(busiest_gate.occupancy_pct, 1)),
            generated_guidance=(
                f"Long queue pressure is simulated near {busiest_gate.zone_name}. "
                "Deploy queue stewards, open a relief route, and publish a fan-facing reroute."
            ),
        )
    ]
