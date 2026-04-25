import {
  pgTable,
  serial,
  text,
  numeric,
  date,
} from "drizzle-orm/pg-core";

export const arrearsItemsTable = pgTable("arrears_items", {
  id: serial("id").primaryKey(),
  creditor: text("creditor").notNull(),
  category: text("category").notNull(),
  balance: numeric("balance", { precision: 12, scale: 2 }).notNull(),
  ongoingCharge: numeric("ongoing_charge", { precision: 12, scale: 2 }).notNull(),
  ongoingFrequency: text("ongoing_frequency").notNull(),
  arrearsPayment: numeric("arrears_payment", { precision: 12, scale: 2 }).notNull(),
  arrearsFrequency: text("arrears_frequency").notNull(),
  riskLevel: text("risk_level").notNull(),
  status: text("status").notNull(),
  nextReviewDate: date("next_review_date"),
  accountRef: text("account_ref"),
  summary: text("summary"),
  objective: text("objective"),
  workingPlan: text("working_plan"),
  communicationPosition: text("communication_position"),
  externalAcknowledgement: text("external_acknowledgement"),
  externalPaymentIntent: text("external_payment_intent"),
  externalStagedReduction: text("external_staged_reduction"),
  externalReviewPoints: text("external_review_points"),
  externalChannel: text("external_channel"),
  evidenceLinks: text("evidence_links"),
});

export type ArrearsItemRow = typeof arrearsItemsTable.$inferSelect;
