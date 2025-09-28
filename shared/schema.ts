import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const pixelEvents = pgTable("pixel_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventName: text("event_name").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  customerId: text("customer_id"),
  sessionId: text("session_id"),
  url: text("url").notNull(),
  shopDomain: text("shop_domain").notNull(),
  eventData: jsonb("event_data").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPixelEventSchema = createInsertSchema(pixelEvents).pick({
  eventName: true,
  timestamp: true,
  customerId: true,
  sessionId: true,
  url: true,
  shopDomain: true,
  eventData: true,
});

// Detailed event data schemas for different event types
export const customerDataSchema = z.object({
  id: z.string().optional(),
  email: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const productDataSchema = z.object({
  id: z.string(),
  title: z.string(),
  price: z.number(),
  vendor: z.string().optional(),
  type: z.string().optional(),
  handle: z.string().optional(),
});

export const cartDataSchema = z.object({
  total_price: z.number(),
  item_count: z.number(),
  currency: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string(),
    quantity: z.number(),
    price: z.number(),
    title: z.string().optional(),
  })),
});

export const pageDataSchema = z.object({
  title: z.string(),
  url: z.string(),
  path: z.string().optional(),
});

export const eventDataSchema = z.object({
  customer: customerDataSchema.optional(),
  product: productDataSchema.optional(),
  cart: cartDataSchema.optional(),
  page: pageDataSchema.optional(),
  context: z.record(z.any()).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPixelEvent = z.infer<typeof insertPixelEventSchema>;
export type PixelEvent = typeof pixelEvents.$inferSelect;
export type EventData = z.infer<typeof eventDataSchema>;
export type CustomerData = z.infer<typeof customerDataSchema>;
export type ProductData = z.infer<typeof productDataSchema>;
export type CartData = z.infer<typeof cartDataSchema>;
export type PageData = z.infer<typeof pageDataSchema>;
