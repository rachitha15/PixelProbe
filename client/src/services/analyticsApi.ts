import { PixelEvent } from '@shared/schema';

const API_BASE_URL = '';

interface EventsResponse {
  success: boolean;
  events: PixelEvent[];
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

interface MetricsResponse {
  success: boolean;
  metrics: {
    totalEvents: number;
    uniqueVisitors: number;
    conversionRate: number;
    topEvents: { name: string; count: number }[];
    eventsByHour: { hour: string; count: number }[];
  };
}

interface HealthResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

class AnalyticsApi {
  async getEvents(params: {
    limit?: number;
    offset?: number;
    eventName?: string;
    shopDomain?: string;
  } = {}): Promise<EventsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.offset) searchParams.set('offset', params.offset.toString());
    if (params.eventName) searchParams.set('eventName', params.eventName);
    if (params.shopDomain) searchParams.set('shopDomain', params.shopDomain);

    const response = await fetch(`${API_BASE_URL}/api/events?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getMetrics(params: {
    shopDomain?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<MetricsResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.shopDomain) searchParams.set('shopDomain', params.shopDomain);
    if (params.startDate) searchParams.set('startDate', params.startDate.toISOString());
    if (params.endDate) searchParams.set('endDate', params.endDate.toISOString());

    const response = await fetch(`${API_BASE_URL}/api/metrics?${searchParams}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getHealth(): Promise<HealthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
}

export const analyticsApi = new AnalyticsApi();