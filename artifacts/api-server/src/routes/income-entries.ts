import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, incomeEntriesTable } from "@workspace/db";
import {
  CreateIncomeEntryBody,
  UpdateIncomeEntryBody,
  UpdateIncomeEntryParams,
  DeleteIncomeEntryParams,
} from "@workspace/api-zod";
import { n } from "../lib/calc";

const router: IRouter = Router();

function shape(row: typeof incomeEntriesTable.$inferSelect) {
  return {
    id: row.id,
    dateReceived: row.dateReceived,
    incomeSourceId: row.incomeSourceId,
    sourceName: row.sourceName,
    person: row.person,
    grossAmount: n(row.grossAmount),
    netAmount: n(row.netAmount),
    paymentMethod: row.paymentMethod,
    tags: row.tags,
    notes: row.notes,
    allocated: row.allocated,
    gigEntryId: row.gigEntryId,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/income-entries", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(incomeEntriesTable)
    .orderBy(desc(incomeEntriesTable.dateReceived));
  res.json(rows.map(shape));
});

router.post("/income-entries", async (req, res): Promise<void> => {
  const parsed = CreateIncomeEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { grossAmount, netAmount, dateReceived, ...rest } = parsed.data;
  const toDate = (v: Date | string) =>
    typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);
  const [row] = await db
    .insert(incomeEntriesTable)
    .values({
      ...rest,
      dateReceived: toDate(dateReceived),
      grossAmount: String(grossAmount),
      netAmount: String(netAmount),
    })
    .returning();
  res.status(201).json(shape(row));
});

router.patch("/income-entries/:id", async (req, res): Promise<void> => {
  const params = UpdateIncomeEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateIncomeEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { grossAmount, netAmount, dateReceived, ...rest } = parsed.data;
  const toDate = (v: Date | string) =>
    typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);
  const [row] = await db
    .update(incomeEntriesTable)
    .set({
      ...rest,
      ...("dateReceived" in parsed.data ? { dateReceived: toDate(dateReceived as Date | string) } : {}),
      ...(grossAmount !== undefined ? { grossAmount: String(grossAmount) } : {}),
      ...(netAmount !== undefined ? { netAmount: String(netAmount) } : {}),
    })
    .where(eq(incomeEntriesTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(shape(row));
});

router.delete("/income-entries/:id", async (req, res): Promise<void> => {
  const params = DeleteIncomeEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(incomeEntriesTable).where(eq(incomeEntriesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
