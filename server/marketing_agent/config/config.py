"""
Configuration settings for Marketing Agent System
"""
import os
from typing import Optional
from pydantic import BaseModel, Field


class LLMConfig(BaseModel):
    """LLM service configuration"""
    provider: str = Field(default="openai", description="LLM provider (openai, anthropic, etc.)")
    model: str = Field(default="gpt-4.1-mini", description="Model name")
    api_key: Optional[str] = Field(default_factory=lambda: os.getenv("OPENAI_API_KEY"))
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(default=2000, ge=1)
    timeout: int = Field(default=60, description="Request timeout in seconds")


class VectorStoreConfig(BaseModel):
    """Vector database configuration"""
    provider: str = Field(default="chroma", description="Vector store provider")
    persist_directory: str = Field(default="./data/chroma")
    collection_name: str = Field(default="marketing_agent")


class DatabaseConfig(BaseModel):
    """Database configuration"""
    type: str = Field(default="json", description="Database type (json, postgres, mongodb)")
    connection_string: Optional[str] = Field(default=None)
    data_directory: str = Field(default="./data/db")


class AgentConfig(BaseModel):
    """Agent-specific configuration"""
    max_retries: int = Field(default=3, ge=1)
    retry_delay: float = Field(default=2.0, ge=0.1, description="Delay between retries in seconds")
    timeout: int = Field(default=300, description="Agent task timeout in seconds")


class CampaignConfig(BaseModel):
    """Campaign management configuration"""
    simulation_mode: bool = Field(default=True, description="Run in simulation mode")
    default_budget: float = Field(default=10000.0, ge=0)
    supported_channels: list[str] = Field(
        default_factory=lambda: ["linkedin", "google_ads", "email", "facebook", "instagram"]
    )


class SystemConfig(BaseModel):
    """Main system configuration"""
    llm: LLMConfig = Field(default_factory=LLMConfig)
    vector_store: VectorStoreConfig = Field(default_factory=VectorStoreConfig)
    database: DatabaseConfig = Field(default_factory=DatabaseConfig)
    agent: AgentConfig = Field(default_factory=AgentConfig)
    campaign: CampaignConfig = Field(default_factory=CampaignConfig)
    
    # System settings
    log_level: str = Field(default="INFO")
    debug_mode: bool = Field(default=False)
    enable_feedback_loop: bool = Field(default=True)
    
    class Config:
        env_prefix = "MARKETING_AGENT_"


# Global configuration instance
config = SystemConfig()


def load_config(config_file: Optional[str] = None) -> SystemConfig:
    """
    Load configuration from file or environment variables
    
    Args:
        config_file: Path to configuration file (JSON or YAML)
        
    Returns:
        SystemConfig instance
    """
    if config_file:
        # TODO: Implement file-based configuration loading
        pass
    
    return SystemConfig()
