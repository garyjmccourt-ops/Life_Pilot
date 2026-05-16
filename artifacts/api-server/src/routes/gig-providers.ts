import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import { db, gigProvidersTable } from "@workspace/db";

const router: IRouter = Router();

const GigProviderInput = z.object({
  providerName: z.string().min(1),
  providerType: z.string().default("delivery"),
  status: z.string().default("Interested"),
  paymentFrequency: z.string().nullable().optional(),
  expectedPaymentDay: z.string().nullable().optional(),
  expectedWeeklyIncome: z.number().nullable().optional(),
  taxSetAsidePct: z.number().default(0),
  vehicleCostMethod: z.string().default("fuel_estimate"),
  usesLocationTracking: z.boolean().default(false),
  usesShiftTracking: z.boolean().default(false),
  usesJourneyTracking: z.boolean().default(false),
  feedsMyohBudget: z.boolean().default(true),
  notes: z.string().nullable().optional(),
});

function shape(r: typeof gigProvidersTable.$inferSelect) {
  return {
    id: r.id,
    providerName: r.providerName,
    providerType: r.providerType,
    status: r.status,
    paymentFrequency: r.paymentFrequency ?? null,
    expectedPaymentDay: r.expectedPaymentDay ?? null,
    expectedWeeklyIncome: r.expectedWeeklyIncome != null ? Number(r.expectedWeeklyIncome) : null,
    taxSetAsidePct: Number(r.taxSetAsidePct ?? 0),
    vehicleCostMethod: r.vehicleCostMethod ?? "fuel_estimate",
    usesLocationTracking: r.usesLocationTracking,
    usesShiftTracking: r.usesShiftTracking,
    usesJourneyTracking: r.usesJourneyTracking,
    feedsMyohBudget: r.feedsMyohBudget,
    notes: r.notes ?? null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

router.get("/gig-providers", async (_req, res): Promise<void> => {
  const rows = await db.select().from(gigProvidersTable).orderBy(gigProvidersTable.id);
  res.json(rows.map(shape));
});

router.post("/gig-providers", async (req, res): Promise<void> => {
  const parsed = GigProviderInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const v = parsed.data;
  const [row] = await db.insert(gigProvidersTable).values({
    providerName: v.providerName,
    providerType: v.providerType,
    status: v.status,
    paymentFrequency: v.paymentFrequency ?? null,
    expectedPaymentDay: v.expectedPaymentDay ?? null,
    expectedWeeklyIncome: v.expectedWeeklyIncome != null ? String(v.expectedWeeklyIncome) : null,
    taxSetAsidePct: String(v.taxSetAsidePct),
    vehicleCostMethod: v.vehicleCostMethod,
    usesLocationTracking: v.usesLocationTracking,
    usesShiftTracking: v.usesShiftTracking,
    usesJourneyTracking: v.usesJourneyTracking,
    feedsMyohBudget: v.feedsMyohBudget,
    notes: v.notes ?? null,
  }).returning();
  res.status(201).json(shape(row));
});

router.patch("/gig-providers/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = GigProviderInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const v = parsed.data;
  const patch: Partial<typeof gigProvidersTable.$inferInsert> = {};
  if (v.providerName !== undefined) patch.providerName = v.providerName;
  if (v.providerType !== undefined) patch.providerType = v.providerType;
  if (v.status !== undefined) patch.status = v.status;
  if ("paymentFrequency" in v) patch.paymentFrequency = v.paymentFrequency ?? null;
  if ("expectedPaymentDay" in v) patch.expectedPaymentDay = v.expectedPaymentDay ?? null;
  if ("expectedWeeklyIncome" in v) patch.expectedWeeklyIncome = v.expectedWeeklyIncome != null ? String(v.expectedWeeklyIncome) : null;
  if (v.taxSetAsidePct !== undefined) patch.taxSetAsidePct = String(v.taxSetAsidePct);
  if (v.vehicleCostMethod !== undefined) patch.vehicleCostMethod = v.vehicleCostMethod;
  if (v.usesLocationTracking !== undefined) patch.usesLocationTracking = v.usesLocationTracking;
  if (v.usesShiftTracking !== undefined) patch.usesShiftTracking = v.usesShiftTracking;
  if (v.usesJourneyTracking !== undefined) patch.usesJourneyTracking = v.usesJourneyTracking;
  if (v.feedsMyohBudget !== undefined) patch.feedsMyohBudget = v.feedsMyohBudget;
  if ("notes" in v) patch.notes = v.notes ?? null;
  patch.updatedAt = new Date();
  const [row] = await db.update(gigProvidersTable).set(patch).where(eq(gigProvidersTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json(shape(row));
});

router.delete("/gig-providers/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(gigProvidersTable).where(eq(gigProvidersTable.id, id));
  res.sendStatus(204);
});

export default router;
