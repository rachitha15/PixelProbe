import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MetricsCard from "./MetricsCard";
import EventStream from "./EventStream";
import { useRealTimeEvents } from "../hooks/useRealTimeEvents";
import { useAnalyticsMetrics } from "../hooks/useAnalyticsMetrics";

interface DashboardProps {
  isConnected?: boolean;
  storeName?: string;
}

export default function Dashboard({ 
  isConnected: propIsConnected, 
  storeName = "Demo Store" 
}: DashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Real-time events and metrics
  const {
    events,
    isLoading: eventsLoading,
    isError: eventsError,
    error: eventsErrorMsg,
    isConnected: wsConnected,
    isLiveStreamEnabled,
    toggleLiveStream,
    refreshEvents
  } = useRealTimeEvents({ initialLimit: 50 });

  const {
    metrics,
    isLoading: metricsLoading,
    isError: metricsError,
    error: metricsErrorMsg,
    refetch: refetchMetrics
  } = useAnalyticsMetrics({ events });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refreshEvents(),
        refetchMetrics()
      ]);
      toast({
        title: "Dashboard refreshed",
        description: "Data has been updated successfully",
      });
    } catch (error) {
      toast({
        title: "Refresh failed",
        description: "Failed to refresh dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = () => {
    try {
      const exportData = {
        events: events.slice(0, 100), // Export last 100 events
        metrics,
        timestamp: new Date().toISOString(),
        storeName
      };
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-export-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export completed",
        description: "Analytics data has been downloaded",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export analytics data",
        variant: "destructive",
      });
    }
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
            variant={wsConnected ? "default" : "destructive"}
            data-testid="badge-connection-status"
          >
            {wsConnected ? "Connected" : "Disconnected"}
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
          value={metricsLoading ? "..." : metrics.totalEvents.toLocaleString()}
          change={{ 
            value: metrics.recentChange.totalEvents.value, 
            type: metrics.recentChange.totalEvents.type, 
            period: 'last 24h' 
          }}
          description="Events captured today"
        />
        
        <MetricsCard
          title="Unique Visitors"
          value={metricsLoading ? "..." : metrics.uniqueVisitors.toLocaleString()}
          change={{ 
            value: metrics.recentChange.uniqueVisitors.value, 
            type: metrics.recentChange.uniqueVisitors.type, 
            period: 'yesterday' 
          }}
          description="Active shoppers"
          variant="success"
        />
        
        <MetricsCard
          title="Cart Updates"
          value={metricsLoading ? "..." : metrics.cartUpdates.toLocaleString()}
          change={{ 
            value: metrics.recentChange.cartUpdates.value, 
            type: metrics.recentChange.cartUpdates.type, 
            period: 'last week' 
          }}
          description="Items added to cart"
          variant="warning"
        />
        
        <MetricsCard
          title="Conversion Rate"
          value={metricsLoading ? "..." : `${metrics.conversionRate}%`}
          change={{ 
            value: metrics.recentChange.conversionRate.value, 
            type: metrics.recentChange.conversionRate.type, 
            period: 'last month' 
          }}
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
          events={events.map(event => ({
            id: event.id,
            name: event.name,
            timestamp: event.timestamp,
            clientId: event.clientId,
            shopDomain: event.shopDomain,
            context: event.context,
            data: event.data as Record<string, any>
          }))}
          isLive={isLiveStreamEnabled}
          onToggleLive={toggleLiveStream}
        />
      </Card>
    </div>
  );
}