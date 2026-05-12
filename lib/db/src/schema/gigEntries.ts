import { pgTable, serial, text, numeric, date, timestamp, integer } from "drizzle-orm/pg-core";

export const gigEntriesTable = pgTable("gig_entries", {
  id: serial("id").primaryKey(),
  entryDate: date("entry_date").notNull(),
  platform: text("platform").notNull().default("doordash"),
  person: text("person"),
  startTime: text("start_time"),
  endTime: text("end_time"),
  hoursWorked: numeric("hours_worked", { precision: 5, scale: 2 }),
  grossEarnings: numeric("gross_earnings", { precision: 10, scale: 2 }).notNull().default("0"),
  tips: numeric("tips", { precision: 10, scale: 2 }).notNull().default("0"),
  fastPayAmount: numeric("fast_pay_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  weeklyDepositAmount: numeric("weekly_deposit_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  fees: numeric("fees", { precision: 10, scale: 2 }).notNull().default("0"),
  fuelEstimate: numeric("fuel_estimate", { precision: 10, scale: 2 }).notNull().default("0"),
  otherExpenses: numeric("other_expenses", { precision: 10, scale: 2 }).notNull().default("0"),
  netIncome: numeric("net_income", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  incomeEntryId: integer("income_entry_id"),
  notes: text("notes"),
  estimatedKm: numeric("estimated_km", { precision: 8, scale: 3 }),
  activeMinutes: integer("active_minutes"),
  deliveriesCount: integer("deliveries_count"),
  offersCount: integer("offers_count"),
  routeChain: text("route_chain"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GigEntryRow = typeof gigEntriesTable.$inferSelect;
