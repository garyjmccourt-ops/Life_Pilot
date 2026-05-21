import { pgTable, serial, integer, text, numeric, date } from "drizzle-orm/pg-core";
import { bnplItemsTable } from "./bnplItems";

export const bnplScheduleEntriesTable = pgTable("bnpl_schedule_entries", {
  id: serial("id").primaryKey(),
  bnplItemId: integer("bnpl_item_id").notNull().references(() => bnplItemsTable.id, { onDelete: "cascade" }),
  dueDate: date("due_date").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("scheduled"),
  paidDate: date("paid_date"),
  notes: text("notes"),
});

export type BnplScheduleEntryRow = typeof bnplScheduleEntriesTable.$inferSelect;
