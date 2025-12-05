import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn", description: "Professional B2B content" },
  { id: "google_ads", label: "Google Ads", description: "Search & display ads" },
  { id: "email", label: "Email", description: "Email marketing campaigns" },
  { id: "facebook", label: "Facebook", description: "Social media posts" },
  { id: "instagram", label: "Instagram", description: "Visual content" },
  { id: "twitter", label: "Twitter/X", description: "Short-form updates" },
];

export default function CreateCampaign() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    name: "",
    campaignBrief: "",
    budget: "",
    websiteUrl: "",
    targetPlatforms: ["linkedin", "email"] as string[],
  });

  const createMutation = trpc.marketing.createCampaign.useMutation({
    onSuccess: (data) => {
      toast.success("Campaign created! Analyzing...");
      setLocation(`/campaign/${data.campaignId}`);
    },
    onError: (error) => {
      toast.error(`Failed to create campaign: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a campaign name");
      return;
    }

    if (!formData.campaignBrief.trim()) {
      toast.error("Please describe your campaign");
      return;
    }

    if (!formData.budget || parseFloat(formData.budget) <= 0) {
      toast.error("Please enter a valid budget");
      return;
    }

    if (!formData.websiteUrl.trim()) {
      toast.error("Please enter your website URL");
      return;
    }

    if (formData.targetPlatforms.length === 0) {
      toast.error("Please select at least one platform");
      return;
    }

    createMutation.mutate({
      name: formData.name,
      campaignBrief: formData.campaignBrief,
      budget: parseFloat(formData.budget),
      websiteUrl: formData.websiteUrl,
      targetPlatforms: formData.targetPlatforms,
      targetKpis: {
        roi: 2.0,
        ctr: 0.03,
      },
    });
  };

  const togglePlatform = (platformId: string) => {
    setFormData((prev) => ({
      ...prev,
      targetPlatforms: prev.targetPlatforms.includes(platformId)
        ? prev.targetPlatforms.filter((p) => p !== platformId)
        : [...prev.targetPlatforms, platformId],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Create Campaign</span>
          </h1>
          <p className="text-muted-foreground">
            Describe your campaign and let AI handle the rest
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <Card className="p-6 glass">
            <Label htmlFor="name" className="text-base font-semibold mb-2 block">
              Campaign Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., Q1 Product Launch"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-background/50"
            />
          </Card>

          {/* Campaign Brief */}
          <Card className="p-6 glass">
            <Label htmlFor="brief" className="text-base font-semibold mb-2 block">
              Campaign Brief
            </Label>
            <p className="text-sm text-muted-foreground mb-3">
              Describe your product, target audience, goals, and key messages
            </p>
            <Textarea
              id="brief"
              placeholder="Example: Launch our new AI-powered project management tool for software development teams. Target tech startups and SMBs. Emphasize productivity, collaboration, and seamless integration with developer tools."
              value={formData.campaignBrief}
              onChange={(e) => setFormData({ ...formData, campaignBrief: e.target.value })}
              rows={6}
              className="bg-background/50"
            />
          </Card>

          {/* Budget */}
          <Card className="p-6 glass">
            <Label htmlFor="budget" className="text-base font-semibold mb-2 block">
              Budget (USD)
            </Label>
            <Input
              id="budget"
              type="number"
              placeholder="10000"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              className="bg-background/50"
              min="100"
              step="100"
            />
            <p className="text-sm text-muted-foreground mt-2">
              AI will optimize budget allocation across selected platforms
            </p>
          </Card>

          {/* Website URL (Required) */}
          <Card className="p-6 glass">
            <Label htmlFor="website" className="text-base font-semibold mb-2 block">
              Website URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="website"
              type="url"
              placeholder="https://example.com"
              value={formData.websiteUrl}
              onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              className="bg-background/50"
              required
            />
          </Card>

          {/* Target Platforms */}
          <Card className="p-6 glass">
            <Label className="text-base font-semibold mb-4 block">
              Target Platforms
            </Label>
            <div className="grid sm:grid-cols-2 gap-4">
              {PLATFORMS.map((platform) => (
                <label
                  key={platform.id}
                  className={`flex items-start space-x-3 p-4 rounded-lg border transition-all cursor-pointer ${
                    formData.targetPlatforms.includes(platform.id)
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background/50 hover:border-primary/50"
                  }`}
                >
                  <Checkbox
                    checked={formData.targetPlatforms.includes(platform.id)}
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
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/")}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="glow-hover"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 w-4 h-4" />
                  Create Campaign
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Info Box */}
        <Card className="mt-8 p-6 glass border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">How it works</h3>
              <p className="text-sm text-muted-foreground">
                Our AI agents will analyze your brand, generate platform-specific content, 
                and create an optimized campaign plan. This typically takes 30-60 seconds.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
