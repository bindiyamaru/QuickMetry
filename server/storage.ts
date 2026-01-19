import { db } from "./db";
import {
  audiometryResults,
  billingSyncLogs,
  quickbooksTokens,
  type AudiometryResult,
  type InsertAudiometryResult,
  type BillingSyncLog,
  type InsertBillingSyncLog,
  type QuickbooksToken,
  type InsertQuickbooksToken
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Audiometry
  getAudiometryResults(): Promise<AudiometryResult[]>;
  getAudiometryResult(id: number): Promise<AudiometryResult | undefined>;
  createAudiometryResult(result: InsertAudiometryResult): Promise<AudiometryResult>;
  updateAudiometryStatus(id: number, status: "NEW" | "BILLED" | "FAILED"): Promise<AudiometryResult>;
  updateAudiometryQbCustomerId(id: number, qbCustomerId: string): Promise<AudiometryResult>;

  // Logs
  createSyncLog(log: InsertBillingSyncLog): Promise<BillingSyncLog>;
  getSyncLogs(audiometryId: number): Promise<BillingSyncLog[]>;
  getLastSyncLog(audiometryId: number): Promise<BillingSyncLog | undefined>;

  // QuickBooks Tokens
  getQuickbooksToken(): Promise<QuickbooksToken | undefined>;
  saveQuickbooksToken(token: InsertQuickbooksToken): Promise<QuickbooksToken>;
  updateQuickbooksToken(id: number, token: Partial<InsertQuickbooksToken>): Promise<QuickbooksToken>;
}

export class DatabaseStorage implements IStorage {
  async getAudiometryResults(): Promise<AudiometryResult[]> {
    return await db.select().from(audiometryResults).orderBy(desc(audiometryResults.testDate));
  }

  async getAudiometryResult(id: number): Promise<AudiometryResult | undefined> {
    const [result] = await db.select().from(audiometryResults).where(eq(audiometryResults.id, id));
    return result;
  }

  async createAudiometryResult(result: InsertAudiometryResult): Promise<AudiometryResult> {
    const [created] = await db.insert(audiometryResults).values(result).returning();
    return created;
  }

  async updateAudiometryStatus(id: number, status: "NEW" | "BILLED" | "FAILED"): Promise<AudiometryResult> {
    const [updated] = await db
      .update(audiometryResults)
      .set({ status })
      .where(eq(audiometryResults.id, id))
      .returning();
    return updated;
  }

  async updateAudiometryQbCustomerId(id: number, qbCustomerId: string): Promise<AudiometryResult> {
    const [updated] = await db
      .update(audiometryResults)
      .set({ qbCustomerId })
      .where(eq(audiometryResults.id, id))
      .returning();
    return updated;
  }

  async createSyncLog(log: InsertBillingSyncLog): Promise<BillingSyncLog> {
    const [created] = await db.insert(billingSyncLogs).values(log).returning();
    return created;
  }

  async getSyncLogs(audiometryId: number): Promise<BillingSyncLog[]> {
    return await db
      .select()
      .from(billingSyncLogs)
      .where(eq(billingSyncLogs.audiometryId, audiometryId))
      .orderBy(desc(billingSyncLogs.createdAt));
  }

  async getLastSyncLog(audiometryId: number): Promise<BillingSyncLog | undefined> {
    const [log] = await db
      .select()
      .from(billingSyncLogs)
      .where(eq(billingSyncLogs.audiometryId, audiometryId))
      .orderBy(desc(billingSyncLogs.createdAt))
      .limit(1);
    return log;
  }

  async getQuickbooksToken(): Promise<QuickbooksToken | undefined> {
    const [token] = await db.select().from(quickbooksTokens).orderBy(desc(quickbooksTokens.createdAt)).limit(1);
    return token;
  }

  async saveQuickbooksToken(token: InsertQuickbooksToken) {
  await db.delete(quickbooksTokens);

  const [created] = await db
    .insert(quickbooksTokens)
    .values(token)
    .returning();

  return created;
}


  async updateQuickbooksToken(
  id: number,
  token: Pick<
    InsertQuickbooksToken,
    "accessToken" | "refreshToken" | "expiresAt"
  >
): Promise<QuickbooksToken> {
  const [updated] = await db
    .update(quickbooksTokens)
    .set(token)
    .where(eq(quickbooksTokens.id, id))
    .returning();

  return updated;
}

}

export const storage = new DatabaseStorage();
