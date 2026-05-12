import { pgTable, serial, text, date, timestamp } from "drizzle-orm/pg-core";

export const scenariosTable = pgTable("scenarios", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  label: text("label").notNull().default("base"),
  status: text("status").notNull().default("draft"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  incomeAssumptions: text("income_assumptions"),
  billAssumptions: text("bill_assumptions"),
  arrearsAssumptions: text("arrears_assumptions"),
  spendingChanges: text("spending_changes"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ScenarioRow = typeof scenariosTable.$inferSelect;
