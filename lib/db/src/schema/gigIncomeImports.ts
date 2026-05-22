import { pgTable, serial, text, numeric, integer, date, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const gigIncomeImportsTable = pgTable("gig_income_imports", {
  id: serial("id").primaryKey(),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
  sourceSystem: text("source_system").notNull(),
  sourceRef: text("source_ref").notNull(),
  entryDate: date("entry_date").notNull(),
  platform: text("platform").notNull(),
  person: text("person").notNull(),
  grossEarnings: numeric("gross_earnings", { precision: 12, scale: 2 }).notNull(),
  netIncome: numeric("net_income", { precision: 12, scale: 2 }).notNull(),
  tips: numeric("tips", { precision: 12, scale: 2 }).default("0"),
  fees: numeric("fees", { precision: 12, scale: 2 }).default("0"),
  fuelEstimate: numeric("fuel_estimate", { precision: 12, scale: 2 }).default("0"),
  hoursWorked: numeric("hours_worked", { precision: 6, scale: 2 }),
  deliveriesCount: integer("deliveries_count"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  notes: text("notes"),
  reviewStatus: text("review_status").notNull().default("pending"),
  promotedGigEntryId: integer("promoted_gig_entry_id"),
  promotedAt: timestamp("promoted_at"),
  rejectionReason: text("rejection_reason"),
  duplicateOfImportId: integer("duplicate_of_import_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("gig_income_imports_source_unique")
    .on(table.sourceSystem, table.sourceRef)
    .where(sql`${table.reviewStatus} <> 'duplicate'`),
]);

export type GigIncomeImportRow = typeof gigIncomeImportsTable.$inferSelect;
export type GigIncomeImportInsert = typeof gigIncomeImportsTable.$inferInsert;
