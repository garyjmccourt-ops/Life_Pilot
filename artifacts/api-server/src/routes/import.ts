import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { eq, sql } from "drizzle-orm";
import {
  db,
  incomeSourcesTable,
  incomeEntriesTable,
  billsTable,
  arrearsItemsTable,
  tasksTable,
  commsEntriesTable,
  weeklyEntriesTable,
  gigEntriesTable,
  budgetCategoriesTable,
  scenariosTable,
} from "@workspace/db";

const router: IRouter = Router();

// ── shared enums ──────────────────────────────────────────────────────
const FREQUENCIES = [
  "weekly",
  "fortnightly",
  "monthly",
  "quarterly",
  "annual",
  "one-off",
] as const;
const Frequency = z.enum(FREQUENCIES);

const ARREARS_CATEGORIES = [
  "rent",
  "utility",
  "council",
  "fine",
  "child-support",
  "personal-debt",
  "tax",
  "other",
] as const;

const TASK_BUCKETS = ["pay", "contact", "file", "review", "negotiate", "watch"] as const;
const TASK_STATUSES = [
  "open",
  "in-progress",
  "waiting",
  "blocked",
  "awaiting-reply",
  "deferred",
  "cancelled",
  "done",
] as const;
const PRIORITIES = ["critical", "p1", "p2", "p3"] as const;

const COMMS_CHANNELS = [
  "phone",
  "email",
  "letter",
  "portal",
  "in-person",
  "sms",
] as const;

const GIG_PLATFORMS = [
  "doordash",
  "uber",
  "airtasker",
  "cash",
  "other",
] as const;

const GIG_PAYMENT_STATUSES = [
  "pending",
  "fast-paid",
  "deposited",
  "received",
] as const;

// ── per-table schemas ─────────────────────────────────────────────────

const IncomeSourceSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().min(1),
  amount: z.number(),
  frequency: Frequency,
  notes: z.string().nullable().optional(),
});

const IncomeEntrySchema = z.object({
  id: z.number().int().optional(),
  dateReceived: z.string().min(1),
  incomeSourceId: z.number().int().nullable().optional(),
  sourceName: z.string().min(1),
  person: z.string().nullable().optional(),
  grossAmount: z.number(),
  netAmount: z.number(),
  paymentMethod: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  allocated: z.boolean().optional().default(false),
  gigEntryId: z.number().int().nullable().optional(),
});

const BillSchema = z.object({
  id: z.number().int().optional(),
  provider: z.string().min(1),
  category: z.string(),
  amount: z.number(),
  frequency: Frequency,
  dueDay: z.number().int().min(1).max(31).nullable().optional(),
  accountRef: z.string().nullable().optional(),
  autopay: z.boolean(),
  notes: z.string().nullable().optional(),
});

const ArrearsSchema = z.object({
  id: z.number().int().optional(),
  creditor: z.string().min(1),
  category: z.enum(ARREARS_CATEGORIES),
  balance: z.number(),
  ongoingCharge: z.number(),
  ongoingFrequency: Frequency,
  arrearsPayment: z.number(),
  arrearsFrequency: Frequency,
  riskLevel: z.enum(["low", "medium", "high"]),
  status: z.enum(["active", "negotiating", "paused", "completed"]),
  nextReviewDate: z.string().nullable().optional(),
  accountRef: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  objective: z.string().nullable().optional(),
  workingPlan: z.string().nullable().optional(),
  communicationPosition: z.string().nullable().optional(),
  externalAcknowledgement: z.string().nullable().optional(),
  externalPaymentIntent: z.string().nullable().optional(),
  externalStagedReduction: z.string().nullable().optional(),
  externalReviewPoints: z.string().nullable().optional(),
  externalChannel: z.string().nullable().optional(),
  evidenceLinks: z.string().nullable().optional(),
});

const TaskSchema = z.object({
  id: z.number().int().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  bucket: z.enum(TASK_BUCKETS),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(PRIORITIES),
  dueDate: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  assignedPerson: z.string().nullable().optional(),
  creditorTag: z.string().nullable().optional(),
  arrearsItemId: z.number().int().nullable().optional(),
  recurring: z.boolean().optional().default(false),
  completedAt: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const CommsSchema = z.object({
  id: z.number().int().optional(),
  occurredAt: z.string(),
  channel: z.enum(COMMS_CHANNELS),
  creditor: z.string().min(1),
  arrearsItemId: z.number().int().nullable().optional(),
  who: z.string().nullable().optional(),
  outcome: z.string(),
  nextStep: z.string().nullable().optional(),
});

const WeeklySchema = z.object({
  id: z.number().int().optional(),
  weekStart: z.string(),
  plannedIn: z.number(),
  actualIn: z.number(),
  plannedOut: z.number(),
  actualOut: z.number(),
  notes: z.string().nullable().optional(),
});

const GigEntrySchema = z.object({
  id: z.number().int().optional(),
  entryDate: z.string().min(1),
  platform: z.enum(GIG_PLATFORMS),
  person: z.string().nullable().optional(),
  startTime: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  hoursWorked: z.number().nullable().optional(),
  grossEarnings: z.number().default(0),
  tips: z.number().default(0),
  fastPayAmount: z.number().default(0),
  weeklyDepositAmount: z.number().default(0),
  fees: z.number().default(0),
  fuelEstimate: z.number().default(0),
  otherExpenses: z.number().default(0),
  netIncome: z.number().default(0),
  paymentStatus: z.enum(GIG_PAYMENT_STATUSES).default("pending"),
  notes: z.string().nullable().optional(),
});

const BudgetCategorySchema = z.object({
  id: z.number().int().optional(),
  name: z.string().min(1),
  group: z.string().default("other"),
  plannedWeekly: z.number().default(0),
  actualWeekly: z.number().default(0),
  essential: z.boolean().default(true),
  includeInScenario: z.boolean().default(true),
  carryForward: z.boolean().default(false),
  notes: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
});

const ScenarioSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().min(1),
  label: z.string().default("base"),
  status: z.string().default("draft"),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  incomeAssumptions: z.string().nullable().optional(),
  billAssumptions: z.string().nullable().optional(),
  arrearsAssumptions: z.string().nullable().optional(),
  spendingChanges: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const ImportBody = z.object({
  mode: z.enum(["replace", "merge"]).default("merge"),
  data: z.object({
    incomeSources: z.array(IncomeSourceSchema).optional().default([]),
    incomeEntries: z.array(IncomeEntrySchema).optional().default([]),
    bills: z.array(BillSchema).optional().default([]),
    arrearsItems: z.array(ArrearsSchema).optional().default([]),
    tasks: z.array(TaskSchema).optional().default([]),
    commsEntries: z.array(CommsSchema).optional().default([]),
    weeklyEntries: z.array(WeeklySchema).optional().default([]),
    gigEntries: z.array(GigEntrySchema).optional().default([]),
    budgetCategories: z.array(BudgetCategorySchema).optional().default([]),
    scenarios: z.array(ScenarioSchema).optional().default([]),
  }),
});

// ── helper ────────────────────────────────────────────────────────────
function resetSeq(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], table: string) {
  return tx.execute(sql.raw(`
    SELECT setval(
      pg_get_serial_sequence('${table}', 'id'),
      COALESCE((SELECT MAX(id) FROM ${table}), 1),
      (SELECT EXISTS (SELECT 1 FROM ${table}))
    )
  `));
}

// ── POST /import ──────────────────────────────────────────────────────
router.post("/import", async (req, res): Promise<void> => {
  const parsed = ImportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid import payload — check the field values below and compare against the template.",
      issues: parsed.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }

  const { mode, data } = parsed.data;

  try {
    const counts = await db.transaction(async (tx) => {
      // ── REPLACE mode: clear all tables in safe order ──────────────
      if (mode === "replace") {
        await tx.delete(commsEntriesTable);
        await tx.delete(tasksTable);
        await tx.delete(weeklyEntriesTable);
        await tx.delete(incomeEntriesTable);
        await tx.delete(gigEntriesTable);
        await tx.delete(arrearsItemsTable);
        await tx.delete(billsTable);
        await tx.delete(incomeSourcesTable);
        await tx.delete(budgetCategoriesTable);
        await tx.delete(scenariosTable);
      }

      // ── Lookup maps for merge-mode dedup ──────────────────────────
      // These are only populated in merge mode; in replace mode the tables
      // are already empty so they'll be empty maps and all paths go to insert.
      const existingSourcesByName = new Map<string, number>();
      const existingBillsByProvider = new Map<string, number>();
      const existingArrearssByCreditor = new Map<string, number>();
      const existingBudgetByName = new Map<string, number>();
      const existingScenariosByName = new Map<string, number>();

      if (mode === "merge") {
        const [srcs, bls, arr, bud, scn] = await Promise.all([
          tx.select({ id: incomeSourcesTable.id, name: incomeSourcesTable.name }).from(incomeSourcesTable),
          tx.select({ id: billsTable.id, provider: billsTable.provider }).from(billsTable),
          tx.select({ id: arrearsItemsTable.id, creditor: arrearsItemsTable.creditor }).from(arrearsItemsTable),
          tx.select({ id: budgetCategoriesTable.id, name: budgetCategoriesTable.name }).from(budgetCategoriesTable),
          tx.select({ id: scenariosTable.id, name: scenariosTable.name }).from(scenariosTable),
        ]);
        for (const r of srcs) existingSourcesByName.set(r.name.toLowerCase(), r.id);
        for (const r of bls) existingBillsByProvider.set(r.provider.toLowerCase(), r.id);
        for (const r of arr) existingArrearssByCreditor.set(r.creditor.toLowerCase(), r.id);
        for (const r of bud) existingBudgetByName.set(r.name.toLowerCase(), r.id);
        for (const r of scn) existingScenariosByName.set(r.name.toLowerCase(), r.id);
      }

      // Track arrears id remapping (imported id → actual DB id) for FK refs
      const arrearsIdMap = new Map<number, number>();

      // ── Income Sources ────────────────────────────────────────────
      let incomeSourceCount = 0;
      for (const r of data.incomeSources) {
        const key = r.name.toLowerCase();
        const existingId = existingSourcesByName.get(key);
        if (existingId != null) {
          await tx.update(incomeSourcesTable)
            .set({ amount: String(r.amount), frequency: r.frequency, notes: r.notes ?? null })
            .where(eq(incomeSourcesTable.id, existingId));
        } else {
          await tx.insert(incomeSourcesTable).values({
            ...(r.id != null ? { id: r.id } : {}),
            name: r.name,
            amount: String(r.amount),
            frequency: r.frequency,
            notes: r.notes ?? null,
          });
        }
        incomeSourceCount++;
      }

      // ── Bills ─────────────────────────────────────────────────────
      let billsCount = 0;
      for (const r of data.bills) {
        const key = r.provider.toLowerCase();
        const existingId = existingBillsByProvider.get(key);
        const values = {
          provider: r.provider,
          category: r.category,
          amount: String(r.amount),
          frequency: r.frequency,
          dueDay: r.dueDay ?? null,
          accountRef: r.accountRef ?? null,
          autopay: r.autopay,
          notes: r.notes ?? null,
        };
        if (existingId != null) {
          await tx.update(billsTable).set(values).where(eq(billsTable.id, existingId));
        } else {
          await tx.insert(billsTable).values({ ...(r.id != null ? { id: r.id } : {}), ...values });
        }
        billsCount++;
      }

      // ── Arrears Items ─────────────────────────────────────────────
      let arrearsCount = 0;
      for (const r of data.arrearsItems) {
        const key = r.creditor.toLowerCase();
        const existingId = existingArrearssByCreditor.get(key);
        const values = {
          creditor: r.creditor,
          category: r.category,
          balance: String(r.balance),
          ongoingCharge: String(r.ongoingCharge),
          ongoingFrequency: r.ongoingFrequency,
          arrearsPayment: String(r.arrearsPayment),
          arrearsFrequency: r.arrearsFrequency,
          riskLevel: r.riskLevel,
          status: r.status,
          nextReviewDate: r.nextReviewDate ?? null,
          accountRef: r.accountRef ?? null,
          summary: r.summary ?? null,
          objective: r.objective ?? null,
          workingPlan: r.workingPlan ?? null,
          communicationPosition: r.communicationPosition ?? null,
          externalAcknowledgement: r.externalAcknowledgement ?? null,
          externalPaymentIntent: r.externalPaymentIntent ?? null,
          externalStagedReduction: r.externalStagedReduction ?? null,
          externalReviewPoints: r.externalReviewPoints ?? null,
          externalChannel: r.externalChannel ?? null,
          evidenceLinks: r.evidenceLinks ?? null,
        };
        if (existingId != null) {
          await tx.update(arrearsItemsTable).set(values).where(eq(arrearsItemsTable.id, existingId));
          if (r.id != null) arrearsIdMap.set(r.id, existingId);
        } else {
          const [ins] = await tx.insert(arrearsItemsTable)
            .values({ ...(r.id != null ? { id: r.id } : {}), ...values })
            .returning({ id: arrearsItemsTable.id });
          if (r.id != null) arrearsIdMap.set(r.id, ins.id);
        }
        arrearsCount++;
      }

      // ── Tasks ─────────────────────────────────────────────────────
      let tasksCount = 0;
      for (const r of data.tasks) {
        const arrearsItemId =
          r.arrearsItemId != null
            ? (arrearsIdMap.get(r.arrearsItemId) ?? r.arrearsItemId)
            : null;
        await tx.insert(tasksTable).values({
          ...(r.id != null ? { id: r.id } : {}),
          title: r.title,
          description: r.description ?? null,
          category: r.category ?? null,
          bucket: r.bucket,
          status: r.status,
          priority: r.priority,
          dueDate: r.dueDate ?? null,
          startDate: r.startDate ?? null,
          assignedPerson: r.assignedPerson ?? null,
          creditorTag: r.creditorTag ?? null,
          arrearsItemId,
          recurring: r.recurring ? "true" : "false",
          completedAt: r.completedAt ?? null,
          notes: r.notes ?? null,
        });
        tasksCount++;
      }

      // ── Comms Entries ─────────────────────────────────────────────
      let commsCount = 0;
      for (const r of data.commsEntries) {
        const arrearsItemId =
          r.arrearsItemId != null
            ? (arrearsIdMap.get(r.arrearsItemId) ?? r.arrearsItemId)
            : null;
        await tx.insert(commsEntriesTable).values({
          ...(r.id != null ? { id: r.id } : {}),
          occurredAt: new Date(r.occurredAt),
          channel: r.channel,
          creditor: r.creditor,
          arrearsItemId,
          who: r.who ?? null,
          outcome: r.outcome,
          nextStep: r.nextStep ?? null,
        });
        commsCount++;
      }

      // ── Weekly Entries (upsert by weekStart) ──────────────────────
      let weeksCount = 0;
      for (const r of data.weeklyEntries) {
        await tx.insert(weeklyEntriesTable)
          .values({
            ...(r.id != null ? { id: r.id } : {}),
            weekStart: r.weekStart.slice(0, 10),
            plannedIn: String(r.plannedIn),
            actualIn: String(r.actualIn),
            plannedOut: String(r.plannedOut),
            actualOut: String(r.actualOut),
            notes: r.notes ?? null,
          })
          .onConflictDoUpdate({
            target: weeklyEntriesTable.weekStart,
            set: {
              plannedIn: String(r.plannedIn),
              actualIn: String(r.actualIn),
              plannedOut: String(r.plannedOut),
              actualOut: String(r.actualOut),
              notes: r.notes ?? null,
            },
          });
        weeksCount++;
      }

      // ── Gig Entries (always insert — transactional records) ───────
      let gigCount = 0;
      for (const r of data.gigEntries) {
        await tx.insert(gigEntriesTable).values({
          ...(r.id != null ? { id: r.id } : {}),
          entryDate: r.entryDate.slice(0, 10),
          platform: r.platform,
          person: r.person ?? null,
          startTime: r.startTime ?? null,
          endTime: r.endTime ?? null,
          hoursWorked: r.hoursWorked != null ? String(r.hoursWorked) : null,
          grossEarnings: String(r.grossEarnings),
          tips: String(r.tips),
          fastPayAmount: String(r.fastPayAmount),
          weeklyDepositAmount: String(r.weeklyDepositAmount),
          fees: String(r.fees),
          fuelEstimate: String(r.fuelEstimate),
          otherExpenses: String(r.otherExpenses),
          netIncome: String(r.netIncome),
          paymentStatus: r.paymentStatus,
          notes: r.notes ?? null,
        });
        gigCount++;
      }

      // ── Income Entries (always insert — transactional records) ────
      let incomeEntryCount = 0;
      for (const r of data.incomeEntries) {
        await tx.insert(incomeEntriesTable).values({
          ...(r.id != null ? { id: r.id } : {}),
          dateReceived: r.dateReceived.slice(0, 10),
          incomeSourceId: r.incomeSourceId ?? null,
          sourceName: r.sourceName,
          person: r.person ?? null,
          grossAmount: String(r.grossAmount),
          netAmount: String(r.netAmount),
          paymentMethod: r.paymentMethod ?? null,
          tags: r.tags ?? null,
          notes: r.notes ?? null,
          allocated: r.allocated ?? false,
          gigEntryId: r.gigEntryId ?? null,
        });
        incomeEntryCount++;
      }

      // ── Budget Categories (upsert by name) ────────────────────────
      let budgetCount = 0;
      for (const r of data.budgetCategories) {
        const key = r.name.toLowerCase();
        const existingId = existingBudgetByName.get(key);
        const values = {
          name: r.name,
          group: r.group,
          plannedWeekly: String(r.plannedWeekly),
          actualWeekly: String(r.actualWeekly),
          essential: r.essential,
          includeInScenario: r.includeInScenario,
          carryForward: r.carryForward,
          notes: r.notes ?? null,
          color: r.color ?? null,
        };
        if (existingId != null) {
          await tx.update(budgetCategoriesTable).set(values).where(eq(budgetCategoriesTable.id, existingId));
        } else {
          await tx.insert(budgetCategoriesTable).values({ ...(r.id != null ? { id: r.id } : {}), ...values });
        }
        budgetCount++;
      }

      // ── Scenarios (upsert by name) ────────────────────────────────
      let scenarioCount = 0;
      for (const r of data.scenarios) {
        const key = r.name.toLowerCase();
        const existingId = existingScenariosByName.get(key);
        const values = {
          name: r.name,
          label: r.label,
          status: r.status,
          startDate: r.startDate ?? null,
          endDate: r.endDate ?? null,
          incomeAssumptions: r.incomeAssumptions ?? null,
          billAssumptions: r.billAssumptions ?? null,
          arrearsAssumptions: r.arrearsAssumptions ?? null,
          spendingChanges: r.spendingChanges ?? null,
          notes: r.notes ?? null,
        };
        if (existingId != null) {
          await tx.update(scenariosTable).set(values).where(eq(scenariosTable.id, existingId));
        } else {
          await tx.insert(scenariosTable).values({ ...(r.id != null ? { id: r.id } : {}), ...values });
        }
        scenarioCount++;
      }

      // ── Reset sequences so future inserts don't collide ───────────
      await Promise.all([
        resetSeq(tx, "income_sources"),
        resetSeq(tx, "income_entries"),
        resetSeq(tx, "bills"),
        resetSeq(tx, "arrears_items"),
        resetSeq(tx, "tasks"),
        resetSeq(tx, "comms_entries"),
        resetSeq(tx, "weekly_entries"),
        resetSeq(tx, "gig_entries"),
        resetSeq(tx, "budget_categories"),
        resetSeq(tx, "scenarios"),
      ]);

      return {
        incomeSources: incomeSourceCount,
        incomeEntries: incomeEntryCount,
        bills: billsCount,
        arrearsItems: arrearsCount,
        tasks: tasksCount,
        commsEntries: commsCount,
        weeklyEntries: weeksCount,
        gigEntries: gigCount,
        budgetCategories: budgetCount,
        scenarios: scenarioCount,
      };
    });

    res.json({ mode, counts });
  } catch (err) {
    req.log.error({ err }, "Import failed");
    res.status(500).json({
      error: err instanceof Error ? err.message : "Import failed",
    });
  }
});

export default router;
