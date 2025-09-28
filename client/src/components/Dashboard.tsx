import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download, Settings } from "lucide-react";
import MetricsCard from "./MetricsCard";
import EventStream from "./EventStream";

interface DashboardProps {
  isConnected?: boolean;
  storeName?: string;
}

export default function Dashboard({ 
  isConnected = true, 
  storeName = "Demo Store" 
}: DashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // TODO: remove mock functionality
  const mockEvents = [
    {
      id: "evt_001",
      name: "page_viewed",
      timestamp: new Date(Date.now() - 30000).toISOString(),
      customerId: "cust_123",
      url: "https://demo-store.myshopify.com/",
      data: {
        page: { title: "Home Page", url: "/" },
        customer: { id: "cust_123", email: "john@example.com" }
      }
    },
    {
      id: "evt_002", 
      name: "product_viewed",
      timestamp: new Date(Date.now() - 45000).toISOString(),
      customerId: "cust_456",
      url: "https://demo-store.myshopify.com/products/widget",
      data: {
        product: { id: "prod_123", title: "Super Widget", price: 29.99 },
        customer: { id: "cust_456", email: "jane@example.com" }
      }
    },
    {
      id: "evt_003",
      name: "cart_updated", 
      timestamp: new Date(Date.now() - 60000).toISOString(),
      customerId: "cust_789",
      url: "https://demo-store.myshopify.com/cart",
      data: {
        cart: { 
          total_price: 59.98,
          item_count: 2,
          items: [
            { product_id: "prod_123", quantity: 2, price: 29.99 }
          ]
        },
        customer: { id: "cust_789", email: "bob@example.com" }
      }
    },
    {
      id: "evt_004",
      name: "checkout_started",
      timestamp: new Date(Date.now() - 90000).toISOString(), 
      customerId: "cust_101",
      url: "https://demo-store.myshopify.com/checkout",
      data: {
        checkout: { total_price: 149.99, currency: "USD" },
        customer: { id: "cust_101", email: "alice@example.com" }
      }
    }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    console.log('Refreshing dashboard data...');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleExport = () => {
    console.log('Exporting data...');
  };

  const handleSettings = () => {
    console.log('Opening settings...');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground" data-testid="text-dashboard-title">
            Pixel Analytics Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time event tracking for {storeName}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge 
            variant={isConnected ? "default" : "destructive"}
            data-testid="badge-connection-status"
          >
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            data-testid="button-export"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSettings}
            data-testid="button-settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricsCard
          title="Total Events"
          value="12,543"
          change={{ value: 12.5, type: 'increase', period: 'last 24h' }}
          description="Events captured today"
        />
        
        <MetricsCard
          title="Unique Visitors"
          value="2,847"
          change={{ value: 8.2, type: 'increase', period: 'yesterday' }}
          description="Active shoppers"
          variant="success"
        />
        
        <MetricsCard
          title="Cart Updates"
          value="456"
          change={{ value: 3.1, type: 'decrease', period: 'last week' }}
          description="Items added to cart"
          variant="warning"
        />
        
        <MetricsCard
          title="Conversion Rate"
          value="3.42%"
          change={{ value: 0.5, type: 'neutral', period: 'last month' }}
          description="Purchase completion"
        />
      </div>

      {/* Event Stream Section */}
      <Card className="p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2" data-testid="text-events-title">
            Live Event Stream
          </h2>
          <p className="text-sm text-muted-foreground">
            Real-time tracking of customer interactions on your store
          </p>
        </div>
        
        <EventStream 
          events={mockEvents}
          isLive={isConnected}
          onToggleLive={() => console.log('Toggle live stream')}
        />
      </Card>
    </div>
  );
}