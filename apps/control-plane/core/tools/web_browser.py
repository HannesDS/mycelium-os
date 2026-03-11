from __future__ import annotations

import re

import httpx

from core.prompt_safety import wrap_untrusted

_ALLOWED_SCHEMES = {"https", "http"}
_MAX_CONTENT_LENGTH = 500_000
_MAX_URL_LENGTH = 2048


def _is_allowed_url(url: str) -> bool:
    if len(url) > _MAX_URL_LENGTH:
        return False
    lower = url.strip().lower()
    if not lower.startswith(("https://", "http://")):
        return False
    scheme = lower.split("://", 1)[0]
    return scheme in _ALLOWED_SCHEMES


def fetch_page(url: str) -> str:
    """
    Fetch and return the text content of a web page. Use for reading public web pages.
    Only https and http URLs are allowed.

    Args:
        url: The URL to fetch (must start with https:// or http://).

    Returns:
        str: The page content as plain text, truncated if very long.
    """
    if not _is_allowed_url(url):
        raise ValueError(f"URL not allowed: {url}")
    with httpx.Client(timeout=30.0, follow_redirects=True) as client:
        resp = client.get(url)
        resp.raise_for_status()
        content = resp.text
        if len(content) > _MAX_CONTENT_LENGTH:
            content = content[:_MAX_CONTENT_LENGTH] + "\n[... truncated]"
        text = re.sub(r"\s+", " ", content)
        return wrap_untrusted(text.strip())


fetch_page.skill_id = "web_browser"
