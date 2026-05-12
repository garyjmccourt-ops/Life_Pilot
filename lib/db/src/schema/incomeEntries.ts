import { pgTable, serial, text, numeric, date, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const incomeEntriesTable = pgTable("income_entries", {
  id: serial("id").primaryKey(),
  dateReceived: date("date_received").notNull(),
  incomeSourceId: integer("income_source_id"),
  sourceName: text("source_name").notNull(),
  person: text("person"),
  grossAmount: numeric("gross_amount", { precision: 12, scale: 2 }).notNull(),
  netAmount: numeric("net_amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method"),
  tags: text("tags"),
  notes: text("notes"),
  allocated: boolean("allocated").notNull().default(false),
  gigEntryId: integer("gig_entry_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type IncomeEntryRow = typeof incomeEntriesTable.$inferSelect;
