import { Card } from "@/components/ui/card";

export default function Team() {
  const team = [
    { name: "Sarah Chen", role: "CEO & Co-Founder", bio: "Former VP of Marketing at Fortune 500 tech company" },
    { name: "Michael Rodriguez", role: "CTO & Co-Founder", bio: "AI researcher with 10+ years in machine learning" },
    { name: "Emily Watson", role: "Head of Product", bio: "Product leader from leading SaaS companies" },
    { name: "David Kim", role: "Head of AI", bio: "PhD in Natural Language Processing from Stanford" },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-4xl font-bold gradient-text mb-4">Our Team</h1>
      <p className="text-muted-foreground mb-8">
        Meet the team building the future of AI-powered marketing
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {team.map((member, index) => (
          <Card key={index} className="p-6 glass">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4" />
            <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
            <p className="text-sm text-primary mb-2">{member.role}</p>
            <p className="text-sm text-muted-foreground">{member.bio}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
