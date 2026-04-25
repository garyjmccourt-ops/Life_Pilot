import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, incomeSourcesTable } from "@workspace/db";
import {
  CreateIncomeBody,
  UpdateIncomeBody,
  UpdateIncomeParams,
  DeleteIncomeParams,
} from "@workspace/api-zod";
import { n, toWeekly } from "../lib/calc";

const router: IRouter = Router();

function shape(row: typeof incomeSourcesTable.$inferSelect) {
  const amount = n(row.amount);
  return {
    id: row.id,
    name: row.name,
    amount,
    frequency: row.frequency,
    notes: row.notes,
    weeklyEquivalent: toWeekly(amount, row.frequency),
  };
}

router.get("/income", async (_req, res): Promise<void> => {
  const rows = await db.select().from(incomeSourcesTable).orderBy(incomeSourcesTable.id);
  res.json(rows.map(shape));
});

router.post("/income", async (req, res): Promise<void> => {
  const parsed = CreateIncomeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { amount, ...rest } = parsed.data;
  const [row] = await db
    .insert(incomeSourcesTable)
    .values({ ...rest, amount: String(amount) })
    .returning();
  res.status(201).json(shape(row));
});

router.patch("/income/:id", async (req, res): Promise<void> => {
  const params = UpdateIncomeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateIncomeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { amount, ...rest } = parsed.data;
  const [row] = await db
    .update(incomeSourcesTable)
    .set({ ...rest, amount: String(amount) })
    .where(eq(incomeSourcesTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(shape(row));
});

router.delete("/income/:id", async (req, res): Promise<void> => {
  const params = DeleteIncomeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(incomeSourcesTable).where(eq(incomeSourcesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
