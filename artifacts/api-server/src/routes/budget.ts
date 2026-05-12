import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, budgetCategoriesTable } from "@workspace/db";
import {
  CreateBudgetCategoryBody,
  UpdateBudgetCategoryBody,
  UpdateBudgetCategoryParams,
  DeleteBudgetCategoryParams,
} from "@workspace/api-zod";
import { n } from "../lib/calc";

const router: IRouter = Router();

function shape(row: typeof budgetCategoriesTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    group: row.group,
    plannedWeekly: n(row.plannedWeekly),
    actualWeekly: n(row.actualWeekly),
    essential: row.essential,
    includeInScenario: row.includeInScenario,
    carryForward: row.carryForward,
    notes: row.notes,
    color: row.color,
  };
}

router.get("/budget-categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(budgetCategoriesTable)
    .orderBy(budgetCategoriesTable.id);
  res.json(rows.map(shape));
});

router.post("/budget-categories", async (req, res): Promise<void> => {
  const parsed = CreateBudgetCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { plannedWeekly, actualWeekly, ...rest } = parsed.data;
  const [row] = await db
    .insert(budgetCategoriesTable)
    .values({
      ...rest,
      plannedWeekly: String(plannedWeekly),
      actualWeekly: String(actualWeekly),
    })
    .returning();
  res.status(201).json(shape(row));
});

router.patch("/budget-categories/:id", async (req, res): Promise<void> => {
  const params = UpdateBudgetCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBudgetCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { plannedWeekly, actualWeekly, ...rest } = parsed.data;
  const [row] = await db
    .update(budgetCategoriesTable)
    .set({
      ...rest,
      ...(plannedWeekly !== undefined ? { plannedWeekly: String(plannedWeekly) } : {}),
      ...(actualWeekly !== undefined ? { actualWeekly: String(actualWeekly) } : {}),
    })
    .where(eq(budgetCategoriesTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(shape(row));
});

router.delete("/budget-categories/:id", async (req, res): Promise<void> => {
  const params = DeleteBudgetCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(budgetCategoriesTable).where(eq(budgetCategoriesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
