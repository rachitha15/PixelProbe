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

    // Calculate metrics
    const totalEvents = events.length;
    const uniqueVisitors = new Set(events.map(event => event.clientId).filter(Boolean)).size;
    const cartUpdates = events.filter(event => event.name === 'cart_updated').length;
    const checkoutEvents = events.filter(event => event.name === 'checkout_started').length;
    const conversionRate = uniqueVisitors > 0 ? (checkoutEvents / uniqueVisitors) * 100 : 0;

    // Count events by type
    const eventCounts: Record<string, number> = {};
    events.forEach(event => {
      eventCounts[event.name] = (eventCounts[event.name] || 0) + 1;
    });

    return {
      totalEvents,
      uniqueVisitors,
      cartUpdates,
      conversionRate: Math.round(conversionRate * 100) / 100, // Round to 2 decimal places
      eventCounts,
    };
  }
}

export const storage = new MemStorage();
