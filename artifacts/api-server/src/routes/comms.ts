import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, commsEntriesTable } from "@workspace/db";
import { CreateCommsBody, DeleteCommsParams } from "@workspace/api-zod";

const router: IRouter = Router();

function shape(row: typeof commsEntriesTable.$inferSelect) {
  return {
    id: row.id,
    occurredAt: row.occurredAt.toISOString(),
    channel: row.channel,
    creditor: row.creditor,
    arrearsItemId: row.arrearsItemId,
    who: row.who,
    outcome: row.outcome,
    nextStep: row.nextStep,
  };
}

router.get("/comms", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(commsEntriesTable)
    .orderBy(desc(commsEntriesTable.occurredAt));
  res.json(rows.map(shape));
});

router.post("/comms", async (req, res): Promise<void> => {
  const parsed = CreateCommsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { occurredAt, ...rest } = parsed.data;
  const [row] = await db
    .insert(commsEntriesTable)
    .values({ ...rest, occurredAt: new Date(occurredAt) })
    .returning();
  res.status(201).json(shape(row));
});

router.delete("/comms/:id", async (req, res): Promise<void> => {
  const params = DeleteCommsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(commsEntriesTable).where(eq(commsEntriesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
