"""
GET /api/grounds — Stadium grounds list and detail endpoint.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.services.grounds_service import get_ground, list_grounds, search_grounds

router = APIRouter(tags=["Grounds"])


class LocaleInfo(BaseModel):
    city: str
    region: str
    country: str


class GroundSummary(BaseModel):
    """Abbreviated stadium info for list/search views."""
    id: str
    title: str
    locale: LocaleInfo
    seats: int
    verified: bool


class GroundsResponse(BaseModel):
    grounds: list[GroundSummary]
    total: int


@router.get("/grounds", response_model=GroundsResponse)
async def get_grounds(
    query: str | None = Query(default=None, description="Search grounds by title, city, or country")
) -> GroundsResponse:
    """List or search tournament grounds."""
    if query:
        results = search_grounds(query)
    else:
        results = list_grounds()

    summaries = [
        GroundSummary(
            id=g["id"],
            title=g["title"],
            locale=LocaleInfo(
                city=g["locale"]["city"],
                region=g["locale"]["region"],
                country=g["locale"]["country"]
            ),
            seats=g["seats"],
            verified=g["verified"]
        )
        for g in results
    ]
    return GroundsResponse(grounds=summaries, total=len(summaries))


@router.get("/grounds/{ground_id}")
async def get_ground_detail(ground_id: str):
    """Retrieve full detail for a specific stadium ground."""
    g = get_ground(ground_id)
    if not g:
        raise HTTPException(status_code=404, detail=f"Ground {ground_id} not found")
    return g
