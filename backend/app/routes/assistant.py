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


# ---------------------------------------------------------------------------
# Rule-based fallback responses
# ---------------------------------------------------------------------------
_FALLBACK_RESPONSES: dict[str, dict] = {
    "navigation": {
        "en": "For navigation assistance, please look for the blue wayfinding signs throughout the stadium. Staff members in yellow vests can also help guide you. The nearest information desk is located at the main concourse level.",
        "es": "Para asistencia de navegación, busque las señales azules de orientación en todo el estadio. Los miembros del personal con chalecos amarillos también pueden guiarle. El mostrador de información más cercano está en el nivel del pasillo principal.",
    },
    "amenities": {
        "en": "Restrooms, food courts, and first aid stations are located on every concourse level. Look for the overhead signs with icons to find the nearest facility.",
        "es": "Los baños, comedores y estaciones de primeros auxilios están ubicados en cada nivel del pasillo. Busque los letreros elevados con iconos para encontrar la instalación más cercana.",
    },
    "transport": {
        "en": "Public transport shuttles depart from Gate A every 10 minutes. Rideshare pickup is at Parking Lot 1. Metro station is a 5-minute walk from Gate C.",
        "es": "Los autobuses de transporte público salen de la Puerta A cada 10 minutos. La recogida de viajes compartidos está en el Estacionamiento 1. La estación de metro está a 5 minutos a pie de la Puerta C.",
    },
    "accessibility": {
        "en": "Wheelchair-accessible entrances are available at Gates A, B, C, and D. Accessible restrooms are on every level. For assistance, text HELP to the number on your ticket or ask any staff member.",
        "es": "Las entradas accesibles para sillas de ruedas están disponibles en las Puertas A, B, C y D. Los baños accesibles están en todos los niveles. Para asistencia, envíe un mensaje de texto con HELP al número de su boleto.",
    },
    "schedule": {
        "en": "Gates open 3 hours before kickoff. The pre-match ceremony begins 30 minutes before the game. Check the official app for real-time schedule updates.",
        "es": "Las puertas abren 3 horas antes del inicio. La ceremonia previa al partido comienza 30 minutos antes del juego. Consulte la aplicación oficial para actualizaciones del horario en tiempo real.",
    },
    "safety": {
        "en": "For emergencies, call stadium security at the number on your ticket. First aid stations are located at the main concourse and near sections 101 and 201. Follow the illuminated exit signs in case of evacuation.",
        "es": "Para emergencias, llame a seguridad del estadio al número de su boleto. Las estaciones de primeros auxilios están en el pasillo principal y cerca de las secciones 101 y 201. Siga las señales de salida iluminadas en caso de evacuación.",
    },
    "general": {
        "en": "Welcome to the FIFA World Cup 2026! I'm here to help with navigation, amenities, transport, accessibility, schedules, and safety. What would you like to know?",
        "es": "¡Bienvenido a la Copa Mundial de la FIFA 2026! Estoy aquí para ayudarle con navegación, servicios, transporte, accesibilidad, horarios y seguridad. ¿Qué le gustaría saber?",
    },
}


def _get_fallback_response(category: str, language: str) -> dict:
    """Get a deterministic fallback response for the given category and language."""
    cat_responses = _FALLBACK_RESPONSES.get(category, _FALLBACK_RESPONSES["general"])
    reply = cat_responses.get(language, cat_responses["en"])

    return {
        "reply": reply,
        "language": language,
        "category": category,
        "suggested_actions": [
            "Ask about restroom locations",
            "Check gate wait times",
            "Find accessible facilities",
        ],
    }


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
            )
            source = "rules"
    else:
        from app.services.offline_service import offline_answer
        response_data = offline_answer(
            message=query.message,
            language=query.language,
            stadium_id=query.stadium_id,
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
