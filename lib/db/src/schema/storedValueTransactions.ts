import { pgTable, serial, integer, text, numeric, date } from "drizzle-orm/pg-core";
import { storedValueItemsTable } from "./storedValueItems";

export const storedValueTransactionsTable = pgTable("stored_value_transactions", {
  id: serial("id").primaryKey(),
  storedValueItemId: integer("stored_value_item_id").notNull().references(() => storedValueItemsTable.id, { onDelete: "cascade" }),
  transactionDate: date("transaction_date").notNull(),
  type: text("type").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  description: text("description"),
  notes: text("notes"),
});

export type StoredValueTransactionRow = typeof storedValueTransactionsTable.$inferSelect;
