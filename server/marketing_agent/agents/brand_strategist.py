"""
Brand Strategist Agent
Responsible for brand analysis, market positioning, and strategy formulation
"""
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

from openai import OpenAI

from core.models import (
    BrandProfile, SWOTAnalysis, PositioningStrategy, 
    BrandAnalysisResult, TargetAudience, ToneOfVoice, Platform
)
from core.memory import SharedMemory


class BrandStrategistAgent:
    """
    Brand Strategist Agent
    
    Responsibilities:
    - Parse client's website or materials to extract brand DNA
    - Identify brand tone, value proposition, and target audience
    - Generate structured marketing brief with SWOT and positioning insights
    """
    
    def __init__(self, llm_client: OpenAI, shared_memory: SharedMemory):
        """
        Initialize Brand Strategist Agent
        
        Args:
            llm_client: OpenAI client instance
            shared_memory: Shared memory for inter-agent communication
        """
        self.llm = llm_client
        self.memory = shared_memory
        self.agent_name = "brand_strategist"
        
    async def analyze_brand(self, 
                           website_url: Optional[str] = None,
                           materials: List[str] = None,
                           additional_context: Optional[str] = None) -> BrandAnalysisResult:
        """
        Perform complete brand analysis
        
        Args:
            website_url: Brand website URL
            materials: List of brand materials (text content)
            additional_context: Additional context provided by user
            
        Returns:
            Complete brand analysis result
        """
        print(f"[{self.agent_name}] Starting brand analysis...")
        
        # Step 1: Collect brand data
        brand_data = await self._collect_brand_data(website_url, materials, additional_context)
        
        # Step 2: Extract brand profile
        brand_profile = await self._extract_brand_profile(brand_data)
        
        # Step 3: Perform SWOT analysis
        swot_analysis = await self._perform_swot_analysis(brand_profile, brand_data)
        
        # Step 4: Generate positioning strategy
        positioning_strategy = await self._generate_positioning_strategy(
            brand_profile, swot_analysis
        )
        
        # Create result
        result = BrandAnalysisResult(
            analysis_id=str(uuid.uuid4()),
            brand_profile=brand_profile,
            swot_analysis=swot_analysis,
            positioning_strategy=positioning_strategy,
            created_at=datetime.now()
        )
        
        # Save to shared memory
        self.memory.save("brand_analysis", result)
        
        print(f"[{self.agent_name}] Brand analysis completed!")
        return result
    
    async def _collect_brand_data(self, 
                                  website_url: Optional[str],
                                  materials: List[str],
                                  additional_context: Optional[str]) -> Dict[str, Any]:
        """
        Collect brand data from various sources
        
        Args:
            website_url: Website URL to scrape
            materials: Brand materials
            additional_context: Additional context
            
        Returns:
            Collected brand data
        """
        data = {
            "website_content": "",
            "materials": materials or [],
            "additional_context": additional_context or ""
        }
        
        # In a real implementation, this would scrape the website
        # For now, we'll use the provided materials
        if website_url:
            # TODO: Implement web scraping
            data["website_url"] = website_url
            data["website_content"] = f"Content from {website_url}"
        
        return data
    
    async def _extract_brand_profile(self, brand_data: Dict[str, Any]) -> BrandProfile:
        """
        Extract brand profile using LLM
        
        Args:
            brand_data: Collected brand data
            
        Returns:
            Brand profile
        """
        print(f"[{self.agent_name}] Extracting brand profile...")
        
        # Prepare context for LLM
        context = self._prepare_context(brand_data)
        
        prompt = f"""You are a brand strategist analyzing a company's brand identity.

Based on the following information, extract and analyze the brand profile:

{context}

Please provide a comprehensive brand analysis in the following JSON format:
{{
    "brand_name": "Company name",
    "industry": "Industry sector",
    "tone_of_voice": ["professional", "friendly", "innovative"],
    "value_proposition": "Core value proposition in one sentence",
    "key_messages": ["Key message 1", "Key message 2", "Key message 3"],
    "target_audience": {{
        "demographics": {{"age_range": "25-45", "gender": "all", "location": "global"}},
        "psychographics": {{"interests": ["interest1", "interest2"], "values": ["value1", "value2"]}},
        "pain_points": ["pain point 1", "pain point 2"],
        "goals": ["goal 1", "goal 2"]
    }},
    "brand_keywords": ["keyword1", "keyword2", "keyword3"],
    "competitors": ["competitor1", "competitor2"]
}}

Provide only the JSON response, no additional text."""
        
        response = self.llm.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "You are an expert brand strategist."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        # Parse response
        import json
        result = json.loads(response.choices[0].message.content)
        
        # Convert to BrandProfile model
        # Parse tone_of_voice with validation
        tone_list = []
        for t in result.get("tone_of_voice", ["professional"]):
            try:
                tone_list.append(ToneOfVoice(t))
            except ValueError:
                # If invalid tone, default to professional
                tone_list.append(ToneOfVoice.PROFESSIONAL)
        
        brand_profile = BrandProfile(
            brand_name=result.get("brand_name", "Unknown"),
            industry=result.get("industry", "Unknown"),
            tone_of_voice=tone_list,
            value_proposition=result.get("value_proposition", ""),
            key_messages=result.get("key_messages", []),
            target_audience=TargetAudience(**result.get("target_audience", {})),
            brand_keywords=result.get("brand_keywords", []),
            competitors=result.get("competitors", [])
        )
        
        return brand_profile
    
    async def _perform_swot_analysis(self, 
                                    brand_profile: BrandProfile,
                                    brand_data: Dict[str, Any]) -> SWOTAnalysis:
        """
        Perform SWOT analysis
        
        Args:
            brand_profile: Extracted brand profile
            brand_data: Original brand data
            
        Returns:
            SWOT analysis
        """
        print(f"[{self.agent_name}] Performing SWOT analysis...")
        
        prompt = f"""You are a brand strategist performing a SWOT analysis.

Brand Profile:
- Name: {brand_profile.brand_name}
- Industry: {brand_profile.industry}
- Value Proposition: {brand_profile.value_proposition}
- Target Audience: {brand_profile.target_audience.demographics}

Based on this brand profile, provide a comprehensive SWOT analysis in JSON format:
{{
    "strengths": ["strength 1", "strength 2", "strength 3", "strength 4"],
    "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
    "opportunities": ["opportunity 1", "opportunity 2", "opportunity 3", "opportunity 4"],
    "threats": ["threat 1", "threat 2", "threat 3"]
}}

Provide only the JSON response, no additional text."""
        
        response = self.llm.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "You are an expert brand strategist."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        import json
        result = json.loads(response.choices[0].message.content)
        
        return SWOTAnalysis(**result)
    
    async def _generate_positioning_strategy(self,
                                            brand_profile: BrandProfile,
                                            swot_analysis: SWOTAnalysis) -> PositioningStrategy:
        """
        Generate positioning strategy
        
        Args:
            brand_profile: Brand profile
            swot_analysis: SWOT analysis
            
        Returns:
            Positioning strategy
        """
        print(f"[{self.agent_name}] Generating positioning strategy...")
        
        prompt = f"""You are a brand strategist creating a positioning strategy.

Brand Profile:
- Name: {brand_profile.brand_name}
- Industry: {brand_profile.industry}
- Value Proposition: {brand_profile.value_proposition}

SWOT Analysis:
- Strengths: {', '.join(swot_analysis.strengths[:3])}
- Opportunities: {', '.join(swot_analysis.opportunities[:3])}

Based on this analysis, create a positioning strategy in JSON format:
{{
    "key_messages": ["message 1", "message 2", "message 3"],
    "differentiation_points": ["point 1", "point 2", "point 3"],
    "recommended_channels": ["linkedin", "google_ads", "email"],
    "content_themes": ["theme 1", "theme 2", "theme 3", "theme 4"]
}}

Recommended channels should be from: linkedin, google_ads, facebook, instagram, email, twitter

Provide only the JSON response, no additional text."""
        
        response = self.llm.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "You are an expert brand strategist."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        import json
        result = json.loads(response.choices[0].message.content)
        
        # Convert channel strings to Platform enum
        recommended_channels = []
        for channel in result.get("recommended_channels", []):
            try:
                recommended_channels.append(Platform(channel))
            except ValueError:
                continue
        
        return PositioningStrategy(
            key_messages=result.get("key_messages", []),
            differentiation_points=result.get("differentiation_points", []),
            recommended_channels=recommended_channels,
            content_themes=result.get("content_themes", [])
        )
    
    async def refine_strategy(self, 
                             current_analysis: BrandAnalysisResult,
                             feedback: Dict[str, Any]) -> BrandAnalysisResult:
        """
        Refine strategy based on campaign feedback
        
        Args:
            current_analysis: Current brand analysis
            feedback: Feedback from campaign manager
            
        Returns:
            Refined brand analysis
        """
        print(f"[{self.agent_name}] Refining strategy based on feedback...")
        
        # TODO: Implement strategy refinement logic
        # This would analyze campaign performance and adjust positioning
        
        return current_analysis
    
    def _prepare_context(self, brand_data: Dict[str, Any]) -> str:
        """
        Prepare context string from brand data
        
        Args:
            brand_data: Brand data dictionary
            
        Returns:
            Formatted context string
        """
        context_parts = []
        
        if brand_data.get("website_url"):
            context_parts.append(f"Website: {brand_data['website_url']}")
        
        if brand_data.get("website_content"):
            context_parts.append(f"Website Content:\n{brand_data['website_content']}")
        
        if brand_data.get("materials"):
            context_parts.append(f"Brand Materials:\n" + "\n".join(brand_data["materials"]))
        
        if brand_data.get("additional_context"):
            context_parts.append(f"Additional Context:\n{brand_data['additional_context']}")
        
        return "\n\n".join(context_parts)
