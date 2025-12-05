import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", description: "Professional B2B content" },
  { id: "google_ads", label: "Google Ads", description: "Search & display ads" },
  { id: "email", label: "Email", description: "Email campaigns" },
  { id: "facebook", label: "Facebook", description: "Social media posts" },
  { id: "instagram", label: "Instagram", description: "Visual content & stories" },
  { id: "twitter", label: "Twitter", description: "Short-form updates" },
];

export default function CreativeContent() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [brandName, setBrandName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const [, setLocation] = useLocation();
  const createCampaignMutation = trpc.marketing.createCampaign.useMutation();
  const utils = trpc.useUtils();
  const [campaignId, setCampaignId] = useState<number | null>(null);
  const [generatedImages, setGeneratedImages] = useState<any[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);

  const handleGenerate = async () => {
    if (!brandName || !productDescription || selectedPlatforms.length === 0) return;

    setIsGenerating(true);
    try {
      // Create a campaign using the Marketing Agent workflow
      const result = await createCampaignMutation.mutateAsync({
        name: `${brandName} - Content Generation`,
        campaignBrief: productDescription,
        budget: budget ? parseFloat(budget) : 5000,
        targetPlatforms: selectedPlatforms,
        websiteUrl: websiteUrl || undefined,
      });

      setCampaignId(result.campaignId);

      // Poll for campaign completion
      const checkCampaign = async () => {
        const campaign = await utils.marketing.getCampaign.fetch({ campaignId: result.campaignId });
        
        if (campaign?.status === 'completed' && campaign.result) {
          // Extract content assets
          const content = campaign.result.contentAssets.map((asset: any) => ({
            platform: asset.platform,
            content: asset.content,
            headline: asset.headline,
            subjectLine: asset.subjectLine,
            cta: asset.cta,
            hashtags: asset.hashtags || [],
          }));
          setGeneratedContent(content);
          setGeneratedImages(campaign.result.generatedImages || []);
          setPerformanceMetrics(campaign.result.performanceMetrics || null);
          setIsGenerating(false);
        } else if (campaign?.status === 'failed') {
          console.error('Campaign generation failed');
          setIsGenerating(false);
        } else {
          // Still processing, check again
          setTimeout(checkCampaign, 2000);
        }
      };

      setTimeout(checkCampaign, 2000);
    } catch (error) {
      console.error('Content generation failed:', error);
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="w-8 h-8 text-blue-500" />
          <h1 className="text-4xl font-bold gradient-text">Creative Engine</h1>
        </div>
        <p className="text-muted-foreground">
          Generate platform-specific marketing content with AI
        </p>
      </div>

      {/* Input Form */}
      <Card className="p-6 glass mb-8">
        <h2 className="text-xl font-semibold mb-4">Content Generation</h2>

        <div className="space-y-6">
          <div>
            <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Enter your website URL to analyze brand identity and extract positioning automatically
            </p>
          </div>

          <div>
            <Label htmlFor="brandName">Brand Name</Label>
            <Input
              id="brandName"
              placeholder="Your Brand Name"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="productDescription">Product/Service Description</Label>
            <Textarea
              id="productDescription"
              placeholder="Describe your product or service, key benefits, and target audience..."
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              className="mt-2 min-h-[120px]"
            />
          </div>

          <div>
            <Label htmlFor="budget">Campaign Budget (USD)</Label>
            <Input
              id="budget"
              type="number"
              placeholder="10000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Budget will be allocated across selected platforms for optimal ROI
            </p>
          </div>

          <div>
            <Label className="text-base font-semibold mb-4 block">Target Platforms</Label>
            <div className="grid sm:grid-cols-2 gap-4">
              {PLATFORMS.map((platform) => (
                <label
                  key={platform.id}
                  className={`flex items-start space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedPlatforms.includes(platform.id)
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background/50 hover:border-primary/50"
                  }`}
                >
                  <Checkbox
                    checked={selectedPlatforms.includes(platform.id)}
                    onCheckedChange={() => togglePlatform(platform.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{platform.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {platform.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !brandName || !productDescription || selectedPlatforms.length === 0}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Content...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Content
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Generated Content */}
      {generatedContent.length > 0 && (
        <div className="space-y-8">
          <h2 className="text-2xl font-bold gradient-text">Generated Content</h2>
          
          {/* Generated Images Section */}
          {generatedImages.length > 0 && (
            <Card className="p-6 glass">
              <h3 className="text-xl font-semibold mb-4">Generated Visual Assets</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {generatedImages.map((img: any, index: number) => (
                  <div key={index} className="space-y-2">
                    <img
                      src={img.url}
                      alt={img.platform}
                      className="w-full rounded-lg border border-border"
                    />
                    <Badge variant="secondary">{img.platform}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Content Assets */}
          {generatedContent.map((item, index) => (
            <Card key={index} className="p-6 glass">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-sm">
                    {PLATFORMS.find(p => p.id === item.platform)?.label}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(item.content, item.platform)}
                >
                  {copiedId === item.platform ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="space-y-3">
                {item.headline && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Headline</Label>
                    <p className="font-semibold text-lg">{item.headline}</p>
                  </div>
                )}

                {item.subjectLine && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Subject Line</Label>
                    <p className="font-semibold">{item.subjectLine}</p>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-muted-foreground">Content</Label>
                  <p className="text-foreground whitespace-pre-wrap">{item.content}</p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Call to Action</Label>
                  <p className="font-medium text-primary">{item.cta}</p>
                </div>

                {item.hashtags && item.hashtags.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Hashtags</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.hashtags.map((tag: string, i: number) => (
                        <span key={i} className="text-sm text-blue-500">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}

          {/* Performance Analysis */}
          {performanceMetrics && (
            <Card className="p-6 glass">
              <h3 className="text-xl font-semibold mb-4">Performance Analysis</h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-background/50 border border-border">
                  <Label className="text-xs text-muted-foreground">Total Impressions</Label>
                  <p className="text-2xl font-bold mt-1">{performanceMetrics.totalImpressions?.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border">
                  <Label className="text-xs text-muted-foreground">Total Clicks</Label>
                  <p className="text-2xl font-bold mt-1">{performanceMetrics.totalClicks?.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border">
                  <Label className="text-xs text-muted-foreground">Conversions</Label>
                  <p className="text-2xl font-bold mt-1">{performanceMetrics.totalConversions?.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-background/50 border border-border">
                  <Label className="text-xs text-muted-foreground">ROI</Label>
                  <p className="text-2xl font-bold mt-1 text-green-500">{performanceMetrics.roi?.toFixed(2)}x</p>
                </div>
              </div>

              {/* Platform Breakdown */}
              {performanceMetrics.platformBreakdown && (
                <div>
                  <h4 className="font-semibold mb-3">Platform Performance</h4>
                  <div className="space-y-3">
                    {Object.entries(performanceMetrics.platformBreakdown).map(([platform, metrics]: [string, any]) => (
                      <div key={platform} className="p-4 rounded-lg bg-background/30 border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">{platform}</Badge>
                          <span className="text-sm text-muted-foreground">
                            CTR: {(metrics.ctr * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <Label className="text-xs text-muted-foreground">Impressions</Label>
                            <p className="font-medium">{metrics.impressions?.toLocaleString()}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Clicks</Label>
                            <p className="font-medium">{metrics.clicks?.toLocaleString()}</p>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Conversions</Label>
                            <p className="font-medium">{metrics.conversions?.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
