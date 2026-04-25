import { pgTable, serial, text, numeric } from "drizzle-orm/pg-core";

export const incomeSourcesTable = pgTable("income_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  frequency: text("frequency").notNull(),
  notes: text("notes"),
});

export type IncomeSourceRow = typeof incomeSourcesTable.$inferSelect;
