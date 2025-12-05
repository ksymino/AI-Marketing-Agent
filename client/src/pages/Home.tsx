import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Sparkles, Zap, Target, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { APP_TITLE } from "@/const";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-card">
      {/* Top Navigation */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold gradient-text hover:opacity-80 transition-opacity">
            {APP_TITLE}
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/pricing">
              <Button variant="ghost" size="sm">
                Pricing
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">AI-Powered Marketing Automation</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
            <span className="gradient-text">
              Transform Your Marketing
            </span>
            <br />
            <span className="text-foreground">with AI Agents</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-muted-foreground max-w-2xl">
            Launch complete marketing campaigns in minutes. Our multi-AI agent system handles brand analysis, 
            content creation, and campaign optimization automatically.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/create-campaign">
              <Button size="lg" className="glow-hover group">
                Create Campaign
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <Card className="p-6 glass glow-hover border-primary/10 hover:border-primary/30 transition-all">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Complete brand analysis and campaign creation in under 60 seconds. 
              10-20x faster than traditional methods.
            </p>
          </Card>

          {/* Feature 2 */}
          <Card className="p-6 glass glow-hover border-primary/10 hover:border-primary/30 transition-all">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Multi-Platform</h3>
            <p className="text-muted-foreground">
              Generate optimized content for LinkedIn, Google Ads, Email, and social media 
              with platform-specific formatting.
            </p>
          </Card>

          {/* Feature 3 */}
          <Card className="p-6 glass glow-hover border-primary/10 hover:border-primary/30 transition-all">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Optimization</h3>
            <p className="text-muted-foreground">
              AI-powered budget allocation and performance prediction. 
              Get actionable insights and recommendations.
            </p>
          </Card>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4">
            <span className="gradient-text">How It Works</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Three specialized AI agents working together
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Step 1 */}
          <div className="relative">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                1
              </div>
              <h3 className="text-xl font-semibold">Brand Analysis</h3>
              <p className="text-muted-foreground">
                AI strategist analyzes your brand, creates SWOT analysis, and defines positioning
              </p>
            </div>
            {/* Arrow */}
            <div className="hidden md:block absolute top-8 -right-4 text-primary/30">
              <ArrowRight className="w-8 h-8" />
            </div>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                2
              </div>
              <h3 className="text-xl font-semibold">Content Generation</h3>
              <p className="text-muted-foreground">
                Creative engine generates platform-specific content, headlines, and visual assets
              </p>
            </div>
            {/* Arrow */}
            <div className="hidden md:block absolute top-8 -right-4 text-primary/30">
              <ArrowRight className="w-8 h-8" />
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
              3
            </div>
            <h3 className="text-xl font-semibold">Campaign Execution</h3>
            <p className="text-muted-foreground">
              Campaign manager optimizes budget, predicts performance, and provides insights
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <Card className="p-12 glass glow text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to <span className="gradient-text">Automate Your Marketing</span>?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join teams using AI to create better campaigns faster. 
            Start your first campaign in minutes.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="glow-hover">
              Get Started Free
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </Card>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-3">Contact Us</h4>
              <p className="text-sm text-muted-foreground">
                Have questions? Reach out to us at <a href="mailto:contact@example.com" className="text-primary hover:underline">contact@example.com</a>
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Careers</h4>
              <p className="text-sm text-muted-foreground">
                Join our team building the future of AI-powered marketing. Send your resume to <a href="mailto:careers@example.com" className="text-primary hover:underline">careers@example.com</a>
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">About Us</h4>
              <p className="text-sm text-muted-foreground">
                We're revolutionizing marketing automation with multi-AI agent technology, empowering businesses to launch campaigns in minutes.
              </p>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground border-t border-border/50 pt-8">
            <p>© 2025 {APP_TITLE}. Powered by Multi-AI Agent Technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
