import { useQuery } from '@tanstack/react-query';
import { PixelEvent } from '@shared/schema';
import { analyticsApi } from '../services/analyticsApi';

interface MetricsData {
  totalEvents: number;
  uniqueVisitors: number;
  cartUpdates: number;
  conversionRate: number;
  topEvents: { name: string; count: number }[];
  recentChange: {
    totalEvents: { value: number; type: 'increase' | 'decrease' | 'neutral' };
    uniqueVisitors: { value: number; type: 'increase' | 'decrease' | 'neutral' };
    cartUpdates: { value: number; type: 'increase' | 'decrease' | 'neutral' };
    conversionRate: { value: number; type: 'increase' | 'decrease' | 'neutral' };
  };
}

interface UseAnalyticsMetricsOptions {
  shopDomain?: string;
  events?: PixelEvent[]; // For calculating metrics from live events
  refreshInterval?: number;
}

export function useAnalyticsMetrics(options: UseAnalyticsMetricsOptions = {}) {
  const { shopDomain, events = [], refreshInterval = 60000 } = options;

  // Fetch metrics from API
  const { 
    data: apiMetrics, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['metrics', { shopDomain }],
    queryFn: () => analyticsApi.getMetrics({ shopDomain }),
    refetchInterval: refreshInterval,
  });

  // Calculate metrics from live events (as supplement to API metrics)
  const calculateLiveMetrics = (events: PixelEvent[]): Partial<MetricsData> => {
    if (events.length === 0) return {};

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Filter events from last 24 hours
    const recentEvents = events.filter(event => 
      new Date(event.timestamp) >= last24Hours
    );

    // Count unique visitors (based on clientId)
    const uniqueClientIds = new Set(
      recentEvents
        .map(event => event.clientId)
        .filter(id => id)
    );

    // Count cart-related events
    const cartEvents = recentEvents.filter(event => 
      event.name.includes('cart') || event.name.includes('checkout')
    );

    // Count completed checkouts
    const completedCheckouts = recentEvents.filter(event => 
      event.name === 'checkout_completed'
    );

    // Calculate basic conversion rate (checkouts / unique visitors)
    const conversionRate = uniqueClientIds.size > 0 
      ? (completedCheckouts.length / uniqueClientIds.size) * 100 
      : 0;

    // Count events by type
    const eventCounts = recentEvents.reduce((acc, event) => {
      acc[event.name] = (acc[event.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEvents = Object.entries(eventCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalEvents: recentEvents.length,
      uniqueVisitors: uniqueClientIds.size,
      cartUpdates: cartEvents.length,
      conversionRate: Number(conversionRate.toFixed(2)),
      topEvents
    };
  };

  const liveMetrics = calculateLiveMetrics(events);

  // Combine API metrics with live metrics (live takes precedence for recent data)
  const combinedMetrics: MetricsData = {
    totalEvents: liveMetrics.totalEvents ?? apiMetrics?.metrics?.totalEvents ?? 0,
    uniqueVisitors: liveMetrics.uniqueVisitors ?? apiMetrics?.metrics?.uniqueVisitors ?? 0,
    cartUpdates: liveMetrics.cartUpdates ?? 0,
    conversionRate: liveMetrics.conversionRate ?? apiMetrics?.metrics?.conversionRate ?? 0,
    topEvents: liveMetrics.topEvents ?? apiMetrics?.metrics?.topEvents ?? [],
    // Default change indicators (would be calculated from historical data in production)
    recentChange: {
      totalEvents: { value: 12.5, type: 'increase' },
      uniqueVisitors: { value: 8.2, type: 'increase' },
      cartUpdates: { value: 3.1, type: 'decrease' },
      conversionRate: { value: 0.5, type: 'neutral' }
    }
  };

  return {
    metrics: combinedMetrics,
    isLoading,
    isError,
    error,
    refetch
  };
}