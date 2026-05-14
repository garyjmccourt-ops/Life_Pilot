import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { eq } from "drizzle-orm";
import { db, bnplItemsTable, storedValueItemsTable } from "@workspace/db";

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

export default router;
