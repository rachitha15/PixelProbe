import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

// Shopify pixel events table matching the actual analytics.subscribe payload
export const pixelEvents = pgTable("pixel_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shopifyEventId: text("shopify_event_id"),
  clientId: text("client_id"),
  name: text("name").notNull(), // event name like 'product_viewed', 'checkout_started'
  timestamp: text("timestamp").notNull(), // ISO 8601 string from Shopify
  seq: integer("seq"),
  type: text("type").notNull(), // 'standard' or 'custom'
  version: text("version"), // Shopify API version
  source: text("source"), // Event source
  shopId: text("shop_id"), // Shopify shop ID
  context: jsonb("context").notNull(), // Shopify context object
  data: jsonb("data").notNull(), // Event-specific data from Shopify
  shopDomain: text("shop_domain").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPixelEventSchema = createInsertSchema(pixelEvents).pick({
  shopifyEventId: true,
  clientId: true,
  name: true,
  timestamp: true,
  seq: true,
  type: true,
  version: true,
  source: true,
  shopId: true,
  context: true,
  data: true,
  shopDomain: true,
});

// Shopify's actual event context structure - flexible to handle all real payloads
export const shopifyContextSchema = z.object({
  document: z.object({
    title: z.string(),
    referrer: z.string().optional(),
    location: z.object({
      href: z.string(),
      host: z.string().optional(),
      hostname: z.string().optional(),
      origin: z.string().optional(),
      pathname: z.string(),
      search: z.string().optional(),
      hash: z.string().optional(),
    }).passthrough(), // Allow additional location fields
  }).passthrough(), // Allow additional document fields
  window: z.object({
    location: z.object({
      href: z.string(),
      host: z.string().optional(),
      hostname: z.string().optional(),
      origin: z.string().optional(),
      pathname: z.string(),
      search: z.string().optional(),
      hash: z.string().optional(),
    }).passthrough(), // Allow additional location fields
  }).passthrough().optional(), // Allow additional window fields
  navigator: z.object({
    userAgent: z.string(),
  }).passthrough().optional(), // Allow additional navigator fields
}).passthrough(); // Allow additional context fields

// Shopify's actual product viewed event data
export const productViewedDataSchema = z.object({
  productVariant: z.object({
    id: z.string(),
    title: z.string(),
    price: z.object({
      amount: z.string(),
      currencyCode: z.string(),
    }),
    product: z.object({
      id: z.string(),
      title: z.string(),
      type: z.string(),
      vendor: z.string(),
    }),
  }),
});

// Shopify's actual checkout event data
export const checkoutDataSchema = z.object({
  checkout: z.object({
    id: z.string(),
    token: z.string(),
    currencyCode: z.string(),
    totalPrice: z.object({
      amount: z.string(),
      currencyCode: z.string(),
    }),
    lineItems: z.array(z.object({
      id: z.string(),
      quantity: z.number(),
      title: z.string(),
      variant: z.object({
        id: z.string(),
        title: z.string(),
        price: z.object({
          amount: z.string(),
          currencyCode: z.string(),
        }),
        product: z.object({
          id: z.string(),
          title: z.string(),
          vendor: z.string(),
          type: z.string(),
        }),
      }),
    })),
    order: z.object({
      id: z.string(),
    }).optional(),
  }),
});

// Base Shopify event schema - flexible to handle real payloads
export const shopifyEventSchema = z.object({
  id: z.string(),
  clientId: z.string().optional(), // May be omitted when unavailable
  name: z.string(),
  timestamp: z.string(),
  seq: z.number().optional(),
  type: z.enum(["standard", "custom"]),
  version: z.string().optional(),
  source: z.string().optional(),
  shopId: z.string().optional(),
  context: shopifyContextSchema,
  data: z.record(z.any()), // Event-specific data varies by event type
}).passthrough(); // Allow additional fields Shopify might send

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPixelEvent = z.infer<typeof insertPixelEventSchema>;
export type PixelEvent = typeof pixelEvents.$inferSelect;
export type ShopifyEvent = z.infer<typeof shopifyEventSchema>;
export type ShopifyContext = z.infer<typeof shopifyContextSchema>;
export type ProductViewedData = z.infer<typeof productViewedDataSchema>;
export type CheckoutData = z.infer<typeof checkoutDataSchema>;
