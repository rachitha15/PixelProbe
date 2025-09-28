# Shopify Pixel Analytics Dashboard

## Overview

A real-time analytics dashboard for monitoring Shopify web pixel events. This application captures ecommerce analytics events from Shopify stores through a custom web pixel integration and displays them in a comprehensive dashboard with live event streaming, metrics visualization, and customer insights.

The system consists of a full-stack web application with a React frontend, Express backend, PostgreSQL database, and a JavaScript web pixel that integrates with Shopify stores to capture analytics events.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
**React SPA with TypeScript** - Built using Vite for fast development and optimized builds. The frontend follows a component-based architecture with:
- **UI Library**: shadcn/ui components built on Radix UI primitives for accessibility and customization
- **Styling**: Tailwind CSS with a custom design system supporting both light and dark modes
- **State Management**: TanStack Query for server state management and caching
- **Real-time Updates**: WebSocket client for live event streaming
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
**Express.js REST API** - Handles HTTP requests and WebSocket connections for real-time features:
- **Event Ingestion**: RESTful endpoints for receiving Shopify pixel events with CORS support
- **WebSocket Server**: Real-time event broadcasting to connected dashboard clients
- **Data Layer**: Abstracted storage interface supporting both in-memory (development) and PostgreSQL (production)
- **API Structure**: RESTful endpoints for events, metrics, and health checks with proper error handling

### Database Design
**PostgreSQL with Drizzle ORM** - Relational database optimized for analytics workloads:
- **Events Table**: Stores Shopify pixel events with flexible JSONB columns for event data and context
- **Schema Design**: Supports Shopify's native event structure including client tracking, shop identification, and extensible event data
- **Migrations**: Drizzle Kit for database schema management and version control

### Real-time Event System
**WebSocket-based Live Streaming** - Enables real-time dashboard updates:
- **Event Broadcasting**: Server broadcasts new events to all connected clients immediately upon ingestion
- **Connection Management**: Automatic reconnection logic with exponential backoff
- **Event Filtering**: Client-side filtering for event types, shop domains, and time ranges

### Authentication & Security
**Stateless Architecture** - Currently designed for internal/demo use:
- **CORS Configuration**: Allows cross-origin requests from Shopify stores
- **Input Validation**: Zod schemas for type-safe request validation
- **Error Handling**: Centralized error handling with proper HTTP status codes

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver optimized for serverless environments
- **drizzle-orm**: Type-safe SQL query builder and ORM
- **express**: Web application framework for the REST API
- **ws**: WebSocket library for real-time event streaming

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **wouter**: Lightweight routing library
- **lucide-react**: Icon library

### Development Tools
- **vite**: Build tool and development server
- **typescript**: Type safety across the application
- **drizzle-kit**: Database schema management and migrations
- **tsx**: TypeScript execution for development

### Shopify Integration
- **Web Pixel API**: Custom JavaScript pixel code that captures Shopify analytics events
- **Analytics Subscription**: Monitors standard Shopify events (page views, product views, cart updates, checkouts)
- **Event Forwarding**: Sends captured events to the dashboard API endpoint in real-time