"""
POST /api/assistant — Fan AI assistant endpoint.

Primary engine: Google Vertex AI Gemini.
Fallback engine: Deterministic rule-based responses (always available).
"""

from __future__ import annotations

import logging
from typing import Literal, cast, get_type_hints

from fastapi import APIRouter, Request

from app.core.config import get_settings
from app.core.rate_limit import ASSISTANT_LIMIT, limiter
from app.models.stadium import AssistantResponse, FanQuery
from app.services.gemini_service import GeminiUnavailableError, generate_fan_response
from app.services.stadium_data import get_zone_statuses

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Assistant"])


@limiter.limit(ASSISTANT_LIMIT)
async def ask_assistant(request: Request, query: FanQuery) -> AssistantResponse:
    """
    Process a fan query through the AI assistant.

    Rate limited to 20 requests/minute per IP.
    Uses Gemini (primary) with automatic fallback to rule-based responses.
    """
    settings = get_settings()
    zones = get_zone_statuses()

    source: str
    response_data: dict

    if settings.USE_GEMINI:
        try:
            response_data = await generate_fan_response(
                message=query.message,
                language=query.language,
                category=query.category,
                zones=zones,
            )
            source = "gemini"
            logger.info(
                "Fan query answered by Gemini for session %s",
                query.session_id[:8],
            )
        except GeminiUnavailableError as exc:
            logger.warning("Gemini unavailable, falling back to rules: %s", exc)
            from app.services.offline_service import offline_answer
            response_data = offline_answer(
                message=query.message,
                language=query.language,
                stadium_id=query.stadium_id,
                category=query.category,
            )
            source = "rules"
    else:
        from app.services.offline_service import offline_answer
        response_data = offline_answer(
            message=query.message,
            language=query.language,
            stadium_id=query.stadium_id,
            category=query.category,
        )
        source = "rules"

    return AssistantResponse(
        reply=response_data.get("reply", "I'm here to help! Please try rephrasing your question."),
        language=response_data.get("language", query.language),
        category=response_data.get("category", query.category),
        source=cast(Literal["gemini", "rules"], source),
        suggested_actions=response_data.get("suggested_actions", []),
    )


# Resolve annotations
ask_assistant.__annotations__ = get_type_hints(ask_assistant)
if hasattr(ask_assistant, "__wrapped__"):
    ask_assistant.__wrapped__.__annotations__ = get_type_hints(ask_assistant.__wrapped__)

router.add_api_route(
    "/assistant",
    endpoint=ask_assistant,
    methods=["POST"],
    response_model=AssistantResponse,
    summary="Fan AI assistant",
    description=(
        "Process a fan query through the multilingual AI assistant. "
        "Uses Gemini (primary) with automatic fallback to rule-based responses."
    ),
)
