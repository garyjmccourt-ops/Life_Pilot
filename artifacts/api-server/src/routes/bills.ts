import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, billsTable } from "@workspace/db";
import {
  CreateBillBody,
  UpdateBillBody,
  UpdateBillParams,
  DeleteBillParams,
} from "@workspace/api-zod";
import { n, toWeekly } from "../lib/calc";

const router: IRouter = Router();

function shape(row: typeof billsTable.$inferSelect) {
  const amount = n(row.amount);
  return {
    id: row.id,
    provider: row.provider,
    category: row.category,
    amount,
    frequency: row.frequency,
    dueDay: row.dueDay,
    dueDate: row.dueDate ?? null,
    accountRef: row.accountRef,
    autopay: row.autopay,
    notes: row.notes,
    paidStatus: row.paidStatus ?? "unpaid",
    weeklyEquivalent: toWeekly(amount, row.frequency),
  };
}

router.get("/bills", async (_req, res): Promise<void> => {
  const rows = await db.select().from(billsTable).orderBy(billsTable.id);
  res.json(rows.map(shape));
});

router.post("/bills", async (req, res): Promise<void> => {
  const parsed = CreateBillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { amount, ...rest } = parsed.data;
  const [row] = await db
    .insert(billsTable)
    .values({ ...rest, amount: String(amount) })
    .returning();
  res.status(201).json(shape(row));
});

router.patch("/bills/:id", async (req, res): Promise<void> => {
  const params = UpdateBillParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBillBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { amount, ...rest } = parsed.data;
  const [row] = await db
    .update(billsTable)
    .set({ ...rest, amount: String(amount) })
    .where(eq(billsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(shape(row));
});

router.delete("/bills/:id", async (req, res): Promise<void> => {
  const params = DeleteBillParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(billsTable).where(eq(billsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
