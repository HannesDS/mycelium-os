from __future__ import annotations

import http.client
import ipaddress
import re
import socket
import ssl
from urllib.parse import urljoin, urlparse

from core.prompt_safety import wrap_untrusted

_ALLOWED_SCHEMES = {"https", "http"}
_MAX_CONTENT_LENGTH = 500_000
_MAX_URL_LENGTH = 2048
_MAX_REDIRECTS = 5
_TIMEOUT = 30.0

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


def _resolve_and_validate(url: str) -> tuple[str, str, int, str, bool]:
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
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    path = parsed.path or "/"
    if parsed.query:
        path += "?" + parsed.query
    addrs = socket.getaddrinfo(host, port, socket.AF_UNSPEC, socket.SOCK_STREAM)
    for addr in addrs:
        ip = addr[4][0]
        if not _is_blocked_ip(ip):
            return (host, ip, port, path, parsed.scheme == "https")
    raise ValueError("URL resolves to blocked address")


def _is_allowed_url(url: str) -> bool:
    if len(url) > _MAX_URL_LENGTH:
        return False
    lower = url.strip().lower()
    if not lower.startswith(("https://", "http://")):
        return False
    scheme = lower.split("://", 1)[0]
    return scheme in _ALLOWED_SCHEMES


class _PinnedHTTPConnection(http.client.HTTPConnection):
    def __init__(self, host: str, port: int, resolved_ip: str, **kwargs: object) -> None:
        self._resolved_ip = resolved_ip
        super().__init__(host, port, **kwargs)

    def connect(self) -> None:
        self.sock = socket.create_connection((self._resolved_ip, self.port), self.timeout)


class _PinnedHTTPSConnection(http.client.HTTPSConnection):
    def __init__(self, host: str, port: int, resolved_ip: str, **kwargs: object) -> None:
        self._resolved_ip = resolved_ip
        super().__init__(host, port, **kwargs)

    def connect(self) -> None:
        self.sock = socket.create_connection((self._resolved_ip, self.port), self.timeout)
        if self._tunnel_host:
            self._tunnel()
        self.sock = self.context.wrap_socket(self.sock, server_hostname=self.host)


def _fetch_pinned(host: str, ip: str, port: int, path: str, is_https: bool) -> tuple[int, dict[str, str], str]:
    conn_cls = _PinnedHTTPSConnection if is_https else _PinnedHTTPConnection
    conn = conn_cls(host, port, ip, timeout=_TIMEOUT)
    try:
        conn.request("GET", path, headers={"Host": host, "User-Agent": "Mycelium-WebBrowser/1.0"})
        resp = conn.getresponse()
        headers = {k.lower(): v for k, v in resp.getheaders()}
        chunks: list[bytes] = []
        total = 0
        while True:
            data = resp.read(8192)
            if not data:
                break
            if total >= _MAX_CONTENT_LENGTH:
                break
            if total + len(data) > _MAX_CONTENT_LENGTH:
                keep = _MAX_CONTENT_LENGTH - total
                if keep > 0:
                    chunks.append(data[:keep])
                break
            chunks.append(data)
            total += len(data)
        body = b"".join(chunks).decode("utf-8", errors="replace")
        return (resp.status, headers, body)
    finally:
        conn.close()


def fetch_page(url: str) -> str:
    """
    Fetch and return the text content of a web page. Use for reading public web pages.
    Only https and http URLs are allowed. Blocks private IPs, localhost, and metadata endpoints.
    Connects to validated IP directly to prevent DNS rebinding.
    """
    if not _is_allowed_url(url):
        raise ValueError(f"URL not allowed: {url}")
    host, ip, port, path, is_https = _resolve_and_validate(url)
    status, headers, body = _fetch_pinned(host, ip, port, path, is_https)
    redirects = 0
    while 300 <= status < 400 and redirects < _MAX_REDIRECTS:
        location = headers.get("location")
        if not location:
            break
        base_url = f"{'https' if is_https else 'http'}://{host}:{port}{path}"
        next_str = location if location.startswith(("http://", "https://")) else urljoin(base_url, location)
        if not _is_allowed_url(next_str):
            break
        host, ip, port, path, is_https = _resolve_and_validate(next_str)
        status, headers, body = _fetch_pinned(host, ip, port, path, is_https)
        redirects += 1
    if status >= 400:
        raise ValueError(f"HTTP {status}")
    if len(body) > _MAX_CONTENT_LENGTH:
        body = body[:_MAX_CONTENT_LENGTH] + "\n[... truncated]"
    text = re.sub(r"\s+", " ", body)
    return wrap_untrusted(text.strip())


fetch_page.skill_id = "web_browser"
