import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
// @ts-ignore
import OAuthClient from 'intuit-oauth';

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

  const oauthClient = new OAuthClient({
    clientId: process.env.QUICKBOOKS_CLIENT_ID,
    clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET,
    environment: process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox',
    redirectUri: process.env.QUICKBOOKS_REDIRECT_URI,
  });

// app.post("/api/dev/clear-qb-tokens", async (_req, res) => {
//   await db.delete(quickbooksTokens);
//   res.send("QuickBooks tokens cleared");
// });

app.get("/auth/quickbooks", (_req, res) => {

  const url = oauthClient.authorizeUri({
    scope: [OAuthClient.scopes.Accounting],
    state: "random-state-123",
  });

  res.redirect(url);
});

app.get('/auth/quickbooks/callback', async (req, res) => {
  try {
    const authResponse = await oauthClient.createToken(req.url);
    const tokenData = authResponse.getJson();

    const realmId = req.query.realmId as string;
    if (!realmId) {
      throw new Error("Missing realmId from QuickBooks callback");
    }

    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    await storage.saveQuickbooksToken({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt,
      realmId,
    });

    res.send("QuickBooks connected successfully!");
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.status(500).send("Authentication failed");
  }
});

app.get("/api/quickbooks/company", async (_req, res) => {
  try {
    const { accessToken, realmId } =
      await refreshQuickbooksToken(oauthClient);

    const response = await fetch(
      `${process.env.QUICKBOOKS_BASE_URL}/v3/company/${realmId}/companyinfo/${realmId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("Error in /api/quickbooks/company:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.post("/api/quickbooks/customers", async (req, res) => {
  try {
    const { patientId } = req.body;
    if (!patientId) {
      return res.status(400).json({ error: "patientId required" });
    }

    const patient = await storage.getAudiometryResult(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    if (patient.qbCustomerId) {
      return res.status(400).json({ error: "Patient already synced to QuickBooks" });
    }

    const { accessToken, realmId } = await refreshQuickbooksToken(oauthClient);

    const qbUrl = `${process.env.QUICKBOOKS_BASE_URL}/v3/company/${realmId}/customer`;

    const customerData = {
      DisplayName: patient.patientName,
      Title: 'Msr/Ms',
    };

    const response = await fetch(qbUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(customerData),
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error("QB API Error:", errData);
      throw new Error(errData.Fault?.Error?.[0]?.Message || "QuickBooks API error");
    }

    const data = await response.json();
    const qbCustomerId = data.Customer.Id;

    await storage.updateAudiometryQbCustomerId(patientId, qbCustomerId);

    res.json({ success: true, qbCustomerId });
  } catch (err) {
    console.error("Error creating QB customer:", err);
    res.status(500).json({ error: "Failed to create customer in QuickBooks" });
  }
});


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

 // Helper function to refresh QuickBooks token
 async function refreshQuickbooksToken(oauthClient: OAuthClient) {
  const token = await storage.getQuickbooksToken();
  if (!token) throw new Error("No QuickBooks token found");

  // Only refresh if expired (with 1 min buffer)
  const isExpired =
    token.expiresAt.getTime() <= Date.now() + 60_000;

  if (!isExpired) {
    return {
      accessToken: token.accessToken,
      realmId: token.realmId,
    };
  }

  console.log("🔄 Refreshing QuickBooks token");

  oauthClient.setToken({
    access_token: token.accessToken,
    refresh_token: token.refreshToken,
    realmId: token.realmId,
  });

  const authResponse = await oauthClient.refresh();
  const newTokenData = authResponse.getJson();

  const newExpiresAt = new Date(
    Date.now() + newTokenData.expires_in * 1000
  );

  await storage.updateQuickbooksToken(token.id, {
    accessToken: newTokenData.access_token,
    refreshToken: newTokenData.refresh_token,
    expiresAt: newExpiresAt,
  });

  return {
    accessToken: newTokenData.access_token,
    realmId: newTokenData.realmId ?? token.realmId,
  };
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
