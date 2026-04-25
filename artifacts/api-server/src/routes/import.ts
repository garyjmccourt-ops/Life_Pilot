import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { sql } from "drizzle-orm";
import {
  db,
  incomeSourcesTable,
  billsTable,
  arrearsItemsTable,
  tasksTable,
  commsEntriesTable,
  weeklyEntriesTable,
} from "@workspace/db";

const router: IRouter = Router();

const FREQUENCIES = [
  "weekly",
  "fortnightly",
  "monthly",
  "quarterly",
  "annual",
  "one-off",
] as const;

const Frequency = z.enum(FREQUENCIES);

const IncomeSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().min(1),
  amount: z.number(),
  frequency: Frequency,
  notes: z.string().nullable().optional(),
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
  category: z.enum([
    "rent",
    "utility",
    "council",
    "fine",
    "child-support",
    "personal-debt",
    "tax",
    "other",
  ]),
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
  bucket: z.enum(["pay", "contact", "file", "review", "negotiate", "watch"]),
  status: z.enum([
    "open",
    "in-progress",
    "blocked",
    "awaiting-reply",
    "done",
  ]),
  priority: z.enum(["p1", "p2", "p3"]),
  dueDate: z.string().nullable().optional(),
  creditorTag: z.string().nullable().optional(),
  arrearsItemId: z.number().int().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const CommsSchema = z.object({
  id: z.number().int().optional(),
  occurredAt: z.string(),
  channel: z.enum(["phone", "email", "letter", "portal", "in-person", "sms"]),
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

const ImportBody = z.object({
  mode: z.enum(["replace", "merge"]).default("replace"),
  data: z.object({
    incomeSources: z.array(IncomeSchema).optional().default([]),
    bills: z.array(BillSchema).optional().default([]),
    arrearsItems: z.array(ArrearsSchema).optional().default([]),
    tasks: z.array(TaskSchema).optional().default([]),
    commsEntries: z.array(CommsSchema).optional().default([]),
    weeklyEntries: z.array(WeeklySchema).optional().default([]),
  }),
});

router.post("/import", async (req, res): Promise<void> => {
  const parsed = ImportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "Invalid import payload",
      issues: parsed.error.issues,
    });
    return;
  }
  const { mode, data } = parsed.data;

  const arrearsIdMap = new Map<number, number>();

  try {
    const counts = await db.transaction(async (tx) => {
      if (mode === "replace") {
        // Order matters only if FKs exist; we use logical refs not real FKs,
        // but clearing children first is still tidy.
        await tx.delete(commsEntriesTable);
        await tx.delete(tasksTable);
        await tx.delete(weeklyEntriesTable);
        await tx.delete(arrearsItemsTable);
        await tx.delete(billsTable);
        await tx.delete(incomeSourcesTable);
      }

      // Income
      let incomeCount = 0;
      for (const r of data.incomeSources) {
        await tx.insert(incomeSourcesTable).values({
          ...(r.id != null ? { id: r.id } : {}),
          name: r.name,
          amount: String(r.amount),
          frequency: r.frequency,
          notes: r.notes ?? null,
        });
        incomeCount++;
      }

      // Bills
      let billsCount = 0;
      for (const r of data.bills) {
        await tx.insert(billsTable).values({
          ...(r.id != null ? { id: r.id } : {}),
          provider: r.provider,
          category: r.category,
          amount: String(r.amount),
          frequency: r.frequency,
          dueDay: r.dueDay ?? null,
          accountRef: r.accountRef ?? null,
          autopay: r.autopay,
          notes: r.notes ?? null,
        });
        billsCount++;
      }

      // Arrears — track id remap so child refs survive even without explicit ids
      let arrearsCount = 0;
      for (const r of data.arrearsItems) {
        const [inserted] = await tx
          .insert(arrearsItemsTable)
          .values({
            ...(r.id != null ? { id: r.id } : {}),
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
          })
          .returning({ id: arrearsItemsTable.id });
        if (r.id != null) arrearsIdMap.set(r.id, inserted.id);
        arrearsCount++;
      }

      // Tasks — remap arrearsItemId via map (or pass through if not remapped)
      let tasksCount = 0;
      for (const r of data.tasks) {
        const arrearsItemId =
          r.arrearsItemId != null
            ? arrearsIdMap.get(r.arrearsItemId) ?? r.arrearsItemId
            : null;
        await tx.insert(tasksTable).values({
          ...(r.id != null ? { id: r.id } : {}),
          title: r.title,
          bucket: r.bucket,
          status: r.status,
          priority: r.priority,
          dueDate: r.dueDate ?? null,
          creditorTag: r.creditorTag ?? null,
          arrearsItemId,
          notes: r.notes ?? null,
        });
        tasksCount++;
      }

      // Comms
      let commsCount = 0;
      for (const r of data.commsEntries) {
        const arrearsItemId =
          r.arrearsItemId != null
            ? arrearsIdMap.get(r.arrearsItemId) ?? r.arrearsItemId
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

      // Weekly entries — weekStart is unique
      let weeksCount = 0;
      for (const r of data.weeklyEntries) {
        await tx
          .insert(weeklyEntriesTable)
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

      // Reset sequences so future inserts don't collide with explicit ids.
      await tx.execute(sql`
        SELECT setval(
          pg_get_serial_sequence('income_sources', 'id'),
          COALESCE((SELECT MAX(id) FROM income_sources), 1),
          (SELECT EXISTS (SELECT 1 FROM income_sources))
        )
      `);
      await tx.execute(sql`
        SELECT setval(
          pg_get_serial_sequence('bills', 'id'),
          COALESCE((SELECT MAX(id) FROM bills), 1),
          (SELECT EXISTS (SELECT 1 FROM bills))
        )
      `);
      await tx.execute(sql`
        SELECT setval(
          pg_get_serial_sequence('arrears_items', 'id'),
          COALESCE((SELECT MAX(id) FROM arrears_items), 1),
          (SELECT EXISTS (SELECT 1 FROM arrears_items))
        )
      `);
      await tx.execute(sql`
        SELECT setval(
          pg_get_serial_sequence('tasks', 'id'),
          COALESCE((SELECT MAX(id) FROM tasks), 1),
          (SELECT EXISTS (SELECT 1 FROM tasks))
        )
      `);
      await tx.execute(sql`
        SELECT setval(
          pg_get_serial_sequence('comms_entries', 'id'),
          COALESCE((SELECT MAX(id) FROM comms_entries), 1),
          (SELECT EXISTS (SELECT 1 FROM comms_entries))
        )
      `);
      await tx.execute(sql`
        SELECT setval(
          pg_get_serial_sequence('weekly_entries', 'id'),
          COALESCE((SELECT MAX(id) FROM weekly_entries), 1),
          (SELECT EXISTS (SELECT 1 FROM weekly_entries))
        )
      `);

      return {
        incomeSources: incomeCount,
        bills: billsCount,
        arrearsItems: arrearsCount,
        tasks: tasksCount,
        commsEntries: commsCount,
        weeklyEntries: weeksCount,
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
