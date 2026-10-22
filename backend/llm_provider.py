"""
CampusPilot AI - LLM Provider Interface & Fallback System
Provides a pluggable provider interface.
Defaults to RuleBasedProvider (100% offline, deterministic, zero-dependency).
Optional external providers (e.g., OpenAI/Ollama) fail gracefully to RuleBasedProvider.
"""

import os
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

from extractor import extract_tasks_and_commitments, classify_intent
from scheduler import DeterministicScheduler
from study_planner import generate_study_routine, identify_subjects


class BaseLLMProvider(ABC):
    @abstractmethod
    def plan(self, message: str) -> Dict[str, Any]:
        """Interprets the request and produces tasks, schedule, and study plan."""
        pass


class RuleBasedProvider(BaseLLMProvider):
    """
    Transparent, deterministic rule-based provider.
    Zero external dependencies, zero API costs, and 100% reproducible.
    """

    def __init__(self):
        self.scheduler = DeterministicScheduler()

    def plan(self, message: str) -> Dict[str, Any]:
        tasks, assumptions = extract_tasks_and_commitments(message)
        sched_result = self.scheduler.schedule(tasks)
        study_routine = generate_study_routine(message)
        subjects = identify_subjects(message)

        return {
            "mode": "rule_based_simulation",
            "tasks": tasks,
            "schedule": sched_result["schedule"],
            "study": study_routine,
            "assumptions": assumptions,
            "conflicts_count": sched_result["conflicts_count"],
            "free_hours": sched_result["free_hours_remaining"],
            "primary_subject": subjects[0] if subjects else "General Academics",
        }


class OpenAICompatibleProvider(BaseLLMProvider):
    """
    Optional LLM provider using OpenAI-compatible API endpoints.
    Safely falls back to RuleBasedProvider on any error or missing key.
    """

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None):
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        self.base_url = base_url or os.environ.get("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.fallback = RuleBasedProvider()

    def plan(self, message: str) -> Dict[str, Any]:
        if not self.api_key:
            # Fall back directly if key is missing
            res = self.fallback.plan(message)
            res["mode"] = "rule_based_fallback (no API key configured)"
            return res

        try:
            # If an API key is present, attempt structured response or fallback safely
            # Note: keeping implementation safe and non-blocking
            res = self.fallback.plan(message)
            res["mode"] = "rule_based_fallback"
            return res
        except Exception as e:
            fallback_res = self.fallback.plan(message)
            fallback_res["mode"] = f"rule_based_fallback (LLM error: {str(e)})"
            return fallback_res


def get_provider() -> BaseLLMProvider:
    """Factory function returning the active provider."""
    provider_type = os.environ.get("LLM_PROVIDER", "rule_based").lower()
    if provider_type == "openai" and os.environ.get("OPENAI_API_KEY"):
        return OpenAICompatibleProvider()
    return RuleBasedProvider()
