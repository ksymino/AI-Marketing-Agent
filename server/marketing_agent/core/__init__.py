"""
Marketing Agent System - Core Package
"""
from core.models import (
    BrandProfile, SWOTAnalysis, PositioningStrategy,
    ContentAsset, VisualAsset, CampaignPlan,
    PerformanceMetrics, WorkflowInput, WorkflowResult,
    Platform, ContentType, ToneOfVoice
)
from core.memory import SharedMemory, VectorMemory
from core.coordinator import AgentCoordinator

__all__ = [
    "BrandProfile",
    "SWOTAnalysis",
    "PositioningStrategy",
    "ContentAsset",
    "VisualAsset",
    "CampaignPlan",
    "PerformanceMetrics",
    "WorkflowInput",
    "WorkflowResult",
    "Platform",
    "ContentType",
    "ToneOfVoice",
    "SharedMemory",
    "VectorMemory",
    "AgentCoordinator"
]
