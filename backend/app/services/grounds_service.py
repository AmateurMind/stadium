"""
Read-only access to the static tournament grounds dataset (data/grounds.json).
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

# Resolve path relative to this file: app/services/grounds_service.py
# parent = app/services
# parent.parent = app
# parent.parent.parent = backend
_DATA_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "grounds.json"

Ground = dict[str, Any]


@lru_cache(maxsize=1)
def load_grounds() -> dict[str, Any]:
    """Load and cache the tournament grounds dataset."""
    with _DATA_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def list_grounds() -> list[Ground]:
    """Return all ground records."""
    return load_grounds().get("grounds", [])


def get_ground(ground_id: str) -> Ground | None:
    """Return ground with matching ID, or None."""
    return next((g for g in list_grounds() if g["id"] == ground_id), None)


def search_grounds(query: str) -> list[Ground]:
    """Case-insensitive query matching ground titles, cities, or countries."""
    q = query.strip().lower()
    if not q:
        return []
    return [
        g for g in list_grounds()
        if q in g["title"].lower()
        or q in g["locale"]["city"].lower()
        or q in g["locale"]["country"].lower()
    ]
