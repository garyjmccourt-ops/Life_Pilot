import {
  pgTable,
  serial,
  text,
  integer,
  date,
  timestamp,
} from "drizzle-orm/pg-core";

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  bucket: text("bucket").notNull(),
  status: text("status").notNull(),
  priority: text("priority").notNull(),
  dueDate: date("due_date"),
  creditorTag: text("creditor_tag"),
  arrearsItemId: integer("arrears_item_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TaskRow = typeof tasksTable.$inferSelect;
