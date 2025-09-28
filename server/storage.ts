import { type User, type InsertUser, type PixelEvent, type InsertPixelEvent } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Pixel event methods
  createPixelEvent(event: InsertPixelEvent): Promise<PixelEvent>;
  getPixelEvents(options?: {
    limit?: number;
    offset?: number;
    eventName?: string;
    shopDomain?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<PixelEvent[]>;
  getPixelEventById(id: string): Promise<PixelEvent | undefined>;
  getEventMetrics(shopDomain?: string, period?: string): Promise<{
    totalEvents: number;
    uniqueVisitors: number;
    cartUpdates: number;
    conversionRate: number;
    eventCounts: Record<string, number>;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private pixelEvents: Map<string, PixelEvent>;

  constructor() {
    this.users = new Map();
    this.pixelEvents = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Pixel event methods
  async createPixelEvent(insertEvent: InsertPixelEvent): Promise<PixelEvent> {
    const id = randomUUID();
    const event: PixelEvent = {
      ...insertEvent,
      id,
      shopifyEventId: insertEvent.shopifyEventId || null,
      clientId: insertEvent.clientId || null,
      seq: insertEvent.seq || null,
      version: insertEvent.version || null,
      source: insertEvent.source || null,
      shopId: insertEvent.shopId || null,
      createdAt: new Date(),
    };
    this.pixelEvents.set(id, event);
    return event;
  }

  async getPixelEvents(options: {
    limit?: number;
    offset?: number;
    eventName?: string;
    shopDomain?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}): Promise<PixelEvent[]> {
    let events = Array.from(this.pixelEvents.values());

    // Apply filters
    if (options.shopDomain) {
      events = events.filter(event => event.shopDomain === options.shopDomain);
    }
    if (options.eventName) {
      events = events.filter(event => event.name === options.eventName);
    }
    if (options.startDate) {
      events = events.filter(event => new Date(event.timestamp) >= options.startDate!);
    }
    if (options.endDate) {
      events = events.filter(event => new Date(event.timestamp) <= options.endDate!);
    }

    // Sort by timestamp descending (newest first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 100;
    
    return events.slice(offset, offset + limit);
  }

  async getPixelEventById(id: string): Promise<PixelEvent | undefined> {
    return this.pixelEvents.get(id);
  }

  async getEventMetrics(shopDomain?: string, period?: string): Promise<{
    totalEvents: number;
    uniqueVisitors: number;
    cartUpdates: number;
    conversionRate: number;
    eventCounts: Record<string, number>;
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
    periodComparison: {
      totalEvents: { value: number; type: 'increase' | 'decrease' | 'neutral' };
      uniqueVisitors: { value: number; type: 'increase' | 'decrease' | 'neutral' };
      cartUpdates: { value: number; type: 'increase' | 'decrease' | 'neutral' };
      conversionRate: { value: number; type: 'increase' | 'decrease' | 'neutral' };
    };
  }> {
    let events = Array.from(this.pixelEvents.values());

    // Filter by shop domain if provided
    if (shopDomain) {
      events = events.filter(event => event.shopDomain === shopDomain);
    }

    // Filter by time period if provided
    if (period) {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'last_1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'last_24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'last_week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last_month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // Include all events
      }
      
      events = events.filter(event => new Date(event.timestamp) >= startDate);
    }

    // Calculate basic metrics
    const totalEvents = events.length;
    const uniqueVisitors = new Set(events.map(event => event.clientId).filter(Boolean)).size;
    const cartUpdates = events.filter(event => 
      event.name === 'cart_updated' || event.name === 'product_added_to_cart'
    ).length;
    const checkoutEvents = events.filter(event => event.name === 'checkout_started').length;
    const completedCheckouts = events.filter(event => event.name === 'checkout_completed').length;
    const conversionRate = uniqueVisitors > 0 ? (completedCheckouts / uniqueVisitors) * 100 : 0;

    // Count events by type
    const eventCounts: Record<string, number> = {};
    events.forEach(event => {
      eventCounts[event.name] = (eventCounts[event.name] || 0) + 1;
    });

    // Calculate top events
    const topEvents = Object.entries(eventCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate revenue metrics
    const completedCheckoutEvents = events.filter(event => event.name === 'checkout_completed');
    const totalRevenue = completedCheckoutEvents.reduce((sum, event) => {
      const amount = event.data?.checkout?.totalPrice?.amount || event.data?.order?.totalPrice?.amount;
      return sum + (amount ? parseFloat(amount) : 0);
    }, 0);
    const averageOrderValue = completedCheckouts.length > 0 ? totalRevenue / completedCheckouts.length : 0;

    // Calculate session metrics
    const clientSessions = new Map<string, { events: number; pages: Set<string> }>();
    events.forEach(event => {
      if (event.clientId) {
        if (!clientSessions.has(event.clientId)) {
          clientSessions.set(event.clientId, { events: 0, pages: new Set() });
        }
        const session = clientSessions.get(event.clientId)!;
        session.events++;
        if (event.context?.document?.location?.pathname) {
          session.pages.add(event.context.document.location.pathname);
        }
      }
    });

    const totalSessions = clientSessions.size;
    const avgSessionEvents = totalSessions > 0 ? totalEvents / totalSessions : 0;
    const singlePageSessions = Array.from(clientSessions.values()).filter(s => s.pages.size <= 1).length;
    const bounceRate = totalSessions > 0 ? (singlePageSessions / totalSessions) * 100 : 0;

    // Calculate period comparison (compare with previous period)
    const getPreviousPeriodEvents = () => {
      const allEvents = Array.from(this.pixelEvents.values());
      
      if (!period || period === 'all') return [];
      
      const now = new Date();
      let currentStart: Date, previousStart: Date, previousEnd: Date;
      
      switch (period) {
        case 'last_1h':
          currentStart = new Date(now.getTime() - 60 * 60 * 1000);
          previousStart = new Date(now.getTime() - 2 * 60 * 60 * 1000);
          previousEnd = currentStart;
          break;
        case 'last_24h':
          currentStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          previousStart = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
          previousEnd = currentStart;
          break;
        case 'last_week':
          currentStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          previousStart = new Date(now.getTime() - 2 * 7 * 24 * 60 * 60 * 1000);
          previousEnd = currentStart;
          break;
        case 'last_month':
          currentStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          previousStart = new Date(now.getTime() - 2 * 30 * 24 * 60 * 60 * 1000);
          previousEnd = currentStart;
          break;
        default:
          return [];
      }
      
      let filteredEvents = allEvents.filter(event => {
        const timestamp = new Date(event.timestamp);
        return timestamp >= previousStart && timestamp <= previousEnd;
      });
      
      if (shopDomain) {
        filteredEvents = filteredEvents.filter(event => event.shopDomain === shopDomain);
      }
      
      return filteredEvents;
    };

    const previousEvents = getPreviousPeriodEvents();
    const previousUniqueVisitors = new Set(previousEvents.map(e => e.clientId).filter(Boolean)).size;
    const previousCartUpdates = previousEvents.filter(e => 
      e.name === 'cart_updated' || e.name === 'product_added_to_cart'
    ).length;
    const previousCompletedCheckouts = previousEvents.filter(e => e.name === 'checkout_completed').length;
    const previousConversionRate = previousUniqueVisitors > 0 ? (previousCompletedCheckouts / previousUniqueVisitors) * 100 : 0;

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return { value: 0, type: 'neutral' as const };
      const change = ((current - previous) / previous) * 100;
      return {
        value: Math.round(Math.abs(change) * 100) / 100,
        type: change > 0 ? 'increase' as const : change < 0 ? 'decrease' as const : 'neutral' as const
      };
    };

    return {
      totalEvents,
      uniqueVisitors,
      cartUpdates,
      conversionRate: Math.round(conversionRate * 100) / 100,
      eventCounts,
      topEvents,
      revenueMetrics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
        ordersCount: completedCheckouts
      },
      sessionMetrics: {
        avgSessionEvents: Math.round(avgSessionEvents * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
        activeUsers: uniqueVisitors
      },
      periodComparison: {
        totalEvents: calculateChange(totalEvents, previousEvents.length),
        uniqueVisitors: calculateChange(uniqueVisitors, previousUniqueVisitors),
        cartUpdates: calculateChange(cartUpdates, previousCartUpdates),
        conversionRate: calculateChange(conversionRate, previousConversionRate)
      }
    };
  }
}

export const storage = new MemStorage();
