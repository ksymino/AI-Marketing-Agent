import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import BrandAnalysis from "./pages/BrandAnalysis";
import CreativeContent from "./pages/CreativeContent";
import KOLCampaign from "./pages/KOLCampaign";
import Campaigns from "./pages/Campaigns";
import CampaignDetail from "./pages/CampaignDetail";
import CreateCampaign from "./pages/CreateCampaign";
import About from "./pages/About";
import Team from "./pages/Team";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import SignUp from "./pages/SignUp";

function Router() {
  return (
    <Switch>
      {/* Landing page without layout */}
      <Route path="/" component={Home} />
      
      {/* App pages with sidebar layout */}
      <Route path="/dashboard">
        <AppLayout><Dashboard /></AppLayout>
      </Route>
      <Route path="/brand-analysis">
        <AppLayout><BrandAnalysis /></AppLayout>
      </Route>
      <Route path="/creative-content">
        <AppLayout><CreativeContent /></AppLayout>
      </Route>
      <Route path="/kol-campaign">
        <AppLayout><KOLCampaign /></AppLayout>
      </Route>
      <Route path="/campaigns" component={() => <AppLayout><Campaigns /></AppLayout>} />
      <Route path="/campaign/:id">
        <AppLayout><CampaignDetail /></AppLayout>
      </Route>
      <Route path="/create-campaign">
        <AppLayout><CreateCampaign /></AppLayout>
      </Route>
      
      {/* Public pages with layout */}
      <Route path="/about">
        <AppLayout><About /></AppLayout>
      </Route>
      <Route path="/team">
        <AppLayout><Team /></AppLayout>
      </Route>
      <Route path="/contact">
        <AppLayout><Contact /></AppLayout>
      </Route>
      <Route path="/pricing">
        <AppLayout><Pricing /></AppLayout>
      </Route>
      <Route path="/signup">
        <AppLayout><SignUp /></AppLayout>
      </Route>
      
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
