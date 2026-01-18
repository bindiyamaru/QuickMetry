import { pgTable, text, serial, integer, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

// 1. Audiometry Results
export const audiometryResults = pgTable("audiometry_results", {
  id: serial("id").primaryKey(),
  patientName: text("patient_name").notNull(),
  testDate: timestamp("test_date").notNull().defaultNow(),
  leftEarDb: integer("left_ear_db").notNull(),
  rightEarDb: integer("right_ear_db").notNull(),
  // Status tracks the overall billing state of this result
  status: text("status", { enum: ["NEW", "BILLED", "FAILED"] }).notNull().default("NEW"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. Billing Sync Logs (for audit trail and retries)
export const billingSyncLogs = pgTable("billing_sync_logs", {
  id: serial("id").primaryKey(),
  audiometryId: integer("audiometry_id").notNull(), // Foreign key ref would go here in full DB
  status: text("status", { enum: ["SUCCESS", "FAILED"] }).notNull(),
  errorType: text("error_type", { enum: ["AUTH", "VALIDATION", "NETWORK", "RATE_LIMIT", "NONE"] }),
  errorMessage: text("error_message"),
  retryCount: integer("retry_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SCHEMAS ===

export const insertAudiometrySchema = createInsertSchema(audiometryResults).omit({ 
  id: true, 
  createdAt: true,
  status: true 
});

export const insertSyncLogSchema = createInsertSchema(billingSyncLogs).omit({
  id: true,
  createdAt: true
});

// === TYPES ===

export type AudiometryResult = typeof audiometryResults.$inferSelect;
export type InsertAudiometryResult = z.infer<typeof insertAudiometrySchema>;

export type BillingSyncLog = typeof billingSyncLogs.$inferSelect;
export type InsertBillingSyncLog = z.infer<typeof insertSyncLogSchema>;

// Request types
export type CreateResultRequest = InsertAudiometryResult;

// Response types combining result + latest log info
export interface AudiometryResultResponse extends AudiometryResult {
  lastSyncLog?: BillingSyncLog;
}
