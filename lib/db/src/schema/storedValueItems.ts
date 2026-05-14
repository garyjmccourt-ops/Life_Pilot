import { pgTable, serial, text, numeric, date } from "drizzle-orm/pg-core";

export const storedValueItemsTable = pgTable("stored_value_items", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(),
  startingValue: numeric("starting_value", { precision: 12, scale: 2 }).notNull(),
  remainingBalance: numeric("remaining_balance", { precision: 12, scale: 2 }).notNull(),
  purchaseDate: date("purchase_date"),
  expiryDate: date("expiry_date"),
  linkedBudgetCategory: text("linked_budget_category"),
  notes: text("notes"),
});

export type StoredValueItemRow = typeof storedValueItemsTable.$inferSelect;
