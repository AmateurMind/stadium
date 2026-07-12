"""Pydantic v2 data models for stadium assistant inputs, zone data, and responses."""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Fan Assistant
# ---------------------------------------------------------------------------
class FanQuery(BaseModel):
    """Validated fan query input for the AI assistant."""

    model_config = {"str_strip_whitespace": True}

    message: str = Field(
        min_length=1,
        max_length=1000,
        description="Fan's natural language question or request",
    )
    language: Literal[
        "en", "es", "fr", "ar", "pt", "de", "ja", "ko", "zh", "hi"
    ] = Field(
        default="en",
        description="ISO 639-1 language code for the fan's preferred language",
    )
    stadium_id: str = Field(
        default="stadium-alpha",
        min_length=3,
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Identifier for the specific stadium venue",
    )
    session_id: str = Field(
        min_length=8,
        max_length=64,
        pattern=r"^[a-zA-Z0-9_-]+$",
        description="Opaque anonymous session identifier",
    )
    category: Literal[
        "navigation", "amenities", "transport", "accessibility",
        "schedule", "safety", "general",
    ] = Field(
        default="general",
        description="Topic category to help route the query",
    )


class AssistantMessage(BaseModel):
    """A single message in the assistant conversation."""

    role: Literal["fan", "assistant"] = Field(description="Who sent this message")
    content: str = Field(description="Message text content")
    language: str = Field(default="en", description="Language of the message")


class AssistantResponse(BaseModel):
    """Response from the fan assistant endpoint."""

    reply: str = Field(description="AI-generated response to the fan's query")
    language: str = Field(description="Language of the response")
    category: str = Field(description="Detected or assigned topic category")
    source: Literal["gemini", "rules"] = Field(
        description="Which engine generated the response"
    )
    suggested_actions: list[str] = Field(
        default_factory=list,
        description="Optional follow-up actions the fan can take",
    )


# ---------------------------------------------------------------------------
# Stadium Zones & Crowd
# ---------------------------------------------------------------------------
class ZoneStatus(BaseModel):
    """Real-time status of a single stadium zone."""

    zone_id: str = Field(description="Unique zone identifier, e.g. 'gate-a', 'section-101'")
    zone_name: str = Field(description="Human-readable zone name")
    zone_type: Literal[
        "gate", "concourse", "seating", "restroom", "concession",
        "first_aid", "parking", "vip",
    ] = Field(description="Type classification of the zone")
    current_occupancy: int = Field(
        ge=0, description="Current number of people in the zone"
    )
    max_capacity: int = Field(
        ge=1, description="Maximum safe capacity for the zone"
    )
    occupancy_pct: float = Field(
        ge=0, le=100, description="Occupancy as a percentage of max capacity"
    )
    status: Literal["normal", "busy", "congested", "closed"] = Field(
        description="Current operational status"
    )
    wait_time_minutes: int = Field(
        ge=0, le=120, description="Estimated wait time in minutes"
    )
    is_accessible: bool = Field(
        default=True,
        description="Whether this zone is wheelchair accessible",
    )


class CrowdAlert(BaseModel):
    """An AI-generated crowd management recommendation for staff."""

    zone_id: str = Field(description="Zone this alert applies to")
    severity: Literal["info", "warning", "critical"] = Field(
        description="Alert severity level"
    )
    message: str = Field(description="Actionable recommendation for staff")
    recommended_action: str = Field(
        description="Specific staff action to take"
    )
    estimated_impact: str = Field(
        description="Expected impact if action is taken"
    )


class OperationsBrief(BaseModel):
    """Tournament operations summary for command-center staff."""

    risk_level: Literal["low", "elevated", "high", "critical"] = Field(
        description="Current venue-wide operational risk level"
    )
    headline: str = Field(
        description="One-line executive summary for matchday operators"
    )
    recommended_staffing: list[str] = Field(
        description="Prioritized staff deployment actions"
    )
    fan_messaging: list[str] = Field(
        description="Short public messages suitable for signage or app alerts"
    )
    accessibility_note: str = Field(
        description="Accessibility-specific operational recommendation"
    )
    sustainability_note: str = Field(
        description="Sustainability-minded operational recommendation"
    )


class CrowdAnalysisResponse(BaseModel):
    """Response from the crowd analysis endpoint."""

    zones: list[ZoneStatus] = Field(description="Current status of all monitored zones")
    alerts: list[CrowdAlert] = Field(description="AI-generated operational alerts")
    total_attendance: int = Field(
        ge=0, description="Total current attendance across all zones"
    )
    stadium_capacity: int = Field(
        ge=1, description="Total stadium capacity"
    )
    overall_occupancy_pct: float = Field(
        ge=0, le=100, description="Overall stadium occupancy percentage"
    )
    source: Literal["gemini", "rules"] = Field(
        description="Which engine generated the alerts"
    )
    operations_brief: OperationsBrief = Field(
        description="Actionable tournament operations brief for staff"
    )


# ---------------------------------------------------------------------------
# Fan Services & Safety Intelligence
# ---------------------------------------------------------------------------
class AccessibilityGuidance(BaseModel):
    """Accessible matchday guidance for disabled visitors."""

    voice_navigation: str = Field(description="Short route guidance suitable for text-to-speech")
    wheelchair_route: str = Field(description="Step-free route and facilities guidance")
    sign_language_avatar_script: str = Field(
        description="Concise script for a sign-language avatar integration"
    )
    live_caption_preview: str = Field(
        description="Caption text shown while a live-caption provider is not connected"
    )
    audio_description: str = Field(description="Available audio-description support")


class FoodRecommendation(BaseModel):
    """Queue-aware food recommendation for a fan."""

    recommended_venue: str
    nearby_landmark: str
    estimated_wait_minutes: int = Field(ge=0)
    kickoff_in_minutes: int = Field(ge=0)
    reasoning: str
    source: Literal["simulated"]


class TransportOption(BaseModel):
    """A single transport choice with crowd-aware guidance."""

    mode: Literal["metro", "shuttle", "rideshare", "walking"]
    recommendation: str
    reason: str


class TransportGuidance(BaseModel):
    """Transport choices informed by the current prototype context."""

    weather_summary: str
    delay_summary: str
    options: list[TransportOption]
    source: Literal["simulated"]


class VisionIncident(BaseModel):
    """A safety event produced by a connected or simulated vision feed."""

    detection_type: Literal["long_queue", "spill", "fight", "unattended_bag"]
    location: str
    severity: Literal["info", "warning", "critical"]
    confidence_pct: float = Field(ge=0, le=100)
    generated_guidance: str


class VisionSafetySnapshot(BaseModel):
    """Vision capability, active detections, and response playbooks."""

    detection_capabilities: list[str]
    active_incidents: list[VisionIncident]
    response_playbooks: list[VisionIncident]
    data_notice: str
    source: Literal["simulated"]


class FanServicesResponse(BaseModel):
    """Accessibility, recommendation, transport, and safety services response."""

    stadium_id: str
    stadium_name: str
    data_notice: str
    accessibility: AccessibilityGuidance
    food_recommendation: FoodRecommendation
    transport: TransportGuidance
    vision: VisionSafetySnapshot
