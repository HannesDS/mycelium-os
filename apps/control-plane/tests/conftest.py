import pytest


@pytest.fixture(autouse=True)
def _patch_auth(monkeypatch):
    monkeypatch.setattr("core.auth.DEV_API_KEY", "test-key")
    monkeypatch.setattr("routers.demo.DEMO_ENABLED", True)
