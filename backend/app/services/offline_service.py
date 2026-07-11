"""
Deterministic offline fallback assistant for StadiumSync.

Runs when Gemini is disabled or unavailable. Matches keywords in user's
queries to ground facilities/accessibility services and formats localized answers.
"""

from __future__ import annotations

import re
from typing import Any
from app.services.grounds_service import get_ground, list_grounds

# Supported languages for offline responses
SUPPORTED_LANGUAGES = {"en", "es", "fr"}

# Mapping keywords to specific facility/accessibility fields
KEYWORDS = {
    "wheelchair": ["wheelchair", "accessibility", "silla de ruedas", "fauteuil roulant", "ada", "disability", "discapacidad", "handicap"],
    "hearing": ["hearing", "audicion", "loop", "caption", "sordo", "sourd", "ecoute"],
    "sight": ["sight", "braille", "blind", "ciego", "aveugle", "vision", "visual"],
    "sensory": ["sensory", "quiet", "calm", "sensorial", "tranquila", "calme", "stimulation"],
    "lifts": ["elevator", "lift", "ascensor", "elevador", "ascenseur", "escalator"],
    "restrooms": ["restroom", "toilet", "bano", "toilettes", "adapted", "wc"],
    "water": ["water", "refill", "hydration", "agua", "eau", "boire", "drink", "thirsty"],
    "food": ["food", "concession", "eat", "hungry", "comida", "nourriture", "restaurant", "vendor"],
    "nursing": ["nursing", "breastfeed", "lactation", "baby", "lactancia", "bebe", "allaitement"],
    "medical": ["medical", "first aid", "post", "doctor", "auxiliary", "primeros auxilios", "enfermeria", "premiers secours", "infirmerie"],
    "worship": ["worship", "pray", "prayer", "religion", "faith", "reflection", "oracion", "rezar", "priere", "prier"]
}

TEMPLATES = {
    "en": {
        "welcome": "Welcome to the FIFA World Cup 2026 assistant! How can I help you today?",
        "ground_select": "Please select a stadium to get precise details. Available: {grounds}.",
        "unverified": "Note: these stadium details are not yet verified by the official tournament team.",
        "wheelchair": "Wheelchair Access at {title}: {value}",
        "hearing": "Hearing Support at {title}: {value}",
        "sight": "Sight/Vision Support at {title}: {value}",
        "sensory": "Sensory Quiet Areas at {title}: {value}",
        "lifts": "Elevators/Lifts at {title}: {value}",
        "restrooms": "Accessible Restrooms at {title}: {value}",
        "calm_route": "Quiet Entry Route at {title}: {value}",
        "water": "Water/Hydration at {title}: {value}",
        "food": "Food Areas at {title}: {value}",
        "nursing": "Nursing Room at {title}: {value}",
        "medical": "First Aid at {title}: {value}",
        "worship": "Multi-faith Space at {title}: {value}",
        "schedule": "FIFA World Cup 2026 Details: Opening match is {opening} at {open_ground}. The final is {final} at {final_ground}.",
        "fallback": "I found information for {title}. Restrooms: {restrooms}. Elevators: {lifts}. Accessible entrances: {entrances}."
    },
    "es": {
        "welcome": "¡Bienvenido al asistente de la Copa Mundial de la FIFA 2026! ¿Cómo puedo ayudarle?",
        "ground_select": "Por favor seleccione un estadio para detalles precisos. Disponible: {grounds}.",
        "unverified": "Nota: estos detalles no han sido verificados oficialmente por el estadio.",
        "wheelchair": "Acceso para sillas de ruedas en {title}: {value}",
        "hearing": "Soporte auditivo en {title}: {value}",
        "sight": "Soporte visual en {title}: {value}",
        "sensory": "Áreas sensoriales tranquilas en {title}: {value}",
        "lifts": "Ascensores en {title}: {value}",
        "restrooms": "Baños accesibles en {title}: {value}",
        "calm_route": "Ruta tranquila en {title}: {value}",
        "water": "Agua/Hidratación en {title}: {value}",
        "food": "Áreas de comida en {title}: {value}",
        "nursing": "Sala de lactancia en {title}: {value}",
        "medical": "Primeros auxilios en {title}: {value}",
        "worship": "Espacio de oración en {title}: {value}",
        "schedule": "Detalles de la Copa Mundial FIFA 2026: El partido inaugural es el {opening} en {open_ground}. La final es el {final} en {final_ground}.",
        "fallback": "Encontré información de {title}. Baños: {restrooms}. Ascensores: {lifts}. Entradas accesibles: {entrances}."
    },
    "fr": {
        "welcome": "Bienvenue dans l'assistant de la Coupe du Monde de la FIFA 2026 ! Comment puis-je vous aider ?",
        "ground_select": "Veuillez sélectionner un stade pour des détails précis. Disponible: {grounds}.",
        "unverified": "Note: ces détails ne sont pas encore officiellement validés par le stade.",
        "wheelchair": "Accès fauteuil roulant à {title}: {value}",
        "hearing": "Assistance auditive à {title}: {value}",
        "sight": "Assistance visuelle à {title}: {value}",
        "sensory": "Espaces sensoriels calmes à {title}: {value}",
        "lifts": "Ascenseurs à {title}: {value}",
        "restrooms": "Toilettes accessibles à {title}: {value}",
        "calm_route": "Itinéraire calme à {title}: {value}",
        "water": "Eau et hydratation à {title}: {value}",
        "food": "Restauration à {title}: {value}",
        "nursing": "Espace allaitement à {title}: {value}",
        "medical": "Premiers secours à {title}: {value}",
        "worship": "Espace de prière à {title}: {value}",
        "schedule": "Détails de la Coupe du Monde de la FIFA 2026: Match d'ouverture le {opening} à {open_ground}. Finale le {final} à {final_ground}.",
        "fallback": "J'ai trouvé des infos sur {title}. Toilettes: {restrooms}. Ascenseurs: {lifts}. Entrées accessibles: {entrances}."
    }
}


def _matches(message: str, keys: list[str]) -> bool:
    """Case-insensitive regex match check for list of keys."""
    pattern = r"\b(" + "|".join(re.escape(k) for k in keys) + r")\b"
    return bool(re.search(pattern, message.lower()))


def offline_answer(
    message: str,
    language: str,
    stadium_id: str | None = None,
) -> dict[str, Any]:
    """
    Generate deterministic response based on keywords and stadium context.
    """
    lang = language.lower()[:2]
    if lang not in SUPPORTED_LANGUAGES:
        lang = "en"

    t = TEMPLATES[lang]
    msg = message.strip()

    # Handle schedule/general tournament queries first
    if _matches(msg, ["match", "opening", "final", "kickoff", "schedule", "partido", "inaugural", "calendario"]):
        grounds = list_grounds()
        open_ground = next((g["title"] for g in grounds if g["id"] == "azteca"), "Estadio Azteca")
        final_ground = next((g["title"] for g in grounds if g["id"] == "metlife"), "MetLife Stadium")
        return {
            "reply": t["schedule"].format(
                opening="2026-06-11", open_ground=open_ground,
                final="2026-07-19", final_ground=final_ground
            ),
            "language": lang,
            "category": "schedule",
            "suggested_actions": ["Check other matches", "View stadium details"]
        }

    # Ensure stadium is selected
    if not stadium_id:
        grounds = list_grounds()
        ground_list = ", ".join(f"{g['title']} ({g['id']})" for g in grounds[:4])
        return {
            "reply": t["ground_select"].format(grounds=ground_list),
            "language": lang,
            "category": "general",
            "suggested_actions": [f"Select {g['title']}" for g in grounds[:2]]
        }

    ground = get_ground(stadium_id)
    if not ground:
        return {
            "reply": f"Sorry, I couldn't find details for stadium ID: {stadium_id}.",
            "language": lang,
            "category": "general",
            "suggested_actions": []
        }

    title = ground["title"]
    acc = ground["accessibility"]
    fac = ground["facilities"]

    # Match specific facilities/accessibility keyword
    matched_replies = []
    category = "general"

    if _matches(msg, KEYWORDS["wheelchair"]):
        matched_replies.append(t["wheelchair"].format(title=title, value=acc["wheelchair_seating"]))
        category = "accessibility"

    if _matches(msg, KEYWORDS["hearing"]):
        matched_replies.append(t["hearing"].format(title=title, value=acc["hearing_support"]))
        category = "accessibility"

    if _matches(msg, KEYWORDS["sight"]):
        matched_replies.append(t["sight"].format(title=title, value=acc["sight_support"]))
        category = "accessibility"

    if _matches(msg, KEYWORDS["sensory"]):
        matched_replies.append(t["sensory"].format(title=title, value=acc["sensory_space"]))
        category = "accessibility"

    if _matches(msg, KEYWORDS["lifts"]):
        matched_replies.append(t["lifts"].format(title=title, value=acc["lifts"]))
        category = "accessibility"

    if _matches(msg, KEYWORDS["restrooms"]):
        matched_replies.append(t["restrooms"].format(title=title, value=acc["adapted_restrooms"]))
        category = "accessibility"

    if _matches(msg, KEYWORDS["water"]):
        matched_replies.append(t["water"].format(title=title, value=fac["water_stations"]))
        category = "amenities"

    if _matches(msg, KEYWORDS["food"]):
        matched_replies.append(t["food"].format(title=title, value=fac["food_areas"]))
        category = "amenities"

    if _matches(msg, KEYWORDS["nursing"]):
        matched_replies.append(t["nursing"].format(title=title, value=fac["nursing_suite"]))
        category = "amenities"

    if _matches(msg, KEYWORDS["medical"]):
        matched_replies.append(t["medical"].format(title=title, value=fac["medical_post"]))
        category = "safety"

    if _matches(msg, KEYWORDS["worship"]):
        matched_replies.append(t["worship"].format(title=title, value=fac["worship_space"]))
        category = "amenities"

    # If any specific keyword matched, join the replies
    if matched_replies:
        reply = " ".join(matched_replies)
        if not ground["verified"]:
            reply += " " + t["unverified"]
        return {
            "reply": reply,
            "language": lang,
            "category": category,
            "suggested_actions": ["Find toilets", "Ask about water", "View quiet routes"]
        }

    # Fallback to general stadium overview info
    entrances = ", ".join(e["name"] for e in ground["entrances"] if e["step_free"])
    reply = t["fallback"].format(
        title=title, restrooms=acc["adapted_restrooms"],
        lifts=acc["lifts"], entrances=entrances
    )
    if not ground["verified"]:
        reply += " " + t["unverified"]

    return {
        "reply": reply,
        "language": lang,
        "category": "general",
        "suggested_actions": ["Ask about wheelchair access", "Check food locations", "Show quiet zones"]
    }
