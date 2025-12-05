import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Loader2, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function KOLCampaign() {
  const [brandName, setBrandName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [budget, setBudget] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const recommendMutation = trpc.kolCampaign.recommend.useMutation();

  const handleGenerate = async () => {
    if (!brandName || !productDescription || !websiteUrl || !targetAudience || !budget) {
      alert("Please fill in all required fields");
      return;
    }

    setIsGenerating(true);
    try {
      const kols = await recommendMutation.mutateAsync({
        brandName,
        productDescription,
        websiteUrl,
        targetAudience,
        budget: parseFloat(budget),
      });
      setRecommendations(kols);
    } catch (error) {
      console.error('KOL recommendation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-pink-500" />
          <h1 className="text-4xl font-bold gradient-text">KOL Campaign</h1>
        </div>
        <p className="text-muted-foreground">
          Find the perfect influencers for your brand and generate personalized outreach messages
        </p>
      </div>

      {/* Input Form */}
      <Card className="p-6 glass mb-8">
        <h2 className="text-xl font-semibold mb-4">Campaign Details</h2>

        <div className="space-y-6">
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
              placeholder="Describe what you offer, key benefits, and what makes it unique..."
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              className="mt-2 min-h-[100px]"
            />
          </div>

          <div>
            <Label htmlFor="websiteUrl">Website URL <span className="text-destructive">*</span></Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="mt-2"
              required
            />
          </div>

          <div>
            <Label htmlFor="targetAudience">Target Audience <span className="text-destructive">*</span></Label>
            <Input
              id="targetAudience"
              placeholder="e.g., Tech-savvy millennials, B2B decision makers..."
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="mt-2"
              required
            />
          </div>

          <div>
            <Label htmlFor="budget">Campaign Budget (USD) <span className="text-destructive">*</span></Label>
            <Input
              id="budget"
              type="number"
              placeholder="10000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Budget helps us recommend influencers within your price range
            </p>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !brandName || !productDescription}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Finding Perfect KOLs...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Find Influencers
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* KOL Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold gradient-text">Recommended Influencers</h2>
          
          {recommendations.map((kol) => (
            <Card key={kol.id} className="p-6 glass">
              {/* KOL Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">{kol.name}</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{kol.platform}</Badge>
                    <Badge variant="outline">{kol.niche}</Badge>
                  </div>
                </div>
              </div>

              {/* Why This KOL */}
              <div className="mb-6">
                <Label className="text-sm font-semibold mb-2 block">Why This Influencer?</Label>
                <p className="text-sm text-muted-foreground leading-relaxed">{kol.reason}</p>
              </div>

              {/* Outreach Message */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-semibold">Personalized Outreach Message</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(kol.outreachMessage, kol.id)}
                  >
                    {copiedId === kol.id ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Message
                      </>
                    )}
                  </Button>
                </div>
                <div className="p-4 bg-background/50 rounded-lg border border-border">
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans">
                    {kol.outreachMessage}
                  </pre>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
