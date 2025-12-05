import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Brain, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BrandAnalysis() {
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const analyzeMutation = trpc.brandAnalysis.analyze.useMutation();

  const handleAnalyze = async () => {
    if (!websiteUrl && !brandDescription) return;

    setIsAnalyzing(true);
    try {
      const result = await analyzeMutation.mutateAsync({
        websiteUrl,
        brandDescription,
      });
      setResult(result);
    } catch (error) {
      console.error('Brand analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-8 h-8 text-purple-500" />
          <h1 className="text-4xl font-bold gradient-text">Brand Strategist</h1>
        </div>
        <p className="text-muted-foreground">
          Analyze brand DNA, extract market insights, and generate SWOT analysis
        </p>
      </div>

      {/* Input Form */}
      <Card className="p-6 glass mb-8">
        <h2 className="text-xl font-semibold mb-4">New Brand Analysis</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Enter a website URL to analyze the brand's identity and market positioning
        </p>

        <div className="space-y-4">
          <div>
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              type="url"
              placeholder="https://example.com"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="brandDescription">Brand Description (Optional)</Label>
            <Textarea
              id="brandDescription"
              placeholder="Provide additional context about your brand, target audience, or specific areas you'd like analyzed..."
              value={brandDescription}
              onChange={(e) => setBrandDescription(e.target.value)}
              className="mt-2 min-h-[100px]"
            />
          </div>

          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing || (!websiteUrl && !brandDescription)}
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Brand...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Analyze Brand
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Brand Tone */}
          <Card className="p-6 glass">
            <h2 className="text-2xl font-bold mb-4">Brand Tone</h2>
            <p className="text-muted-foreground">
              {result.brandProfile.toneOfVoice.join(", ")}
            </p>
          </Card>

          {/* Value Proposition */}
          <Card className="p-6 glass">
            <h2 className="text-2xl font-bold mb-4">Value Proposition</h2>
            <p className="text-foreground leading-relaxed">
              {result.brandProfile.valueProposition}
            </p>
          </Card>

          {/* Target Audience */}
          <Card className="p-6 glass">
            <h2 className="text-2xl font-bold mb-4">Target Audience</h2>
            <p className="text-foreground leading-relaxed">
              {result.brandProfile.targetAudience.demographics}. {result.brandProfile.targetAudience.psychographics}
            </p>
          </Card>

          {/* Market Positioning */}
          <Card className="p-6 glass">
            <h2 className="text-2xl font-bold mb-4">Market Positioning</h2>
            <p className="text-foreground leading-relaxed">
              {result.positioningStrategy}
            </p>
          </Card>

          {/* SWOT Analysis */}
          <Card className="p-6 glass">
            <h2 className="text-2xl font-bold mb-4 gradient-text">SWOT Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-green-500 mb-2">Strengths</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {result.swotAnalysis.strengths.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-red-500 mb-2">Weaknesses</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {result.swotAnalysis.weaknesses.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-blue-500 mb-2">Opportunities</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {result.swotAnalysis.opportunities.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-yellow-500 mb-2">Threats</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {result.swotAnalysis.threats.map((item: string, i: number) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>


        </div>
      )}
    </div>
  );
}
