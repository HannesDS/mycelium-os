from __future__ import annotations

import json
from unittest.mock import patch, MagicMock

import pytest

from core.ollama import list_available_models, find_first_available, looks_like_ollama_error


class TestListAvailableModels:
    def test_returns_model_names(self):
        fake_response = MagicMock()
        fake_response.read.return_value = json.dumps({
            "models": [
                {"name": "llama3.2:latest", "size": 2000000000},
                {"name": "mistral:latest", "size": 4000000000},
            ]
        }).encode()
        fake_response.__enter__ = lambda s: s
        fake_response.__exit__ = MagicMock(return_value=False)

        with patch("core.ollama.urllib.request.urlopen", return_value=fake_response):
            result = list_available_models("http://localhost:11434")

        assert result == ["llama3.2:latest", "mistral:latest"]

    def test_returns_empty_on_connection_error(self):
        with patch("core.ollama.urllib.request.urlopen", side_effect=ConnectionError("refused")):
            result = list_available_models("http://localhost:11434")

        assert result == []

    def test_returns_empty_on_timeout(self):
        with patch("core.ollama.urllib.request.urlopen", side_effect=TimeoutError()):
            result = list_available_models("http://localhost:11434")

        assert result == []

    def test_returns_empty_on_malformed_json(self):
        fake_response = MagicMock()
        fake_response.read.return_value = b"not json"
        fake_response.__enter__ = lambda s: s
        fake_response.__exit__ = MagicMock(return_value=False)

        with patch("core.ollama.urllib.request.urlopen", return_value=fake_response):
            result = list_available_models("http://localhost:11434")

        assert result == []


class TestFindFirstAvailable:
    def test_returns_exact_match_from_candidates(self):
        with patch("core.ollama.list_available_models", return_value=["llama3.2:latest", "phi3:latest"]):
            result = find_first_available("http://localhost:11434", ["mistral:latest", "llama3.2:latest"])

        assert result == "llama3.2:latest"

    def test_returns_first_candidate_in_order(self):
        with patch("core.ollama.list_available_models", return_value=["phi3:latest", "llama3.2:latest"]):
            result = find_first_available("http://localhost:11434", ["llama3.2:latest", "phi3:latest"])

        assert result == "llama3.2:latest"

    def test_appends_latest_tag_for_match(self):
        with patch("core.ollama.list_available_models", return_value=["llama3.2:latest"]):
            result = find_first_available("http://localhost:11434", ["llama3.2"])

        assert result == "llama3.2:latest"

    def test_returns_any_available_if_no_candidate_matches(self):
        with patch("core.ollama.list_available_models", return_value=["gemma:latest"]):
            result = find_first_available("http://localhost:11434", ["mistral:latest", "llama3.2:latest"])

        assert result == "gemma:latest"

    def test_returns_none_when_no_models_available(self):
        with patch("core.ollama.list_available_models", return_value=[]):
            result = find_first_available("http://localhost:11434", ["mistral:latest"])

        assert result is None


class TestLooksLikeOllamaError:
    def test_detects_model_not_found(self):
        assert looks_like_ollama_error("model 'mistral:latest' not found") is True

    def test_detects_connection_failure(self):
        assert looks_like_ollama_error(
            "Failed to connect to Ollama. Please check that Ollama is downloaded."
        ) is True

    def test_detects_not_running(self):
        assert looks_like_ollama_error("Ollama is not running") is True

    def test_normal_response_not_flagged(self):
        assert looks_like_ollama_error("I am the CEO shroom. How can I help?") is False

    def test_empty_string(self):
        assert looks_like_ollama_error("") is False
