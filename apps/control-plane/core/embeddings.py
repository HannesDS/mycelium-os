from __future__ import annotations

import logging
import os

import ollama

logger = logging.getLogger(__name__)

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
EMBED_MODEL = os.getenv("EMBED_MODEL", "nomic-embed-text")


def embed_text(text: str) -> list[float] | None:
    """Generate embedding for text using Ollama. Returns None on failure."""
    try:
        client = ollama.Client(host=OLLAMA_HOST)
        response = client.embeddings(model=EMBED_MODEL, prompt=text[:8192])
        return response["embedding"]
    except Exception:
        logger.warning("Failed to generate embedding", exc_info=True)
        return None
