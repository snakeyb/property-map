import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get("/api/properties", async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === "true";
      const data = await storage.fetchProperties(forceRefresh);
      res.json(data);
    } catch (error) {
      console.error("Error fetching properties:", error);
      res.status(500).json({
        error: "Failed to fetch properties from PropertyPipeline",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return httpServer;
}
