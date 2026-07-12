"""GET /api/services - accessibility, fan recommendations, and safety intelligence."""

from __future__ import annotations

from typing import get_type_hints

from fastapi import APIRouter, HTTPException, Query, Request

from app.core.rate_limit import SERVICES_LIMIT, limiter
from app.models.stadium import FanServicesResponse
from app.services.fan_services import build_fan_services
from app.services.stadium_data import get_zone_statuses

router = APIRouter(tags=["Fan Services"])


@limiter.limit(SERVICES_LIMIT)
async def get_fan_services(
    request: Request,
    stadium_id: str = Query(default="metlife", min_length=3, max_length=64),
) -> FanServicesResponse:
    """Return clearly labelled prototype guidance for a selected stadium."""
    services = build_fan_services(stadium_id, get_zone_statuses())
    if services is None:
        raise HTTPException(status_code=404, detail="Stadium not found")
    return services


get_fan_services.__annotations__ = get_type_hints(get_fan_services)
if hasattr(get_fan_services, "__wrapped__"):
    get_fan_services.__wrapped__.__annotations__ = get_type_hints(get_fan_services.__wrapped__)

router.add_api_route(
    "/services",
    endpoint=get_fan_services,
    methods=["GET"],
    response_model=FanServicesResponse,
    summary="Accessibility, recommendations, and safety services",
)
