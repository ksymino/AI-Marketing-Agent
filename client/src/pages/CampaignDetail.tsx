import { useEffect } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, CheckCircle2, XCircle, Clock, Sparkles } from "lucide-react";
import { Link } from "wouter";

export default function CampaignDetail() {
  const [, params] = useRoute("/campaign/:id");
  const campaignId = params?.id ? parseInt(params.id) : 0;

  const { data: campaign, isLoading, refetch } = trpc.marketing.getCampaign.useQuery(
    { campaignId },
    { 
      enabled: campaignId > 0, 
      refetchInterval: 2000 // Poll every 2 seconds
    }
  );

  useEffect(() => {
    if (campaign?.status && campaign.status !== "completed" && campaign.status !== "failed") {
      const interval = setInterval(() => {
        refetch();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [campaign?.status, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <XCircle className="w-16 h-16 text-destructive" />
        <h2 className="text-2xl font-bold">Campaign Not Found</h2>
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pending", variant: "secondary" as const, icon: Clock },
      analyzing: { label: "Analyzing", variant: "default" as const, icon: Loader2 },
      generating: { label: "Generating", variant: "default" as const, icon: Loader2 },
      executing: { label: "Executing", variant: "default" as const, icon: Loader2 },
      completed: { label: "Completed", variant: "default" as const, icon: CheckCircle2 },
      failed: { label: "Failed", variant: "destructive" as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-2">
        <Icon className={`w-4 h-4 ${status === "analyzing" || status === "generating" || status === "executing" ? "animate-spin" : ""}`} />
        {config.label}
      </Badge>
    );
  };

  const isProcessing = campaign.status !== "completed" && campaign.status !== "failed";

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/campaigns">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="gradient-text">{campaign.name}</span>
              </h1>
              <p className="text-muted-foreground">
                Created {new Date(campaign.createdAt).toLocaleDateString()}
              </p>
            </div>
            {getStatusBadge(campaign.status)}
          </div>
        </div>

        {/* Processing State */}
        {isProcessing && (
          <Card className="p-8 glass glow mb-8 text-center">
            <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">AI Agents are working...</h3>
            <p className="text-muted-foreground">
              {campaign.status === "analyzing" && "Analyzing your brand and creating strategy"}
              {campaign.status === "generating" && "Generating platform-specific content"}
              {campaign.status === "executing" && "Optimizing campaign and calculating metrics"}
            </p>
          </Card>
        )}

        {/* Campaign Info */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 glass">
            <h3 className="font-semibold mb-4">Campaign Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Budget:</span>
                <span className="ml-2 font-medium">${(campaign.budget / 100).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Platforms:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {campaign.targetPlatforms.map((p: string) => (
                    <Badge key={p} variant="secondary">{p}</Badge>
                  ))}
                </div>
              </div>
              {campaign.websiteUrl && (
                <div>
                  <span className="text-muted-foreground">Website:</span>
                  <a href={campaign.websiteUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary hover:underline">
                    {campaign.websiteUrl}
                  </a>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 glass">
            <h3 className="font-semibold mb-4">Campaign Brief</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {campaign.campaignBrief}
            </p>
          </Card>
        </div>

        {/* Results */}
        {campaign.result && campaign.status === "completed" && (
          <div className="space-y-8">
            {/* Brand Analysis */}
            {campaign.result.brandAnalysis && (
              <Card className="p-6 glass">
                <h2 className="text-2xl font-bold mb-6 gradient-text">Brand Analysis</h2>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-3">Brand Profile</h3>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Brand:</span>
                        <p className="font-medium">{campaign.result.brandAnalysis.brandProfile?.brandName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Industry:</span>
                        <p className="font-medium">{campaign.result.brandAnalysis.brandProfile?.industry}</p>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground">Value Proposition:</span>
                        <p className="font-medium">{campaign.result.brandAnalysis.brandProfile?.valueProposition}</p>
                      </div>
                    </div>
                  </div>

                  {campaign.result.brandAnalysis.swotAnalysis && (
                    <div>
                      <h3 className="font-semibold mb-3">SWOT Analysis</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                          <h4 className="font-medium text-green-400 mb-2">Strengths</h4>
                          <ul className="text-sm space-y-1">
                            {campaign.result.brandAnalysis.swotAnalysis.strengths?.map((s: string, i: number) => (
                              <li key={i} className="text-muted-foreground">• {s}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <h4 className="font-medium text-yellow-400 mb-2">Weaknesses</h4>
                          <ul className="text-sm space-y-1">
                            {campaign.result.brandAnalysis.swotAnalysis.weaknesses?.map((w: string, i: number) => (
                              <li key={i} className="text-muted-foreground">• {w}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <h4 className="font-medium text-blue-400 mb-2">Opportunities</h4>
                          <ul className="text-sm space-y-1">
                            {campaign.result.brandAnalysis.swotAnalysis.opportunities?.map((o: string, i: number) => (
                              <li key={i} className="text-muted-foreground">• {o}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                          <h4 className="font-medium text-red-400 mb-2">Threats</h4>
                          <ul className="text-sm space-y-1">
                            {campaign.result.brandAnalysis.swotAnalysis.threats?.map((t: string, i: number) => (
                              <li key={i} className="text-muted-foreground">• {t}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Generated Images */}
            {campaign.result.generatedImages && campaign.result.generatedImages.length > 0 && (
              <Card className="p-6 glass">
                <h2 className="text-2xl font-bold mb-6 gradient-text">AI-Generated Images</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaign.result.generatedImages.map((image: any, index: number) => (
                    <div key={index} className="space-y-3">
                      <div className="aspect-square rounded-lg overflow-hidden border border-border bg-card">
                        <img 
                          src={image.imageUrl} 
                          alt={`${image.platform} generated image`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <Badge variant="secondary">{image.platform}</Badge>
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {image.prompt}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Content Assets */}
            {campaign.result.contentAssets && campaign.result.contentAssets.length > 0 && (
              <Card className="p-6 glass">
                <h2 className="text-2xl font-bold mb-6 gradient-text">Generated Content</h2>
                <div className="space-y-6">
                  {campaign.result.contentAssets.map((asset: any, index: number) => (
                    <div key={index} className="p-4 rounded-lg bg-card border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <Badge variant="secondary">{asset.platform}</Badge>
                        <Badge variant="outline">{asset.contentType}</Badge>
                      </div>
                      {asset.headline && (
                        <h4 className="font-semibold mb-2">{asset.headline}</h4>
                      )}
                      {asset.subjectLine && (
                        <p className="text-sm text-primary mb-2">Subject: {asset.subjectLine}</p>
                      )}
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-3">
                        {asset.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">CTA:</span>
                        <span className="font-medium">{asset.cta}</span>
                      </div>
                      {asset.hashtags && asset.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {asset.hashtags.map((tag: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* KOL Recommendations */}
            {campaign.result.kolRecommendations && campaign.result.kolRecommendations.length > 0 && (
              <Card className="p-6 glass">
                <h2 className="text-2xl font-bold mb-6 gradient-text">Recommended Influencer Types</h2>
                <p className="text-muted-foreground mb-6">Suggested influencer profiles that align with your brand. Use these as a guide to find real influencers.</p>
                <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-6">
                  {campaign.result.kolRecommendations.map((kol: any) => (
                    <Card key={kol.id} className="p-5 bg-card border border-border hover:border-primary/50 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{kol.name}</h3>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="secondary">{kol.platform}</Badge>
                            <Badge variant="outline">{kol.niche}</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Why This Type:</p>
                        <p className="text-sm text-muted-foreground">{kol.reason}</p>
                      </div>

                      <div>
                        <p className="text-xs text-muted-foreground mb-2 font-medium">Outreach Template:</p>
                        <div className="p-3 rounded bg-muted/30 border border-border text-sm">
                          <p className="whitespace-pre-wrap text-muted-foreground">{kol.outreachMessage}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            )}

            {/* Performance Metrics */}
            {campaign.result.performanceMetrics && (
              <Card className="p-6 glass">
                <h2 className="text-2xl font-bold mb-6 gradient-text">Performance Metrics</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="text-2xl font-bold text-primary">
                      {campaign.result.performanceMetrics.roi?.toFixed(2)}x
                    </div>
                    <div className="text-sm text-muted-foreground">ROI</div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="text-2xl font-bold text-primary">
                      {campaign.result.performanceMetrics.conversions?.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Conversions</div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="text-2xl font-bold text-primary">
                      {(campaign.result.performanceMetrics.ctr * 100)?.toFixed(2)}%
                    </div>
                    <div className="text-sm text-muted-foreground">CTR</div>
                  </div>
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="text-2xl font-bold text-primary">
                      ${campaign.result.performanceMetrics.costPerAcquisition?.toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">CPA</div>
                  </div>
                </div>

                {campaign.result.optimizationFeedback && (
                  <div className="mt-6 space-y-4">
                    {campaign.result.optimizationFeedback.insights && (
                      <div>
                        <h3 className="font-semibold mb-2">Key Insights</h3>
                        <ul className="space-y-2">
                          {campaign.result.optimizationFeedback.insights.map((insight: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {campaign.result.optimizationFeedback.recommendations && (
                      <div>
                        <h3 className="font-semibold mb-2">Recommendations</h3>
                        <ul className="space-y-2">
                          {campaign.result.optimizationFeedback.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* Failed State */}
        {campaign.status === "failed" && (
          <Card className="p-8 glass border-destructive/50 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Campaign Failed</h3>
            <p className="text-muted-foreground mb-4">
              Something went wrong while processing your campaign. Please try again.
            </p>
            <Link href="/create">
              <Button>Create New Campaign</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
