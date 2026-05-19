import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const roadmapItemsTable = pgTable("roadmap_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  layer: text("layer").notNull(),
  status: text("status").notNull(),
  description: text("description").notNull(),
  whyItMatters: text("why_it_matters").notNull(),
  validationNeeded: text("validation_needed"),
  riskNotes: text("risk_notes"),
  buildPriority: text("build_priority").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type RoadmapItemRow = typeof roadmapItemsTable.$inferSelect;
