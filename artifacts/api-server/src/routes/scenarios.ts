import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, scenariosTable } from "@workspace/db";
import {
  CreateScenarioBody,
  UpdateScenarioBody,
  UpdateScenarioParams,
  DeleteScenarioParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function shape(row: typeof scenariosTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    label: row.label,
    status: row.status,
    startDate: row.startDate,
    endDate: row.endDate,
    incomeAssumptions: row.incomeAssumptions,
    billAssumptions: row.billAssumptions,
    arrearsAssumptions: row.arrearsAssumptions,
    spendingChanges: row.spendingChanges,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/scenarios", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(scenariosTable)
    .orderBy(desc(scenariosTable.createdAt));
  res.json(rows.map(shape));
});

router.post("/scenarios", async (req, res): Promise<void> => {
  const parsed = CreateScenarioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { startDate, endDate, ...rest } = parsed.data;
  const toDate = (v: Date | string | null | undefined) =>
    v == null ? v : typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);
  const [row] = await db.insert(scenariosTable).values({
    ...rest,
    startDate: toDate(startDate) ?? null,
    endDate: toDate(endDate) ?? null,
  }).returning();
  res.status(201).json(shape(row));
});

router.patch("/scenarios/:id", async (req, res): Promise<void> => {
  const params = UpdateScenarioParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateScenarioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { startDate, endDate, ...rest } = parsed.data;
  const toDate = (v: Date | string | null | undefined) =>
    v == null ? v : typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);
  const [row] = await db
    .update(scenariosTable)
    .set({
      ...rest,
      ...("startDate" in parsed.data ? { startDate: toDate(startDate) ?? null } : {}),
      ...("endDate" in parsed.data ? { endDate: toDate(endDate) ?? null } : {}),
    })
    .where(eq(scenariosTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(shape(row));
});

router.delete("/scenarios/:id", async (req, res): Promise<void> => {
  const params = DeleteScenarioParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(scenariosTable).where(eq(scenariosTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
