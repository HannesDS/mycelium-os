from __future__ import annotations

import pytest

from core.tools.web_browser import fetch_page


def test_fetch_page_blocks_localhost():
    with pytest.raises(ValueError, match="host not allowed"):
        fetch_page("http://localhost/test")


def test_fetch_page_blocks_127_0_0_1():
    with pytest.raises(ValueError, match="host not allowed"):
        fetch_page("http://127.0.0.1/test")


def test_fetch_page_blocks_metadata_endpoint():
    with pytest.raises(ValueError, match="host not allowed"):
        fetch_page("http://metadata.google.internal/computeMetadata/v1/")

