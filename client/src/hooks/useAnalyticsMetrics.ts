import { useQuery } from '@tanstack/react-query';
import { PixelEvent } from '@shared/schema';
import { analyticsApi } from '../services/analyticsApi';

interface MetricsData {
  totalEvents: number;
  uniqueVisitors: number;
  cartUpdates: number;
  conversionRate: number;
  topEvents: { name: string; count: number }[];
  revenueMetrics: {
    totalRevenue: number;
    averageOrderValue: number;
    ordersCount: number;
  };
  sessionMetrics: {
    avgSessionEvents: number;
    bounceRate: number;
    activeUsers: number;
  };
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
  period?: string; // Time period for metrics calculation
}

export function useAnalyticsMetrics(options: UseAnalyticsMetricsOptions = {}) {
  const { shopDomain, events = [], refreshInterval = 60000, period = 'last_24h' } = options;

  // Map period to API timeframe format
  const getTimeframe = (period: string): string => {
    switch (period) {
      case 'last_1h':
        return '1h';
      case 'last_24h':
        return '24h';
      case 'last_week':
        return '7d';
      case 'last_month':
        return '30d';
      default:
        return '24h';
    }
  };

  const timeframe = getTimeframe(period);

  // Fetch metrics from API
  const { 
    data: apiMetrics, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['metrics', { shopDomain, timeframe }],
    queryFn: () => analyticsApi.getMetrics({ shopDomain, timeframe }),
    refetchInterval: refreshInterval,
  });

  // Calculate enhanced metrics from live events (as supplement to API metrics)
  const calculateLiveMetrics = (events: PixelEvent[]): Partial<MetricsData> => {
    if (events.length === 0) return {};

    const now = new Date();
    let startTime: Date;
    
    // Determine time range based on period
    switch (period) {
      case 'last_1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case 'last_week':
        startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'last_month':
        startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }
    
    // Filter events from specified period
    const recentEvents = events.filter(event => 
      new Date(event.timestamp) >= startTime
    );

    // Count unique visitors (based on clientId)
    const uniqueClientIds = new Set(
      recentEvents
        .map(event => event.clientId)
        .filter(id => id)
    );

    // Count cart-related events
    const cartEvents = recentEvents.filter(event => 
      event.name === 'cart_updated' || event.name === 'product_added_to_cart'
    );

    // Count completed checkouts
    const completedCheckouts = recentEvents.filter(event => 
      event.name === 'checkout_completed'
    );

    // Calculate conversion rate (completed checkouts / unique visitors)
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

    // Calculate revenue metrics
    const totalRevenue = completedCheckouts.reduce((sum, event) => {
      const eventData = event.data as any;
      const amount = eventData?.checkout?.totalPrice?.amount || eventData?.order?.totalPrice?.amount;
      return sum + (amount ? parseFloat(amount) : 0);
    }, 0);
    const averageOrderValue = completedCheckouts.length > 0 ? totalRevenue / completedCheckouts.length : 0;

    // Calculate session metrics
    const clientSessions = new Map<string, { events: number; pages: Set<string> }>();
    recentEvents.forEach(event => {
      if (event.clientId) {
        if (!clientSessions.has(event.clientId)) {
          clientSessions.set(event.clientId, { events: 0, pages: new Set() });
        }
        const session = clientSessions.get(event.clientId)!;
        session.events++;
        const eventContext = event.context as any;
        if (eventContext?.document?.location?.pathname) {
          session.pages.add(eventContext.document.location.pathname);
        }
      }
    });

    const totalSessions = clientSessions.size;
    const avgSessionEvents = totalSessions > 0 ? recentEvents.length / totalSessions : 0;
    const singlePageSessions = Array.from(clientSessions.values()).filter(s => s.pages.size <= 1).length;
    const bounceRate = totalSessions > 0 ? (singlePageSessions / totalSessions) * 100 : 0;

    return {
      totalEvents: recentEvents.length,
      uniqueVisitors: uniqueClientIds.size,
      cartUpdates: cartEvents.length,
      conversionRate: Number(conversionRate.toFixed(2)),
      topEvents,
      revenueMetrics: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        ordersCount: completedCheckouts.length
      },
      sessionMetrics: {
        avgSessionEvents: Number(avgSessionEvents.toFixed(2)),
        bounceRate: Number(bounceRate.toFixed(2)),
        activeUsers: uniqueClientIds.size
      }
    };
  };

  const liveMetrics = calculateLiveMetrics(events);

  // Combine API metrics with live metrics (live takes precedence for recent data)
  const combinedMetrics: MetricsData = {
    totalEvents: liveMetrics.totalEvents ?? apiMetrics?.metrics?.totalEvents ?? 0,
    uniqueVisitors: liveMetrics.uniqueVisitors ?? apiMetrics?.metrics?.uniqueVisitors ?? 0,
    cartUpdates: liveMetrics.cartUpdates ?? apiMetrics?.metrics?.cartUpdates ?? 0,
    conversionRate: liveMetrics.conversionRate ?? apiMetrics?.metrics?.conversionRate ?? 0,
    topEvents: liveMetrics.topEvents ?? apiMetrics?.metrics?.topEvents ?? [],
    revenueMetrics: liveMetrics.revenueMetrics ?? apiMetrics?.metrics?.revenueMetrics ?? {
      totalRevenue: 0,
      averageOrderValue: 0,
      ordersCount: 0
    },
    sessionMetrics: liveMetrics.sessionMetrics ?? apiMetrics?.metrics?.sessionMetrics ?? {
      avgSessionEvents: 0,
      bounceRate: 0,
      activeUsers: 0
    },
    // Use real period comparison from API or default values
    recentChange: apiMetrics?.metrics?.periodComparison ?? {
      totalEvents: { value: 0, type: 'neutral' },
      uniqueVisitors: { value: 0, type: 'neutral' },
      cartUpdates: { value: 0, type: 'neutral' },
      conversionRate: { value: 0, type: 'neutral' }
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