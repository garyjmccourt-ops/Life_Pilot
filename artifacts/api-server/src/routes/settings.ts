import { Router, type IRouter } from "express";
import { eq, and, desc, asc } from "drizzle-orm";
import { db, lookupValuesTable, auditLogTable } from "@workspace/db";
import { z } from "zod";

const router: IRouter = Router();

// ── Seed data ──────────────────────────────────────────────────────────────────

const SYSTEM_SEEDS: Array<{
  namespace: string;
  value: string;
  label: string;
  sortOrder: number;
  description?: string;
}> = [
  // Income source types
  { namespace: "income_source_type", value: "salary", label: "Salary / Wages", sortOrder: 1 },
  { namespace: "income_source_type", value: "centrelink", label: "Centrelink", sortOrder: 2 },
  { namespace: "income_source_type", value: "gig", label: "Gig / Casual Work", sortOrder: 3 },
  { namespace: "income_source_type", value: "rental", label: "Rental Income", sortOrder: 4 },
  { namespace: "income_source_type", value: "investment", label: "Investment Returns", sortOrder: 5 },
  { namespace: "income_source_type", value: "other_income", label: "Other Income", sortOrder: 6 },
  // Bill categories
  { namespace: "bill_category", value: "utilities", label: "Utilities", sortOrder: 1 },
  { namespace: "bill_category", value: "insurance", label: "Insurance", sortOrder: 2 },
  { namespace: "bill_category", value: "rent", label: "Rent", sortOrder: 3 },
  { namespace: "bill_category", value: "mortgage", label: "Mortgage", sortOrder: 4 },
  { namespace: "bill_category", value: "phone", label: "Phone", sortOrder: 5 },
  { namespace: "bill_category", value: "internet", label: "Internet", sortOrder: 6 },
  { namespace: "bill_category", value: "subscriptions", label: "Subscriptions", sortOrder: 7 },
  { namespace: "bill_category", value: "transport", label: "Transport", sortOrder: 8 },
  { namespace: "bill_category", value: "health", label: "Health & Medical", sortOrder: 9 },
  { namespace: "bill_category", value: "education", label: "Education", sortOrder: 10 },
  { namespace: "bill_category", value: "other_bill", label: "Other Bills", sortOrder: 11 },
  // Budget category groups
  { namespace: "budget_category_group", value: "housing", label: "Housing", sortOrder: 1 },
  { namespace: "budget_category_group", value: "food", label: "Food & Groceries", sortOrder: 2 },
  { namespace: "budget_category_group", value: "transport", label: "Transport", sortOrder: 3 },
  { namespace: "budget_category_group", value: "health", label: "Health", sortOrder: 4 },
  { namespace: "budget_category_group", value: "debt", label: "Debt Repayment", sortOrder: 5 },
  { namespace: "budget_category_group", value: "savings", label: "Savings", sortOrder: 6 },
  { namespace: "budget_category_group", value: "entertainment", label: "Entertainment", sortOrder: 7 },
  { namespace: "budget_category_group", value: "education", label: "Education", sortOrder: 8 },
  { namespace: "budget_category_group", value: "other_budget", label: "Other", sortOrder: 9 },
  // Payment methods
  { namespace: "payment_method", value: "bank_transfer", label: "Bank Transfer", sortOrder: 1 },
  { namespace: "payment_method", value: "cash", label: "Cash", sortOrder: 2 },
  { namespace: "payment_method", value: "bpay", label: "BPAY", sortOrder: 3 },
  { namespace: "payment_method", value: "cheque", label: "Cheque", sortOrder: 4 },
  { namespace: "payment_method", value: "paypal", label: "PayPal", sortOrder: 5 },
  { namespace: "payment_method", value: "card", label: "Card", sortOrder: 6 },
  { namespace: "payment_method", value: "other_payment", label: "Other", sortOrder: 7 },
  // Arrears categories
  { namespace: "arrears_category", value: "utility", label: "Utility", sortOrder: 1 },
  { namespace: "arrears_category", value: "credit_card", label: "Credit Card", sortOrder: 2 },
  { namespace: "arrears_category", value: "personal_loan", label: "Personal Loan", sortOrder: 3 },
  { namespace: "arrears_category", value: "rent", label: "Rent", sortOrder: 4 },
  { namespace: "arrears_category", value: "medical", label: "Medical", sortOrder: 5 },
  { namespace: "arrears_category", value: "council_rates", label: "Council Rates", sortOrder: 6 },
  { namespace: "arrears_category", value: "fines", label: "Fines & Penalties", sortOrder: 7 },
  { namespace: "arrears_category", value: "other_arrears", label: "Other", sortOrder: 8 },
  // Arrears statuses
  { namespace: "arrears_status", value: "current", label: "Current", sortOrder: 1 },
  { namespace: "arrears_status", value: "payment_arrangement", label: "Payment Arrangement", sortOrder: 2 },
  { namespace: "arrears_status", value: "negotiating", label: "Negotiating", sortOrder: 3 },
  { namespace: "arrears_status", value: "legal", label: "Legal Action", sortOrder: 4 },
  { namespace: "arrears_status", value: "referred", label: "Referred to Agency", sortOrder: 5 },
  { namespace: "arrears_status", value: "resolved", label: "Resolved", sortOrder: 6 },
  { namespace: "arrears_status", value: "written_off", label: "Written Off", sortOrder: 7 },
  // Arrears risk levels
  { namespace: "arrears_risk_level", value: "low", label: "Low", sortOrder: 1 },
  { namespace: "arrears_risk_level", value: "medium", label: "Medium", sortOrder: 2 },
  { namespace: "arrears_risk_level", value: "high", label: "High", sortOrder: 3 },
  { namespace: "arrears_risk_level", value: "critical", label: "Critical", sortOrder: 4 },
  // Task buckets
  { namespace: "task_bucket", value: "today", label: "Today", sortOrder: 1 },
  { namespace: "task_bucket", value: "this-week", label: "This Week", sortOrder: 2 },
  { namespace: "task_bucket", value: "backlog", label: "Backlog", sortOrder: 3 },
  { namespace: "task_bucket", value: "waiting", label: "Waiting", sortOrder: 4 },
  { namespace: "task_bucket", value: "done", label: "Done", sortOrder: 5 },
  // Task statuses
  { namespace: "task_status", value: "open", label: "Open", sortOrder: 1 },
  { namespace: "task_status", value: "in-progress", label: "In Progress", sortOrder: 2 },
  { namespace: "task_status", value: "blocked", label: "Blocked", sortOrder: 3 },
  { namespace: "task_status", value: "done", label: "Done", sortOrder: 4 },
  // Task priorities
  { namespace: "task_priority", value: "low", label: "Low", sortOrder: 1 },
  { namespace: "task_priority", value: "medium", label: "Medium", sortOrder: 2 },
  { namespace: "task_priority", value: "high", label: "High", sortOrder: 3 },
  { namespace: "task_priority", value: "urgent", label: "Urgent", sortOrder: 4 },
  // Gig platforms
  { namespace: "gig_platform", value: "doordash", label: "DoorDash", sortOrder: 1 },
  { namespace: "gig_platform", value: "uber", label: "Uber Eats", sortOrder: 2 },
  { namespace: "gig_platform", value: "airtasker", label: "Airtasker", sortOrder: 3 },
  { namespace: "gig_platform", value: "menulog", label: "Menulog", sortOrder: 4 },
  { namespace: "gig_platform", value: "cash", label: "Cash Work", sortOrder: 5 },
  { namespace: "gig_platform", value: "other_gig", label: "Other", sortOrder: 6 },
  // Gig payment statuses
  { namespace: "gig_payment_status", value: "pending", label: "Pending", sortOrder: 1 },
  { namespace: "gig_payment_status", value: "fast-paid", label: "Fast-Paid", sortOrder: 2 },
  { namespace: "gig_payment_status", value: "deposited", label: "Deposited", sortOrder: 3 },
  { namespace: "gig_payment_status", value: "received", label: "Received", sortOrder: 4 },
];

// ── Auto-seed on startup ──────────────────────────────────────────────────────

let seeded = false;

async function seedIfNeeded() {
  if (seeded) return;
  seeded = true;
  try {
    const existing = await db
      .select({ namespace: lookupValuesTable.namespace, value: lookupValuesTable.value })
      .from(lookupValuesTable)
      .where(eq(lookupValuesTable.isSystem, true));
    const existingSet = new Set(existing.map((r) => `${r.namespace}::${r.value}`));
    const toInsert = SYSTEM_SEEDS.filter(
      (s) => !existingSet.has(`${s.namespace}::${s.value}`),
    );
    if (toInsert.length > 0) {
      await db.insert(lookupValuesTable).values(
        toInsert.map((s) => ({ ...s, isSystem: true, isActive: true })),
      );
    }
  } catch (err) {
    console.error("Settings seed error:", err);
    seeded = false;
  }
}

// Kick off seed asynchronously — don't block server startup
seedIfNeeded().catch(console.error);

// ── Audit helper ──────────────────────────────────────────────────────────────

async function audit(
  entityType: string,
  entityId: string | null,
  action: string,
  before: unknown,
  after: unknown,
  notes?: string,
) {
  try {
    await db.insert(auditLogTable).values({
      entityType,
      entityId: entityId != null ? String(entityId) : null,
      action,
      actor: "local-user",
      before: before != null ? JSON.stringify(before) : null,
      after: after != null ? JSON.stringify(after) : null,
      notes: notes ?? null,
    });
  } catch (err) {
    console.error("Audit log error:", err);
  }
}

// ── Zod schemas ───────────────────────────────────────────────────────────────

const CreateLookupBody = z.object({
  namespace: z.string().min(1),
  value: z.string().min(1),
  label: z.string().min(1),
  description: z.string().nullable().optional(),
  sortOrder: z.number().int().optional().default(0),
  metadata: z.string().nullable().optional(),
});

const UpdateLookupBody = z.object({
  label: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
  metadata: z.string().nullable().optional(),
});

const IdParam = z.object({ id: z.coerce.number().int().positive() });

// ── Routes ────────────────────────────────────────────────────────────────────

function shapeLookup(row: typeof lookupValuesTable.$inferSelect) {
  return {
    id: row.id,
    namespace: row.namespace,
    value: row.value,
    label: row.label,
    description: row.description,
    isSystem: row.isSystem,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    metadata: row.metadata,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /settings/lookup?namespace=xxx
router.get("/settings/lookup", async (req, res): Promise<void> => {
  await seedIfNeeded();
  const ns = req.query.namespace as string | undefined;
  const rows = ns
    ? await db
        .select()
        .from(lookupValuesTable)
        .where(eq(lookupValuesTable.namespace, ns))
        .orderBy(asc(lookupValuesTable.sortOrder), asc(lookupValuesTable.label))
    : await db
        .select()
        .from(lookupValuesTable)
        .orderBy(asc(lookupValuesTable.namespace), asc(lookupValuesTable.sortOrder));
  res.json(rows.map(shapeLookup));
});

// POST /settings/lookup
router.post("/settings/lookup", async (req, res): Promise<void> => {
  const parsed = CreateLookupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .insert(lookupValuesTable)
    .values({ ...parsed.data, isSystem: false, isActive: true })
    .returning();
  await audit("lookup_value", String(row.id), "create", null, shapeLookup(row));
  res.status(201).json(shapeLookup(row));
});

// PATCH /settings/lookup/:id
router.patch("/settings/lookup/:id", async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = UpdateLookupBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const existing = await db
    .select()
    .from(lookupValuesTable)
    .where(eq(lookupValuesTable.id, params.data.id));
  if (!existing[0]) { res.status(404).json({ error: "Not found" }); return; }
  const before = shapeLookup(existing[0]);
  const [row] = await db
    .update(lookupValuesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(lookupValuesTable.id, params.data.id))
    .returning();
  await audit("lookup_value", String(row.id), "update", before, shapeLookup(row));
  res.json(shapeLookup(row));
});

// DELETE /settings/lookup/:id
router.delete("/settings/lookup/:id", async (req, res): Promise<void> => {
  const params = IdParam.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: "Invalid id" }); return; }
  const [existing] = await db
    .select()
    .from(lookupValuesTable)
    .where(eq(lookupValuesTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (existing.isSystem) {
    res.status(403).json({ error: "System values cannot be deleted. Deactivate them instead." });
    return;
  }
  await db.delete(lookupValuesTable).where(eq(lookupValuesTable.id, params.data.id));
  await audit("lookup_value", String(params.data.id), "delete", shapeLookup(existing), null);
  res.sendStatus(204);
});

// GET /settings/audit-log?limit=100
router.get("/settings/audit-log", async (req, res): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const rows = await db
    .select()
    .from(auditLogTable)
    .orderBy(desc(auditLogTable.createdAt))
    .limit(limit);
  res.json(
    rows.map((r) => ({
      id: r.id,
      entityType: r.entityType,
      entityId: r.entityId,
      action: r.action,
      actor: r.actor,
      before: r.before ? JSON.parse(r.before) : null,
      after: r.after ? JSON.parse(r.after) : null,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
    })),
  );
});

export default router;
