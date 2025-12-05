import { Link } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles, BarChart3, TrendingUp, Zap, Target } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Dashboard() {
  const { data: campaigns, isLoading } = trpc.marketing.listCampaigns.useQuery();

  const completedCampaigns = campaigns?.filter(c => c.status === "completed") || [];
  const totalCampaigns = campaigns?.length || 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to your AI Marketing Command Center
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6 glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Campaigns</p>
              <p className="text-3xl font-bold">{isLoading ? "..." : totalCampaigns}</p>
            </div>
            <BarChart3 className="w-12 h-12 text-primary opacity-20" />
          </div>
        </Card>

        <Card className="p-6 glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-3xl font-bold">{isLoading ? "..." : completedCampaigns.length}</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-6 glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
              <p className="text-3xl font-bold">
                {isLoading ? "..." : totalCampaigns > 0 ? Math.round((completedCampaigns.length / totalCampaigns) * 100) : 0}%
              </p>
            </div>
            <Target className="w-12 h-12 text-blue-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* What You Can Do */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">What You Can Do</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 glass border-purple-500/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Brain className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Brand Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Analyze your brand's DNA, create SWOT analysis, define target audience and market positioning. Get comprehensive insights into your brand identity.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 glass border-blue-500/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Sparkles className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Creative Content</h3>
                <p className="text-sm text-muted-foreground">
                  Generate multi-platform marketing content for your own channels. Create engaging posts for LinkedIn, Instagram, Email, and more with AI assistance.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 glass border-green-500/20">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <Zap className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Influencer Marketing</h3>
                <p className="text-sm text-muted-foreground">
                  Find and connect with relevant influencers on Instagram and TikTok. Get personalized outreach messages and collaboration recommendations.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Recent Campaigns</h2>
          <Link href="/campaigns">
            <Button variant="outline" size="sm">View All</Button>
          </Link>
        </div>

        {isLoading ? (
          <Card className="p-8 glass text-center">
            <p className="text-muted-foreground">Loading campaigns...</p>
          </Card>
        ) : campaigns && campaigns.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {campaigns.slice(0, 5).map((campaign) => (
              <Link key={campaign.id} href={`/campaign/${campaign.id}`}>
                <Card className="p-4 glass hover:border-primary/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold mb-1">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Budget: ${campaign.budget.toLocaleString()} • {campaign.targetPlatforms.length} platforms
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          campaign.status === "completed"
                            ? "bg-green-500/10 text-green-500"
                            : campaign.status === "failed"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-blue-500/10 text-blue-500"
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 glass text-center">
            <p className="text-muted-foreground mb-4">No campaigns yet. Start by creating your first campaign!</p>
            <Link href="/create-campaign">
              <Button>Create Campaign</Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}
