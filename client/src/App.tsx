import { Switch, Route } from "wouter";
import { useState } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import ThemeToggle from "@/components/ThemeToggle";
import Dashboard from "@/components/Dashboard";
import NotFound from "@/pages/not-found";

function DashboardPage() {
  return <Dashboard isConnected={true} storeName="Demo Store" />;
}

function EventsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Live Events</h1>
      <p className="text-muted-foreground">Real-time event monitoring page</p>
    </div>
  );
}

function CustomersPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Customers</h1>
      <p className="text-muted-foreground">Customer analytics and insights</p>
    </div>
  );
}

function AnalyticsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Analytics</h1>
      <p className="text-muted-foreground">Advanced analytics and reporting</p>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/customers" component={CustomersPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [activeNavItem, setActiveNavItem] = useState("dashboard");

  const style = {
    "--sidebar-width": "20rem",
    "--sidebar-width-icon": "4rem",
  };

  const handleNavItemSelect = (item: string) => {
    setActiveNavItem(item);
    // TODO: Implement proper routing when backend is ready
    console.log(`Navigate to ${item}`);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar 
              activeItem={activeNavItem} 
              onItemSelect={handleNavItemSelect}
            />
            <div className="flex flex-col flex-1">
              <header className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <SidebarTrigger data-testid="button-sidebar-toggle" />
                <ThemeToggle />
              </header>
              <main className="flex-1 overflow-auto">
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
