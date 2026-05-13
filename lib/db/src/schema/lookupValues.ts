import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const lookupValuesTable = pgTable(
  "lookup_values",
  {
    id: serial("id").primaryKey(),
    namespace: text("namespace").notNull(),
    value: text("value").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(false),
    isActive: boolean("is_active").notNull().default(true),
    isDefault: boolean("is_default").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    metadata: text("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("uq_lookup_namespace_value").on(t.namespace, t.value)],
);

export type LookupValueRow = typeof lookupValuesTable.$inferSelect;
