import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertPixelEventSchema, pixelWrapperSchema } from "@shared/schema";
import { z } from "zod";

// Enhanced WebSocket client store with liveness tracking
interface WebSocketClient {
  ws: WebSocket;
  isAlive: boolean;
}

const wsClients = new Set<WebSocketClient>();

// Function to broadcast events to all connected WebSocket clients
function broadcastEvent(eventType: string, data: any) {
  const message = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
  
  wsClients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(message);
      } catch (error) {
        console.error('Error broadcasting to WebSocket client:', error);
        wsClients.delete(client);
      }
    } else {
      wsClients.delete(client);
    }
  });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // CORS middleware for all API routes (needed for cross-origin requests from Shopify)
  app.use('/api/*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-shop-domain');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Handle pixel event submission from Shopify
  app.post("/api/events", async (req, res) => {
    try {
      // Validate the incoming wrapper payload from our pixel code
      const wrapperData = pixelWrapperSchema.parse(req.body);
      
      // Extract the actual Shopify event data from the wrapper
      const eventData = wrapperData.eventData;
      
      // Transform to our storage format
      const insertData = {
        shopifyEventId: eventData.id,
        clientId: eventData.clientId || null,
        name: eventData.name,
        timestamp: eventData.timestamp,
        seq: eventData.seq || null,
        type: eventData.type,
        version: eventData.version || null,
        source: eventData.source || null,
        shopId: eventData.shopId || null,
        context: eventData.context,
        data: eventData.data,
        shopDomain: wrapperData.shopDomain
      };

      // Store the event
      const savedEvent = await storage.createPixelEvent(insertData);
      
      // Broadcast the new event to all connected WebSocket clients
      broadcastEvent('pixel_event', savedEvent);
      
      res.status(201).json({ 
        success: true, 
        eventId: savedEvent.id,
        message: 'Event received successfully' 
      });
    } catch (error) {
      console.error('Error processing pixel event:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid event data',
          details: error.errors 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: 'Internal server error' 
        });
      }
    }
  });

  // Validation schema for GET /api/events query parameters
  const eventsQuerySchema = z.object({
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 50)
      .refine(val => val >= 1 && val <= 1000, { message: "Limit must be between 1 and 1000" }),
    offset: z.string().optional().transform(val => val ? parseInt(val, 10) : 0)
      .refine(val => val >= 0, { message: "Offset must be >= 0" }),
    eventName: z.string().optional(),
    shopDomain: z.string().optional()
  });

  // Get pixel events for dashboard (with pagination and filtering)
  app.get("/api/events", async (req, res) => {
    try {
      const queryValidation = eventsQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid query parameters',
          details: queryValidation.error.errors 
        });
      }

      const { limit, offset, eventName, shopDomain } = queryValidation.data;
      
      const events = await storage.getPixelEvents({
        limit,
        offset,
        eventName,
        shopDomain
      });
      
      res.json({
        success: true,
        events,
        pagination: {
          limit,
          offset,
          hasMore: events.length === limit
        }
      });
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch events' 
      });
    }
  });

  // Validation schema for GET /api/metrics query parameters
  const metricsQuerySchema = z.object({
    timeframe: z.enum(['1h', '24h', '7d', '30d']).default('24h'),
    shopDomain: z.string().optional()
  });

  // Get aggregated metrics for dashboard
  app.get("/api/metrics", async (req, res) => {
    try {
      const queryValidation = metricsQuerySchema.safeParse(req.query);
      if (!queryValidation.success) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid query parameters',
          details: queryValidation.error.errors 
        });
      }

      const { timeframe, shopDomain } = queryValidation.data;
      
      // Map timeframe to storage period format
      let period: string;
      switch (timeframe) {
        case '1h':
          period = 'last_1h';
          break;
        case '24h':
          period = 'last_24h';
          break;
        case '7d':
          period = 'last_week';
          break;
        case '30d':
          period = 'last_month';
          break;
        default:
          period = 'last_24h';
      }

      const metrics = await storage.getEventMetrics(shopDomain, period);
      
      res.json({
        success: true,
        metrics,
        timeframe,
        generated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch metrics' 
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      success: true, 
      message: 'Shopify Analytics API is running',
      timestamp: new Date().toISOString()
    });
  });

  const httpServer = createServer(app);

  // Set up WebSocket server for real-time event streaming
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });

  wss.on('connection', (ws, req) => {
    console.log('New WebSocket connection established');
    
    const client: WebSocketClient = { ws, isAlive: true };
    wsClients.add(client);

    // Send initial connection confirmation
    ws.send(JSON.stringify({ 
      type: 'connection_established', 
      data: { message: 'Connected to Shopify Analytics stream' },
      timestamp: new Date().toISOString()
    }));

    // Handle pong responses to maintain connection liveness
    ws.on('pong', () => {
      client.isAlive = true;
    });

    // Handle WebSocket messages from clients
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle subscription to specific shop domains or event types
        if (data.type === 'subscribe') {
          // Store subscription preferences if needed
          console.log('Client subscribed to:', data.filters);
          ws.send(JSON.stringify({
            type: 'subscription_confirmed',
            data: { filters: data.filters },
            timestamp: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    // Handle client disconnection
    ws.on('close', () => {
      console.log('WebSocket connection closed');
      wsClients.delete(client);
    });

    // Handle connection errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      wsClients.delete(client);
    });
  });

  // Periodic heartbeat to keep connections alive and clean up dead ones
  const heartbeatInterval = setInterval(() => {
    wsClients.forEach((client) => {
      if (!client.isAlive) {
        // Client didn't respond to last ping, terminate connection
        console.log('Terminating dead WebSocket connection');
        client.ws.terminate();
        wsClients.delete(client);
        return;
      }
      
      if (client.ws.readyState === WebSocket.OPEN) {
        // Mark as not alive and send ping
        client.isAlive = false;
        try {
          client.ws.ping();
        } catch (error) {
          console.error('Error pinging WebSocket client:', error);
          wsClients.delete(client);
        }
      } else {
        // Connection is already closed
        wsClients.delete(client);
      }
    });
  }, 30000); // Every 30 seconds

  // Reset endpoint for demo/testing - clears all events and metrics
  app.post("/api/reset", async (req, res) => {
    try {
      await storage.clearAllEvents();
      
      // Broadcast reset event to all connected clients
      broadcastEvent('reset', { message: 'All data cleared' });
      
      res.json({
        success: true,
        message: 'All events and metrics have been reset',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error resetting data:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to reset data' 
      });
    }
  });

  // Clean up interval on server shutdown
  process.on('SIGINT', () => {
    clearInterval(heartbeatInterval);
    wsClients.forEach((client) => {
      client.ws.terminate();
    });
    wsClients.clear();
  });

  console.log('WebSocket server initialized on /ws');

  return httpServer;
}
