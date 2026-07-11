"""
Service integration for www.thestatsapi.com to fetch live match analytics and expected goals.
Includes a fallback helper that returns realistic simulation data when no API key is provided.
"""

from __future__ import annotations

import httpx
import logging
from typing import Any
from app.core.config import get_settings

logger = logging.getLogger(__name__)

# Default mock match statistics for evaluation / offline fallback
MOCK_STATS = {
    "match_id": "mt_010249745",
    "status": "live",
    "minute": 74,
    "teams": {
        "home": {"name": "Argentina", "goals": 2},
        "away": {"name": "France", "goals": 1}
    },
    "overview": {
        "expected_goals": {
            "all": {"home": 2.34, "away": 0.87},
            "first_half": {"home": 1.21, "away": 0.34},
            "second_half": {"home": 1.13, "away": 0.53}
        },
        "possession_pct": {"home": 54, "away": 46},
        "shots": {"home": 12, "away": 7},
        "shots_on_target": {"home": 5, "away": 2},
        "fouls": {"home": 11, "away": 14},
        "fouls_won": {"home": 14, "away": 11},
        "tackles": {"home": 22, "away": 18},
        "offsides": {"home": 2, "away": 1},
        "corners": {"home": 6, "away": 4}
    },
    "source": "simulated"
}


async def fetch_live_match_stats(match_id: str) -> dict[str, Any]:
    """
    Fetch live stats for a specific match from thestatsapi.com.
    Falls back to mock data if the API key is not configured or fails.
    """
    settings = get_settings()
    key = settings.THE_STATS_API_KEY

    if not key or key == "your-api-key-here" or key.strip() == "":
        logger.info("THE_STATS_API_KEY not configured. Returning simulated match statistics.")
        return MOCK_STATS

    url = f"https://api.thestatsapi.com/api/football/matches/{match_id}/stats"
    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            if response.status_code == 200:
                data = response.json()
                logger.info("Successfully fetched live stats from thestatsapi.com")
                # Wrap under consistent structure
                return {
                    "match_id": match_id,
                    "status": "live",
                    "minute": data.get("minute", 74),
                    "teams": data.get("teams", MOCK_STATS["teams"]),
                    "overview": data.get("data", {}).get("overview", data.get("overview", MOCK_STATS["overview"])),
                    "source": "thestatsapi"
                }
            else:
                logger.warning(
                    "thestatsapi.com returned status %d. Falling back to mock stats.",
                    response.status_code
                )
                return MOCK_STATS
    except Exception as e:
        logger.error("Failed to connect to thestatsapi.com: %s. Falling back to mock.", e)
        return MOCK_STATS
