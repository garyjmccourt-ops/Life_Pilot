import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, tasksTable } from "@workspace/db";
import {
  CreateTaskBody,
  UpdateTaskBody,
  UpdateTaskParams,
  DeleteTaskParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function shape(row: typeof tasksTable.$inferSelect) {
  return {
    id: row.id,
    title: row.title,
    bucket: row.bucket,
    status: row.status,
    priority: row.priority,
    dueDate: row.dueDate,
    creditorTag: row.creditorTag,
    arrearsItemId: row.arrearsItemId,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  };
}

function dateStr(v: Date | string | null | undefined): string | null | undefined {
  if (v == null) return v as null | undefined;
  if (typeof v === "string") return v.slice(0, 10);
  return v.toISOString().slice(0, 10);
}

router.get("/tasks", async (_req, res): Promise<void> => {
  const rows = await db.select().from(tasksTable).orderBy(tasksTable.id);
  res.json(rows.map(shape));
});

router.post("/tasks", async (req, res): Promise<void> => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { dueDate, ...rest } = parsed.data;
  const [row] = await db
    .insert(tasksTable)
    .values({ ...rest, dueDate: dateStr(dueDate) ?? null })
    .returning();
  res.status(201).json(shape(row));
});

router.patch("/tasks/:id", async (req, res): Promise<void> => {
  const params = UpdateTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { dueDate, ...rest } = parsed.data;
  const updateValues: Partial<typeof tasksTable.$inferInsert> = { ...rest };
  if ("dueDate" in parsed.data) {
    updateValues.dueDate = dateStr(dueDate) ?? null;
  }
  const [row] = await db
    .update(tasksTable)
    .set(updateValues)
    .where(eq(tasksTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(shape(row));
});

router.delete("/tasks/:id", async (req, res): Promise<void> => {
  const params = DeleteTaskParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(tasksTable).where(eq(tasksTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
