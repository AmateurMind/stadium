"""
GET /api/zones — Stadium zone information endpoint.

Returns current status of all stadium zones or filters by type.
Supports accessibility filtering for disabled fan assistance.
"""

from __future__ import annotations

from typing import get_type_hints

from fastapi import APIRouter, Query, Request
from pydantic import BaseModel, Field

from app.core.rate_limit import ZONES_LIMIT, limiter
from app.models.stadium import ZoneStatus
from app.services.stadium_data import get_zone_statuses

router = APIRouter(tags=["Zones"])


class ZonesResponse(BaseModel):
    """Response from the zones endpoint."""

    zones: list[ZoneStatus] = Field(description="List of stadium zones matching the filter")
    total: int = Field(description="Total number of zones returned")


@limiter.limit(ZONES_LIMIT)
async def list_zones(
    request: Request,
    zone_type: str | None = Query(
        default=None,
        description="Filter by zone type: gate, concourse, seating, restroom, etc.",
    ),
    accessible_only: bool = Query(
        default=False,
        description="If true, return only wheelchair-accessible zones",
    ),
) -> ZonesResponse:
    """
    List stadium zones with optional filtering by type and accessibility.

    Rate limited to 30 requests/minute per IP.
    """
    zones = get_zone_statuses()

    if zone_type:
        zones = [z for z in zones if z.zone_type == zone_type]
    if accessible_only:
        zones = [z for z in zones if z.is_accessible]

    return ZonesResponse(zones=zones, total=len(zones))


# Rebuild local Pydantic models
ZonesResponse.model_rebuild()

# Resolve annotations
list_zones.__annotations__ = get_type_hints(list_zones)
if hasattr(list_zones, "__wrapped__"):
    list_zones.__wrapped__.__annotations__ = get_type_hints(list_zones.__wrapped__)

router.add_api_route(
    "/zones",
    endpoint=list_zones,
    methods=["GET"],
    response_model=ZonesResponse,
    summary="List stadium zones",
    description=(
        "Get current status of all stadium zones with optional filtering "
        "by zone type and wheelchair accessibility."
    ),
)
