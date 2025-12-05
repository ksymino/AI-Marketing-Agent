"""
Agent Coordinator
Orchestrates the workflow between Brand Strategist, Creative Engine, and Campaign Manager
"""
import asyncio
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

from openai import OpenAI

from core.models import (
    WorkflowInput, WorkflowResult, WorkflowState,
    BrandAnalysisResult, ContentGenerationResult, CampaignResult
)
from core.memory import SharedMemory
from agents.brand_strategist import BrandStrategistAgent
from agents.creative_engine import CreativeEngineAgent
from agents.campaign_manager import CampaignManagerAgent


class AgentCoordinator:
    """
    Central coordinator for multi-agent workflow
    
    Orchestrates the complete marketing workflow:
    1. Brand Strategist analyzes brand
    2. Creative Engine generates content
    3. Campaign Manager executes campaign
    4. Feedback loop for optimization
    """
    
    def __init__(self, 
                 llm_client: OpenAI,
                 shared_memory: SharedMemory,
                 enable_feedback_loop: bool = True,
                 max_iterations: int = 2):
        """
        Initialize Agent Coordinator
        
        Args:
            llm_client: OpenAI client instance
            shared_memory: Shared memory for inter-agent communication
            enable_feedback_loop: Whether to enable feedback loop
            max_iterations: Maximum number of optimization iterations
        """
        self.llm = llm_client
        self.memory = shared_memory
        self.enable_feedback_loop = enable_feedback_loop
        self.max_iterations = max_iterations
        
        # Initialize agents
        self.brand_strategist = BrandStrategistAgent(llm_client, shared_memory)
        self.creative_engine = CreativeEngineAgent(llm_client, shared_memory)
        self.campaign_manager = CampaignManagerAgent(llm_client, shared_memory)
        
        print("[Coordinator] Multi-Agent Marketing System initialized")
        print(f"  - Brand Strategist: Ready")
        print(f"  - Creative Engine: Ready")
        print(f"  - Campaign Manager: Ready")
        print(f"  - Feedback Loop: {'Enabled' if enable_feedback_loop else 'Disabled'}")
    
    async def execute_workflow(self, workflow_input: WorkflowInput) -> WorkflowResult:
        """
        Execute complete marketing workflow
        
        Args:
            workflow_input: Workflow input parameters
            
        Returns:
            Complete workflow result
        """
        # Create new session
        session_id = self.memory.create_session()
        workflow_id = str(uuid.uuid4())
        
        print(f"\n{'='*60}")
        print(f"Starting Marketing Workflow")
        print(f"Session ID: {session_id}")
        print(f"Workflow ID: {workflow_id}")
        print(f"{'='*60}\n")
        
        # Initialize workflow result
        result = WorkflowResult(
            workflow_id=workflow_id,
            state=WorkflowState.PENDING,
            started_at=datetime.now()
        )
        
        try:
            # Stage 1: Brand Analysis
            result.state = WorkflowState.ANALYZING_BRAND
            self.memory.set_workflow_state(result.state.value)
            
            brand_analysis = await self._execute_with_retry(
                self._stage_brand_analysis,
                workflow_input
            )
            result.brand_analysis = brand_analysis
            
            # Stage 2: Content Generation
            result.state = WorkflowState.GENERATING_CONTENT
            self.memory.set_workflow_state(result.state.value)
            
            content_generation = await self._execute_with_retry(
                self._stage_content_generation,
                brand_analysis, workflow_input
            )
            result.content_generation = content_generation
            
            # Stage 3: Campaign Execution
            result.state = WorkflowState.EXECUTING_CAMPAIGN
            self.memory.set_workflow_state(result.state.value)
            
            campaign_result = await self._execute_with_retry(
                self._stage_campaign_execution,
                content_generation, brand_analysis, workflow_input
            )
            result.campaign_result = campaign_result
            
            # Stage 4: Feedback Loop (if enabled)
            if self.enable_feedback_loop and self._should_optimize(campaign_result, workflow_input):
                print(f"\n[Coordinator] Performance below target. Starting optimization loop...")
                
                for iteration in range(self.max_iterations - 1):
                    print(f"\n[Coordinator] Optimization iteration {iteration + 1}/{self.max_iterations - 1}")
                    
                    # Refine strategy based on feedback
                    improved_analysis = await self.brand_strategist.refine_strategy(
                        brand_analysis,
                        campaign_result.optimization_feedback.model_dump()
                    )
                    
                    # Regenerate content
                    improved_content = await self.creative_engine.generate_content(
                        improved_analysis.brand_profile,
                        workflow_input.campaign_brief,
                        workflow_input.target_platforms
                    )
                    
                    # Re-execute campaign
                    improved_campaign = await self.campaign_manager.execute_campaign(
                        improved_content.content_assets,
                        improved_analysis.brand_profile,
                        workflow_input.budget,
                        workflow_input.target_kpis
                    )
                    
                    # Update results
                    result.brand_analysis = improved_analysis
                    result.content_generation = improved_content
                    result.campaign_result = improved_campaign
                    
                    # Check if optimization goal is met
                    if not self._should_optimize(improved_campaign, workflow_input):
                        print(f"[Coordinator] Optimization goal achieved!")
                        break
            
            # Complete workflow
            result.state = WorkflowState.COMPLETED
            result.completed_at = datetime.now()
            self.memory.set_workflow_state(result.state.value)
            
            print(f"\n{'='*60}")
            print(f"Workflow Completed Successfully")
            print(f"Duration: {(result.completed_at - result.started_at).total_seconds():.1f}s")
            print(f"{'='*60}\n")
            
        except Exception as e:
            result.state = WorkflowState.FAILED
            result.error_message = str(e)
            result.completed_at = datetime.now()
            self.memory.set_workflow_state(result.state.value)
            
            print(f"\n[Coordinator] Workflow failed: {e}")
            raise
        
        return result
    
    async def _stage_brand_analysis(self, workflow_input: WorkflowInput) -> BrandAnalysisResult:
        """
        Execute brand analysis stage
        
        Args:
            workflow_input: Workflow input
            
        Returns:
            Brand analysis result
        """
        print(f"\n{'='*60}")
        print(f"Stage 1: Brand Analysis")
        print(f"{'='*60}\n")
        
        # Prepare materials
        materials = []
        if workflow_input.campaign_brief:
            materials.append(f"Campaign Brief:\n{workflow_input.campaign_brief}")
        
        # Execute brand analysis
        result = await self.brand_strategist.analyze_brand(
            website_url=workflow_input.website_url,
            materials=materials,
            additional_context=None
        )
        
        print(f"\n[Coordinator] Brand analysis completed")
        print(f"  - Brand: {result.brand_profile.brand_name}")
        print(f"  - Industry: {result.brand_profile.industry}")
        print(f"  - Tone: {', '.join([t.value for t in result.brand_profile.tone_of_voice])}")
        
        return result
    
    async def _stage_content_generation(self,
                                       brand_analysis: BrandAnalysisResult,
                                       workflow_input: WorkflowInput) -> ContentGenerationResult:
        """
        Execute content generation stage
        
        Args:
            brand_analysis: Brand analysis result
            workflow_input: Workflow input
            
        Returns:
            Content generation result
        """
        print(f"\n{'='*60}")
        print(f"Stage 2: Content Generation")
        print(f"{'='*60}\n")
        
        result = await self.creative_engine.generate_content(
            brand_profile=brand_analysis.brand_profile,
            campaign_brief=workflow_input.campaign_brief,
            target_platforms=workflow_input.target_platforms,
            num_variants=1
        )
        
        print(f"\n[Coordinator] Content generation completed")
        print(f"  - Content assets: {len(result.content_assets)}")
        print(f"  - Visual assets: {len(result.visual_assets)}")
        print(f"  - Platforms: {', '.join([a.platform.value for a in result.content_assets])}")
        
        return result
    
    async def _stage_campaign_execution(self,
                                       content_generation: ContentGenerationResult,
                                       brand_analysis: BrandAnalysisResult,
                                       workflow_input: WorkflowInput) -> CampaignResult:
        """
        Execute campaign execution stage
        
        Args:
            content_generation: Content generation result
            brand_analysis: Brand analysis result
            workflow_input: Workflow input
            
        Returns:
            Campaign result
        """
        print(f"\n{'='*60}")
        print(f"Stage 3: Campaign Execution")
        print(f"{'='*60}\n")
        
        result = await self.campaign_manager.execute_campaign(
            content_assets=content_generation.content_assets,
            brand_profile=brand_analysis.brand_profile,
            total_budget=workflow_input.budget,
            target_kpis=workflow_input.target_kpis
        )
        
        print(f"\n[Coordinator] Campaign execution completed")
        print(f"  - Impressions: {result.performance_metrics.impressions:,}")
        print(f"  - Conversions: {result.performance_metrics.conversions}")
        print(f"  - ROI: {result.performance_metrics.roi:.2f}x")
        
        return result
    
    async def _execute_with_retry(self, func, *args, max_retries: int = 3):
        """
        Execute function with retry logic
        
        Args:
            func: Function to execute
            args: Function arguments
            max_retries: Maximum number of retries
            
        Returns:
            Function result
        """
        last_error = None
        
        for attempt in range(max_retries):
            try:
                return await func(*args)
            except Exception as e:
                last_error = e
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    print(f"[Coordinator] Attempt {attempt + 1} failed: {e}")
                    print(f"[Coordinator] Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)
                else:
                    print(f"[Coordinator] All retry attempts failed")
        
        raise last_error
    
    def _should_optimize(self, campaign_result: CampaignResult, workflow_input: WorkflowInput) -> bool:
        """
        Determine if optimization is needed
        
        Args:
            campaign_result: Campaign result
            workflow_input: Workflow input with target KPIs
            
        Returns:
            True if optimization is needed
        """
        if not workflow_input.target_kpis:
            return False
        
        performance = campaign_result.performance_metrics
        
        # Check if target KPIs are met
        for kpi, target_value in workflow_input.target_kpis.items():
            if kpi == "roi" and performance.roi < target_value:
                return True
            elif kpi == "conversions" and performance.conversions < target_value:
                return True
            elif kpi == "ctr" and performance.ctr < target_value:
                return True
        
        return False
    
    def get_workflow_status(self) -> Dict[str, Any]:
        """
        Get current workflow status
        
        Returns:
            Workflow status dictionary
        """
        return {
            "state": self.memory.get_workflow_state(),
            "session_id": self.memory.session_id,
            "brand_analysis": self.memory.get("brand_analysis") is not None,
            "content_generation": self.memory.get("content_generation") is not None,
            "campaign_result": self.memory.get("campaign_result") is not None
        }
    
    def export_results(self) -> Dict[str, Any]:
        """
        Export all workflow results
        
        Returns:
            Complete workflow results
        """
        return self.memory.export_session()
