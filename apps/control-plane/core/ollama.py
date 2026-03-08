from __future__ import annotations

import json
import logging
import urllib.request

logger = logging.getLogger(__name__)


def list_available_models(host: str) -> list[str]:
    try:
        req = urllib.request.Request(f"{host}/api/tags")
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read())
            return [m["name"] for m in data.get("models", [])]
    except Exception:
        logger.warning("Failed to query Ollama at %s", host, exc_info=True)
        return []


def find_first_available(host: str, candidates: list[str]) -> str | None:
    available = list_available_models(host)
    if not available:
        return None
    available_set = set(available)
    for c in candidates:
        if c in available_set:
            return c
        with_tag = f"{c}:latest"
        if with_tag in available_set:
            return with_tag
    return available[0]


_ERROR_PATTERNS = ["not found", "failed to connect to ollama", "ollama is not running"]


def is_model_not_found_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "not found" in msg


def looks_like_ollama_error(text: str) -> bool:
    lower = text.lower()
    return any(p in lower for p in _ERROR_PATTERNS)
