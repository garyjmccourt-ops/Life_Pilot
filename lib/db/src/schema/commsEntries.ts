import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const commsEntriesTable = pgTable("comms_entries", {
  id: serial("id").primaryKey(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  channel: text("channel").notNull(),
  creditor: text("creditor").notNull(),
  arrearsItemId: integer("arrears_item_id"),
  who: text("who"),
  outcome: text("outcome").notNull(),
  nextStep: text("next_step"),
});

export type CommsEntryRow = typeof commsEntriesTable.$inferSelect;
