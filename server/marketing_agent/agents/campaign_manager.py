"""
Campaign Manager Agent
Responsible for campaign execution, budget optimization, and performance tracking
"""
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid
import random

from openai import OpenAI

from core.models import (
    ContentAsset, CampaignPlan, BudgetAllocation, ChannelStrategy,
    PerformanceMetrics, OptimizationFeedback, CampaignResult,
    Platform, BrandProfile, TargetAudience
)
from core.memory import SharedMemory


class CampaignManagerAgent:
    """
    Campaign Manager Agent
    
    Responsibilities:
    - Simulate or execute marketing campaigns
    - Allocate budget across channels
    - Select channels and influencers
    - Track campaign performance (CTR, CPM, ROI)
    - Provide optimization feedback to Brand Strategist
    """
    
    def __init__(self, llm_client: OpenAI, shared_memory: SharedMemory, simulation_mode: bool = True):
        """
        Initialize Campaign Manager Agent
        
        Args:
            llm_client: OpenAI client instance
            shared_memory: Shared memory for inter-agent communication
            simulation_mode: Whether to run in simulation mode
        """
        self.llm = llm_client
        self.memory = shared_memory
        self.agent_name = "campaign_manager"
        self.simulation_mode = simulation_mode
        
        # Channel performance benchmarks (industry averages)
        self.channel_benchmarks = {
            Platform.LINKEDIN: {
                "avg_cpm": 15.0,
                "avg_cpc": 5.0,
                "avg_ctr": 0.025,
                "avg_conversion_rate": 0.02,
                "reach_multiplier": 1000
            },
            Platform.GOOGLE_ADS: {
                "avg_cpm": 10.0,
                "avg_cpc": 2.5,
                "avg_ctr": 0.03,
                "avg_conversion_rate": 0.025,
                "reach_multiplier": 2000
            },
            Platform.FACEBOOK: {
                "avg_cpm": 8.0,
                "avg_cpc": 1.5,
                "avg_ctr": 0.035,
                "avg_conversion_rate": 0.015,
                "reach_multiplier": 1500
            },
            Platform.INSTAGRAM: {
                "avg_cpm": 9.0,
                "avg_cpc": 1.8,
                "avg_ctr": 0.04,
                "avg_conversion_rate": 0.018,
                "reach_multiplier": 1800
            },
            Platform.EMAIL: {
                "avg_cpm": 5.0,
                "avg_cpc": 0.5,
                "avg_ctr": 0.05,
                "avg_conversion_rate": 0.03,
                "reach_multiplier": 500
            }
        }
    
    async def execute_campaign(self,
                              content_assets: List[ContentAsset],
                              brand_profile: BrandProfile,
                              total_budget: float,
                              target_kpis: Dict[str, float]) -> CampaignResult:
        """
        Execute or simulate a marketing campaign
        
        Args:
            content_assets: Generated content assets
            brand_profile: Brand profile
            total_budget: Total campaign budget
            target_kpis: Target KPIs (e.g., {"roi": 2.0, "conversions": 100})
            
        Returns:
            Campaign execution result
        """
        print(f"[{self.agent_name}] Starting campaign execution...")
        
        # Step 1: Create campaign plan
        campaign_plan = await self._create_campaign_plan(
            content_assets, brand_profile, total_budget, target_kpis
        )
        
        # Step 2: Optimize budget allocation
        budget_allocations = self._optimize_budget_allocation(
            campaign_plan, total_budget
        )
        campaign_plan.budget_allocations = budget_allocations
        
        # Step 3: Execute or simulate campaign
        if self.simulation_mode:
            performance = self._simulate_campaign_performance(
                campaign_plan, brand_profile
            )
        else:
            performance = await self._execute_real_campaign(campaign_plan)
        
        # Step 4: Generate optimization feedback
        optimization_feedback = await self._generate_optimization_feedback(
            campaign_plan, performance, target_kpis
        )
        
        # Create result
        result = CampaignResult(
            campaign_plan=campaign_plan,
            performance_metrics=performance,
            optimization_feedback=optimization_feedback,
            executed_at=datetime.now()
        )
        
        # Save to shared memory
        self.memory.save("campaign_result", result)
        
        print(f"[{self.agent_name}] Campaign execution completed!")
        print(f"  - ROI: {performance.roi:.2f}x")
        print(f"  - Conversions: {performance.conversions}")
        print(f"  - CTR: {performance.ctr:.2%}")
        
        return result
    
    async def _create_campaign_plan(self,
                                   content_assets: List[ContentAsset],
                                   brand_profile: BrandProfile,
                                   total_budget: float,
                                   target_kpis: Dict[str, float]) -> CampaignPlan:
        """
        Create campaign execution plan
        
        Args:
            content_assets: Content assets
            brand_profile: Brand profile
            total_budget: Total budget
            target_kpis: Target KPIs
            
        Returns:
            Campaign plan
        """
        print(f"[{self.agent_name}] Creating campaign plan...")
        
        # Group content by platform
        platform_content = {}
        for asset in content_assets:
            if asset.platform not in platform_content:
                platform_content[asset.platform] = []
            platform_content[asset.platform].append(asset)
        
        # Create channel strategies
        channel_strategies = []
        for platform, assets in platform_content.items():
            # Use the first asset for each platform (or implement selection logic)
            selected_asset = assets[0]
            
            strategy = ChannelStrategy(
                channel=platform,
                content_id=selected_asset.content_id,
                target_audience=brand_profile.target_audience,
                budget_allocation=BudgetAllocation(
                    channel=platform,
                    allocated_budget=0,  # Will be optimized later
                    estimated_reach=0,
                    estimated_cpm=self.channel_benchmarks[platform]["avg_cpm"],
                    estimated_cpc=self.channel_benchmarks[platform]["avg_cpc"]
                )
            )
            channel_strategies.append(strategy)
        
        campaign_plan = CampaignPlan(
            campaign_id=str(uuid.uuid4()),
            campaign_name=f"{brand_profile.brand_name} Campaign",
            total_budget=total_budget,
            budget_allocations=[],  # Will be populated by optimization
            channel_strategies=channel_strategies,
            target_kpis=target_kpis,
            start_date=datetime.now()
        )
        
        return campaign_plan
    
    def _optimize_budget_allocation(self,
                                   campaign_plan: CampaignPlan,
                                   total_budget: float) -> List[BudgetAllocation]:
        """
        Optimize budget allocation across channels
        
        Args:
            campaign_plan: Campaign plan
            total_budget: Total budget
            
        Returns:
            Optimized budget allocations
        """
        print(f"[{self.agent_name}] Optimizing budget allocation...")
        
        channels = [strategy.channel for strategy in campaign_plan.channel_strategies]
        num_channels = len(channels)
        
        if num_channels == 0:
            return []
        
        # Simple allocation strategy: weighted by expected ROI
        # In a real implementation, this would use optimization algorithms
        
        allocations = []
        for strategy in campaign_plan.channel_strategies:
            channel = strategy.channel
            benchmarks = self.channel_benchmarks[channel]
            
            # Calculate expected ROI for this channel
            expected_ctr = benchmarks["avg_ctr"]
            expected_conversion_rate = benchmarks["avg_conversion_rate"]
            expected_roi = expected_ctr * expected_conversion_rate * 100  # Simplified
            
            # Allocate budget proportional to expected ROI
            # For simplicity, we'll use equal allocation with slight variations
            base_allocation = total_budget / num_channels
            
            # Adjust based on channel performance
            if channel in [Platform.GOOGLE_ADS, Platform.EMAIL]:
                allocation = base_allocation * 1.2  # Favor high-ROI channels
            elif channel in [Platform.LINKEDIN]:
                allocation = base_allocation * 1.1
            else:
                allocation = base_allocation * 0.9
            
            # Calculate estimated reach
            estimated_reach = int(
                (allocation / benchmarks["avg_cpm"]) * benchmarks["reach_multiplier"]
            )
            
            budget_allocation = BudgetAllocation(
                channel=channel,
                allocated_budget=allocation,
                estimated_reach=estimated_reach,
                estimated_cpm=benchmarks["avg_cpm"],
                estimated_cpc=benchmarks["avg_cpc"]
            )
            allocations.append(budget_allocation)
        
        # Normalize to total budget
        total_allocated = sum(a.allocated_budget for a in allocations)
        for allocation in allocations:
            allocation.allocated_budget = (allocation.allocated_budget / total_allocated) * total_budget
            allocation.estimated_reach = int(
                (allocation.allocated_budget / allocation.estimated_cpm) * 
                self.channel_benchmarks[allocation.channel]["reach_multiplier"]
            )
        
        return allocations
    
    def _simulate_campaign_performance(self,
                                      campaign_plan: CampaignPlan,
                                      brand_profile: BrandProfile) -> PerformanceMetrics:
        """
        Simulate campaign performance
        
        Args:
            campaign_plan: Campaign plan
            brand_profile: Brand profile
            
        Returns:
            Simulated performance metrics
        """
        print(f"[{self.agent_name}] Simulating campaign performance...")
        
        total_impressions = 0
        total_clicks = 0
        total_conversions = 0
        total_cost = campaign_plan.total_budget
        
        for allocation in campaign_plan.budget_allocations:
            channel = allocation.channel
            benchmarks = self.channel_benchmarks[channel]
            
            # Calculate impressions
            impressions = allocation.estimated_reach
            total_impressions += impressions
            
            # Calculate clicks with some randomness
            base_ctr = benchmarks["avg_ctr"]
            actual_ctr = base_ctr * random.uniform(0.8, 1.2)  # ±20% variation
            clicks = int(impressions * actual_ctr)
            total_clicks += clicks
            
            # Calculate conversions
            base_conversion_rate = benchmarks["avg_conversion_rate"]
            actual_conversion_rate = base_conversion_rate * random.uniform(0.7, 1.3)
            conversions = int(clicks * actual_conversion_rate)
            total_conversions += conversions
        
        # Calculate overall metrics
        ctr = total_clicks / total_impressions if total_impressions > 0 else 0
        conversion_rate = total_conversions / total_clicks if total_clicks > 0 else 0
        
        # Simulate revenue (assuming average order value)
        avg_order_value = 100.0  # Placeholder
        revenue = total_conversions * avg_order_value
        
        roi = (revenue - total_cost) / total_cost if total_cost > 0 else 0
        cpa = total_cost / total_conversions if total_conversions > 0 else 0
        
        # Calculate engagement score (0-100)
        engagement_score = min(100, (ctr * 1000 + conversion_rate * 500))
        
        metrics = PerformanceMetrics(
            impressions=total_impressions,
            clicks=total_clicks,
            ctr=ctr,
            conversions=total_conversions,
            conversion_rate=conversion_rate,
            total_cost=total_cost,
            revenue=revenue,
            roi=roi,
            cost_per_acquisition=cpa,
            engagement_score=engagement_score
        )
        
        return metrics
    
    async def _execute_real_campaign(self, campaign_plan: CampaignPlan) -> PerformanceMetrics:
        """
        Execute real campaign (placeholder for API integrations)
        
        Args:
            campaign_plan: Campaign plan
            
        Returns:
            Actual performance metrics
        """
        # TODO: Implement real campaign execution with platform APIs
        # This would integrate with LinkedIn Ads API, Google Ads API, etc.
        
        print(f"[{self.agent_name}] Real campaign execution not yet implemented. Using simulation.")
        return self._simulate_campaign_performance(campaign_plan, None)
    
    async def _generate_optimization_feedback(self,
                                             campaign_plan: CampaignPlan,
                                             performance: PerformanceMetrics,
                                             target_kpis: Dict[str, float]) -> OptimizationFeedback:
        """
        Generate optimization recommendations
        
        Args:
            campaign_plan: Campaign plan
            performance: Performance metrics
            target_kpis: Target KPIs
            
        Returns:
            Optimization feedback
        """
        print(f"[{self.agent_name}] Generating optimization feedback...")
        
        # Prepare performance summary
        performance_summary = f"""
Campaign Performance:
- Total Budget: ${campaign_plan.total_budget:,.2f}
- Impressions: {performance.impressions:,}
- Clicks: {performance.clicks:,}
- CTR: {performance.ctr:.2%}
- Conversions: {performance.conversions}
- Conversion Rate: {performance.conversion_rate:.2%}
- ROI: {performance.roi:.2f}x
- Cost per Acquisition: ${performance.cost_per_acquisition:.2f}

Target KPIs:
{self._format_kpis(target_kpis)}

Channel Breakdown:
{self._format_channel_breakdown(campaign_plan)}
"""
        
        prompt = f"""You are a marketing campaign analyst. Analyze the following campaign performance and provide optimization recommendations.

{performance_summary}

Provide your analysis in JSON format:
{{
    "insights": [
        "Key insight 1 about performance",
        "Key insight 2 about performance",
        "Key insight 3 about performance"
    ],
    "recommendations": [
        "Specific recommendation 1",
        "Specific recommendation 2",
        "Specific recommendation 3"
    ],
    "budget_reallocation": {{
        "linkedin": 3500,
        "google_ads": 4500,
        "email": 2000
    }},
    "content_adjustments": [
        "Content adjustment suggestion 1",
        "Content adjustment suggestion 2"
    ]
}}

Focus on:
1. Which channels performed best/worst
2. Whether target KPIs were met
3. Specific actions to improve ROI
4. Budget reallocation suggestions
"""
        
        response = self.llm.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "You are an expert marketing campaign analyst."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        import json
        result = json.loads(response.choices[0].message.content)
        
        # Convert budget reallocation to Platform enum keys
        budget_realloc = {}
        if "budget_reallocation" in result:
            for channel_str, budget in result["budget_reallocation"].items():
                try:
                    platform = Platform(channel_str)
                    budget_realloc[platform] = float(budget)
                except (ValueError, KeyError):
                    continue
        
        feedback = OptimizationFeedback(
            insights=result.get("insights", []),
            recommendations=result.get("recommendations", []),
            suggested_budget_reallocation=budget_realloc if budget_realloc else None,
            suggested_content_adjustments=result.get("content_adjustments", [])
        )
        
        return feedback
    
    def _format_kpis(self, kpis: Dict[str, float]) -> str:
        """Format KPIs for display"""
        return "\n".join([f"- {k}: {v}" for k, v in kpis.items()])
    
    def _format_channel_breakdown(self, campaign_plan: CampaignPlan) -> str:
        """Format channel breakdown for display"""
        lines = []
        for allocation in campaign_plan.budget_allocations:
            lines.append(
                f"- {allocation.channel.value}: ${allocation.allocated_budget:,.2f} "
                f"(Est. Reach: {allocation.estimated_reach:,})"
            )
        return "\n".join(lines)
