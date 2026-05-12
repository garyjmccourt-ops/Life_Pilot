import { pgTable, serial, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core";

export const budgetCategoriesTable = pgTable("budget_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  group: text("group").notNull().default("other"),
  plannedWeekly: numeric("planned_weekly", { precision: 10, scale: 2 }).notNull().default("0"),
  actualWeekly: numeric("actual_weekly", { precision: 10, scale: 2 }).notNull().default("0"),
  essential: boolean("essential").notNull().default(true),
  includeInScenario: boolean("include_in_scenario").notNull().default(true),
  carryForward: boolean("carry_forward").notNull().default(false),
  notes: text("notes"),
  color: text("color"),
  sortOrder: serial("sort_order"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BudgetCategoryRow = typeof budgetCategoriesTable.$inferSelect;
