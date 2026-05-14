import { pgTable, serial, text, numeric, date, boolean } from "drizzle-orm/pg-core";

export const bnplItemsTable = pgTable("bnpl_items", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(),
  description: text("description").notNull(),
  originalAmount: numeric("original_amount", { precision: 12, scale: 2 }).notNull(),
  remainingBalance: numeric("remaining_balance", { precision: 12, scale: 2 }).notNull(),
  instalmentAmount: numeric("instalment_amount", { precision: 12, scale: 2 }).notNull(),
  instalmentFrequency: text("instalment_frequency").notNull().default("fortnightly"),
  nextPaymentDate: date("next_payment_date"),
  status: text("status").notNull().default("active"),
  feeRisk: text("fee_risk"),
  linkedBudgetCategory: text("linked_budget_category"),
  notes: text("notes"),
});

export type BnplItemRow = typeof bnplItemsTable.$inferSelect;
