import { db } from "./db";
import {
  audiometryResults,
  billingSyncLogs,
  type AudiometryResult,
  type InsertAudiometryResult,
  type BillingSyncLog,
  type InsertBillingSyncLog
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Audiometry
  getAudiometryResults(): Promise<AudiometryResult[]>;
  getAudiometryResult(id: number): Promise<AudiometryResult | undefined>;
  createAudiometryResult(result: InsertAudiometryResult): Promise<AudiometryResult>;
  updateAudiometryStatus(id: number, status: "NEW" | "BILLED" | "FAILED"): Promise<AudiometryResult>;

  // Logs
  createSyncLog(log: InsertBillingSyncLog): Promise<BillingSyncLog>;
  getSyncLogs(audiometryId: number): Promise<BillingSyncLog[]>;
  getLastSyncLog(audiometryId: number): Promise<BillingSyncLog | undefined>;
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
}

export const storage = new DatabaseStorage();
