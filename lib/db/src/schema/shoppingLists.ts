import { pgTable, serial, text, numeric, date, timestamp } from "drizzle-orm/pg-core";

export const shoppingListsTable = pgTable("shopping_lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  weekStart: date("week_start"),
  weekEnd: date("week_end"),
  status: text("status").notNull().default("draft"),
  estimatedTotal: numeric("estimated_total", { precision: 10, scale: 2 }).notNull().default("0"),
  actualTotal: numeric("actual_total", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ShoppingListRow = typeof shoppingListsTable.$inferSelect;
