import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Marketing Agent workflows
  marketing: router({
    // Create a new campaign
    createCampaign: publicProcedure
      .input(
        z.object({
          name: z.string(),
          campaignBrief: z.string(),
          budget: z.number().positive(),
          targetPlatforms: z.array(z.string()),
          targetKpis: z.record(z.string(), z.number()).optional(),
          websiteUrl: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { createCampaign } = await import("./db");
        const { executeMarketingWorkflow } = await import("./marketing_agent/adapter");

        // Create campaign record
        const campaignId = await createCampaign({
          userId: ctx.user?.id || 1, // Default to 1 for demo
          name: input.name,
          campaignBrief: input.campaignBrief,
          budget: Math.round(input.budget * 100), // Convert to cents
          targetPlatforms: JSON.stringify(input.targetPlatforms),
          targetKpis: input.targetKpis ? JSON.stringify(input.targetKpis) : null,
          websiteUrl: input.websiteUrl || null,
          status: "pending",
        });

        // Execute workflow asynchronously
        (async () => {
          try {
            const { updateCampaignStatus, saveCampaignResult } = await import("./db");
            
            await updateCampaignStatus(campaignId, "analyzing");
            
            const result = await executeMarketingWorkflow({
              campaignBrief: input.campaignBrief,
              budget: input.budget,
              targetPlatforms: input.targetPlatforms,
              websiteUrl: input.websiteUrl,
              targetKpis: input.targetKpis as Record<string, number> | undefined,
            });

            await updateCampaignStatus(campaignId, "completed");
            
            await saveCampaignResult({
              campaignId,
              brandAnalysis: JSON.stringify(result.brandAnalysis),
              contentAssets: JSON.stringify(result.contentGeneration.contentAssets),
              visualAssets: JSON.stringify(result.contentGeneration.visualAssets),
              generatedImages: JSON.stringify(result.contentGeneration.generatedImages || []),
              kolRecommendations: JSON.stringify(result.kolRecommendations || []),
              campaignPlan: JSON.stringify(result.campaignResult.campaignPlan),
              performanceMetrics: JSON.stringify(result.campaignResult.performanceMetrics),
              optimizationFeedback: JSON.stringify(result.campaignResult.optimizationFeedback),
              executionTime: result.executionTime,
            });
          } catch (error) {
            console.error("[Marketing] Workflow failed:", error);
            const { updateCampaignStatus } = await import("./db");
            await updateCampaignStatus(campaignId, "failed");
          }
        })();

        return { campaignId };
      }),

    // Get campaign status and details
    getCampaign: publicProcedure
      .input(z.object({ campaignId: z.number() }))
      .query(async ({ input }) => {
        const { getCampaignById, getCampaignResult } = await import("./db");
        
        const campaign = await getCampaignById(input.campaignId);
        if (!campaign) return null;

        const result = await getCampaignResult(input.campaignId);

        return {
          ...campaign,
          targetPlatforms: JSON.parse(campaign.targetPlatforms),
          targetKpis: campaign.targetKpis ? JSON.parse(campaign.targetKpis) : null,
          result: result
            ? {
                brandAnalysis: JSON.parse(result.brandAnalysis || "{}"),
                contentAssets: JSON.parse(result.contentAssets || "[]"),
                visualAssets: JSON.parse(result.visualAssets || "[]"),
                generatedImages: JSON.parse(result.generatedImages || "[]"),
                kolRecommendations: JSON.parse(result.kolRecommendations || "[]"),
                campaignPlan: JSON.parse(result.campaignPlan || "{}"),
                performanceMetrics: JSON.parse(result.performanceMetrics || "{}"),
                optimizationFeedback: JSON.parse(result.optimizationFeedback || "{}"),
                executionTime: result.executionTime,
              }
            : null,
        };
      }),

    // List user's campaigns
    listCampaigns: publicProcedure.query(async ({ ctx }) => {
      const { getUserCampaigns } = await import("./db");
      const campaigns = await getUserCampaigns(ctx.user?.id || 1);
      
      return campaigns.map((c) => ({
        ...c,
        targetPlatforms: JSON.parse(c.targetPlatforms),
        targetKpis: c.targetKpis ? JSON.parse(c.targetKpis) : null,
      }));
    }),
  }),

  // Brand Analysis API
  brandAnalysis: router({
    analyze: publicProcedure
      .input(z.object({
        websiteUrl: z.string().optional(),
        brandDescription: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        const prompt = `Analyze the following brand and provide a comprehensive brand analysis:

${input.websiteUrl ? `Website: ${input.websiteUrl}` : ''}
${input.brandDescription ? `Description: ${input.brandDescription}` : ''}

Provide a detailed JSON response with the following structure:
{
  "brandProfile": {
    "brandName": "extracted or inferred brand name",
    "industry": "industry category",
    "toneOfVoice": ["tone1", "tone2", "tone3"],
    "valueProposition": "clear value proposition statement",
    "targetAudience": {
      "demographics": "demographic description",
      "psychographics": "psychographic description"
    }
  },
  "swotAnalysis": {
    "strengths": ["strength1", "strength2", "strength3"],
    "weaknesses": ["weakness1", "weakness2", "weakness3"],
    "opportunities": ["opportunity1", "opportunity2", "opportunity3"],
    "threats": ["threat1", "threat2", "threat3"]
  },
  "positioningStrategy": "detailed positioning strategy statement"
}`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a brand strategist expert. Provide detailed, actionable brand analysis in JSON format.' },
            { role: 'user', content: prompt }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'brand_analysis',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  brandProfile: {
                    type: 'object',
                    properties: {
                      brandName: { type: 'string' },
                      industry: { type: 'string' },
                      toneOfVoice: { type: 'array', items: { type: 'string' } },
                      valueProposition: { type: 'string' },
                      targetAudience: {
                        type: 'object',
                        properties: {
                          demographics: { type: 'string' },
                          psychographics: { type: 'string' }
                        },
                        required: ['demographics', 'psychographics'],
                        additionalProperties: false
                      }
                    },
                    required: ['brandName', 'industry', 'toneOfVoice', 'valueProposition', 'targetAudience'],
                    additionalProperties: false
                  },
                  swotAnalysis: {
                    type: 'object',
                    properties: {
                      strengths: { type: 'array', items: { type: 'string' } },
                      weaknesses: { type: 'array', items: { type: 'string' } },
                      opportunities: { type: 'array', items: { type: 'string' } },
                      threats: { type: 'array', items: { type: 'string' } }
                    },
                    required: ['strengths', 'weaknesses', 'opportunities', 'threats'],
                    additionalProperties: false
                  },
                  positioningStrategy: { type: 'string' }
                },
                required: ['brandProfile', 'swotAnalysis', 'positioningStrategy'],
                additionalProperties: false
              }
            }
          }
        });

        const content = response.choices[0]?.message?.content;
        const result = JSON.parse(typeof content === 'string' ? content : '{}');
        return result;
      }),
  }),

  // KOL Campaign API
  kolCampaign: router({
    recommend: publicProcedure
      .input(z.object({
        brandName: z.string(),
        productDescription: z.string(),
        websiteUrl: z.string(),
        targetAudience: z.string(),
        budget: z.number(),
      }))
      .mutation(async ({ input }) => {
        const { invokeLLM } = await import('./_core/llm');
        
        const prompt = `Generate 3 influencer recommendations for the following brand:

Brand: ${input.brandName}
Website: ${input.websiteUrl}
Product: ${input.productDescription}
Target Audience: ${input.targetAudience}
Budget: $${input.budget}

For each influencer, provide:
- A realistic Instagram or TikTok username
- Platform (Instagram or TikTok)
- Follower count
- Engagement rate
- Niche/specialty
- Average views
- Estimated cost per post
- Reason why they're a good fit
- A personalized outreach message

Provide response in JSON format with an array of 3 influencers.`;

        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are an influencer marketing expert. Generate realistic, relevant KOL recommendations with personalized outreach messages.' },
            { role: 'user', content: prompt }
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'kol_recommendations',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  influencers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        platform: { type: 'string' },
                        followers: { type: 'string' },
                        engagementRate: { type: 'string' },
                        niche: { type: 'string' },
                        avgViews: { type: 'string' },
                        estimatedCost: { type: 'string' },
                        reason: { type: 'string' },
                        outreachMessage: { type: 'string' }
                      },
                      required: ['name', 'platform', 'followers', 'engagementRate', 'niche', 'avgViews', 'estimatedCost', 'reason', 'outreachMessage'],
                      additionalProperties: false
                    }
                  }
                },
                required: ['influencers'],
                additionalProperties: false
              }
            }
          }
        });

        const kolContent = response.choices[0]?.message?.content;
        const result = JSON.parse(typeof kolContent === 'string' ? kolContent : '{ "influencers": [] }');
        return result.influencers.map((kol: any, index: number) => ({
          id: `kol${index + 1}`,
          ...kol,
          profileUrl: kol.platform === 'Instagram' 
            ? `https://instagram.com/${kol.name.replace('@', '')}` 
            : `https://tiktok.com/${kol.name}`
        }));
      }),
  }),
});

export type AppRouter = typeof appRouter;
