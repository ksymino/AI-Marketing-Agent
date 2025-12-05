/**
 * Adapter for integrating the Marketing Agent system with the web dashboard
 * This module provides a bridge between the tRPC API and the core agent system
 */

import { invokeLLM } from "../_core/llm";

// Define types for the marketing agent workflow
export interface WorkflowInput {
  campaignBrief: string;
  budget: number; // in dollars
  targetPlatforms: string[];
  websiteUrl?: string;
  targetKpis?: Record<string, number>;
}

export interface BrandProfile {
  brandName: string;
  industry: string;
  toneOfVoice: string[];
  valueProposition: string;
  keyMessages: string[];
  targetAudience: {
    demographics?: string;
    psychographics?: string;
    painPoints?: string[];
  };
  brandKeywords: string[];
  competitiveAdvantages?: string[];
}

export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface ContentAsset {
  contentId: string;
  platform: string;
  contentType: string;
  content: string;
  headline?: string;
  subjectLine?: string;
  cta: string;
  hashtags: string[];
  keywords: string[];
  tone: string;
}

export interface VisualAsset {
  assetId: string;
  prompt: string;
  style: string;
}

export interface BudgetAllocation {
  platform: string;
  amount: number;
  percentage: number;
  estimatedReach: number;
}

export interface PerformanceMetrics {
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  conversionRate: number;
  roi: number;
  costPerAcquisition: number;
  engagementScore: number;
}

export interface KOLRecommendation {
  id: string;
  name: string; // Example influencer name (for illustration only)
  platform: string;
  niche: string;
  reason: string; // Why this type of influencer is suitable
  outreachMessage: string; // Template message for reaching out
}

export interface WorkflowResult {
  status: "completed" | "failed";
  brandAnalysis: {
    brandProfile: BrandProfile;
    swotAnalysis: SWOTAnalysis;
    positioningStrategy: string;
  };
  contentGeneration: {
    contentAssets: ContentAsset[];
    visualAssets: VisualAsset[];
    generatedImages: Array<{
      platform: string;
      imageUrl: string;
      prompt: string;
    }>;
  };
  kolRecommendations: KOLRecommendation[];
  campaignResult: {
    campaignPlan: {
      campaignId: string;
      campaignName: string;
      totalBudget: number;
      budgetAllocations: BudgetAllocation[];
    };
    performanceMetrics: PerformanceMetrics;
    optimizationFeedback: {
      insights: string[];
      recommendations: string[];
    };
  };
  executionTime: number;
}

/**
 * Execute the complete marketing workflow using LLM
 */
export async function executeMarketingWorkflow(
  input: WorkflowInput
): Promise<WorkflowResult> {
  const startTime = Date.now();

  try {
    // Stage 1: Brand Analysis
    const brandAnalysis = await analyzeBrand(input);

    // Stage 2: Content Generation
    const contentGeneration = await generateContent(input, brandAnalysis);

    // Stage 3: Campaign Execution
    const campaignResult = await executeCampaign(
      input,
      brandAnalysis,
      contentGeneration
    );

    // Step 4: Generate KOL Recommendations
    const kolRecommendations = await generateKOLRecommendations(
      input,
      brandAnalysis
    );

    const executionTime = Date.now() - startTime;

    return {
      status: "completed",
      brandAnalysis,
      contentGeneration,
      kolRecommendations,
      campaignResult,
      executionTime,
    };
  } catch (error) {
    console.error("[Marketing Agent] Workflow failed:", error);
    throw error;
  }
}

/**
 * Stage 1: Brand Analysis
 */
async function analyzeBrand(input: WorkflowInput) {
  // Scrape real website content if URL is provided
  let websiteContent = null;
  if (input.websiteUrl) {
    const { scrapeWebsiteContent } = await import('./websiteScraper');
    websiteContent = await scrapeWebsiteContent(input.websiteUrl);
  }

  const prompt = `You are a brand strategist analyzing a marketing campaign.

Campaign Brief: ${input.campaignBrief}

${websiteContent ? `
REAL WEBSITE CONTENT:
Title: ${websiteContent.title}
Description: ${websiteContent.description}
Main Content: ${websiteContent.mainContent}
Product Info: ${websiteContent.productInfo}
Keywords: ${websiteContent.keywords.join(', ')}
` : ''}

Budget: $${input.budget}
Target Platforms: ${input.targetPlatforms.join(", ")}

Analyze this campaign and provide:
1. Brand Profile (name, industry, tone, value proposition, key messages, target audience, keywords)
2. SWOT Analysis (strengths, weaknesses, opportunities, threats)
3. Positioning Strategy (one clear statement)

Return your analysis in JSON format matching this structure:
{
  "brandProfile": {
    "brandName": "string",
    "industry": "string",
    "toneOfVoice": ["professional", "innovative"],
    "valueProposition": "string",
    "keyMessages": ["string"],
    "targetAudience": {
      "demographics": "string",
      "psychographics": "string",
      "painPoints": ["string"]
    },
    "brandKeywords": ["string"],
    "competitiveAdvantages": ["string"]
  },
  "swotAnalysis": {
    "strengths": ["string"],
    "weaknesses": ["string"],
    "opportunities": ["string"],
    "threats": ["string"]
  },
  "positioningStrategy": "string"
}`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a professional brand strategist. Always respond with valid JSON.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  const result = JSON.parse(typeof content === 'string' ? content : '');
  return result;
}

/**
 * Stage 2: Content Generation
 */
async function generateContent(input: WorkflowInput, brandAnalysis: any) {
  const contentAssets: ContentAsset[] = [];
  const visualAssets: VisualAsset[] = [];

  // Generate content for each platform
  for (const platform of input.targetPlatforms) {
    const prompt = `You are a creative content writer.

Create marketing content for ${platform.toUpperCase()}.

Brand: ${brandAnalysis.brandProfile.brandName}
Value Proposition: ${brandAnalysis.brandProfile.valueProposition}
Tone: ${brandAnalysis.brandProfile.toneOfVoice.join(", ")}
Key Messages: ${brandAnalysis.brandProfile.keyMessages.join(", ")}

Generate platform-specific content with:
- Main content (appropriate length for ${platform})
- Headline (if applicable)
- Subject line (for email)
- Call-to-action
- Hashtags (for social media)
- Keywords

Return JSON format:
{
  "content": "string",
  "headline": "string or null",
  "subjectLine": "string or null",
  "cta": "string",
  "hashtags": ["string"],
  "keywords": ["string"]
}`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a creative marketing content writer. Always respond with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0].message.content;
    const contentData = JSON.parse(typeof content === 'string' ? content : '');

    contentAssets.push({
      contentId: `${platform}_${Date.now()}`,
      platform,
      contentType: platform === "email" ? "email_campaign" : "post",
      content: contentData.content,
      headline: contentData.headline,
      subjectLine: contentData.subjectLine,
      cta: contentData.cta,
      hashtags: contentData.hashtags || [],
      keywords: contentData.keywords || [],
      tone: brandAnalysis.brandProfile.toneOfVoice[0] || "professional",
    });
  }

  // Generate visual asset prompt
  const visualPrompt = `Create a visual asset prompt for ${brandAnalysis.brandProfile.brandName}.
  
Brand: ${brandAnalysis.brandProfile.brandName}
Industry: ${brandAnalysis.brandProfile.industry}
Tone: ${brandAnalysis.brandProfile.toneOfVoice.join(", ")}

Generate a detailed image generation prompt and style description.

Return JSON:
{
  "prompt": "detailed image generation prompt",
  "style": "style description"
}`;

  const visualResponse = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a creative director. Always respond with valid JSON.",
      },
      { role: "user", content: visualPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const visualContent = visualResponse.choices[0].message.content;
  const visualData = JSON.parse(typeof visualContent === 'string' ? visualContent : '');
  visualAssets.push({
    assetId: `visual_${Date.now()}`,
    prompt: visualData.prompt,
    style: visualData.style,
  });

  // Generate actual images for Instagram and visual platforms
  const generatedImages: any[] = [];
  const visualPlatforms = input.targetPlatforms.filter(p => 
    ['instagram', 'facebook', 'twitter'].includes(p.toLowerCase())
  );

  if (visualPlatforms.length > 0) {
    const { generateImage } = await import("../_core/imageGeneration");
    
    for (const platform of visualPlatforms) {
      try {
        const imagePrompt = `Professional marketing image for ${brandAnalysis.brandProfile.brandName}. Style: Modern, clean, ${brandAnalysis.brandProfile.toneOfVoice?.[0] || 'professional'}. Context: ${brandAnalysis.brandProfile.valueProposition}. Platform: ${platform}. High quality, eye-catching, brand-appropriate.`;
        
        const imageResult = await generateImage({
          prompt: imagePrompt,
        });

        generatedImages.push({
          platform,
          imageUrl: imageResult.url,
          prompt: imagePrompt,
        });
      } catch (error) {
        console.error(`[Image Generation] Failed for ${platform}:`, error);
      }
    }
  }

  return {
    contentAssets,
    visualAssets,
    generatedImages,
  };
}

/**
 * Generate KOL (Key Opinion Leader) recommendations based on brand analysis
 * Provides example influencer types with reasoning and outreach templates
 * Note: Names are illustrative examples only, not real accounts
 */
async function generateKOLRecommendations(
  input: WorkflowInput,
  brandAnalysis: any
): Promise<KOLRecommendation[]> {
  const kolPrompt = `Based on the following brand information, suggest 3 TYPES of influencers (not specific people) that would be suitable for this marketing campaign.

Brand: ${brandAnalysis.brandProfile.brandName}
Industry: ${brandAnalysis.brandProfile.industry}
Target Audience: ${JSON.stringify(brandAnalysis.brandProfile.targetAudience)}
Value Proposition: ${brandAnalysis.brandProfile.valueProposition}

Provide ONLY these 5 fields for each influencer type:
1. name: A GENERIC category name (e.g., "Tech Educator", "Lifestyle Content Creator") - NOT a real person's name
2. platform: One of: Instagram, TikTok, or YouTube
3. niche: Their content focus area (one or two words)
4. reason: Why this TYPE of influencer would be a good fit (2-3 sentences)
5. outreachMessage: A template message to send

❌ STRICTLY FORBIDDEN - Do NOT include:
- Real names, usernames, or handles
- Follower counts or subscriber numbers
- Engagement rates or percentages
- View counts or averages
- Cost estimates or budget numbers
- Profile URLs or links
- Any other numerical metrics

Respond with ONLY a JSON object with an "influencers" array containing exactly 3 objects with ONLY the 5 allowed fields.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an influencer marketing expert. Always respond with valid JSON.",
      },
      { role: "user", content: kolPrompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  const data = JSON.parse(typeof content === 'string' ? content : '');
  const influencers = data.influencers || data.recommendations || data || [];

  // Strictly filter to only allowed fields - remove ANY other data
  return influencers.map((inf: any, index: number) => {
    const cleaned: KOLRecommendation = {
      id: `kol_${Date.now()}_${index}`,
      name: inf.name || 'Influencer Type',
      platform: inf.platform || 'Instagram',
      niche: inf.niche || '',
      reason: inf.reason || '',
      outreachMessage: inf.outreachMessage || '',
    };
    // Return ONLY the cleaned object - no extra fields
    return cleaned;
  });
}

/**
 * Industry benchmarks for realistic calculations
 */
const PLATFORM_BENCHMARKS: Record<string, { ctr: number; cpc: number; conversionRate: number; cpm: number }> = {
  linkedin: { ctr: 0.0039, cpc: 5.26, conversionRate: 0.027, cpm: 6.50 },
  google_ads: { ctr: 0.0317, cpc: 2.69, conversionRate: 0.041, cpm: 2.80 },
  email: { ctr: 0.026, cpc: 0.10, conversionRate: 0.018, cpm: 0.05 },
  facebook: { ctr: 0.009, cpc: 1.72, conversionRate: 0.095, cpm: 7.19 },
  instagram: { ctr: 0.0083, cpc: 3.56, conversionRate: 0.085, cpm: 7.91 },
  twitter: { ctr: 0.0086, cpc: 0.38, conversionRate: 0.0064, cpm: 6.46 },
};

/**
 * Calculate realistic performance metrics based on industry benchmarks
 */
function calculatePerformanceMetrics(
  budget: number,
  platforms: string[],
  budgetAllocations: any[]
) {
  let totalImpressions = 0;
  let totalClicks = 0;
  let totalConversions = 0;
  let totalSpend = 0;

  budgetAllocations.forEach((allocation) => {
    const platform = allocation.platform.toLowerCase();
    const benchmark = PLATFORM_BENCHMARKS[platform] || PLATFORM_BENCHMARKS.google_ads;
    const platformBudget = allocation.amount;

    // Calculate impressions based on CPM
    const impressions = Math.round((platformBudget / benchmark.cpm) * 1000);
    
    // Calculate clicks based on CTR
    const clicks = Math.round(impressions * benchmark.ctr);
    
    // Calculate conversions based on conversion rate
    const conversions = Math.round(clicks * benchmark.conversionRate);

    totalImpressions += impressions;
    totalClicks += clicks;
    totalConversions += conversions;
    totalSpend += platformBudget;
  });

  const ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
  const conversionRate = totalClicks > 0 ? totalConversions / totalClicks : 0;
  const cpa = totalConversions > 0 ? totalSpend / totalConversions : 0;
  
  // Assume average order value for ROI calculation (can be customized)
  const avgOrderValue = 500; // $500 per conversion
  const revenue = totalConversions * avgOrderValue;
  const roi = totalSpend > 0 ? revenue / totalSpend : 0;

  return {
    impressions: totalImpressions,
    clicks: totalClicks,
    ctr: parseFloat(ctr.toFixed(4)),
    conversions: totalConversions,
    conversionRate: parseFloat(conversionRate.toFixed(4)),
    roi: parseFloat(roi.toFixed(2)),
    costPerAcquisition: parseFloat(cpa.toFixed(2)),
    engagementScore: parseFloat((ctr * 1000).toFixed(1)), // Engagement score out of 10
  };
}

/**
 * Stage 3: Campaign Execution with Real Calculations
 */
async function executeCampaign(
  input: WorkflowInput,
  brandAnalysis: any,
  contentGeneration: any
) {
  // First, get AI-powered budget allocation and insights
  const prompt = `You are a campaign manager optimizing budget allocation.

Campaign: ${brandAnalysis.brandProfile.brandName}
Total Budget: $${input.budget}
Platforms: ${input.targetPlatforms.join(", ")}
Target KPIs: ${JSON.stringify(input.targetKpis || {})}

Provide smart budget allocation and strategic insights:

Return JSON format:
{
  "campaignPlan": {
    "campaignName": "string",
    "budgetAllocations": [
      {
        "platform": "string",
        "amount": number (must sum to total budget),
        "percentage": number,
        "rationale": "why this allocation"
      }
    ]
  },
  "optimizationFeedback": {
    "insights": ["string - key strategic insights"],
    "recommendations": ["string - actionable improvements"]
  }
}`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          "You are a data-driven campaign manager. Allocate budget strategically based on platform strengths and campaign goals. Always respond with valid JSON.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0].message.content;
  const result = JSON.parse(typeof content === 'string' ? content : '');

  // Calculate realistic metrics based on industry benchmarks
  const performanceMetrics = calculatePerformanceMetrics(
    input.budget,
    input.targetPlatforms,
    result.campaignPlan.budgetAllocations
  );

  return {
    campaignPlan: {
      campaignId: `campaign_${Date.now()}`,
      campaignName: result.campaignPlan.campaignName,
      totalBudget: input.budget,
      budgetAllocations: result.campaignPlan.budgetAllocations,
    },
    performanceMetrics,
    optimizationFeedback: result.optimizationFeedback,
  };
}
