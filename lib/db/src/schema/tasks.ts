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
  description: text("description"),
  category: text("category"),
  bucket: text("bucket").notNull(),
  status: text("status").notNull(),
  priority: text("priority").notNull(),
  dueDate: date("due_date"),
  startDate: date("start_date"),
  assignedPerson: text("assigned_person"),
  creditorTag: text("creditor_tag"),
  arrearsItemId: integer("arrears_item_id"),
  recurring: text("recurring").notNull().default("false"),
  completedAt: date("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TaskRow = typeof tasksTable.$inferSelect;
