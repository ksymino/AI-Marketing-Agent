import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";

export default function SignUp() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <Card className="p-8 glass">
        <h1 className="text-3xl font-bold gradient-text mb-2 text-center">Create Account</h1>
        <p className="text-muted-foreground text-center mb-8">Start your free trial today</p>

        <form className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" className="mt-2" />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" className="mt-2" />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" className="mt-2" />
          </div>

          <Button className="w-full">Sign Up</Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{" "}
          <Link href="/dashboard" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
