import { pgTable, serial, text, numeric, boolean, timestamp } from "drizzle-orm/pg-core";

export const gigProvidersTable = pgTable("gig_providers", {
  id: serial("id").primaryKey(),
  providerName: text("provider_name").notNull(),
  providerType: text("provider_type").notNull().default("delivery"),
  status: text("status").notNull().default("Interested"),
  paymentFrequency: text("payment_frequency"),
  expectedPaymentDay: text("expected_payment_day"),
  expectedWeeklyIncome: numeric("expected_weekly_income", { precision: 10, scale: 2 }),
  taxSetAsidePct: numeric("tax_set_aside_pct", { precision: 5, scale: 2 }).default("0"),
  vehicleCostMethod: text("vehicle_cost_method").default("fuel_estimate"),
  usesLocationTracking: boolean("uses_location_tracking").notNull().default(false),
  usesShiftTracking: boolean("uses_shift_tracking").notNull().default(false),
  usesJourneyTracking: boolean("uses_journey_tracking").notNull().default(false),
  feedsMyohBudget: boolean("feeds_myoh_budget").notNull().default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GigProviderRow = typeof gigProvidersTable.$inferSelect;
