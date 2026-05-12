import { pgTable, serial, text, numeric, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const shoppingListItemsTable = pgTable("shopping_list_items", {
  id: serial("id").primaryKey(),
  shoppingListId: integer("shopping_list_id").notNull(),
  shoppingItemId: integer("shopping_item_id"),
  item: text("item").notNull(),
  category: text("category").notNull().default("general"),
  quantitySize: text("quantity_size"),
  store: text("store"),
  estimatedPrice: numeric("estimated_price", { precision: 8, scale: 2 }),
  actualPrice: numeric("actual_price", { precision: 8, scale: 2 }),
  needed: boolean("needed").notNull().default(true),
  bought: boolean("bought").notNull().default(false),
  priority: text("priority").notNull().default("normal"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ShoppingListItemRow = typeof shoppingListItemsTable.$inferSelect;
