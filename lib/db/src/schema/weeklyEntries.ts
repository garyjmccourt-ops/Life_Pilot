import {
  pgTable,
  serial,
  text,
  numeric,
  date,
} from "drizzle-orm/pg-core";

export const weeklyEntriesTable = pgTable("weekly_entries", {
  id: serial("id").primaryKey(),
  weekStart: date("week_start").notNull().unique(),
  plannedIn: numeric("planned_in", { precision: 12, scale: 2 }).notNull(),
  actualIn: numeric("actual_in", { precision: 12, scale: 2 }).notNull(),
  plannedOut: numeric("planned_out", { precision: 12, scale: 2 }).notNull(),
  actualOut: numeric("actual_out", { precision: 12, scale: 2 }).notNull(),
  notes: text("notes"),
});

export type WeeklyEntryRow = typeof weeklyEntriesTable.$inferSelect;
