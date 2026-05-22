import { Router } from "express";
import { z } from "zod";
import { db, gigIncomeImportsTable } from "@workspace/db";
import { eq, and, desc, inArray } from "drizzle-orm";

const router = Router();

const KNOWN_PLATFORMS = ["doordash", "uber", "airtasker", "cash", "other"] as const;
const KNOWN_PAYMENT_STATUSES = ["pending", "fast-paid", "deposited", "received"] as const;
const KNOWN_REVIEW_STATUSES = ["pending", "approved", "rejected", "duplicate"] as const;
const KNOWN_PERSONS = ["Gary", "Sam", "Shared"];

const GigImportEntrySchema = z.object({
  sourceSystem: z.literal("gig_pilot"),
  sourceRef: z.string().min(1, "sourceRef is required"),
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "entryDate must be YYYY-MM-DD"),
  platform: z.enum(KNOWN_PLATFORMS),
  person: z.string().min(1, "person is required"),
  grossEarnings: z.number().nonnegative(),
  netIncome: z.number().nonnegative(),
  tips: z.number().nonnegative().default(0),
  fees: z.number().nonnegative().default(0),
  fuelEstimate: z.number().nonnegative().default(0),
  hoursWorked: z.number().nonnegative().nullable().optional(),
  deliveriesCount: z.number().int().nonnegative().nullable().optional(),
  paymentStatus: z.enum(KNOWN_PAYMENT_STATUSES).default("pending"),
  notes: z.string().nullable().optional(),
});

const PostBodySchema = z.union([
  GigImportEntrySchema,
  z.object({ entries: z.array(GigImportEntrySchema).min(1) }),
]);

// ── GET /gig-imports ──────────────────────────────────────────────────────────
router.get("/gig-imports", async (req, res): Promise<void> => {
  try {
    const includeAll = req.query.all === "true";
    const statuses: string[] = includeAll
      ? ["pending", "approved", "rejected", "duplicate"]
      : ["pending"];

    const rows = await db
      .select()
      .from(gigIncomeImportsTable)
      .where(inArray(gigIncomeImportsTable.reviewStatus, statuses))
      .orderBy(desc(gigIncomeImportsTable.receivedAt));

    const enriched = rows.map((r) => ({
      ...r,
      warnings: buildWarnings(r),
    }));

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch staged imports" });
  }
});

// ── POST /gig-imports ─────────────────────────────────────────────────────────
router.post("/gig-imports", async (req, res): Promise<void> => {
  const parsed = PostBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
    return;
  }

  const entries = "entries" in parsed.data ? parsed.data.entries : [parsed.data];
  const results: Array<{ sourceRef: string; status: "staged" | "duplicate" | "error"; id?: number; warnings?: string[] }> = [];

  for (const entry of entries) {
    try {
      const warnings = [];
      if (!KNOWN_PERSONS.includes(entry.person)) {
        warnings.push(`person "${entry.person}" is not a known household member (Gary/Sam/Shared)`);
      }
      if (entry.netIncome > entry.grossEarnings) {
        warnings.push("netIncome exceeds grossEarnings");
      }
      const entryDateObj = new Date(entry.entryDate + "T00:00:00");
      const now = new Date();
      if (entryDateObj > now) {
        warnings.push("entryDate is in the future");
      }
      const twelveMonthsAgo = new Date(now);
      twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
      if (entryDateObj < twelveMonthsAgo) {
        warnings.push("entryDate is more than 12 months ago");
      }

      const [inserted] = await db
        .insert(gigIncomeImportsTable)
        .values({
          sourceSystem: entry.sourceSystem,
          sourceRef: entry.sourceRef,
          entryDate: entry.entryDate,
          platform: entry.platform,
          person: entry.person,
          grossEarnings: String(entry.grossEarnings),
          netIncome: String(entry.netIncome),
          tips: String(entry.tips ?? 0),
          fees: String(entry.fees ?? 0),
          fuelEstimate: String(entry.fuelEstimate ?? 0),
          hoursWorked: entry.hoursWorked != null ? String(entry.hoursWorked) : null,
          deliveriesCount: entry.deliveriesCount ?? null,
          paymentStatus: entry.paymentStatus,
          notes: entry.notes ?? null,
          reviewStatus: "pending",
        })
        .onConflictDoNothing()
        .returning();

      if (!inserted) {
        results.push({ sourceRef: entry.sourceRef, status: "duplicate" });
      } else {
        results.push({ sourceRef: entry.sourceRef, status: "staged", id: inserted.id, warnings });
      }
    } catch (err) {
      results.push({ sourceRef: entry.sourceRef, status: "error" });
    }
  }

  const staged = results.filter((r) => r.status === "staged").length;
  const duplicates = results.filter((r) => r.status === "duplicate").length;

  res.status(201).json({
    summary: { staged, duplicates, errors: results.filter((r) => r.status === "error").length },
    results,
    note: "All records staged only. No writes to gig_entries or income_entries.",
  });
});

// ── PATCH /gig-imports/:id/reject ─────────────────────────────────────────────
router.patch("/gig-imports/:id/reject", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { reason } = req.body as { reason?: string };

  const [updated] = await db
    .update(gigIncomeImportsTable)
    .set({
      reviewStatus: "rejected",
      rejectionReason: reason ?? null,
    })
    .where(eq(gigIncomeImportsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Staged import not found" });
    return;
  }
  res.json({ ok: true, id: updated.id, reviewStatus: updated.reviewStatus });
});

// ── PATCH /gig-imports/:id/approve ────────────────────────────────────────────
router.patch("/gig-imports/:id/approve", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [row] = await db
    .select()
    .from(gigIncomeImportsTable)
    .where(eq(gigIncomeImportsTable.id, id));

  if (!row) {
    res.status(404).json({ error: "Staged import not found" });
    return;
  }

  res.status(200).json({
    ok: false,
    id,
    message: "Approval and promotion to gig_entries is not implemented in Packet 1. The staged row has not been modified. Promotion will be implemented in a later explicit packet.",
    currentReviewStatus: row.reviewStatus,
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildWarnings(row: typeof gigIncomeImportsTable.$inferSelect): string[] {
  const warnings: string[] = [];
  if (!KNOWN_PERSONS.includes(row.person)) {
    warnings.push(`person "${row.person}" is not a known household member`);
  }
  if (parseFloat(row.netIncome) > parseFloat(row.grossEarnings)) {
    warnings.push("netIncome exceeds grossEarnings");
  }
  return warnings;
}

export default router;
