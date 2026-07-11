"""
Google Vertex AI Gemini integration for stadium assistant and crowd intelligence.

Uses the Vertex AI SDK (google-cloud-aiplatform / vertexai) to call
Gemini and generate context-aware responses for fans and staff.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from app.core.config import get_settings
from app.models.stadium import CrowdAlert, ZoneStatus

logger = logging.getLogger(__name__)


class GeminiUnavailableError(Exception):
    """Raised when Gemini cannot produce a valid response (network, parse, timeout)."""


# ---------------------------------------------------------------------------
# Fan Assistant
# ---------------------------------------------------------------------------
_SUPPORTED_LANGUAGES = {
    "en": "English", "es": "Spanish", "fr": "French", "ar": "Arabic",
    "pt": "Portuguese", "de": "German", "ja": "Japanese", "ko": "Korean",
    "zh": "Chinese", "hi": "Hindi",
}


def _build_fan_prompt(
    message: str,
    language: str,
    category: str,
    zone_context: str,
) -> str:
    """Construct the prompt for fan assistant queries."""
    lang_name = _SUPPORTED_LANGUAGES.get(language, "English")

    return f"""\
You are a friendly, helpful AI assistant for fans attending the FIFA World Cup 2026.
You are deployed inside the stadium's official mobile app.

CURRENT STADIUM CONTEXT:
{zone_context}

FAN'S QUERY:
- Message: "{message}"
- Preferred language: {lang_name} ({language})
- Topic category: {category}

INSTRUCTIONS:
1. Respond in {lang_name} ({language}).
2. Be concise, warm, and actionable — fans are on their phones in a crowded stadium.
3. If the query is about navigation, give specific directions using zone names from the context.
4. If about accessibility, always prioritise wheelchair-accessible routes and facilities.
5. If about wait times or crowds, use the real zone data provided.
6. Include 1-3 suggested follow-up actions the fan might want to take.
7. Never make up zone names or data not in the context.

RESPONSE FORMAT:
Return ONLY a valid JSON object. No markdown, no explanation, no code fences. Example:
{{
  "reply": "Your helpful response here...",
  "language": "{language}",
  "category": "{category}",
  "suggested_actions": ["Action 1", "Action 2"]
}}
"""


async def generate_fan_response(
    message: str,
    language: str,
    category: str,
    zones: list[ZoneStatus],
) -> dict[str, Any]:
    """Call Vertex AI Gemini to generate a fan assistant response.

    Args:
        message: Fan's natural language query.
        language: ISO 639-1 language code.
        category: Topic category of the query.
        zones: Current zone statuses for context.

    Returns:
        Dict with reply, language, category, and suggested_actions.

    Raises:
        GeminiUnavailableError: If Gemini returns an error, invalid JSON, or times out.
    """
    settings = get_settings()

    try:
        import vertexai
        from vertexai.generative_models import GenerationConfig, GenerativeModel

        vertexai.init(project=settings.PROJECT_ID, location=settings.REGION)
        model = GenerativeModel(settings.GEMINI_MODEL)

        zone_context = "\n".join(
            f"  - {z.zone_name} ({z.zone_type}): {z.occupancy_pct}% full, "
            f"status={z.status}, wait={z.wait_time_minutes}min, "
            f"accessible={'Yes' if z.is_accessible else 'No'}"
            for z in zones
        )

        prompt = _build_fan_prompt(message, language, category, zone_context)

        generation_config = GenerationConfig(
            temperature=0.6,
            top_p=0.85,
            max_output_tokens=1024,
        )

        response = await asyncio.wait_for(
            asyncio.get_event_loop().run_in_executor(
                None,
                lambda: model.generate_content(
                    prompt,
                    generation_config=generation_config,
                ),
            ),
            timeout=15.0,
        )

        raw_text = response.text.strip()

        # Strip potential markdown code fences Gemini sometimes adds
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1]
            raw_text = raw_text.rsplit("```", 1)[0].strip()

        parsed: dict[str, Any] = json.loads(raw_text)

        if not isinstance(parsed, dict) or "reply" not in parsed:
            raise ValueError("Gemini returned invalid response structure")

        logger.info("Gemini generated fan response successfully")
        return parsed

    except GeminiUnavailableError:
        raise
    except Exception as exc:
        logger.warning("Gemini unavailable: %s — %s", type(exc).__name__, exc)
        raise GeminiUnavailableError(f"Gemini call failed: {exc}") from exc


# ---------------------------------------------------------------------------
# Staff Crowd Intelligence
# ---------------------------------------------------------------------------
def _build_crowd_prompt(zones: list[ZoneStatus]) -> str:
    """Construct the prompt for crowd intelligence analysis."""
    zone_lines = "\n".join(
        f"  {i + 1}. {z.zone_name} ({z.zone_type}): "
        f"{z.current_occupancy}/{z.max_capacity} ({z.occupancy_pct}%), "
        f"status={z.status}, wait={z.wait_time_minutes}min"
        for i, z in enumerate(zones)
    )

    return f"""\
You are a crowd management AI for the FIFA World Cup 2026 stadium operations team.

CURRENT ZONE DATA:
{zone_lines}

TASK:
Analyse the zone data and generate actionable crowd management alerts for stadium staff.
Focus on:
1. Zones approaching or exceeding safe capacity
2. Optimal redistribution strategies
3. Accessibility considerations
4. Wait time reduction opportunities

For each alert, provide:
- zone_id: The specific zone this applies to
- severity: "info", "warning", or "critical"
- message: Clear description of the situation
- recommended_action: Specific, actionable staff instruction
- estimated_impact: Expected result if action is taken

RESPONSE FORMAT:
Return ONLY a valid JSON array. No markdown, no explanation, no code fences.
[
  {{
    "zone_id": "gate-a",
    "severity": "warning",
    "message": "Gate A approaching capacity...",
    "recommended_action": "Deploy 3 additional staff...",
    "estimated_impact": "Reduce wait times by 5 minutes..."
  }}
]
"""


async def generate_crowd_alerts(
    zones: list[ZoneStatus],
) -> list[CrowdAlert]:
    """Call Vertex AI Gemini to generate crowd management alerts.

    Args:
        zones: Current zone statuses.

    Returns:
        List of CrowdAlert instances.

    Raises:
        GeminiUnavailableError: If Gemini returns an error, invalid JSON, or times out.
    """
    settings = get_settings()

    try:
        import vertexai
        from vertexai.generative_models import GenerationConfig, GenerativeModel

        vertexai.init(project=settings.PROJECT_ID, location=settings.REGION)
        model = GenerativeModel(settings.GEMINI_MODEL)

        prompt = _build_crowd_prompt(zones)

        generation_config = GenerationConfig(
            temperature=0.3,
            top_p=0.8,
            max_output_tokens=2048,
        )

        response = await asyncio.wait_for(
            asyncio.get_event_loop().run_in_executor(
                None,
                lambda: model.generate_content(
                    prompt,
                    generation_config=generation_config,
                ),
            ),
            timeout=15.0,
        )

        raw_text = response.text.strip()

        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1]
            raw_text = raw_text.rsplit("```", 1)[0].strip()

        raw_alerts: list[dict[str, Any]] = json.loads(raw_text)

        if not isinstance(raw_alerts, list) or len(raw_alerts) == 0:
            raise ValueError("Gemini returned empty or non-list JSON")

        alerts = [CrowdAlert(**alert) for alert in raw_alerts[:10]]

        logger.info("Gemini generated %d crowd alerts successfully", len(alerts))
        return alerts

    except GeminiUnavailableError:
        raise
    except Exception as exc:
        logger.warning("Gemini unavailable for crowd analysis: %s — %s", type(exc).__name__, exc)
        raise GeminiUnavailableError(f"Gemini call failed: {exc}") from exc
