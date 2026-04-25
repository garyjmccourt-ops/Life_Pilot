import { Router, type IRouter } from "express";
import { db, weeklyEntriesTable } from "@workspace/db";
import { UpsertWeekBody } from "@workspace/api-zod";
import { n } from "../lib/calc";

const router: IRouter = Router();

function shape(row: typeof weeklyEntriesTable.$inferSelect) {
  return {
    id: row.id,
    weekStart: row.weekStart,
    plannedIn: n(row.plannedIn),
    actualIn: n(row.actualIn),
    plannedOut: n(row.plannedOut),
    actualOut: n(row.actualOut),
    notes: row.notes,
  };
}

router.get("/weeks", async (_req, res): Promise<void> => {
  const rows = await db.select().from(weeklyEntriesTable).orderBy(weeklyEntriesTable.weekStart);
  res.json(rows.map(shape));
});

router.post("/weeks", async (req, res): Promise<void> => {
  const parsed = UpsertWeekBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const v = parsed.data;
  const weekStart =
    v.weekStart instanceof Date
      ? v.weekStart.toISOString().slice(0, 10)
      : String(v.weekStart).slice(0, 10);
  const [row] = await db
    .insert(weeklyEntriesTable)
    .values({
      weekStart,
      plannedIn: String(v.plannedIn),
      actualIn: String(v.actualIn),
      plannedOut: String(v.plannedOut),
      actualOut: String(v.actualOut),
      notes: v.notes ?? null,
    })
    .onConflictDoUpdate({
      target: weeklyEntriesTable.weekStart,
      set: {
        plannedIn: String(v.plannedIn),
        actualIn: String(v.actualIn),
        plannedOut: String(v.plannedOut),
        actualOut: String(v.actualOut),
        notes: v.notes ?? null,
      },
    })
    .returning();
  res.json(shape(row));
});

export default router;
