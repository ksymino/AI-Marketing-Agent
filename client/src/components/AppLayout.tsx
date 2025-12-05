import { Link, useLocation } from "wouter";
import { Brain, Sparkles, BarChart3, LayoutDashboard, Menu, X, Users, TrendingUp } from "lucide-react";
import { Button } from "./ui/button";
import { APP_TITLE } from "@/const";
import { useState } from "react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}
  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { path: "/campaigns", label: "Campaigns", icon: <TrendingUp className="w-5 h-5" /> },
    { path: "/kol-campaign", label: "Influencer Marketing", icon: <Users className="w-5 h-5" /> },
  ];
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link href="/" className="text-xl font-bold gradient-text hover:opacity-80 transition-opacity">
              {APP_TITLE}
            </Link>
          </div>

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

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] w-64 
            border-r border-border bg-card/30 backdrop-blur-sm
            transition-transform duration-300 z-40
            ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location === item.path || location.startsWith(item.path + "/");
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${
                      isActive
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                    }
                  `}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

          <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2025 {APP_TITLE}. Powered by Multi-AI Agent Technology.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
