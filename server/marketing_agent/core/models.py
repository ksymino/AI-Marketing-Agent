"""
Data models for Marketing Agent System
"""
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field


class ToneOfVoice(str, Enum):
    """Brand tone of voice options"""
    PROFESSIONAL = "professional"
    FRIENDLY = "friendly"
    INNOVATIVE = "innovative"
    AUTHORITATIVE = "authoritative"
    PLAYFUL = "playful"
    EMPATHETIC = "empathetic"


class Platform(str, Enum):
    """Marketing platform options"""
    LINKEDIN = "linkedin"
    GOOGLE_ADS = "google_ads"
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    EMAIL = "email"
    TWITTER = "twitter"


class ContentType(str, Enum):
    """Content type options"""
    POST = "post"
    AD_COPY = "ad_copy"
    EMAIL_CAMPAIGN = "email_campaign"
    ARTICLE = "article"
    VIDEO_SCRIPT = "video_script"


# ============================================================================
# Brand Strategist Models
# ============================================================================

class TargetAudience(BaseModel):
    """Target audience definition"""
    demographics: Dict[str, Any] = Field(default_factory=dict, description="Age, gender, location, etc.")
    psychographics: Dict[str, Any] = Field(default_factory=dict, description="Interests, values, lifestyle")
    pain_points: List[str] = Field(default_factory=list, description="Customer pain points")
    goals: List[str] = Field(default_factory=list, description="Customer goals and aspirations")


class BrandProfile(BaseModel):
    """Brand profile and identity"""
    brand_name: str
    industry: str
    website_url: Optional[str] = None
    tone_of_voice: List[ToneOfVoice] = Field(default_factory=list)
    value_proposition: str = Field(default="", description="Core value proposition")
    key_messages: List[str] = Field(default_factory=list)
    target_audience: TargetAudience = Field(default_factory=TargetAudience)
    brand_keywords: List[str] = Field(default_factory=list)
    competitors: List[str] = Field(default_factory=list)


class SWOTAnalysis(BaseModel):
    """SWOT analysis results"""
    strengths: List[str] = Field(default_factory=list)
    weaknesses: List[str] = Field(default_factory=list)
    opportunities: List[str] = Field(default_factory=list)
    threats: List[str] = Field(default_factory=list)


class PositioningStrategy(BaseModel):
    """Market positioning strategy"""
    key_messages: List[str] = Field(default_factory=list)
    differentiation_points: List[str] = Field(default_factory=list)
    recommended_channels: List[Platform] = Field(default_factory=list)
    content_themes: List[str] = Field(default_factory=list)


class BrandAnalysisResult(BaseModel):
    """Complete brand analysis output"""
    brand_profile: BrandProfile
    swot_analysis: SWOTAnalysis
    positioning_strategy: PositioningStrategy
    created_at: datetime = Field(default_factory=datetime.now)
    analysis_id: str = Field(default="")


# ============================================================================
# Creative Engine Models
# ============================================================================

class VisualAsset(BaseModel):
    """Visual asset specification"""
    asset_id: str
    prompt: str = Field(description="Image generation prompt")
    generated_url: Optional[str] = None
    local_path: Optional[str] = None
    style: str = Field(default="professional")


class ContentAsset(BaseModel):
    """Marketing content asset"""
    content_id: str
    platform: Platform
    content_type: ContentType
    content: str = Field(description="Main content text")
    headline: Optional[str] = None
    subject_line: Optional[str] = None
    cta: Optional[str] = Field(None, description="Call to action")
    hashtags: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    visual_prompt: Optional[str] = None
    tone: ToneOfVoice = ToneOfVoice.PROFESSIONAL
    estimated_engagement_score: Optional[float] = None


class ContentGenerationRequest(BaseModel):
    """Request for content generation"""
    brand_profile: BrandProfile
    campaign_brief: str
    target_platforms: List[Platform]
    content_types: List[ContentType]
    num_variants: int = Field(default=1, ge=1, le=5)


class ContentGenerationResult(BaseModel):
    """Content generation output"""
    content_assets: List[ContentAsset]
    visual_assets: List[VisualAsset]
    generation_metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)


# ============================================================================
# Campaign Manager Models
# ============================================================================

class BudgetAllocation(BaseModel):
    """Budget allocation per channel"""
    channel: Platform
    allocated_budget: float = Field(ge=0)
    estimated_reach: int = Field(default=0, ge=0)
    estimated_cpm: float = Field(default=0.0, ge=0)
    estimated_cpc: float = Field(default=0.0, ge=0)


class ChannelStrategy(BaseModel):
    """Strategy for a specific channel"""
    channel: Platform
    content_id: str
    target_audience: TargetAudience
    budget_allocation: BudgetAllocation
    schedule: Optional[Dict[str, Any]] = None


class InfluencerOutreach(BaseModel):
    """Influencer outreach plan"""
    influencer_name: str
    platform: Platform
    follower_count: int = Field(ge=0)
    engagement_rate: float = Field(ge=0.0, le=1.0)
    outreach_message: str
    estimated_reach: int = Field(ge=0)
    cost: float = Field(default=0.0, ge=0)


class CampaignPlan(BaseModel):
    """Complete campaign execution plan"""
    campaign_id: str
    campaign_name: str
    total_budget: float = Field(ge=0)
    budget_allocations: List[BudgetAllocation]
    channel_strategies: List[ChannelStrategy]
    influencer_outreach: List[InfluencerOutreach] = Field(default_factory=list)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    target_kpis: Dict[str, float] = Field(default_factory=dict)


class PerformanceMetrics(BaseModel):
    """Campaign performance metrics"""
    impressions: int = Field(default=0, ge=0)
    clicks: int = Field(default=0, ge=0)
    ctr: float = Field(default=0.0, ge=0.0, description="Click-through rate")
    conversions: int = Field(default=0, ge=0)
    conversion_rate: float = Field(default=0.0, ge=0.0)
    total_cost: float = Field(default=0.0, ge=0)
    revenue: float = Field(default=0.0, ge=0)
    roi: float = Field(default=0.0, description="Return on investment")
    cost_per_acquisition: float = Field(default=0.0, ge=0)
    engagement_score: float = Field(default=0.0, ge=0.0)


class OptimizationFeedback(BaseModel):
    """Optimization recommendations"""
    insights: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)
    suggested_budget_reallocation: Optional[Dict[Platform, float]] = None
    suggested_content_adjustments: List[str] = Field(default_factory=list)


class CampaignResult(BaseModel):
    """Complete campaign execution result"""
    campaign_plan: CampaignPlan
    performance_metrics: PerformanceMetrics
    optimization_feedback: OptimizationFeedback
    executed_at: datetime = Field(default_factory=datetime.now)


# ============================================================================
# Workflow Models
# ============================================================================

class WorkflowState(str, Enum):
    """Workflow execution state"""
    PENDING = "pending"
    ANALYZING_BRAND = "analyzing_brand"
    GENERATING_CONTENT = "generating_content"
    PLANNING_CAMPAIGN = "planning_campaign"
    EXECUTING_CAMPAIGN = "executing_campaign"
    COMPLETED = "completed"
    FAILED = "failed"


class WorkflowInput(BaseModel):
    """Input for complete workflow"""
    website_url: Optional[str] = None
    brand_materials: List[str] = Field(default_factory=list, description="Paths to brand materials")
    campaign_brief: str
    budget: float = Field(ge=0)
    target_platforms: List[Platform]
    target_kpis: Dict[str, float] = Field(default_factory=dict)


class WorkflowResult(BaseModel):
    """Complete workflow execution result"""
    workflow_id: str
    state: WorkflowState
    brand_analysis: Optional[BrandAnalysisResult] = None
    content_generation: Optional[ContentGenerationResult] = None
    campaign_result: Optional[CampaignResult] = None
    error_message: Optional[str] = None
    started_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None


# ============================================================================
# Message Models (Inter-agent communication)
# ============================================================================

class MessageType(str, Enum):
    """Message types for agent communication"""
    TASK_REQUEST = "task_request"
    TASK_RESPONSE = "task_response"
    STATUS_UPDATE = "status_update"
    ERROR = "error"
    FEEDBACK = "feedback"


class AgentMessage(BaseModel):
    """Message format for inter-agent communication"""
    message_id: str
    timestamp: datetime = Field(default_factory=datetime.now)
    from_agent: str
    to_agent: str
    message_type: MessageType
    payload: Dict[str, Any]
    context: Dict[str, Any] = Field(default_factory=dict)
