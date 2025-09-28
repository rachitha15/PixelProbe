import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    // API-only mode: serve a simple message for non-API routes
    console.log(`API-only mode: ${distPath} not found, serving API endpoints only`);
    app.use("*", (_req, res) => {
      res.status(200).json({ 
        message: "Shopify Analytics API", 
        status: "running",
        endpoints: ["/api/events", "/api/metrics"],
        timestamp: new Date().toISOString()
      });
    });
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}