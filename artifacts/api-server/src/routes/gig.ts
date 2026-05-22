import { Router, type IRouter } from "express";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { db, gigEntriesTable } from "@workspace/db";
import {
  CreateGigEntryBody,
  UpdateGigEntryBody,
  UpdateGigEntryParams,
  DeleteGigEntryParams,
} from "@workspace/api-zod";
import { n } from "../lib/calc";
import { syncGigWeekIncome, getWeekBounds } from "../lib/gig-sync";

const router: IRouter = Router();

const PLATFORM_LABELS: Record<string, string> = {
  doordash: "DoorDash",
  uber: "Uber Eats",
  airtasker: "Airtasker",
  menulog: "Menulog",
  cash: "Cash",
  other: "Other",
};

// ── Shape ─────────────────────────────────────────────────────────────────────

function shape(row: typeof gigEntriesTable.$inferSelect) {
  return {
    id: row.id,
    entryDate: row.entryDate,
    platform: row.platform,
    person: row.person,
    startTime: row.startTime,
    endTime: row.endTime,
    hoursWorked: row.hoursWorked != null ? n(row.hoursWorked) : null,
    grossEarnings: n(row.grossEarnings),
    tips: n(row.tips),
    fastPayAmount: n(row.fastPayAmount),
    weeklyDepositAmount: n(row.weeklyDepositAmount),
    fees: n(row.fees),
    fuelEstimate: n(row.fuelEstimate),
    otherExpenses: n(row.otherExpenses),
    netIncome: n(row.netIncome),
    paymentStatus: row.paymentStatus,
    incomeEntryId: row.incomeEntryId,
    notes: row.notes,
    estimatedKm: row.estimatedKm != null ? n(row.estimatedKm) : null,
    activeMinutes: row.activeMinutes ?? null,
    deliveriesCount: row.deliveriesCount ?? null,
    offersCount: row.offersCount ?? null,
    routeChain: row.routeChain ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function numStr(v: number | undefined | null): string | undefined {
  if (v == null) return undefined;
  return String(v);
}

// ── Routes ─────────────────────────────────────────────────────────────────────

router.get("/gig", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(gigEntriesTable)
    .orderBy(desc(gigEntriesTable.entryDate));
  res.json(rows.map(shape));
});

router.post("/gig", async (req, res): Promise<void> => {
  const parsed = CreateGigEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const {
    grossEarnings, tips, fastPayAmount, weeklyDepositAmount, fees,
    fuelEstimate, otherExpenses, netIncome, hoursWorked, entryDate,
    estimatedKm, activeMinutes, deliveriesCount, offersCount, routeChain,
    ...rest
  } = parsed.data;
  const toDate = (v: Date | string | null | undefined) =>
    v == null ? v : typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);

  const dateStr = toDate(entryDate) as string;

  const [row] = await db
    .insert(gigEntriesTable)
    .values({
      ...rest,
      entryDate: dateStr,
      grossEarnings: String(grossEarnings),
      tips: String(tips),
      fastPayAmount: String(fastPayAmount),
      weeklyDepositAmount: String(weeklyDepositAmount),
      fees: String(fees),
      fuelEstimate: String(fuelEstimate),
      otherExpenses: String(otherExpenses),
      netIncome: String(netIncome),
      hoursWorked: numStr(hoursWorked) ?? null,
      estimatedKm: estimatedKm != null ? String(estimatedKm) : null,
      activeMinutes: activeMinutes ?? null,
      deliveriesCount: deliveriesCount ?? null,
      offersCount: offersCount ?? null,
      routeChain: routeChain ?? null,
    })
    .returning();

  // Auto-sync weekly income entry
  const sync = await syncGigWeekIncome(dateStr);

  // Re-fetch the row to get the updated incomeEntryId
  const [updated] = await db.select().from(gigEntriesTable).where(eq(gigEntriesTable.id, row.id));

  res.status(201).json({
    gigEntry: shape(updated ?? row),
    weeklyIncome: {
      incomeEntryId: sync.incomeEntryId,
      weekEnding: sync.weekEnding,
      isNew: sync.isNew,
    },
  });
});

router.patch("/gig/:id", async (req, res): Promise<void> => {
  const params = UpdateGigEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateGigEntryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Fetch existing to get old date (needed if date changes week)
  const [existing] = await db.select().from(gigEntriesTable).where(eq(gigEntriesTable.id, params.data.id));
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const oldDate = existing.entryDate;

  const {
    grossEarnings, tips, fastPayAmount, weeklyDepositAmount, fees,
    fuelEstimate, otherExpenses, netIncome, hoursWorked, entryDate,
    estimatedKm, activeMinutes, deliveriesCount, offersCount, routeChain,
    ...rest
  } = parsed.data;
  const toDate = (v: Date | string | null | undefined) =>
    v == null ? v : typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);

  const [row] = await db
    .update(gigEntriesTable)
    .set({
      ...rest,
      ...("entryDate" in parsed.data ? { entryDate: toDate(entryDate) as string } : {}),
      ...(grossEarnings !== undefined ? { grossEarnings: String(grossEarnings) } : {}),
      ...(tips !== undefined ? { tips: String(tips) } : {}),
      ...(fastPayAmount !== undefined ? { fastPayAmount: String(fastPayAmount) } : {}),
      ...(weeklyDepositAmount !== undefined ? { weeklyDepositAmount: String(weeklyDepositAmount) } : {}),
      ...(fees !== undefined ? { fees: String(fees) } : {}),
      ...(fuelEstimate !== undefined ? { fuelEstimate: String(fuelEstimate) } : {}),
      ...(otherExpenses !== undefined ? { otherExpenses: String(otherExpenses) } : {}),
      ...(netIncome !== undefined ? { netIncome: String(netIncome) } : {}),
      ...(hoursWorked !== undefined ? { hoursWorked: numStr(hoursWorked) ?? null } : {}),
      ...(estimatedKm !== undefined ? { estimatedKm: estimatedKm != null ? String(estimatedKm) : null } : {}),
      ...(activeMinutes !== undefined ? { activeMinutes: activeMinutes ?? null } : {}),
      ...(deliveriesCount !== undefined ? { deliveriesCount: deliveriesCount ?? null } : {}),
      ...(offersCount !== undefined ? { offersCount: offersCount ?? null } : {}),
      ...(routeChain !== undefined ? { routeChain: routeChain ?? null } : {}),
    })
    .where(eq(gigEntriesTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const newDate = row.entryDate;

  // Sync the new week; if date moved to a different week, also re-sync the old week
  const sync = await syncGigWeekIncome(newDate);
  const oldWeek = getWeekBounds(oldDate);
  const newWeek = getWeekBounds(newDate);
  if (oldWeek.sunday !== newWeek.sunday) {
    await syncGigWeekIncome(oldDate);
  }

  // Re-fetch to get updated incomeEntryId
  const [refreshed] = await db.select().from(gigEntriesTable).where(eq(gigEntriesTable.id, row.id));

  res.json({
    gigEntry: shape(refreshed ?? row),
    weeklyIncome: {
      incomeEntryId: sync.incomeEntryId,
      weekEnding: sync.weekEnding,
      isNew: sync.isNew,
    },
  });
});

router.delete("/gig/:id", async (req, res): Promise<void> => {
  const params = DeleteGigEntryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  // Capture the entry date before deleting so we can re-sync the week
  const [existing] = await db.select().from(gigEntriesTable).where(eq(gigEntriesTable.id, params.data.id));
  const entryDate = existing?.entryDate;

  await db.delete(gigEntriesTable).where(eq(gigEntriesTable.id, params.data.id));

  // Re-sync the week's income entry (updates totals after removal)
  if (entryDate) {
    await syncGigWeekIncome(entryDate);
  }

  res.sendStatus(204);
});

// ── Hub import bridge ─────────────────────────────────────────────────────────
// Accepts an array of shift summaries exported by the Gig Economy Hub companion
// app and bulk-inserts them as gig_entries records.

import { z as zBridge } from "zod/v4";

const ImportSummaryItem = zBridge.object({
  entryDate: zBridge.string().min(1),
  platform: zBridge.string().default("other"),
  person: zBridge.string().nullable().optional(),
  grossEarnings: zBridge.number().default(0),
  tips: zBridge.number().default(0),
  fastPayAmount: zBridge.number().default(0),
  weeklyDepositAmount: zBridge.number().default(0),
  fees: zBridge.number().default(0),
  fuelEstimate: zBridge.number().default(0),
  otherExpenses: zBridge.number().default(0),
  netIncome: zBridge.number().default(0),
  paymentStatus: zBridge.string().default("pending"),
  estimatedKm: zBridge.number().nullable().optional(),
  activeMinutes: zBridge.number().int().nullable().optional(),
  deliveriesCount: zBridge.number().int().nullable().optional(),
  offersCount: zBridge.number().int().nullable().optional(),
  routeChain: zBridge.string().nullable().optional(),
  notes: zBridge.string().nullable().optional(),
});

router.post("/gig/import-summary", async (req, res): Promise<void> => {
  const parsed = zBridge.array(ImportSummaryItem).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Expected an array of shift summary objects", details: parsed.error.issues });
    return;
  }
  if (parsed.data.length === 0) {
    res.json({ imported: 0 });
    return;
  }
  const rows = parsed.data.map((s) => ({
    entryDate: s.entryDate,
    platform: s.platform,
    person: s.person ?? null,
    grossEarnings: String(s.grossEarnings),
    tips: String(s.tips),
    fastPayAmount: String(s.fastPayAmount),
    weeklyDepositAmount: String(s.weeklyDepositAmount),
    fees: String(s.fees),
    fuelEstimate: String(s.fuelEstimate),
    otherExpenses: String(s.otherExpenses),
    netIncome: String(s.netIncome),
    paymentStatus: s.paymentStatus,
    estimatedKm: s.estimatedKm != null ? String(s.estimatedKm) : null,
    activeMinutes: s.activeMinutes ?? null,
    deliveriesCount: s.deliveriesCount ?? null,
    offersCount: s.offersCount ?? null,
    routeChain: s.routeChain ?? null,
    notes: s.notes ?? null,
  }));
  await db.insert(gigEntriesTable).values(rows);
  res.json({ imported: rows.length });
});

// Legacy per-entry link (kept for backwards compatibility)
router.post("/gig/:id/link-income", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [gig] = await db
    .select()
    .from(gigEntriesTable)
    .where(eq(gigEntriesTable.id, id));

  if (!gig) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  // Redirect to weekly sync
  const sync = await syncGigWeekIncome(gig.entryDate);
  const [updated] = await db.select().from(gigEntriesTable).where(eq(gigEntriesTable.id, id));
  res.status(201).json({ gigEntry: shape(updated ?? gig), incomeEntryId: sync.incomeEntryId });
});

export default router;
