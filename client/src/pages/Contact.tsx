import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Contact() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-4xl font-bold gradient-text mb-4">Contact Us</h1>
      <p className="text-muted-foreground mb-8">
        Have questions? We'd love to hear from you.
      </p>

      <Card className="p-8 glass">
        <form className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" className="mt-2" />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" className="mt-2" />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" className="mt-2" />
          </div>

          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" className="mt-2 min-h-[150px]" />
          </div>

          <Button className="w-full">Send Message</Button>
        </form>
      </Card>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Or email us directly at <a href="mailto:contact@example.com" className="text-primary hover:underline">contact@example.com</a></p>
      </div>
    </div>
  );
}
