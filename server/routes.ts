import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

// --- MOCK BILLING SERVICE ---
// Simulates a flaky external API (QuickBooks-like)
async function mockExternalBillingApi(data: any): Promise<void> {
  const random = Math.random();
  
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 800));

  if (random < 0.1) {
    throw { type: 'AUTH', message: '401 Unauthorized: Invalid API Token' };
  }
  if (random < 0.2) {
    throw { type: 'VALIDATION', message: '400 Bad Request: Invalid CPT Code' };
  }
  if (random < 0.3) {
    throw { type: 'RATE_LIMIT', message: '429 Too Many Requests: Slow down' };
  }
  if (random < 0.4) {
    throw { type: 'NETWORK', message: '500 Internal Server Error: Connection reset' };
  }
  
  // 60% chance of success
  return; 
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // GET Results (with last log attached)
  app.get(api.audiometry.list.path, async (req, res) => {
    const results = await storage.getAudiometryResults();
    
    // Attach the last sync log to each result for the dashboard
    const enrichedResults = await Promise.all(results.map(async (r) => {
      const lastLog = await storage.getLastSyncLog(r.id);
      return { ...r, lastSyncLog: lastLog };
    }));

    res.json(enrichedResults);
  });

  // POST Create Result
  app.post(api.audiometry.create.path, async (req, res) => {
    try {
      const input = api.audiometry.create.input.parse(req.body);
      const result = await storage.createAudiometryResult(input);
      res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal Server Error" });
      }
    }
  });

  // POST Trigger Sync (The Core Logic)
  app.post(api.audiometry.sync.path, async (req, res) => {
    const id = Number(req.params.id);
    const result = await storage.getAudiometryResult(id);
    
    if (!result) {
      return res.status(404).json({ message: "Audiometry result not found" });
    }

    // Get previous retry count
    const lastLog = await storage.getLastSyncLog(id);
    const currentRetryCount = lastLog ? lastLog.retryCount! + 1 : 0;

    try {
      // 1. Attempt Sync
      console.log(`[Sync] Attempting sync for Patient ${result.patientName} (Attempt ${currentRetryCount + 1})...`);
      await mockExternalBillingApi(result);

      // 2. Success Path
      await storage.updateAudiometryStatus(id, "BILLED");
      const successLog = await storage.createSyncLog({
        audiometryId: id,
        status: "SUCCESS",
        errorType: "NONE",
        errorMessage: "Successfully synced to billing system",
        retryCount: currentRetryCount
      });

      res.json({ success: true, message: "Sync successful", log: successLog });

    } catch (error: any) {
      // 3. Failure Path
      console.error(`[Sync] Failed: ${error.message}`);
      
      await storage.updateAudiometryStatus(id, "FAILED");
      const failureLog = await storage.createSyncLog({
        audiometryId: id,
        status: "FAILED",
        errorType: error.type || "NETWORK",
        errorMessage: error.message || "Unknown error occurred",
        retryCount: currentRetryCount
      });

      // In a real app, we might queue a background job here for auto-retry
      // if (error.type === 'RATE_LIMIT' || error.type === 'NETWORK') { ... }

      res.json({ success: false, message: failureLog.errorMessage, log: failureLog });
    }
  });

  // GET Logs
  app.get(api.audiometry.logs.path, async (req, res) => {
    const id = Number(req.params.id);
    const logs = await storage.getSyncLogs(id);
    res.json(logs);
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existing = await storage.getAudiometryResults();
  if (existing.length === 0) {
    console.log("Seeding database...");
    await storage.createAudiometryResult({
      patientName: "John Doe",
      leftEarDb: 20,
      rightEarDb: 25,
      testDate: new Date(),
    });
    await storage.createAudiometryResult({
      patientName: "Jane Smith",
      leftEarDb: 40,
      rightEarDb: 35,
      testDate: new Date(Date.now() - 86400000), // Yesterday
    });
    await storage.createAudiometryResult({
      patientName: "Robert Johnson",
      leftEarDb: 15,
      rightEarDb: 15,
      testDate: new Date(Date.now() - 172800000), // 2 days ago
    });
  }
}
