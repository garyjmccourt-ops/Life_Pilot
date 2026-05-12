import {
  pgTable,
  serial,
  text,
  numeric,
  integer,
  boolean,
  date,
} from "drizzle-orm/pg-core";

export const billsTable = pgTable("bills", {
  id: serial("id").primaryKey(),
  provider: text("provider").notNull(),
  category: text("category").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  frequency: text("frequency").notNull(),
  dueDay: integer("due_day"),
  dueDate: date("due_date"),
  accountRef: text("account_ref"),
  autopay: boolean("autopay").notNull().default(false),
  notes: text("notes"),
});

export type BillRow = typeof billsTable.$inferSelect;
