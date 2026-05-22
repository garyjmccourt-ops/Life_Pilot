import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import { db, bnplItemsTable, storedValueItemsTable, bnplScheduleEntriesTable, storedValueTransactionsTable } from "@workspace/db";

const router: IRouter = Router();

const n = (v: unknown) => (v == null ? 0 : Number(v));

// ── BNPL items ────────────────────────────────────────────────────────────────

const BnplInput = z.object({
  provider: z.string().min(1),
  description: z.string().min(1),
  originalAmount: z.number(),
  remainingBalance: z.number(),
  instalmentAmount: z.number(),
  instalmentFrequency: z.string().default("fortnightly"),
  nextPaymentDate: z.string().nullable().optional(),
  status: z.string().default("active"),
  feeRisk: z.string().nullable().optional(),
  linkedBudgetCategory: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

router.get("/bnpl", async (_req, res): Promise<void> => {
  const rows = await db.select().from(bnplItemsTable).orderBy(bnplItemsTable.id);
  res.json(rows.map(r => ({
    id: r.id,
    provider: r.provider,
    description: r.description,
    originalAmount: n(r.originalAmount),
    remainingBalance: n(r.remainingBalance),
    instalmentAmount: n(r.instalmentAmount),
    instalmentFrequency: r.instalmentFrequency,
    nextPaymentDate: r.nextPaymentDate ?? null,
    status: r.status,
    feeRisk: r.feeRisk ?? null,
    linkedBudgetCategory: r.linkedBudgetCategory ?? null,
    notes: r.notes ?? null,
  })));
});

router.post("/bnpl", async (req, res): Promise<void> => {
  const parsed = BnplInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const v = parsed.data;
  const [row] = await db.insert(bnplItemsTable).values({
    provider: v.provider,
    description: v.description,
    originalAmount: String(v.originalAmount),
    remainingBalance: String(v.remainingBalance),
    instalmentAmount: String(v.instalmentAmount),
    instalmentFrequency: v.instalmentFrequency,
    nextPaymentDate: v.nextPaymentDate ?? null,
    status: v.status,
    feeRisk: v.feeRisk ?? null,
    linkedBudgetCategory: v.linkedBudgetCategory ?? null,
    notes: v.notes ?? null,
  }).returning();
  res.status(201).json({ ...row, originalAmount: n(row.originalAmount), remainingBalance: n(row.remainingBalance), instalmentAmount: n(row.instalmentAmount) });
});

router.patch("/bnpl/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const parsed = BnplInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const v = parsed.data;
  const updates: Record<string, unknown> = {};
  if (v.provider !== undefined) updates.provider = v.provider;
  if (v.description !== undefined) updates.description = v.description;
  if (v.originalAmount !== undefined) updates.originalAmount = String(v.originalAmount);
  if (v.remainingBalance !== undefined) updates.remainingBalance = String(v.remainingBalance);
  if (v.instalmentAmount !== undefined) updates.instalmentAmount = String(v.instalmentAmount);
  if (v.instalmentFrequency !== undefined) updates.instalmentFrequency = v.instalmentFrequency;
  if (v.nextPaymentDate !== undefined) updates.nextPaymentDate = v.nextPaymentDate ?? null;
  if (v.status !== undefined) updates.status = v.status;
  if (v.feeRisk !== undefined) updates.feeRisk = v.feeRisk ?? null;
  if (v.linkedBudgetCategory !== undefined) updates.linkedBudgetCategory = v.linkedBudgetCategory ?? null;
  if (v.notes !== undefined) updates.notes = v.notes ?? null;
  const [row] = await db.update(bnplItemsTable).set(updates).where(eq(bnplItemsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, originalAmount: n(row.originalAmount), remainingBalance: n(row.remainingBalance), instalmentAmount: n(row.instalmentAmount) });
});

router.delete("/bnpl/:id", async (req, res): Promise<void> => {
  await db.delete(bnplItemsTable).where(eq(bnplItemsTable.id, Number(req.params.id)));
  res.status(204).end();
});

// ── BNPL schedule entries ─────────────────────────────────────────────────────

const BnplScheduleInput = z.object({
  bnplItemId: z.number().int(),
  dueDate: z.string().min(1),
  amount: z.number(),
  status: z.enum(["scheduled", "paid", "missed", "skipped"]).default("scheduled"),
  paidDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

router.get("/bnpl-schedule", async (req, res): Promise<void> => {
  const bnplItemId = req.query.bnplItemId ? Number(req.query.bnplItemId) : null;
  const query = db.select().from(bnplScheduleEntriesTable).orderBy(bnplScheduleEntriesTable.dueDate);
  const rows = bnplItemId
    ? await db.select().from(bnplScheduleEntriesTable).where(eq(bnplScheduleEntriesTable.bnplItemId, bnplItemId)).orderBy(bnplScheduleEntriesTable.dueDate)
    : await query;
  res.json(rows.map(r => ({
    id: r.id,
    bnplItemId: r.bnplItemId,
    dueDate: r.dueDate,
    amount: n(r.amount),
    status: r.status,
    paidDate: r.paidDate ?? null,
    notes: r.notes ?? null,
  })));
});

router.post("/bnpl-schedule", async (req, res): Promise<void> => {
  const parsed = BnplScheduleInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const v = parsed.data;
  const [row] = await db.insert(bnplScheduleEntriesTable).values({
    bnplItemId: v.bnplItemId,
    dueDate: v.dueDate,
    amount: String(v.amount),
    status: v.status,
    paidDate: v.paidDate ?? null,
    notes: v.notes ?? null,
  }).returning();
  res.status(201).json({ ...row, amount: n(row.amount) });
});

router.patch("/bnpl-schedule/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const parsed = BnplScheduleInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const v = parsed.data;
  const updates: Record<string, unknown> = {};
  if (v.bnplItemId !== undefined) updates.bnplItemId = v.bnplItemId;
  if (v.dueDate !== undefined) updates.dueDate = v.dueDate;
  if (v.amount !== undefined) updates.amount = String(v.amount);
  if (v.status !== undefined) updates.status = v.status;
  if (v.paidDate !== undefined) updates.paidDate = v.paidDate ?? null;
  if (v.notes !== undefined) updates.notes = v.notes ?? null;
  const [row] = await db.update(bnplScheduleEntriesTable).set(updates).where(eq(bnplScheduleEntriesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  // Recalculate parent BNPL item's remaining balance from all paid schedule entries
  const allEntries = await db.select().from(bnplScheduleEntriesTable).where(eq(bnplScheduleEntriesTable.bnplItemId, row.bnplItemId));
  const paidSum = allEntries.filter(e => e.status === "paid").reduce((s, e) => s + n(e.amount), 0);
  const [parentItem] = await db.select().from(bnplItemsTable).where(eq(bnplItemsTable.id, row.bnplItemId));
  if (parentItem) {
    const newBalance = Math.max(0, n(parentItem.originalAmount) - paidSum);
    await db.update(bnplItemsTable).set({ remainingBalance: String(newBalance) }).where(eq(bnplItemsTable.id, row.bnplItemId));
  }

  res.json({ ...row, amount: n(row.amount) });
});

router.delete("/bnpl-schedule/:id", async (req, res): Promise<void> => {
  await db.delete(bnplScheduleEntriesTable).where(eq(bnplScheduleEntriesTable.id, Number(req.params.id)));
  res.status(204).end();
});

// ── Stored value items ────────────────────────────────────────────────────────

const StoredValueInput = z.object({
  provider: z.string().min(1),
  startingValue: z.number(),
  remainingBalance: z.number(),
  purchaseDate: z.string().nullable().optional(),
  expiryDate: z.string().nullable().optional(),
  linkedBudgetCategory: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

router.get("/stored-value", async (_req, res): Promise<void> => {
  const rows = await db.select().from(storedValueItemsTable).orderBy(storedValueItemsTable.id);
  res.json(rows.map(r => ({
    id: r.id,
    provider: r.provider,
    startingValue: n(r.startingValue),
    remainingBalance: n(r.remainingBalance),
    purchaseDate: r.purchaseDate ?? null,
    expiryDate: r.expiryDate ?? null,
    linkedBudgetCategory: r.linkedBudgetCategory ?? null,
    notes: r.notes ?? null,
  })));
});

router.post("/stored-value", async (req, res): Promise<void> => {
  const parsed = StoredValueInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const v = parsed.data;
  const [row] = await db.insert(storedValueItemsTable).values({
    provider: v.provider,
    startingValue: String(v.startingValue),
    remainingBalance: String(v.remainingBalance),
    purchaseDate: v.purchaseDate ?? null,
    expiryDate: v.expiryDate ?? null,
    linkedBudgetCategory: v.linkedBudgetCategory ?? null,
    notes: v.notes ?? null,
  }).returning();
  res.status(201).json({ ...row, startingValue: n(row.startingValue), remainingBalance: n(row.remainingBalance) });
});

router.patch("/stored-value/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const parsed = StoredValueInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const v = parsed.data;
  const updates: Record<string, unknown> = {};
  if (v.provider !== undefined) updates.provider = v.provider;
  if (v.startingValue !== undefined) updates.startingValue = String(v.startingValue);
  if (v.remainingBalance !== undefined) updates.remainingBalance = String(v.remainingBalance);
  if (v.purchaseDate !== undefined) updates.purchaseDate = v.purchaseDate ?? null;
  if (v.expiryDate !== undefined) updates.expiryDate = v.expiryDate ?? null;
  if (v.linkedBudgetCategory !== undefined) updates.linkedBudgetCategory = v.linkedBudgetCategory ?? null;
  if (v.notes !== undefined) updates.notes = v.notes ?? null;
  const [row] = await db.update(storedValueItemsTable).set(updates).where(eq(storedValueItemsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, startingValue: n(row.startingValue), remainingBalance: n(row.remainingBalance) });
});

router.delete("/stored-value/:id", async (req, res): Promise<void> => {
  await db.delete(storedValueItemsTable).where(eq(storedValueItemsTable.id, Number(req.params.id)));
  res.status(204).end();
});

// ── Stored value transactions ─────────────────────────────────────────────────

const StoredValueTransactionInput = z.object({
  storedValueItemId: z.number().int(),
  transactionDate: z.string().min(1),
  type: z.enum(["top_up", "spend"]),
  amount: z.number(),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

router.get("/stored-value-transactions", async (req, res): Promise<void> => {
  const storedValueItemId = req.query.storedValueItemId ? Number(req.query.storedValueItemId) : null;
  const rows = storedValueItemId
    ? await db.select().from(storedValueTransactionsTable).where(eq(storedValueTransactionsTable.storedValueItemId, storedValueItemId)).orderBy(storedValueTransactionsTable.transactionDate)
    : await db.select().from(storedValueTransactionsTable).orderBy(storedValueTransactionsTable.transactionDate);
  res.json(rows.map(r => ({
    id: r.id,
    storedValueItemId: r.storedValueItemId,
    transactionDate: r.transactionDate,
    type: r.type,
    amount: n(r.amount),
    description: r.description ?? null,
    notes: r.notes ?? null,
  })));
});

async function recalcStoredValueBalance(storedValueItemId: number): Promise<void> {
  const allTx = await db.select().from(storedValueTransactionsTable).where(eq(storedValueTransactionsTable.storedValueItemId, storedValueItemId));
  const [parent] = await db.select().from(storedValueItemsTable).where(eq(storedValueItemsTable.id, storedValueItemId));
  if (!parent) return;
  const delta = allTx.reduce((s, t) => t.type === "top_up" ? s + n(t.amount) : s - n(t.amount), 0);
  const newBalance = Math.max(0, n(parent.startingValue) + delta);
  await db.update(storedValueItemsTable).set({ remainingBalance: String(newBalance) }).where(eq(storedValueItemsTable.id, storedValueItemId));
}

router.post("/stored-value-transactions", async (req, res): Promise<void> => {
  const parsed = StoredValueTransactionInput.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const v = parsed.data;
  const [row] = await db.insert(storedValueTransactionsTable).values({
    storedValueItemId: v.storedValueItemId,
    transactionDate: v.transactionDate,
    type: v.type,
    amount: String(v.amount),
    description: v.description ?? null,
    notes: v.notes ?? null,
  }).returning();
  await recalcStoredValueBalance(v.storedValueItemId);
  res.status(201).json({ ...row, amount: n(row.amount) });
});

router.patch("/stored-value-transactions/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const parsed = StoredValueTransactionInput.partial().safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid input" }); return; }
  const v = parsed.data;
  const updates: Record<string, unknown> = {};
  if (v.storedValueItemId !== undefined) updates.storedValueItemId = v.storedValueItemId;
  if (v.transactionDate !== undefined) updates.transactionDate = v.transactionDate;
  if (v.type !== undefined) updates.type = v.type;
  if (v.amount !== undefined) updates.amount = String(v.amount);
  if (v.description !== undefined) updates.description = v.description ?? null;
  if (v.notes !== undefined) updates.notes = v.notes ?? null;
  const [row] = await db.update(storedValueTransactionsTable).set(updates).where(eq(storedValueTransactionsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  await recalcStoredValueBalance(row.storedValueItemId);
  res.json({ ...row, amount: n(row.amount) });
});

router.delete("/stored-value-transactions/:id", async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [existing] = await db.select().from(storedValueTransactionsTable).where(eq(storedValueTransactionsTable.id, id));
  await db.delete(storedValueTransactionsTable).where(eq(storedValueTransactionsTable.id, id));
  if (existing) await recalcStoredValueBalance(existing.storedValueItemId);
  res.status(204).end();
});

export default router;
