from __future__ import annotations

import ipaddress
import re
import socket
from urllib.parse import urljoin, urlparse

import httpx

from core.prompt_safety import wrap_untrusted

_ALLOWED_SCHEMES = {"https", "http"}
_MAX_CONTENT_LENGTH = 500_000
_MAX_URL_LENGTH = 2048
_MAX_REDIRECTS = 5

_BLOCKED_HOSTS = frozenset({
    "localhost", "127.0.0.1", "0.0.0.0", "::1",
    "metadata.google.internal", "metadata.google.com",
    "169.254.169.254", "metadata",
})


def _is_blocked_ip(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        return True
    return (
        ip.is_loopback
        or ip.is_private
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
    )


def _validate_url(url: str) -> None:
    if len(url) > _MAX_URL_LENGTH:
        raise ValueError("URL too long")
    parsed = urlparse(url)
    if not parsed.scheme or parsed.scheme.lower() not in _ALLOWED_SCHEMES:
        raise ValueError("URL scheme not allowed")
    host = (parsed.hostname or "").strip().lower()
    if not host:
        raise ValueError("URL has no host")
    if host in _BLOCKED_HOSTS:
        raise ValueError("URL host not allowed")
    try:
        for addr in socket.getaddrinfo(host, parsed.port or (443 if parsed.scheme == "https" else 80), socket.AF_UNSPEC, socket.SOCK_STREAM):
            ip = addr[4][0]
            if _is_blocked_ip(ip):
                raise ValueError("URL resolves to blocked address")
    except socket.gaierror:
        raise ValueError("URL host could not be resolved")


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
    Only https and http URLs are allowed. Blocks private IPs, localhost, and metadata endpoints.
    """
    if not _is_allowed_url(url):
        raise ValueError(f"URL not allowed: {url}")
    _validate_url(url)
    with httpx.Client(timeout=30.0, follow_redirects=False) as client:
        resp = client.get(url)
        redirects = 0
        while 300 <= resp.status_code < 400 and redirects < _MAX_REDIRECTS:
            location = resp.headers.get("location")
            if not location:
                break
            next_str = location if location.startswith(("http://", "https://")) else urljoin(str(resp.url), location)
            _validate_url(next_str)
            resp = client.get(next_str)
            redirects += 1
        resp.raise_for_status()
        content = resp.text
        if len(content) > _MAX_CONTENT_LENGTH:
            content = content[:_MAX_CONTENT_LENGTH] + "\n[... truncated]"
        text = re.sub(r"\s+", " ", content)
        return wrap_untrusted(text.strip())


fetch_page.skill_id = "web_browser"
