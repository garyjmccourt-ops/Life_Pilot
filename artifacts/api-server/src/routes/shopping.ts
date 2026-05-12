import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import {
  db,
  shoppingItemsTable,
  shoppingListsTable,
  shoppingListItemsTable,
} from "@workspace/db";
import {
  CreateShoppingItemBody,
  UpdateShoppingItemBody,
  UpdateShoppingItemParams,
  DeleteShoppingItemParams,
  CreateShoppingListBody,
  UpdateShoppingListBody,
  UpdateShoppingListParams,
  DeleteShoppingListParams,
  CreateShoppingListItemBody,
  UpdateShoppingListItemBody,
  UpdateShoppingListItemParams,
  DeleteShoppingListItemParams,
  ListShoppingListItemsParams,
} from "@workspace/api-zod";
import { n } from "../lib/calc";

const router: IRouter = Router();

function shapeItem(row: typeof shoppingItemsTable.$inferSelect) {
  return {
    id: row.id,
    item: row.item,
    category: row.category,
    quantitySize: row.quantitySize,
    preferredStore: row.preferredStore,
    alternativeStore: row.alternativeStore,
    alternativeItem: row.alternativeItem,
    estimatedPrice: row.estimatedPrice != null ? n(row.estimatedPrice) : null,
    actualPrice: row.actualPrice != null ? n(row.actualPrice) : null,
    priority: row.priority,
    usualFrequency: row.usualFrequency,
    lastPurchasedDate: row.lastPurchasedDate,
    linkedBudgetCategoryId: row.linkedBudgetCategoryId,
    notes: row.notes,
    active: row.active,
  };
}

function shapeList(row: typeof shoppingListsTable.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    weekStart: row.weekStart,
    weekEnd: row.weekEnd,
    status: row.status,
    estimatedTotal: n(row.estimatedTotal),
    actualTotal: n(row.actualTotal),
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  };
}

function shapeListItem(row: typeof shoppingListItemsTable.$inferSelect) {
  return {
    id: row.id,
    shoppingListId: row.shoppingListId,
    shoppingItemId: row.shoppingItemId,
    item: row.item,
    category: row.category,
    quantitySize: row.quantitySize,
    store: row.store,
    estimatedPrice: row.estimatedPrice != null ? n(row.estimatedPrice) : null,
    actualPrice: row.actualPrice != null ? n(row.actualPrice) : null,
    needed: row.needed,
    bought: row.bought,
    priority: row.priority,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
  };
}

router.get("/shopping-items", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(shoppingItemsTable)
    .orderBy(shoppingItemsTable.item);
  res.json(rows.map(shapeItem));
});

router.post("/shopping-items", async (req, res): Promise<void> => {
  const parsed = CreateShoppingItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { estimatedPrice, actualPrice, lastPurchasedDate, ...rest } = parsed.data;
  const toDate = (v: Date | string | null | undefined) =>
    v == null ? v : typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);
  const [row] = await db
    .insert(shoppingItemsTable)
    .values({
      ...rest,
      estimatedPrice: estimatedPrice != null ? String(estimatedPrice) : null,
      actualPrice: actualPrice != null ? String(actualPrice) : null,
      lastPurchasedDate: toDate(lastPurchasedDate) ?? null,
    })
    .returning();
  res.status(201).json(shapeItem(row));
});

router.patch("/shopping-items/:id", async (req, res): Promise<void> => {
  const params = UpdateShoppingItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateShoppingItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { estimatedPrice, actualPrice, lastPurchasedDate, ...rest } = parsed.data;
  const toDate = (v: Date | string | null | undefined) =>
    v == null ? v : typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);
  const [row] = await db
    .update(shoppingItemsTable)
    .set({
      ...rest,
      ...(estimatedPrice !== undefined ? { estimatedPrice: estimatedPrice != null ? String(estimatedPrice) : null } : {}),
      ...(actualPrice !== undefined ? { actualPrice: actualPrice != null ? String(actualPrice) : null } : {}),
      ...("lastPurchasedDate" in parsed.data ? { lastPurchasedDate: toDate(lastPurchasedDate) ?? null } : {}),
    })
    .where(eq(shoppingItemsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(shapeItem(row));
});

router.delete("/shopping-items/:id", async (req, res): Promise<void> => {
  const params = DeleteShoppingItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(shoppingItemsTable).where(eq(shoppingItemsTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/shopping-lists", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(shoppingListsTable)
    .orderBy(desc(shoppingListsTable.createdAt));
  res.json(rows.map(shapeList));
});

router.post("/shopping-lists", async (req, res): Promise<void> => {
  const parsed = CreateShoppingListBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { estimatedTotal, actualTotal, weekStart, weekEnd, ...rest } = parsed.data;
  const toDate = (v: Date | string | null | undefined) =>
    v == null ? v : typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);
  const [row] = await db
    .insert(shoppingListsTable)
    .values({
      ...rest,
      estimatedTotal: String(estimatedTotal),
      actualTotal: String(actualTotal),
      weekStart: toDate(weekStart) ?? null,
      weekEnd: toDate(weekEnd) ?? null,
    })
    .returning();
  res.status(201).json(shapeList(row));
});

router.patch("/shopping-lists/:id", async (req, res): Promise<void> => {
  const params = UpdateShoppingListParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateShoppingListBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { estimatedTotal, actualTotal, weekStart, weekEnd, ...rest } = parsed.data;
  const toDate = (v: Date | string | null | undefined) =>
    v == null ? v : typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);
  const [row] = await db
    .update(shoppingListsTable)
    .set({
      ...rest,
      ...(estimatedTotal !== undefined ? { estimatedTotal: String(estimatedTotal) } : {}),
      ...(actualTotal !== undefined ? { actualTotal: String(actualTotal) } : {}),
      ...("weekStart" in parsed.data ? { weekStart: toDate(weekStart) ?? null } : {}),
      ...("weekEnd" in parsed.data ? { weekEnd: toDate(weekEnd) ?? null } : {}),
    })
    .where(eq(shoppingListsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(shapeList(row));
});

router.delete("/shopping-lists/:id", async (req, res): Promise<void> => {
  const params = DeleteShoppingListParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(shoppingListsTable).where(eq(shoppingListsTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/shopping-lists/:listId/items", async (req, res): Promise<void> => {
  const params = ListShoppingListItemsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const rows = await db
    .select()
    .from(shoppingListItemsTable)
    .where(eq(shoppingListItemsTable.shoppingListId, params.data.listId))
    .orderBy(shoppingListItemsTable.id);
  res.json(rows.map(shapeListItem));
});

router.post("/shopping-lists/:listId/items", async (req, res): Promise<void> => {
  const params = ListShoppingListItemsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = CreateShoppingListItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { estimatedPrice, actualPrice, ...rest } = parsed.data;
  const [row] = await db
    .insert(shoppingListItemsTable)
    .values({
      ...rest,
      shoppingListId: params.data.listId,
      estimatedPrice: estimatedPrice != null ? String(estimatedPrice) : null,
      actualPrice: actualPrice != null ? String(actualPrice) : null,
    })
    .returning();
  res.status(201).json(shapeListItem(row));
});

router.patch("/shopping-list-items/:id", async (req, res): Promise<void> => {
  const params = UpdateShoppingListItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateShoppingListItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { estimatedPrice, actualPrice, ...rest } = parsed.data;
  const [row] = await db
    .update(shoppingListItemsTable)
    .set({
      ...rest,
      ...(estimatedPrice !== undefined ? { estimatedPrice: estimatedPrice != null ? String(estimatedPrice) : null } : {}),
      ...(actualPrice !== undefined ? { actualPrice: actualPrice != null ? String(actualPrice) : null } : {}),
    })
    .where(eq(shoppingListItemsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(shapeListItem(row));
});

router.delete("/shopping-list-items/:id", async (req, res): Promise<void> => {
  const params = DeleteShoppingListItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .delete(shoppingListItemsTable)
    .where(eq(shoppingListItemsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
