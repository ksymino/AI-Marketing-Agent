import { Card } from "@/components/ui/card";
import { APP_TITLE } from "@/const";

export default function About() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold gradient-text mb-4">About Us</h1>
      
      <Card className="p-8 glass mb-8">
        <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          At {APP_TITLE}, we're revolutionizing marketing automation with multi-AI agent technology. 
          Our platform empowers businesses to launch complete marketing campaigns in minutes, not weeks.
        </p>
        <p className="text-muted-foreground leading-relaxed">
          By combining brand analysis, creative content generation, and campaign optimization into a 
          single intelligent system, we help marketers achieve better results with less effort.
        </p>
      </Card>

      <Card className="p-8 glass">
        <h2 className="text-2xl font-semibold mb-4">Our Technology</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          We leverage cutting-edge AI technology with three specialized agents:
        </p>
        <ul className="space-y-3 text-muted-foreground">
          <li className="flex items-start gap-3">
            <span className="text-purple-500 font-bold">•</span>
            <span><strong>Brand Strategist:</strong> Analyzes brand DNA and creates comprehensive market positioning</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-blue-500 font-bold">•</span>
            <span><strong>Creative Engine:</strong> Generates platform-specific content optimized for each channel</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-500 font-bold">•</span>
            <span><strong>Campaign Manager:</strong> Optimizes budget allocation and predicts performance metrics</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
