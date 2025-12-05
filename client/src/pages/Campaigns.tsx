import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, ArrowRight, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Link } from "wouter";

export default function Campaigns() {
  const { data: campaigns, isLoading } = trpc.marketing.listCampaigns.useQuery();

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
        <Icon className={`w-3 h-3 ${status === "analyzing" || status === "generating" || status === "executing" ? "animate-spin" : ""}`} />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <span className="gradient-text">Your Campaigns</span>
            </h1>
            <p className="text-muted-foreground">
              Manage and track your marketing campaigns
            </p>
          </div>
          <Link href="/create-campaign">
            <Button className="glow-hover">
              <Plus className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </Link>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && campaigns && campaigns.length === 0 && (
          <Card className="p-12 glass text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first AI-powered marketing campaign to get started
              </p>
              <Link href="/create-campaign">
                <Button className="glow-hover">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Campaigns List */}
        {!isLoading && campaigns && campaigns.length > 0 && (
          <div className="grid gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id} className="p-6 glass glow-hover hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {campaign.campaignBrief}
                    </p>
                  </div>
                  <Link href={`/campaign/${campaign.id}`}>
                    <Button variant="ghost" size="sm">
                      View
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="ml-2 font-medium">${(campaign.budget / 100).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Platforms:</span>
                    <div className="flex gap-1">
                      {campaign.targetPlatforms.slice(0, 3).map((p: string) => (
                        <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                      ))}
                      {campaign.targetPlatforms.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{campaign.targetPlatforms.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="ml-auto text-muted-foreground">
                    {new Date(campaign.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
