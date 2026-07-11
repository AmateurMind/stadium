"""
GET /api/stats — Match statistics route integration with thestatsapi.com
"""

from __future__ import annotations

from typing import get_type_hints
from fastapi import APIRouter, Query, Request
from app.services.stats_service import fetch_live_match_stats

router = APIRouter(tags=["Stats"])


@router.get("/stats")
async def get_stats(
    match_id: str = Query(default="mt_010249745", description="Match ID to retrieve stats for")
):
    """Retrieve live statistics for a match from thestatsapi.com or simulated fallback."""
    data = await fetch_live_match_stats(match_id)
    return data
