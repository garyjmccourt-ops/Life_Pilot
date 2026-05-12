import { pgTable, serial, text, numeric, boolean, date, timestamp, integer } from "drizzle-orm/pg-core";

export const shoppingItemsTable = pgTable("shopping_items", {
  id: serial("id").primaryKey(),
  item: text("item").notNull(),
  category: text("category").notNull().default("general"),
  quantitySize: text("quantity_size"),
  preferredStore: text("preferred_store").notNull().default("any"),
  alternativeStore: text("alternative_store"),
  alternativeItem: text("alternative_item"),
  estimatedPrice: numeric("estimated_price", { precision: 8, scale: 2 }),
  actualPrice: numeric("actual_price", { precision: 8, scale: 2 }),
  priority: text("priority").notNull().default("normal"),
  usualFrequency: text("usual_frequency").notNull().default("weekly"),
  lastPurchasedDate: date("last_purchased_date"),
  linkedBudgetCategoryId: integer("linked_budget_category_id"),
  notes: text("notes"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ShoppingItemRow = typeof shoppingItemsTable.$inferSelect;
