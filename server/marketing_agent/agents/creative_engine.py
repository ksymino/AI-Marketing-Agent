"""
Creative Engine Agent
Responsible for generating marketing content and creative assets
"""
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

from openai import OpenAI

from core.models import (
    BrandProfile, ContentAsset, VisualAsset, ContentGenerationResult,
    Platform, ContentType, ToneOfVoice
)
from core.memory import SharedMemory


class CreativeEngineAgent:
    """
    Creative Engine Agent
    
    Responsibilities:
    - Generate platform-specific content (LinkedIn posts, email campaigns, ad copies)
    - Translate brand strategy into actionable creative assets
    - Create visual prompts for image generation
    - Adapt content tone and style for different platforms
    """
    
    def __init__(self, llm_client: OpenAI, shared_memory: SharedMemory):
        """
        Initialize Creative Engine Agent
        
        Args:
            llm_client: OpenAI client instance
            shared_memory: Shared memory for inter-agent communication
        """
        self.llm = llm_client
        self.memory = shared_memory
        self.agent_name = "creative_engine"
        
        # Platform-specific templates and guidelines
        self.platform_guidelines = {
            Platform.LINKEDIN: {
                "max_length": 3000,
                "tone": "professional",
                "best_practices": [
                    "Start with a hook",
                    "Use line breaks for readability",
                    "Include relevant hashtags (3-5)",
                    "End with a call-to-action"
                ]
            },
            Platform.GOOGLE_ADS: {
                "headline_max": 30,
                "description_max": 90,
                "tone": "compelling",
                "best_practices": [
                    "Include keywords",
                    "Clear value proposition",
                    "Strong call-to-action"
                ]
            },
            Platform.EMAIL: {
                "subject_max": 50,
                "tone": "personal",
                "best_practices": [
                    "Personalized subject line",
                    "Clear value in first paragraph",
                    "Single clear CTA",
                    "Mobile-friendly format"
                ]
            },
            Platform.FACEBOOK: {
                "max_length": 500,
                "tone": "engaging",
                "best_practices": [
                    "Visual-first approach",
                    "Emotional connection",
                    "Encourage engagement"
                ]
            },
            Platform.INSTAGRAM: {
                "max_length": 2200,
                "tone": "visual",
                "best_practices": [
                    "Strong visual component",
                    "Storytelling",
                    "Hashtags (10-30)",
                    "First line is crucial"
                ]
            }
        }
    
    async def generate_content(self,
                              brand_profile: BrandProfile,
                              campaign_brief: str,
                              target_platforms: List[Platform],
                              num_variants: int = 1) -> ContentGenerationResult:
        """
        Generate marketing content for specified platforms
        
        Args:
            brand_profile: Brand profile from strategist
            campaign_brief: Campaign description and goals
            target_platforms: List of target platforms
            num_variants: Number of variants to generate per platform
            
        Returns:
            Content generation result with all assets
        """
        print(f"[{self.agent_name}] Starting content generation...")
        
        content_assets = []
        visual_assets = []
        
        # Generate content for each platform
        for platform in target_platforms:
            print(f"[{self.agent_name}] Generating content for {platform.value}...")
            
            for variant_num in range(num_variants):
                # Generate platform-specific content
                content = await self._generate_platform_content(
                    brand_profile, campaign_brief, platform, variant_num
                )
                content_assets.append(content)
                
                # Generate visual prompt if needed
                if platform in [Platform.INSTAGRAM, Platform.FACEBOOK, Platform.LINKEDIN]:
                    visual = await self._generate_visual_prompt(content, brand_profile)
                    visual_assets.append(visual)
        
        result = ContentGenerationResult(
            content_assets=content_assets,
            visual_assets=visual_assets,
            generation_metadata={
                "num_platforms": len(target_platforms),
                "num_variants": num_variants,
                "total_assets": len(content_assets)
            },
            created_at=datetime.now()
        )
        
        # Save to shared memory
        self.memory.save("content_generation", result)
        
        print(f"[{self.agent_name}] Content generation completed! Generated {len(content_assets)} assets.")
        return result
    
    async def _generate_platform_content(self,
                                        brand_profile: BrandProfile,
                                        campaign_brief: str,
                                        platform: Platform,
                                        variant_num: int) -> ContentAsset:
        """
        Generate content for a specific platform
        
        Args:
            brand_profile: Brand profile
            campaign_brief: Campaign brief
            platform: Target platform
            variant_num: Variant number for A/B testing
            
        Returns:
            Content asset
        """
        guidelines = self.platform_guidelines.get(platform, {})
        
        # Determine content type based on platform
        content_type = self._get_content_type(platform)
        
        # Build prompt based on platform
        prompt = self._build_content_prompt(
            brand_profile, campaign_brief, platform, guidelines, variant_num
        )
        
        # Generate content using LLM
        response = self.llm.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": self._get_system_prompt(platform)},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,  # Higher temperature for creativity
            response_format={"type": "json_object"}
        )
        
        import json
        result = json.loads(response.choices[0].message.content)
        
        # Create content asset
        content_asset = ContentAsset(
            content_id=str(uuid.uuid4()),
            platform=platform,
            content_type=content_type,
            content=result.get("content", ""),
            headline=result.get("headline"),
            subject_line=result.get("subject_line"),
            cta=result.get("cta"),
            hashtags=result.get("hashtags", []),
            keywords=brand_profile.brand_keywords,
            visual_prompt=result.get("visual_prompt"),
            tone=brand_profile.tone_of_voice[0] if brand_profile.tone_of_voice else ToneOfVoice.PROFESSIONAL
        )
        
        return content_asset
    
    async def _generate_visual_prompt(self,
                                     content: ContentAsset,
                                     brand_profile: BrandProfile) -> VisualAsset:
        """
        Generate visual asset prompt for image generation
        
        Args:
            content: Content asset
            brand_profile: Brand profile
            
        Returns:
            Visual asset with generation prompt
        """
        prompt = f"""Create a detailed image generation prompt for the following marketing content:

Brand: {brand_profile.brand_name}
Industry: {brand_profile.industry}
Platform: {content.platform.value}
Content: {content.content[:200]}...

Generate a detailed prompt for DALL-E or Midjourney that would create an engaging visual for this content.
The image should align with the brand's {', '.join([t.value for t in brand_profile.tone_of_voice])} tone.

Provide the response in JSON format:
{{
    "prompt": "Detailed image generation prompt",
    "style": "Style description (e.g., professional, modern, minimalist)"
}}"""
        
        response = self.llm.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "You are an expert at creating image generation prompts."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            response_format={"type": "json_object"}
        )
        
        import json
        result = json.loads(response.choices[0].message.content)
        
        visual_asset = VisualAsset(
            asset_id=str(uuid.uuid4()),
            prompt=result.get("prompt", ""),
            style=result.get("style", "professional")
        )
        
        return visual_asset
    
    def _get_content_type(self, platform: Platform) -> ContentType:
        """
        Determine content type based on platform
        
        Args:
            platform: Target platform
            
        Returns:
            Content type
        """
        mapping = {
            Platform.LINKEDIN: ContentType.POST,
            Platform.FACEBOOK: ContentType.POST,
            Platform.INSTAGRAM: ContentType.POST,
            Platform.GOOGLE_ADS: ContentType.AD_COPY,
            Platform.EMAIL: ContentType.EMAIL_CAMPAIGN,
            Platform.TWITTER: ContentType.POST
        }
        return mapping.get(platform, ContentType.POST)
    
    def _get_system_prompt(self, platform: Platform) -> str:
        """
        Get system prompt for content generation
        
        Args:
            platform: Target platform
            
        Returns:
            System prompt
        """
        base = "You are an expert marketing copywriter specializing in "
        
        prompts = {
            Platform.LINKEDIN: base + "professional B2B content for LinkedIn.",
            Platform.GOOGLE_ADS: base + "compelling ad copy that drives conversions.",
            Platform.EMAIL: base + "engaging email marketing campaigns.",
            Platform.FACEBOOK: base + "social media content that drives engagement.",
            Platform.INSTAGRAM: base + "visual storytelling and Instagram content.",
            Platform.TWITTER: base + "concise, impactful Twitter content."
        }
        
        return prompts.get(platform, base + "digital marketing content.")
    
    def _build_content_prompt(self,
                             brand_profile: BrandProfile,
                             campaign_brief: str,
                             platform: Platform,
                             guidelines: Dict[str, Any],
                             variant_num: int) -> str:
        """
        Build content generation prompt
        
        Args:
            brand_profile: Brand profile
            campaign_brief: Campaign brief
            platform: Target platform
            guidelines: Platform guidelines
            variant_num: Variant number
            
        Returns:
            Content generation prompt
        """
        tone_str = ', '.join([t.value for t in brand_profile.tone_of_voice])
        
        prompt = f"""Generate marketing content for {platform.value} with the following specifications:

BRAND INFORMATION:
- Brand Name: {brand_profile.brand_name}
- Industry: {brand_profile.industry}
- Value Proposition: {brand_profile.value_proposition}
- Tone of Voice: {tone_str}
- Key Messages: {', '.join(brand_profile.key_messages[:3])}
- Target Audience: {brand_profile.target_audience.demographics}

CAMPAIGN BRIEF:
{campaign_brief}

PLATFORM GUIDELINES:
- Platform: {platform.value}
- Tone: {guidelines.get('tone', 'engaging')}
- Best Practices: {', '.join(guidelines.get('best_practices', []))}

REQUIREMENTS:
- This is variant #{variant_num + 1} (make it unique if multiple variants)
- Follow platform best practices
- Align with brand tone and key messages
- Include a clear call-to-action
- Make it engaging and conversion-focused

"""
        
        # Add platform-specific requirements
        if platform == Platform.LINKEDIN:
            prompt += """
Provide the response in JSON format:
{
    "content": "Full LinkedIn post content with line breaks",
    "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
    "cta": "Call to action"
}
"""
        elif platform == Platform.GOOGLE_ADS:
            prompt += f"""
Provide the response in JSON format:
{{
    "headline": "Compelling headline (max {guidelines.get('headline_max', 30)} chars)",
    "content": "Ad description (max {guidelines.get('description_max', 90)} chars)",
    "cta": "Call to action",
    "keywords": ["keyword1", "keyword2", "keyword3"]
}}
"""
        elif platform == Platform.EMAIL:
            prompt += f"""
Provide the response in JSON format:
{{
    "subject_line": "Email subject line (max {guidelines.get('subject_max', 50)} chars)",
    "content": "Email body content",
    "cta": "Call to action button text"
}}
"""
        else:
            prompt += """
Provide the response in JSON format:
{
    "content": "Post content",
    "hashtags": ["hashtag1", "hashtag2"],
    "cta": "Call to action"
}
"""
        
        return prompt
    
    async def generate_variant(self,
                              base_content: ContentAsset,
                              variation_level: int = 1) -> ContentAsset:
        """
        Generate a variant of existing content for A/B testing
        
        Args:
            base_content: Base content to create variant from
            variation_level: Level of variation (1=minor, 2=moderate, 3=major)
            
        Returns:
            Content variant
        """
        print(f"[{self.agent_name}] Generating content variant (level {variation_level})...")
        
        variation_instructions = {
            1: "Make minor adjustments to wording while keeping the same structure and message",
            2: "Restructure the content with a different approach while maintaining the core message",
            3: "Create a significantly different version with a new angle or hook"
        }
        
        prompt = f"""Create a variant of the following marketing content:

Original Content:
Platform: {base_content.platform.value}
Content: {base_content.content}
CTA: {base_content.cta}

Variation Instruction: {variation_instructions.get(variation_level, variation_instructions[1])}

Provide the variant in JSON format:
{{
    "content": "Variant content",
    "headline": "Variant headline (if applicable)",
    "cta": "Variant call to action",
    "hashtags": ["hashtag1", "hashtag2"]
}}"""
        
        response = self.llm.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": "You are an expert at creating content variants for A/B testing."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            response_format={"type": "json_object"}
        )
        
        import json
        result = json.loads(response.choices[0].message.content)
        
        # Create variant content asset
        variant = ContentAsset(
            content_id=str(uuid.uuid4()),
            platform=base_content.platform,
            content_type=base_content.content_type,
            content=result.get("content", ""),
            headline=result.get("headline"),
            cta=result.get("cta"),
            hashtags=result.get("hashtags", []),
            keywords=base_content.keywords,
            tone=base_content.tone
        )
        
        return variant
