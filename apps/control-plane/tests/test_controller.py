from unittest.mock import patch

import pytest

from agno.models.ollama import Ollama
from agno.models.openrouter import OpenRouter
from core.controller import ShroomController, _resolve_model
from core.manifest import ShroomManifest, ShroomMetadata, ShroomSpec


def test_resolve_model_ollama():
    m = _resolve_model("mistral-7b")
    assert isinstance(m, Ollama)
    assert m.id == "mistral:latest"


def test_resolve_model_ollama_passthrough():
    m = _resolve_model("llama3.2:latest")
    assert isinstance(m, Ollama)
    assert m.id == "llama3.2:latest"


def test_resolve_model_openrouter_requires_key():
    with patch.dict("os.environ", {"OPENROUTER_API_KEY": ""}):
        with pytest.raises(ValueError, match="OPENROUTER_API_KEY"):
            _resolve_model("openrouter/anthropic/claude-3.5-sonnet")


def test_resolve_model_openrouter_with_key():
    with patch.dict("os.environ", {"OPENROUTER_API_KEY": "sk-test"}):
        m = _resolve_model("openrouter/anthropic/claude-3.5-sonnet")
    assert isinstance(m, OpenRouter)
    assert m.id == "anthropic/claude-3.5-sonnet"


def test_create_agent_openrouter():
    with patch.dict("os.environ", {"OPENROUTER_API_KEY": "sk-test"}):
        manifest = ShroomManifest(
            apiVersion="mycelium.io/v1",
            kind="Shroom",
            metadata=ShroomMetadata(id="test", name="Test"),
            spec=ShroomSpec(
                model="openrouter/anthropic/claude-3.5-sonnet",
                skills=[],
                escalates_to="human",
            ),
        )
        c = ShroomController()
        c.register(manifest)
        agent = c.get_agent("test")
        assert agent is not None
        assert isinstance(agent.model, OpenRouter)
