import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, arrearsItemsTable } from "@workspace/db";
import {
  CreateArrearsBody,
  UpdateArrearsBody,
  UpdateArrearsParams,
  GetArrearsParams,
  DeleteArrearsParams,
} from "@workspace/api-zod";
import { n, toWeekly } from "../lib/calc";

const router: IRouter = Router();

export function shapeArrears(row: typeof arrearsItemsTable.$inferSelect) {
  const balance = n(row.balance);
  const ongoingCharge = n(row.ongoingCharge);
  const arrearsPayment = n(row.arrearsPayment);
  const weeklyOngoing = toWeekly(ongoingCharge, row.ongoingFrequency);
  const weeklyArrears = toWeekly(arrearsPayment, row.arrearsFrequency);
  return {
    id: row.id,
    creditor: row.creditor,
    category: row.category,
    balance,
    ongoingCharge,
    ongoingFrequency: row.ongoingFrequency,
    arrearsPayment,
    arrearsFrequency: row.arrearsFrequency,
    riskLevel: row.riskLevel,
    status: row.status,
    nextReviewDate: row.nextReviewDate,
    accountRef: row.accountRef,
    summary: row.summary,
    objective: row.objective,
    workingPlan: row.workingPlan,
    communicationPosition: row.communicationPosition,
    externalAcknowledgement: row.externalAcknowledgement,
    externalPaymentIntent: row.externalPaymentIntent,
    externalStagedReduction: row.externalStagedReduction,
    externalReviewPoints: row.externalReviewPoints,
    externalChannel: row.externalChannel,
    evidenceLinks: row.evidenceLinks,
    weeklyOngoing,
    weeklyArrears,
    weeklyTotal: Math.round((weeklyOngoing + weeklyArrears) * 100) / 100,
  };
}

function pack(input: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...input };
  if (out.balance != null) out.balance = String(out.balance);
  if (out.ongoingCharge != null) out.ongoingCharge = String(out.ongoingCharge);
  if (out.arrearsPayment != null) out.arrearsPayment = String(out.arrearsPayment);
  return out;
}

router.get("/arrears", async (_req, res): Promise<void> => {
  const rows = await db.select().from(arrearsItemsTable).orderBy(arrearsItemsTable.id);
  res.json(rows.map(shapeArrears));
});

router.post("/arrears", async (req, res): Promise<void> => {
  const parsed = CreateArrearsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(arrearsItemsTable)
    .values(pack(parsed.data) as typeof arrearsItemsTable.$inferInsert)
    .returning();
  res.status(201).json(shapeArrears(row));
});

router.get("/arrears/:id", async (req, res): Promise<void> => {
  const params = GetArrearsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(arrearsItemsTable)
    .where(eq(arrearsItemsTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(shapeArrears(row));
});

router.patch("/arrears/:id", async (req, res): Promise<void> => {
  const params = UpdateArrearsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateArrearsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(arrearsItemsTable)
    .set(pack(parsed.data))
    .where(eq(arrearsItemsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(shapeArrears(row));
});

router.delete("/arrears/:id", async (req, res): Promise<void> => {
  const params = DeleteArrearsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(arrearsItemsTable).where(eq(arrearsItemsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
